
import { GoogleGenAI, Type } from "@google/genai";
import { Student } from "../types";

export const getActiveApiKey = (): string => {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('custom_gemini_api_key')?.trim() : '';
  if (customKey) return customKey;
  const envKey = typeof process !== 'undefined' ? process.env?.API_KEY?.trim() || '' : '';
  if (envKey && envKey !== 'PLACEHOLDER_API_KEY') return envKey;
  return '';
};

const getAiClient = () => new GoogleGenAI({ apiKey: getActiveApiKey() });

// Helper to extract base64 and mimeType from Data URL
const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return null;
};

export const analyzeClassroomImage = async (
  classroomImageDataUrl: string,
  students: Student[]
): Promise<{ presentStudentIds: string[]; totalFacesDetected: number; description: string }> => {
  
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    console.warn("No API Key found. Returning mock response.");
    // Mock fallback if no key provided for demo purposes
    return {
      presentStudentIds: students.filter((_, i) => i % 2 === 0).map(s => s.id), // Mock every other student
      totalFacesDetected: Math.ceil(students.length / 2) + 1,
      description: "Demo Mode: API Key missing. Configure your Gemini API key in Settings or AI Studio."
    };
  }
  const ai = getAiClient();

  try {
    const classroomImage = parseDataUrl(classroomImageDataUrl);
    if (!classroomImage) throw new Error("Invalid classroom image format");

    const parts: any[] = [];

    // 1. System Instruction: Define the Persona and strict Visual Matching task
    parts.push({
        text: `You are an expert Biometric Attendance System. 
        Your task is to perform strict Face Recognition to identify students in a "Classroom Photo".
        
        Protocol:
        1. Analyze the "Classroom Photo" to detect ALL human faces present. COUNT them carefully.
        2. For each student in the provided "Reference Database", generate an internal visual embedding of their facial features.
        3. Compare these reference embeddings against every face detected in the "Classroom Photo".
        4. Identification requires a high-confidence visual match of facial features (eyes, nose, mouth, face shape). 
        5. Do NOT infer presence based on the order of the list. Match purely on visual evidence.
        6. Ignore students who are heavily obstructed or do not match any reference photo.
        `
    });

    // 2. Build the Reference Database (Context)
    const studentsWithPhotos = students.filter(s => s.photoUrl);
    
    if (studentsWithPhotos.length > 0) {
        parts.push({
            text: "--- REFERENCE DATABASE (KNOWN STUDENTS) ---"
        });

        studentsWithPhotos.forEach(student => {
            const refPhoto = parseDataUrl(student.photoUrl!);
            if (refPhoto) {
                // Explicitly bind the ID and Name to the image
                parts.push({
                    text: `Student ID: "${student.id}", Name: "${student.name}"`
                });
                parts.push({
                    inlineData: {
                        mimeType: refPhoto.mimeType,
                        data: refPhoto.data
                    }
                });
            }
        });
        
        parts.push({
            text: "--- END REFERENCE DATABASE ---"
        });
    } else {
        // Fallback if no photos provided (though the UI encourages it)
        const studentNames = students.map(s => s.name).join(", ");
        parts.push({ 
            text: `WARNING: No reference photos provided. Rely on the following roster names only if you can identify text labels or context, otherwise this is an estimation: [${studentNames}]` 
        });
    }

    // 3. Add the Target Image
    parts.push({
        text: "--- TARGET CLASSROOM PHOTO to Analyze ---"
    });
    parts.push({
        inlineData: {
            mimeType: classroomImage.mimeType,
            data: classroomImage.data,
        },
    });

    // 4. Final Output Directive
    parts.push({ 
        text: `Compare the faces in the "Target Classroom Photo" with the "Reference Database" above.
        Return a JSON object with:
        - 'presentStudentIds': A list of Student IDs for those positively identified.
        - 'totalFacesDetected': The integer count of ALL faces found in the image (identified or not).
        - 'description': A professional summary (e.g., "Detected 25 faces. Matched 23 known students.").
        ` 
    });

    // Use gemini-3-flash-preview for general vision-to-text detection tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: parts,
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            presentStudentIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of IDs for students visually identified in the photo",
            },
            totalFacesDetected: {
              type: Type.INTEGER,
              description: "The total number of faces detected in the image",
            },
            description: {
              type: Type.STRING,
              description: "Technical description of the recognition results",
            },
          },
          required: ["presentStudentIds", "totalFacesDetected", "description"],
        },
        // Lower temperature for deterministic, factual matching
        temperature: 0.2, 
      },
    });

    let jsonText = response.text;
    if (!jsonText) {
        throw new Error("No JSON response from AI");
    }
    // Clean up markdown if present
    jsonText = jsonText.trim().replace(/```json/g, '').replace(/```/g, '');

    const data = JSON.parse(jsonText);
    return {
        presentStudentIds: data.presentStudentIds || [],
        totalFacesDetected: data.totalFacesDetected || 0,
        description: data.description || "Analysis complete."
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze attendance.");
  }
};

export const generateParentReport = async (studentName: string, attendanceSummary: string) => {
   if (!getActiveApiKey()) return `Hello, here is the monthly report for ${studentName}: ${attendanceSummary}`;

   try {
    const ai = getAiClient();
    // Use gemini-3-flash-preview for basic text tasks
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Draft a polite, professional SMS (under 160 chars) to a parent regarding their child's (${studentName}) attendance this month. Summary: ${attendanceSummary}.`,
    });
    return response.text;
   } catch (e) {
       return `Monthly Report for ${studentName}: ${attendanceSummary}`;
   }
};
