import { GoogleGenAI, Type } from "@google/genai";
import {
  AssessmentType,
  Language,
  CurriculumTopic,
  StudentLearningProfile,
  MaterialType,
  FlashcardItem,
  QuizQuestion,
  StructuredLessonPlan,
  SocraticMessage,
  TextbookScanResult,
  WhiteboardHintResult,
  MonthlyAcademicPlan,
  DailyTeachingPlan,
  ExamPaperResult,
  ExamPaperType,
  Student,
  StudentExamRecord,
  StudentFeeRecord,
  AssistantActionCommand,
} from "../types";
import { getActiveApiKey } from "./geminiService";

const getAiClient = () => new GoogleGenAI({ apiKey: getActiveApiKey() });

const parseDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  return null;
};

export const assessStudentWork = async (
  type: AssessmentType,
  language: Language,
  studentMediaBase64: string, // Image for Writing/Math, Audio for Reading
  referenceImageBase64: string | undefined,
  referenceText: string | undefined
): Promise<{
  score: number;
  feedback: string;
  remedialTask: string;
  strengths: string[];
  weaknesses: string[];
}> => {
  if (!getActiveApiKey()) {
    return {
      score: 8,
      feedback: `### Demo Assessment (${language})\n* **Strengths:** Good effort and neat line alignment.\n* **Correction Needed:** Configure your **Gemini API Key** in the top bar or Settings to enable live AI script, Nuqta, and step-by-step Math analysis.`,
      remedialTask: `Practice writing the core vocabulary of this ${language} lesson 3 times and review with the Socratic Coach.`,
      strengths: ["Consistent Effort", `${language} Practice`],
      weaknesses: ["API Key Not Configured"],
    };
  }

  try {
    const ai = getAiClient();
    const parts: any[] = [];

    parts.push({
      text: `You are an expert AI Personal Tutor for K-12 students in Pakistan (specifically tailored for South Punjab / Dera Ghazi Khan, BISE DG Khan & PCTB standards).
      You are fluent in English, Urdu (اردو), Saraiki (سرائیکی), Balochi (بلوچی), and Sindhi (سنڌي).
      Your goal is to grade student work with high precision in the target language (${language}) and provide encouraging, culturally relatable corrective feedback.
      
      Scoring Scale: 0 to 10 (10 is perfect).
      Tone: Supportive, clear, and pedagogical.
      Format: Use Markdown for the feedback (bullet points, bold text for emphasis).

      Output JSON schema:
      {
          "score": number,
          "feedback": "A comprehensive review using Markdown. Separate into 'Strengths' and 'Areas for Improvement'. Quote specific errors from the student's work and show the correction.",
          "remedialTask": "A specific, actionable task to practice the weak areas.",
          "strengths": ["List of short tags, e.g., 'Neat Nastaliq Script', 'Correct Saraiki Nuqta', 'Good Pronunciation'"],
          "weaknesses": ["List of short tags, e.g., 'Spelling: Letter Saraiki Gaf ڳ', 'Math: Carrying over', 'English: Past Tense']
      }`,
    });

    if (type === "Writing") {
      let specificInstruction = "";
      if (language === "Urdu") {
        specificInstruction =
          "Analyze the Urdu Nastaliq or Naskh script. Check for correct dot placement (Nuqta), correct letter forms (shapes), and ligature connections. Check Urdu grammar and spelling.";
      } else if (language === "Saraiki") {
        specificInstruction =
          "Analyze the Saraiki Shahmukhi script. Pay close attention to the 5 distinctive Saraiki implosive letters (ٻ, ڄ, ݙ, ڳ, ݨ) and their Nuqta/dot placement, alongside Urdu/Saraiki grammar.";
      } else if (language === "Balochi") {
        specificInstruction =
          "Analyze the Balochi Nastaliq/Arabic script and grammar, providing gentle bridge explanations in Urdu/Balochi.";
      } else if (language === "Sindhi") {
        specificInstruction =
          "Analyze the Sindhi script. Pay close attention to the specific 52-letter alphabet, ensuring distinct Sindhi characters (like ڳ, ڄ, ڌ, ٻ) are written correctly.";
      } else {
        specificInstruction =
          "Check for standard English spelling, grammar, sentence construction, and punctuation. Explain tricky English grammar rules using simple Urdu/Saraiki bridge hints so a BISE DG Khan student understands clearly.";
      }

      parts.push({
        text: `TASK: ${language} Handwriting & Writing Assignment Analysis.
        
        ANALYSIS STEPS:
        1. Transcribe the student's handwriting internally (Language: ${language}).
        2. Compare against the reference text (if provided) or standard ${language} grammar/spelling rules.
        3. Identify spelling mistakes, grammar issues, and handwriting legibility.
        4. ${specificInstruction}`,
      });

      if (referenceImageBase64) {
        const ref = parseDataUrl(referenceImageBase64);
        if (ref) {
          parts.push(
            { text: "REFERENCE MATERIAL (Expected Layout/Content):" },
            { inlineData: { mimeType: ref.mimeType, data: ref.data } }
          );
        }
      }
      if (referenceText) {
        parts.push({ text: `REFERENCE TEXT (Ground Truth): "${referenceText}"` });
      }

      const work = parseDataUrl(studentMediaBase64);
      if (work) {
        parts.push(
          { text: "STUDENT WORK IMAGE TO GRADE:" },
          { inlineData: { mimeType: work.mimeType, data: work.data } }
        );
      }
    } else if (type === "Math") {
      parts.push({
        text: `TASK: Math Problem Solving & Step-by-Step Logic Analysis.
        Language Context: ${language} (Treat both Western Arabic 123 and Eastern Arabic ١٢٣ numerals as valid).

        ANALYSIS STEPS:
        1. Trace the student's logic line-by-line.
        2. Check for calculation errors, sign errors (+/-), and conceptual misunderstandings.
        3. Identify the EXACT step where the first error occurred.
        4. Explain WHY it is wrong in ${language} (with helpful Urdu/Saraiki conceptual clarity if needed).`,
      });

      if (referenceImageBase64) {
        const ref = parseDataUrl(referenceImageBase64);
        if (ref) {
          parts.push(
            { text: "REFERENCE PROBLEM/FORMULA:" },
            { inlineData: { mimeType: ref.mimeType, data: ref.data } }
          );
        }
      }

      const work = parseDataUrl(studentMediaBase64);
      if (work) {
        parts.push(
          { text: "STUDENT SOLUTION IMAGE TO GRADE:" },
          { inlineData: { mimeType: work.mimeType, data: work.data } }
        );
      }
    } else if (type === "Reading") {
      parts.push({
        text: `TASK: ${language} Reading Fluency & Pronunciation Analysis.
        1. Transcribe the audio expecting ${language} speech.
        2. Align the transcript with the Target Text.
        3. Detect mispronunciations, skipped words, and reading pace.`,
      });

      if (referenceText) {
        parts.push({ text: `TARGET TEXT TO READ: "${referenceText}"` });
      }

      const audioData = parseDataUrl(studentMediaBase64);
      if (audioData) {
        parts.push({ inlineData: { mimeType: audioData.mimeType, data: audioData.data } });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
            remedialTask: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "feedback", "remedialTask"],
        },
      },
    });

    const result = JSON.parse(response.text.trim());
    return {
      score: result.score,
      feedback: result.feedback,
      remedialTask: result.remedialTask,
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
    };
  } catch (error) {
    console.error("Tutor AI Error", error);
    return {
      score: 0,
      feedback: "Error processing assessment. Please check your Gemini API Key and try again.",
      remedialTask: "Retry assessment.",
      strengths: [],
      weaknesses: [],
    };
  }
};

// 1. STRUCTURED LESSON PLANNER (WITH MULTIGRADE & MOTHER-TONGUE BRIDGE FOR SOUTH PUNJAB / DG KHAN)
export const generateStructuredLessonPlan = async (
  studentName: string,
  topic: CurriculumTopic,
  profile: StudentLearningProfile,
  isMultigrade: boolean
): Promise<StructuredLessonPlan> => {
  if (!getActiveApiKey()) {
    return {
      title: `${topic.title} (${topic.subject} - Grade ${topic.grade})`,
      duration: "35 Minutes (PCTB / BISE DG Khan Standard)",
      objectives: [
        `Understand core concepts of ${topic.title} without rote memorization (Ratta)`,
        `Connect ${topic.subject} vocabulary with Urdu and Saraiki mother-tongue examples`,
        `Master past-paper MCQ patterns for ${topic.grade}`,
      ],
      warmUp: `5-Min Oral Hook: Ask ${studentName} a relatable question from everyday life in Dera Ghazi Khan (e.g., canal water flow, local bazaar math, or wheat/cotton farming) connected to ${topic.title}.`,
      coreConceptExplanation: `Break down "${topic.description}" into 3 visual steps on the blackboard. Emphasize areas where ${studentName} previously struggled (${profile.weaknesses.join(", ") || "foundational concepts"}).`,
      motherTongueBridge: `Explain key terms in ${topic.language} first, then bridge in Saraiki/Urdu (e.g., "ایں تصور کوں آسان سرائیکی / اردو وچ سمجھوں تاں...") so the student grasps the logic before writing in English/Urdu.`,
      multigradeSplit: isMultigrade
        ? `Single-Teacher Multigrade Split: First 15 mins: Direct blackboard instruction with Grade ${topic.grade} while junior grades practice flashcards in pairs. Next 15 mins: Assign ${studentName}'s group a peer-quiz while you check junior notebooks.`
        : `Focused Grade ${topic.grade} cohort session with peer-pair checking.`,
      guidedPractice: `Solve 2 examples together on the board, then ask ${studentName} to solve 1 problem independently on the Smart Whiteboard.`,
      homeActivity: `No-cost home activity: Observe or practice ${topic.title} using household items and teach one concept to a sibling in Saraiki/Urdu.`,
      teacherTips: `Avoid pure dictation. Have the student explain the 'Why' in their own words before copying from the board.`,
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `
    You are an expert curriculum designer for schools in Dera Ghazi Khan & South Punjab, Pakistan (PCTB / BISE DG Khan aligned).
    Create a highly practical, smart Structured Lesson Plan.

    Student / Class Focus: ${studentName} (Grade: ${topic.grade})
    Subject: ${topic.subject}
    Topic: ${topic.title} - ${topic.description}
    Instruction Language: ${topic.language}
    Multigrade Classroom Mode (Single teacher handling multiple classes): ${isMultigrade ? "YES - Include a specific Multigrade Split strategy" : "Standard Classroom"}
    Student Known Strengths: ${profile.strengths.join(", ") || "None recorded yet"}
    Student Known Weaknesses to remediate: ${profile.weaknesses.join(", ") || "None recorded yet"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            warmUp: { type: Type.STRING },
            coreConceptExplanation: { type: Type.STRING },
            motherTongueBridge: {
              type: Type.STRING,
              description:
                "How to explain the concept using Saraiki/Urdu/Balochi mother-tongue analogies so students avoid blind rote learning (Ratta)",
            },
            multigradeSplit: {
              type: Type.STRING,
              description:
                "How a single teacher in a rural South Punjab school can manage another grade while this student/group works independently",
            },
            guidedPractice: { type: Type.STRING },
            homeActivity: {
              type: Type.STRING,
              description: "Low-cost or zero-cost practical activity using everyday rural/home items",
            },
            teacherTips: { type: Type.STRING },
          },
          required: [
            "title",
            "duration",
            "objectives",
            "warmUp",
            "coreConceptExplanation",
            "motherTongueBridge",
            "multigradeSplit",
            "guidedPractice",
            "homeActivity",
            "teacherTips",
          ],
        },
      },
    });

    return JSON.parse(response.text.trim()) as StructuredLessonPlan;
  } catch (error) {
    console.error("Lesson Plan Generation Error:", error);
    throw error;
  }
};

// 2. INTERACTIVE FLASHCARDS CREATOR (WITH MOTHER-TONGUE HINTS)
export const generateInteractiveFlashcards = async (
  studentName: string,
  topic: CurriculumTopic,
  profile: StudentLearningProfile,
  count: number = 6
): Promise<FlashcardItem[]> => {
  if (!getActiveApiKey()) {
    return [
      {
        id: "fc-1",
        front: `Core Concept: ${topic.title}`,
        back: topic.description || "Key definition and rule from the textbook.",
        hint: `Think about how this applies in daily life (${topic.language} / Saraiki bridge).`,
        example: `Example tailored for ${studentName} (${topic.subject}, Grade ${topic.grade}).`,
      },
      {
        id: "fc-2",
        front: `Why do we avoid 'Ratta' (rote learning) in ${topic.title}?`,
        back: "Because BISE DG Khan board questions test conceptual application and unseen MCQs.",
        hint: "Understand the meaning in Urdu/Saraiki first, then write in your own words.",
        example: "Translating a concept into your own sentence improves retention by 3x.",
      },
      {
        id: "fc-3",
        front: `Key Formula / Rule in ${topic.title}`,
        back: `Step-by-step application of ${topic.title} (${topic.subject}).`,
        hint: "Check units and signs carefully before writing the final answer.",
        example: "Used in solving Section B short questions.",
      },
    ];
  }

  try {
    const ai = getAiClient();
    const prompt = `
    Create ${count} interactive study flashcards for a Grade ${topic.grade} student (${studentName}) in Pakistan studying "${topic.title}" (${topic.subject}).
    Target Language: ${topic.language}.
    Student's Weaknesses to reinforce: ${profile.weaknesses.join(", ") || "General mastery"}.
    Reference Material: ${topic.referenceText || topic.description}.

    For each flashcard:
    - 'front': A clear question, term, or prompt in ${topic.language}.
    - 'back': Concise, accurate answer or definition.
    - 'hint': A short memory trick or Urdu/Saraiki mother-tongue bridge hint.
    - 'example': A relatable real-world sentence or example relevant to Pakistani students.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              hint: { type: Type.STRING },
              example: { type: Type.STRING },
            },
            required: ["id", "front", "back", "hint", "example"],
          },
        },
      },
    });

    return JSON.parse(response.text.trim()) as FlashcardItem[];
  } catch (error) {
    console.error("Flashcard Generation Error:", error);
    return [];
  }
};

// 3. INTERACTIVE MCQ QUIZ CREATOR (AUTO-GRADED + BISE DG KHAN BOARD STYLE)
export const generateInteractiveQuiz = async (
  studentName: string,
  topic: CurriculumTopic,
  profile: StudentLearningProfile,
  questionCount: number = 5
): Promise<QuizQuestion[]> => {
  if (!getActiveApiKey()) {
    return [
      {
        id: "q-1",
        question: `[Demo Mode] Which of the following best describes the core idea of "${topic.title}" in ${topic.subject}?`,
        options: [
          topic.description || "The primary principle taught in this unit",
          "An unrelated historical event",
          "Memorizing without understanding the concept",
          "Skipping step-by-step verification",
        ],
        correctIndex: 0,
        explanation: `Option A directly reflects the learning objective of ${topic.title}. Add your Gemini API Key in the top bar for live AI-generated MCQs!`,
        conceptTag: `${topic.subject}: ${topic.title}`,
      },
      {
        id: "q-2",
        question: `When solving a BISE DG Khan board question on "${topic.title}", what is the smartest first step?`,
        options: [
          "Write down random formulas immediately",
          "Identify the given data/keywords and understand the question in your mother tongue",
          "Leave the question blank",
          "Copy the question text twice",
        ],
        correctIndex: 1,
        explanation:
          "Identifying given data and understanding what is asked prevents common mistakes in Math, Science, and English.",
        conceptTag: `${topic.subject} Problem Solving`,
      },
    ];
  }

  try {
    const ai = getAiClient();
    const prompt = `
    Create ${questionCount} high-quality Multiple Choice Questions (MCQs) aligned with Punjab Curriculum & Textbook Board (PCTB) and BISE DG Khan exam standards.
    Student: ${studentName} (Grade ${topic.grade})
    Subject: ${topic.subject}
    Topic: ${topic.title} (${topic.description})
    Language: ${topic.language}
    Reference Content: ${topic.referenceText || "Standard curriculum"}
    Student Weaknesses to test and remediate: ${profile.weaknesses.join(", ") || "Core concepts"}

    Requirements:
    - Exactly 4 options per question.
    - 'correctIndex' must be 0, 1, 2, or 3.
    - 'explanation' must clearly explain WHY the correct option is right (and include a brief Urdu/Saraiki bridge clarification if helpful).
    - 'conceptTag' should be a short 2-4 word skill tag (e.g., "Fractions: Common Denominator" or "English: Past Indefinite") so we can update the student's Strengths/Weaknesses profile automatically.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              conceptTag: { type: Type.STRING },
            },
            required: ["id", "question", "options", "correctIndex", "explanation", "conceptTag"],
          },
        },
      },
    });

    return JSON.parse(response.text.trim()) as QuizQuestion[];
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return [];
  }
};

// 4. INTERACTIVE SOCRATIC DOUBT-SOLVER (MOTHER-TONGUE BRIDGE: ENGLISH / URDU / SARAIKI / BALOCHI / SINDHI)
export const askSocraticTutor = async (
  studentName: string,
  topic: CurriculumTopic | undefined,
  language: Language,
  chatHistory: SocraticMessage[],
  studentQuestion: string
): Promise<{ reply: string; followUpHint: string }> => {
  if (!getActiveApiKey()) {
    return {
      reply: `Shabash ${studentName}! That's a great question about **${topic?.title || "your lesson"}**. Instead of giving you the final answer right away, let's think step by step: What do you already know about the main keyword in your question? *(Configure your Gemini API Key above for live multilingual Socratic coaching in ${language}/Saraiki/Urdu!)*`,
      followUpHint: `Try breaking the problem into two smaller parts and tell me what you think happens first.`,
    };
  }

  try {
    const ai = getAiClient();
    const historyTranscript = chatHistory
      .slice(-6)
      .map((m) => `${m.role === "student" ? studentName : "AI Ustad"}: ${m.text}`)
      .join("\n");

    const prompt = `
    You are "AI Ustad", a warm, Socratic tutor helping K-12 students in Dera Ghazi Khan & South Punjab, Pakistan.
    Student Name: ${studentName}
    Preferred Language: ${language} (If ${language} is Saraiki, respond in natural, encouraging Saraiki/Urdu script so the student feels at home; if English, use simple English with helpful Urdu/Saraiki bridge words for hard terms).
    Current Topic: ${topic ? `${topic.title} (${topic.subject} - ${topic.description})` : "General School Doubt"}

    SOCRATIC RULES:
    1. NEVER just dump the final homework answer so the student copies it blindly.
    2. Validate the student's curiosity, explain the underlying concept using a relatable local analogy (e.g., farming, Indus river, cricket, solar panels, local bazaar math), and ask ONE guiding question that helps the student figure out the next step themselves.
    3. Provide a separate short 'followUpHint' in case they get stuck.

    Recent Conversation:
    ${historyTranscript}

    Student's New Message: "${studentQuestion}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            followUpHint: { type: Type.STRING },
          },
          required: ["reply", "followUpHint"],
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Socratic Tutor Error:", error);
    return {
      reply: "Could not reach AI Ustad right now. Please check your Gemini API Key or internet connection.",
      followUpHint: "Review the topic description and try asking again.",
    };
  }
};

// 5. TEXTBOOK PAGE SCANNER & VIRTUAL VILLAGE LAB / MIND-MAP GENERATOR
export const analyzeTextbookPage = async (
  imageBase64: string | null,
  rawText: string,
  language: Language
): Promise<TextbookScanResult> => {
  if (!getActiveApiKey()) {
    return {
      title: "Smart Textbook Breakdown (Demo Mode)",
      eli10Summary:
        "This page introduces a foundational concept. Once you add your Gemini API Key, snapping any Punjab Textbook Board (PCTB) page will instantly extract simplified summaries, Saraiki/Urdu meanings, and a visual mind-map!",
      motherTongueExplanation:
        "ایں سبق دا خلاصہ سادہ سرائیکی تے اردو وچ: رٹا لاوݨ دی بجائے تصور کوں اپݨے الفاظ وچ سمجھو۔",
      keyTakeaways: [
        "Understand the core definition in your own words",
        "Connect textbook diagrams to real-world examples around Dera Ghazi Khan",
        "Practice the vocabulary terms before attempting board questions",
      ],
      vocabulary: [
        {
          term: "Concept / Phenomenon",
          definition: "A scientific or academic principle explained in the chapter",
          localMeaning: "تصور / اصول (سادہ مفہوم)",
        },
      ],
      mindMap: [
        {
          branch: "1. Main Idea",
          nodes: ["Definition", "Real-life example", "Why it matters"],
        },
        {
          branch: "2. Exam Focus (BISE DG Khan)",
          nodes: ["Key MCQ facts", "Short question definition", "Diagram labels"],
        },
      ],
      noLabExperiment:
        "Zero-Cost Village Lab: Use a clear plastic water bottle, sunlight, and soil/water from the school courtyard to observe this principle in action without needing expensive lab apparatus.",
      practicePrompts: [
        "Explain the main idea of this page to your friend in Saraiki or Urdu.",
        "What would happen if one condition in this process changed?",
      ],
    };
  }

  try {
    const ai = getAiClient();
    const parts: any[] = [
      {
        text: `You are an expert Pakistani educator helping students in Dera Ghazi Khan & rural South Punjab understand tough textbook pages without rote memorization (Ratta).
        Analyze the provided textbook page image and/or text.
        Output Language Preference: ${language}.
        Always include a 'motherTongueExplanation' that explains the heart of the lesson in warm, everyday Urdu & Saraiki so a rural student immediately gets an "Aha!" moment.
        Also include a 'noLabExperiment': a safe, zero-cost hands-on activity or experiment using everyday village/household items (since many rural schools lack science labs).`,
      },
    ];

    if (rawText) {
      parts.push({ text: `TEXTBOOK PASSAGE / NOTES: "${rawText}"` });
    }
    if (imageBase64) {
      const parsed = parseDataUrl(imageBase64);
      if (parsed) {
        parts.push({ inlineData: { mimeType: parsed.mimeType, data: parsed.data } });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            eli10Summary: {
              type: Type.STRING,
              description: "Explain Like I'm 10 summary in simple, clear language",
            },
            motherTongueExplanation: {
              type: Type.STRING,
              description: "Conceptual explanation in everyday Urdu/Saraiki bridge language",
            },
            keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  localMeaning: {
                    type: Type.STRING,
                    description: "Meaning in Urdu / Saraiki / Sindhi script",
                  },
                },
                required: ["term", "definition", "localMeaning"],
              },
            },
            mindMap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  branch: { type: Type.STRING },
                  nodes: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["branch", "nodes"],
              },
            },
            noLabExperiment: {
              type: Type.STRING,
              description:
                "A hands-on activity or science demonstration requiring zero lab equipment, using everyday rural/household items",
            },
            practicePrompts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "title",
            "eli10Summary",
            "motherTongueExplanation",
            "keyTakeaways",
            "vocabulary",
            "mindMap",
            "noLabExperiment",
            "practicePrompts",
          ],
        },
      },
    });

    return JSON.parse(response.text.trim()) as TextbookScanResult;
  } catch (error) {
    console.error("Textbook Scan Error:", error);
    throw error;
  }
};

// 6. ON-SCREEN WHITEBOARD / SCRATCHPAD LIVE AI HINT COACH
export const analyzeWhiteboardWork = async (
  canvasDataUrl: string,
  problemPrompt: string,
  language: Language
): Promise<WhiteboardHintResult> => {
  if (!getActiveApiKey()) {
    return {
      status: "on_track",
      praise: "Good start on the scratchpad!",
      detectedIssue: "Demo Mode: Configure your Gemini API key to get live vision analysis of your strokes and math steps.",
      nextStepHint: `Double-check your step against "${problemPrompt || "the target problem"}" and verify the units/Nuqta placement.`,
    };
  }

  try {
    const ai = getAiClient();
    const img = parseDataUrl(canvasDataUrl);
    if (!img) throw new Error("Invalid canvas image");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `You are a live AI Whiteboard Coach watching a student practice handwriting (English, Urdu, Saraiki, Sindhi) or solve a Math/Science problem on a digital scratchpad.
            Target Problem / Prompt: "${problemPrompt || "Free practice on whiteboard"}"
            Preferred Language: ${language}

            Inspect the student's drawing/writing on the canvas:
            - If they are on the right track, set status to 'on_track' or 'solved'.
            - If there is a calculation mistake, sign error, or script/Nuqta error, set status to 'needs_correction'.
            - Give warm encouragement ('praise'), point out any issue ('detectedIssue'), and give a concise hint for the very next step ('nextStepHint') without doing the whole work for them.`,
          },
          {
            inlineData: {
              mimeType: img.mimeType,
              data: img.data,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, enum: ["on_track", "needs_correction", "solved"] },
            praise: { type: Type.STRING },
            detectedIssue: { type: Type.STRING },
            nextStepHint: { type: Type.STRING },
          },
          required: ["status", "praise", "detectedIssue", "nextStepHint"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as WhiteboardHintResult;
  } catch (error) {
    console.error("Whiteboard Coach Error:", error);
    return {
      status: "on_track",
      praise: "Keep going!",
      detectedIssue: "Could not analyze canvas right now.",
      nextStepHint: "Check your steps carefully.",
    };
  }
};

// 7. ATTENDANCE-LINKED "MISSED CLASS CATCH-UP PACK" (FOR HARVEST / FLOOD / ILLNESS ABSENCES)
export const generateCatchUpStudyPack = async (
  studentName: string,
  absentDates: string[],
  topic: CurriculumTopic,
  reasonContext: string
): Promise<{ studyPackMarkdown: string; parentWhatsAppMessage: string }> => {
  if (!getActiveApiKey()) {
    return {
      studyPackMarkdown: `# 15-Minute Rapid Catch-Up Pack for ${studentName}\n**Missed Dates:** ${absentDates.join(", ") || "Recent Class"} | **Reason:** ${reasonContext}\n**Topic:** ${topic.title} (${topic.subject})\n\n### 1. What You Missed in 3 Bullet Points\n* Core concept of **${topic.title}**: ${topic.description}\n* Mother-Tongue Summary (Urdu/Saraiki): ایں سبق دا اہم نکتہ سمجھݨ بہت آسان ہے۔\n* Key Formula / Rule to remember for the BISE DG Khan test.\n\n### 2. Quick 5-Minute Home Practice\n1. Read the key definition aloud twice.\n2. Write 2 examples in your notebook.\n3. Ask the Socratic Coach if you get stuck on any word.`,
      parentWhatsAppMessage: `Assalam-o-Alaikum! ${studentName} missed ${absentDates.length || 1} day(s) of school (${reasonContext}). So they don't fall behind in ${topic.subject} (${topic.title}), here is a 15-minute home Catch-Up activity: Please ask ${studentName} to review "${topic.description}" for 15 minutes tonight. Shukriya! - ClassGuard AI School`,
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `
    A student in Dera Ghazi Khan / South Punjab named ${studentName} (Grade ${topic.grade}) missed ${absentDates.length} day(s) of school (${absentDates.join(", ")}) due to: ${reasonContext} (e.g., Wheat/Cotton harvest season, Monsoon/Rod-Kohi flood disruption, transport issue, or illness).
    They missed the lesson on: "${topic.title}" (${topic.subject} - ${topic.description}).
    Language: ${topic.language}.

    Create:
    1. 'studyPackMarkdown': A compassionate, ultra-clear 15-minute "Rapid Catch-Up Study Pack" in Markdown that includes:
       - A 3-minute Story/Analogy summary (with Urdu/Saraiki mother-tongue bridge so they can study at home even if parents have limited formal schooling).
       - Top 3 Key Points they must know.
       - 2 quick self-check questions with answers at the bottom.
    2. 'parentWhatsAppMessage': A polite, encouraging WhatsApp message in Roman Urdu + Urdu/Saraiki that the teacher can send to the father/mother with 1 click, explaining how the child can catch up in 15 minutes at home.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studyPackMarkdown: { type: Type.STRING },
            parentWhatsAppMessage: { type: Type.STRING },
          },
          required: ["studyPackMarkdown", "parentWhatsAppMessage"],
        },
      },
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Catch-Up Pack Error:", error);
    return {
      studyPackMarkdown: "Failed to generate Catch-Up Pack. Please check your Gemini API key.",
      parentWhatsAppMessage: "",
    };
  }
};

export const generateLearningMaterial = async (
  studentName: string,
  topic: CurriculumTopic,
  profile: StudentLearningProfile,
  type: MaterialType
): Promise<string> => {
  if (!getActiveApiKey())
    return "Demo Mode: Gemini API Key missing. Click 'Configure Gemini API Key' in the top bar to generate live materials.";

  try {
    const ai = getAiClient();
    const prompt = `
    Act as an expert Pakistani teacher (Dera Ghazi Khan / South Punjab context) creating personalized learning materials.
    Student: ${studentName}
    Target Topic: ${topic.title} (${topic.subject})
    Language: ${topic.language}
    Student Strengths: ${profile.strengths.join(", ") || "None recorded"}
    Student Weaknesses: ${profile.weaknesses.join(", ") || "None recorded"}
    Task: Create a ${type} in clean Markdown with Urdu/Saraiki conceptual bridge notes where helpful.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Generation Error", error);
    return "Failed to generate material.";
  }
};

// 8. SYSTEM SCHOOL AI AGENT: WHOLE-MONTH DATE-WISE & DAY-WISE ACADEMIC PLANNER (BEACONHOUSE / CITY / ALLIED STANDARD FOR OWN COURSE)
export const generateMonthlyAcademicPlanner = async (
  grade: string,
  subject: string,
  monthLabel: string,
  startDateIso: string,
  syllabusSource: string,
  courseChaptersAndPages: string,
  bookImageBase64: string | null,
  language: Language
): Promise<MonthlyAcademicPlan> => {
  // Helper to generate working dates (Mon-Sat, skipping Sundays)
  const buildWorkingDates = (startIso: string, count: number): string[] => {
    const dates: string[] = [];
    const cursor = startIso ? new Date(startIso) : new Date();
    if (isNaN(cursor.getTime())) {
      cursor.setTime(Date.now());
    }
    while (dates.length < count) {
      if (cursor.getDay() !== 0) {
        dates.push(
          cursor.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        );
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  };

  const workingDates = buildWorkingDates(startDateIso, 24);

  if (!getActiveApiKey()) {
    const demoDays: DailyTeachingPlan[] = workingDates.map((dateLabel, idx) => {
      const dayNumber = idx + 1;
      const isWeeklyTest = dayNumber % 6 === 0 && dayNumber < 24;
      const isMonthlyTest = dayNumber === 24;
      const isRevision = dayNumber === 23;

      if (isMonthlyTest) {
        return {
          dayNumber,
          dateLabel,
          dayType: "MonthlyTest",
          unitAndPages: `Full Month Syllabus (${courseChaptersAndPages || "Units 1–2"})`,
          topicTitle: `Monthly Grand Assessment (${subject})`,
          learningOutcome: "Evaluate full-month SLO mastery across objective MCQs, short & long questions.",
          howToTeach: "5m seating & instructions -> 35m supervised written test -> collect notebooks for rubric grading.",
          boardWorkAndMaterial: "Distribute printed Monthly Test Paper (generated in the Exam tab).",
          classwork: "Attempt 40-Mark Monthly Assessment Paper.",
          homework: "Review incorrect questions and get parent signature on test diary.",
        };
      }

      if (isWeeklyTest) {
        const weekNum = dayNumber / 6;
        return {
          dayNumber,
          dateLabel,
          dayType: "WeeklyTest",
          unitAndPages: `Week ${weekNum} Covered Pages`,
          topicTitle: `Week ${weekNum} Checkpoint Test & Copy Checking`,
          learningOutcome: `Verify students retained all Week ${weekNum} concepts without rote memorization (Ratta).`,
          howToTeach: "25m written Weekly Test (15 Marks) -> 15m live board discussion of tricky questions & remedial feedback.",
          boardWorkAndMaterial: `Week ${weekNum} 15-Mark Test Sheet + Model Solution on Board.`,
          classwork: `Complete Week ${weekNum} Test in test register.`,
          homework: "Correct any mistakes 3 times in homework notebook.",
        };
      }

      if (isRevision) {
        return {
          dayNumber,
          dateLabel,
          dayType: "Revision",
          unitAndPages: `All Monthly Chapters (${courseChaptersAndPages || "Full Monthly Course"})`,
          topicTitle: "Whole-Month Interactive Revision & Weak-Spot Clinic",
          learningOutcome: "Consolidate definitions, formulas, and board exam short questions before Monthly Test.",
          howToTeach: "15m Rapid-Fire Flashcard Quiz -> 15m Past-Paper Board Practice -> 10m Student Q&A.",
          boardWorkAndMaterial: "Summary Mind-Map of all topics covered this month.",
          classwork: "Solve 5 mixed revision problems in pairs.",
          homework: "Prepare full monthly syllabus for tomorrow's Monthly Test.",
        };
      }

      return {
        dayNumber,
        dateLabel,
        dayType: "Teaching",
        unitAndPages: `${courseChaptersAndPages || "Chapter 1"} • Segment ${dayNumber} (2 Pages)`,
        topicTitle: `Day ${dayNumber}: Structured Concept & Exercise (${subject})`,
        learningOutcome: `Students will understand and apply Day ${dayNumber} concepts of ${subject} in their own words (Beaconhouse/Allied SLO standard).`,
        howToTeach: `1. Warm-Up (5m): Ask a real-life question in ${language}/Urdu/Saraiki.\n2. Concept & Board Work (15m): Explain today's pages step-by-step on the board.\n3. Guided Classwork (15m): Students solve 3 questions in class while teacher checks copies.\n4. Wrap-Up (5m): 2 oral exit-ticket questions.`,
        boardWorkAndMaterial: `Key Definition + 2 Solved Board Examples + Urdu/Saraiki Mother-Tongue Explanation so teachers have 100% ready material.`,
        classwork: `Write key definitions and solve Exercise Q.${(dayNumber % 5) + 1} in classwork copy.`,
        homework: `Practice 2 similar problems at home and learn today's 3 key terms.`,
      };
    });

    return {
      grade,
      subject,
      monthLabel,
      syllabusSource,
      monthlyOverview: `[Demo Mode — Add Gemini API Key for live custom book parsing] Beaconhouse / The City School / Allied School standard 24-working-day Date-Wise & Day-Wise Pacing Guide for Grade ${grade} ${subject} (${syllabusSource}). Covers: ${courseChaptersAndPages || "Selected Monthly Course"} with built-in Weekly Tests every 6th day and a Month-End Assessment.`,
      days: demoDays,
    };
  }

  try {
    const ai = getAiClient();
    const parts: any[] = [
      {
        text: `You are an elite Academic Director from Beaconhouse School System, The City School, and Allied Schools in Pakistan.
        A school principal wants a complete, Date-Wise and Day-Wise Monthly Academic Plan for their own school syllabus so their teachers know EXACTLY:
        1. Kitna parhana hai (Exact chapter, sub-topic, and page/exercise breakdown for each day)
        2. Kya parhana hai (Topic & Student Learning Outcome - SLO)
        3. Kaise parhana hai (40-minute step-by-step classroom teaching methodology: Warm-up hook, Board explanation, Urdu/Saraiki mother-tongue conceptual bridge, Guided practice)
        4. Teacher Mawaad / Material (Exact definitions, solved examples, or board notes the teacher should write on the board)
        5. Classwork (CW) and Homework (HW) diary entries.

        PARAMETERS:
        - Class / Grade: ${grade}
        - Subject: ${subject}
        - Month: ${monthLabel}
        - Syllabus / Publisher: ${syllabusSource}
        - School's Target Course / Chapters / Pages for this Month: "${courseChaptersAndPages}"
        - Teaching & Explanation Language: ${language}
        - Working Dates to map (24 Working Days = 4 Weeks, Mon–Sat): ${workingDates.join(" | ")}

        STRUCTURE RULES:
        - Generate 24 days matching the exact 'workingDates' list above.
        - Days 6, 12, and 18 MUST have dayType = 'WeeklyTest' (covering that week's taught topics).
        - Day 23 MUST have dayType = 'Revision'.
        - Day 24 MUST have dayType = 'MonthlyTest' (Full-month test).
        - All other days have dayType = 'Teaching', pacing the school's chapters/pages logically from start to finish across the month.`,
      },
    ];

    if (bookImageBase64) {
      const parsed = parseDataUrl(bookImageBase64);
      if (parsed) {
        parts.push(
          { text: "UPLOADED TEXTBOOK / TABLE OF CONTENTS PHOTO FROM SCHOOL:" },
          { inlineData: { mimeType: parsed.mimeType, data: parsed.data } }
        );
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: { type: Type.STRING },
            subject: { type: Type.STRING },
            monthLabel: { type: Type.STRING },
            syllabusSource: { type: Type.STRING },
            monthlyOverview: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER },
                  dateLabel: { type: Type.STRING },
                  dayType: {
                    type: Type.STRING,
                    enum: ["Teaching", "Revision", "WeeklyTest", "MonthlyTest"],
                  },
                  unitAndPages: { type: Type.STRING },
                  topicTitle: { type: Type.STRING },
                  learningOutcome: { type: Type.STRING },
                  howToTeach: { type: Type.STRING },
                  boardWorkAndMaterial: { type: Type.STRING },
                  classwork: { type: Type.STRING },
                  homework: { type: Type.STRING },
                },
                required: [
                  "dayNumber",
                  "dateLabel",
                  "dayType",
                  "unitAndPages",
                  "topicTitle",
                  "learningOutcome",
                  "howToTeach",
                  "boardWorkAndMaterial",
                  "classwork",
                  "homework",
                ],
              },
            },
          },
          required: ["grade", "subject", "monthLabel", "syllabusSource", "monthlyOverview", "days"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as MonthlyAcademicPlan;
  } catch (error) {
    console.error("Monthly Academic Planner Error:", error);
    throw error;
  }
};

// 9. ONE-CLICK DAILY TEACHER MAWAAD (COMPLETE TEACHING HANDOUT, BOARD NOTES & SOLVED EXERCISE)
export const generateDailyTeacherMawaad = async (
  grade: string,
  subject: string,
  dayPlan: DailyTeachingPlan,
  language: Language
): Promise<string> => {
  if (!getActiveApiKey()) {
    return `# Complete Teacher Mawaad (تدریسی مواد): Day ${dayPlan.dayNumber} (${dayPlan.dateLabel})
**Class:** ${grade} | **Subject:** ${subject} | **Portion:** ${dayPlan.unitAndPages}
**Topic:** ${dayPlan.topicTitle}

---

### 1. What the Teacher Says to Open the Class (5-Min Script)
* Greet the class warmly and connect **${dayPlan.topicTitle}** to everyday life in Pakistan.
* **Mother-Tongue Explanation (Urdu/Saraiki):** بچوں کو رٹا لگوانے کے بجائے آسان الفاظ میں مثال دیں۔

### 2. Exact Blackboard Layout (بورڈ ورک)
* **Date & SLO:** ${dayPlan.learningOutcome}
* **Key Definitions & Notes:** ${dayPlan.boardWorkAndMaterial}

### 3. Solved Exercise / Questions for Students
1. **Question 1:** Explain the main idea of ${dayPlan.topicTitle}.
   * **Model Answer:** Clear 2-line answer for student notebooks.
2. **Question 2:** Application question from ${dayPlan.unitAndPages}.
   * **Model Answer:** Step-by-step solution.

### 4. Quick 3-Question Exit Check (Oral Assessment)
* Ask 3 random students to summarize today's lesson before assigning Homework: *${dayPlan.homework}*`;
  }

  try {
    const ai = getAiClient();
    const prompt = `
    You are an Academic Master Trainer from Beaconhouse / The City School / Allied School.
    Generate the COMPLETE, ready-to-use "Teacher Teaching Material (Mawaad / تدریسی مواد)" for a teacher in Grade ${grade} (${subject}) for this specific day:
    - Date: ${dayPlan.dateLabel} (Day ${dayPlan.dayNumber})
    - Portion (Kitna Parhana Hai): ${dayPlan.unitAndPages}
    - Topic (Kya Parhana Hai): ${dayPlan.topicTitle}
    - SLO: ${dayPlan.learningOutcome}
    - Language Preference: ${language}

    Include in clean, printable Markdown:
    1. **Teacher Word-for-Word Explanation Script** (How to explain the concept simply in ${language} + Urdu/Saraiki bridge so even a new teacher teaches like an expert).
    2. **Exact Blackboard / Whiteboard Layout** (Definitions, diagrams, formulas, and key points to write on the board).
    3. **Solved Textbook / Exercise Questions & Answers** (Ready for students to write in their Classwork copies).
    4. **5 Quick Oral Check Questions & Student Worksheet** (For checking comprehension in the last 5 minutes).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Daily Teacher Mawaad Error:", error);
    return "Failed to generate daily teacher material. Please verify your Gemini API key.";
  }
};

// 10. AUTOMATED WEEKLY, MONTHLY, MID-TERM & ANNUAL EXAM PAPER GENERATOR
export const generateExamPaper = async (
  examType: ExamPaperType,
  schoolName: string,
  grade: string,
  subject: string,
  coveredSyllabus: string,
  language: Language
): Promise<ExamPaperResult> => {
  const specs: Record<
    ExamPaperType,
    { marks: number; time: string; mcqCount: number; shortCount: number; longCount: number }
  > = {
    Weekly: { marks: 20, time: "35 Minutes", mcqCount: 5, shortCount: 5, longCount: 1 },
    Monthly: { marks: 40, time: "1 Hour 15 Mins", mcqCount: 10, shortCount: 8, longCount: 2 },
    MidTerm: { marks: 75, time: "2 Hours 30 Mins", mcqCount: 15, shortCount: 15, longCount: 3 },
    Annual: { marks: 100, time: "3 Hours", mcqCount: 20, shortCount: 20, longCount: 4 },
  };

  const spec = specs[examType];

  if (!getActiveApiKey()) {
    return {
      examType,
      schoolHeaderTitle: `${schoolName || "ClassGuard Model School"} — ${examType} Examination 2026`,
      grade,
      subject,
      timeAllowed: spec.time,
      totalMarks: spec.marks,
      coveredSyllabus: coveredSyllabus || "Prescribed Syllabus Units",
      mcqs: Array.from({ length: Math.min(spec.mcqCount, 5) }, (_, i) => ({
        qNo: i + 1,
        question: `[Demo MCQ #${i + 1}] Which concept from "${coveredSyllabus || subject}" is tested here? (Add Gemini API Key for live questions)`,
        options: ["Correct Conceptual Option", "Distractor B", "Distractor C", "Distractor D"],
        correctAnswer: "A",
        marks: 1,
      })),
      shortQuestions: Array.from({ length: Math.min(spec.shortCount, 4) }, (_, i) => ({
        qNo: i + 1,
        question: `Define and explain key principle #${i + 1} from ${coveredSyllabus || subject} with an example.`,
        marks: 2,
        modelAnswer: `Concise 2-to-3 line model answer aligned with BISE DG Khan / Allied / Beaconhouse marking standards.`,
      })),
      longQuestions: Array.from({ length: spec.longCount }, (_, i) => ({
        qNo: i + 1,
        question: `(a) Explain the complete process/derivation from Unit ${i + 1} of ${coveredSyllabus || subject}. (b) Solve a practical problem based on this topic.`,
        marks: 5,
        markingRubric: `2 Marks for Definition/Diagram + 3 Marks for Step-by-Step Derivation/Solution.`,
      })),
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `
    You are the Controller of Examinations for a top Pakistani school system (Beaconhouse / The City School / Allied School & BISE DG Khan Board standard).
    Create a complete, balanced, print-ready **${examType} Examination Paper** with a full Teacher Answer Key / Marking Scheme.

    - School Name: ${schoolName || "ClassGuard Smart School"}
    - Exam Type: ${examType} Exam
    - Class / Grade: ${grade}
    - Subject: ${subject}
    - Total Marks: ${spec.marks}
    - Time Allowed: ${spec.time}
    - Covered Syllabus / Chapters: "${coveredSyllabus}"
    - Paper Language: ${language}

    REQUIRED SECTIONS:
    1. Section A (Objective MCQs): Generate ${spec.mcqCount} MCQs (1 mark each) with 4 options and the exact correctAnswer.
    2. Section B (Short Questions): Generate ${Math.min(spec.shortCount, 10)} Short Questions (2 marks each) with a clear 'modelAnswer' for the teacher's marking key.
    3. Section C (Long / Extensive Questions): Generate ${spec.longCount} Long Questions with a detailed 'markingRubric' showing how marks are awarded step-by-step.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            examType: { type: Type.STRING, enum: ["Weekly", "Monthly", "MidTerm", "Annual"] },
            schoolHeaderTitle: { type: Type.STRING },
            grade: { type: Type.STRING },
            subject: { type: Type.STRING },
            timeAllowed: { type: Type.STRING },
            totalMarks: { type: Type.INTEGER },
            coveredSyllabus: { type: Type.STRING },
            mcqs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  qNo: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  marks: { type: Type.INTEGER },
                },
                required: ["qNo", "question", "options", "correctAnswer", "marks"],
              },
            },
            shortQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  qNo: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  marks: { type: Type.INTEGER },
                  modelAnswer: { type: Type.STRING },
                },
                required: ["qNo", "question", "marks", "modelAnswer"],
              },
            },
            longQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  qNo: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  marks: { type: Type.INTEGER },
                  markingRubric: { type: Type.STRING },
                },
                required: ["qNo", "question", "marks", "markingRubric"],
              },
            },
          },
          required: [
            "examType",
            "schoolHeaderTitle",
            "grade",
            "subject",
            "timeAllowed",
            "totalMarks",
            "coveredSyllabus",
            "mcqs",
            "shortQuestions",
            "longQuestions",
          ],
        },
      },
    });

    return JSON.parse(response.text.trim()) as ExamPaperResult;
  } catch (error) {
    console.error("Exam Paper Generation Error:", error);
    throw error;
  }
};

// 11. AKGFLOW-STYLE FLOATING AI VOICE & TEXT COPILOT: FULL APP AUTO-CONTROLLER
export const interpretAppVoiceOrTextCommand = async (
  rawUserText: string,
  students: Student[],
  examRecords: StudentExamRecord[],
  feeRecords: StudentFeeRecord[],
  replyLanguage: string = "Roman Urdu + English"
): Promise<{
  assistantReply: string;
  actionCommand: AssistantActionCommand;
}> => {
  const textLower = rawUserText.toLowerCase();

  // Helper to match a student by ID, GR No, or Name from the user's voice/text query
  const findMatchingStudent = (): Student | undefined => {
    for (const st of students) {
      if (
        textLower.includes(st.id.toLowerCase()) ||
        textLower.includes(st.grNo.toLowerCase()) ||
        textLower.includes(st.name.toLowerCase()) ||
        st.name
          .toLowerCase()
          .split(" ")
          .some((part) => part.length > 2 && textLower.includes(part))
      ) {
        return st;
      }
    }
    return undefined;
  };

  // Helper to detect subject from query
  const detectSubject = (): string => {
    if (textLower.includes("math") || textLower.includes("riyazi")) return "Math";
    if (textLower.includes("science") || textLower.includes("bio") || textLower.includes("physics") || textLower.includes("light")) return "Science";
    if (textLower.includes("english") || textLower.includes("angrezi")) return "English";
    if (textLower.includes("urdu")) return "Urdu";
    if (textLower.includes("saraiki")) return "Saraiki";
    if (textLower.includes("computer")) return "Computer";
    if (textLower.includes("history") || textLower.includes("islamiyat")) return "History";
    return "Math";
  };

  // Helper to detect grade/class from query (e.g. "class 8th", "8th class", "grade 9")
  const detectGrade = (): string => {
    const match = rawUserText.match(/(?:class|grade|jamat)?\s*(\d{1,2})(?:th|st|nd|rd)?/i);
    if (match && match[1]) {
      return `${match[1]}-A`;
    }
    return "8-A";
  };

  // Helper to detect chapters/topic from query
  const detectTopicOrChapters = (): string => {
    const chMatch = rawUserText.match(/(chapter.*|topic.*|unit.*|from chapter.*)/i);
    if (chMatch && chMatch[1]) return chMatch[1].trim();
    return rawUserText;
  };

  const matchedStudent = findMatchingStudent();

  // Fast deterministic handling for Fee Record queries (Parent / Admin)
  if (
    textLower.includes("fee") ||
    textLower.includes("fees") ||
    textLower.includes("dues") ||
    textLower.includes("voucher") ||
    textLower.includes("kharcha")
  ) {
    const targetQuery = matchedStudent
      ? matchedStudent.grNo
      : rawUserText.match(/\d+/)?.[0] || rawUserText;
    const feeList = feeRecords.filter(
      (f) =>
        (matchedStudent && (f.studentId === matchedStudent.id || f.grNo === matchedStudent.grNo)) ||
        f.grNo.toLowerCase() === targetQuery.toLowerCase() ||
        f.studentName.toLowerCase().includes(targetQuery.toLowerCase())
    );

    const feeSummary =
      feeList.length > 0
        ? feeList
            .map(
              (f) =>
                `• **${f.studentName}** (GR No: **${f.grNo}**, Class ${f.grade}) — **${f.monthLabel}**: Total Due **Rs. ${f.totalDuePKR.toLocaleString()}**, Paid **Rs. ${f.paidAmountPKR.toLocaleString()}**, Balance **Rs. ${f.balancePKR.toLocaleString()}** (**${f.status}**)`
            )
            .join("\n")
        : `Student query "${targetQuery}" ke liye Exams & Fees tab khola ja raha hai.`;

    return {
      assistantReply: `Ji bilkul! Fee database se record mil gaya hai:\n\n${feeSummary}\n\nMain aap ko **Exams & Fees Ledger** page par redirect kar raha hoon aur student filter apply kar diya hai.`,
      actionCommand: {
        id: Date.now().toString(),
        actionType: "LOOKUP_FEE_RECORD",
        targetTab: "records",
        studentQuery: matchedStudent ? matchedStudent.grNo : targetQuery,
        summaryText: `Open Fee Record for ${matchedStudent ? `${matchedStudent.name} (GR: ${matchedStudent.grNo})` : targetQuery}`,
      },
    };
  }

  // Fast deterministic handling for Exam Result queries (Parent / Admin)
  if (
    (textLower.includes("result") ||
      textLower.includes("marks") ||
      textLower.includes("dmc") ||
      textLower.includes("report card") ||
      textLower.includes("natija")) &&
    (matchedStudent || /\d{2,}/.test(rawUserText))
  ) {
    const targetQuery = matchedStudent
      ? matchedStudent.grNo
      : rawUserText.match(/\d+/)?.[0] || rawUserText;
    const results = examRecords.filter(
      (r) =>
        (matchedStudent && (r.studentId === matchedStudent.id || r.grNo === matchedStudent.grNo)) ||
        r.grNo.toLowerCase() === targetQuery.toLowerCase() ||
        r.studentName.toLowerCase().includes(targetQuery.toLowerCase())
    );

    const resultSummary =
      results.length > 0
        ? results
            .map(
              (r) =>
                `• **${r.studentName}** (ID/GR: **${r.grNo}**, Class ${r.grade}) — **${r.termLabel} (${r.examType})**: Obtained **${r.obtainedMarks}/${r.totalMarks}** (**${r.percentage}%**, Grade **${r.overallGrade}**) — *${r.aiPrincipalRemarks}*`
            )
            .join("\n")
        : `Student "${targetQuery}" ka result card khola ja raha hai.`;

    return {
      assistantReply: `Assalam-o-Alaikum! Student Exam Database se result mil gaya hai:\n\n${resultSummary}\n\nMain aap ko **Exams & Fees Result Card** page par redirect kar raha hoon.`,
      actionCommand: {
        id: Date.now().toString(),
        actionType: "LOOKUP_EXAM_RESULT",
        targetTab: "records",
        studentQuery: matchedStudent ? matchedStudent.grNo : targetQuery,
        summaryText: `Show Exam Result Card for ${matchedStudent ? `${matchedStudent.name} (ID: ${matchedStudent.grNo})` : targetQuery}`,
      },
    };
  }

  // Fast deterministic handling for Exam Paper / Test Generation (Admin / Teacher)
  if (
    textLower.includes("exam paper") ||
    textLower.includes("test paper") ||
    textLower.includes("question paper") ||
    textLower.includes("half course") ||
    textLower.includes("full course") ||
    textLower.includes("paper بنا") ||
    textLower.includes("make paper") ||
    textLower.includes("generate exam")
  ) {
    const grade = detectGrade();
    const subject = detectSubject();
    const chapters = detectTopicOrChapters();
    let examType: ExamPaperType = "MidTerm";
    if (textLower.includes("weekly")) examType = "Weekly";
    else if (textLower.includes("monthly")) examType = "Monthly";
    else if (textLower.includes("annual") || textLower.includes("final") || textLower.includes("full course"))
      examType = "Annual";
    else if (textLower.includes("half course") || textLower.includes("mid") || textLower.includes("term"))
      examType = "MidTerm";

    return {
      assistantReply: `Hukam! Main **Class ${grade}** ke subject **${subject}** (${chapters}) ka **${examType} Exam Paper** (MCQs + Short Questions + Long Questions + Answer Key) abhi **System School AI Agent** mein generate kar raha hoon!`,
      actionCommand: {
        id: Date.now().toString(),
        actionType: "GENERATE_EXAM_PAPER",
        targetTab: "tutor",
        tutorView: "system_agent",
        grade,
        subject,
        chaptersOrTopic: chapters,
        examType,
        summaryText: `Generate ${examType} Exam Paper • Class ${grade} • ${subject} (${chapters})`,
      },
    };
  }

  // Fast deterministic handling for Monthly Date-Wise / Day-Wise Planner
  if (
    textLower.includes("monthly plan") ||
    textLower.includes("date wise") ||
    textLower.includes("day wise") ||
    textLower.includes("beaconhouse") ||
    textLower.includes("allied") ||
    textLower.includes("city school") ||
    textLower.includes("mahine ka plan")
  ) {
    const grade = detectGrade();
    const subject = detectSubject();
    const chapters = detectTopicOrChapters();

    return {
      assistantReply: `Bilkul! Main **Class ${grade} (${subject})** ke liye Beaconhouse / Allied School standard ka **24-Day Date-Wise & Day-Wise Monthly Planner + Teacher Mawaad** (${chapters}) abhi generate kar raha hoon!`,
      actionCommand: {
        id: Date.now().toString(),
        actionType: "GENERATE_MONTHLY_PLAN",
        targetTab: "tutor",
        tutorView: "system_agent",
        grade,
        subject,
        chaptersOrTopic: chapters,
        summaryText: `Build 24-Day Date-Wise Monthly Plan • Class ${grade} • ${subject}`,
      },
    };
  }

  // Fast deterministic handling for Lesson Plan / Worksheet (Teacher / Admin)
  if (
    textLower.includes("lesson plan") ||
    textLower.includes("worksheet") ||
    textLower.includes("flashcard") ||
    textLower.includes("mawaad")
  ) {
    const grade = detectGrade();
    const subject = detectSubject();
    const chapters = detectTopicOrChapters();

    return {
      assistantReply: `Ji zaroor! Main **Class ${grade}** ke subject **${subject}** (${chapters}) ka **Smart Lesson Plan, Teacher Mawaad & Worksheet** abhi tayyar kar ke screen par khol raha hoon!`,
      actionCommand: {
        id: Date.now().toString(),
        actionType: "GENERATE_LESSON_PLAN",
        targetTab: "tutor",
        tutorView: "system_agent",
        grade,
        subject,
        chaptersOrTopic: chapters,
        summaryText: `Generate Lesson Plan & Teacher Mawaad • Class ${grade} • ${subject} (${chapters})`,
      },
    };
  }

  // If Gemini API Key is configured, use Gemini to parse any nuanced command or question
  if (getActiveApiKey()) {
    try {
      const ai = getAiClient();
      const studentRosterBrief = students
        .map((s) => `${s.name} (ID: ${s.id}, GR No: ${s.grNo}, Class: ${s.grade})`)
        .join("; ");

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the AKGFlow-style Floating AI Copilot inside "ClassGuard AI School Management & Smart Learning App".
        You can auto-control the entire app for Admin, Teachers, Students, and Parents.
        Reply in warm, concise ${replyLanguage}.

        Known Students in Database: ${studentRosterBrief}
        User Command / Question: "${rawUserText}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assistantReply: { type: Type.STRING },
              actionType: {
                type: Type.STRING,
                enum: [
                  "GENERATE_EXAM_PAPER",
                  "GENERATE_MONTHLY_PLAN",
                  "GENERATE_LESSON_PLAN",
                  "LOOKUP_EXAM_RESULT",
                  "LOOKUP_FEE_RECORD",
                  "NAVIGATE_TAB",
                  "GENERAL_CHAT",
                ],
              },
              targetTab: {
                type: Type.STRING,
                enum: ["attendance", "students", "reports", "records", "tutor"],
              },
              tutorView: {
                type: Type.STRING,
                enum: [
                  "dashboard",
                  "system_agent",
                  "hub",
                  "socratic",
                  "scanner",
                  "whiteboard",
                  "catchup",
                  "assessment",
                  "curriculum",
                ],
              },
              grade: { type: Type.STRING },
              subject: { type: Type.STRING },
              chaptersOrTopic: { type: Type.STRING },
              examType: { type: Type.STRING, enum: ["Weekly", "Monthly", "MidTerm", "Annual"] },
              studentQuery: { type: Type.STRING },
              summaryText: { type: Type.STRING },
            },
            required: ["assistantReply", "actionType", "summaryText"],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      return {
        assistantReply: parsed.assistantReply,
        actionCommand: {
          id: Date.now().toString(),
          actionType: parsed.actionType,
          targetTab: parsed.targetTab,
          tutorView: parsed.tutorView,
          grade: parsed.grade,
          subject: parsed.subject,
          chaptersOrTopic: parsed.chaptersOrTopic,
          examType: parsed.examType,
          studentQuery: parsed.studentQuery,
          summaryText: parsed.summaryText,
        },
      };
    } catch (e) {
      console.error("AI Copilot parse error:", e);
    }
  }

  return {
    assistantReply: `Main aap ka **ClassGuard AI Flow Assistant** hoon! Aap mujhe Voice ya Text mein keh sakte hain:\n• *"Generate exam paper of Mathematics class 8th half course from chapter 1 to 10"*\n• *"Help me make lesson plan for Science 8th class chapter Light"*\n• *"What is the annual or mid-term exam result of my son Akhtar Ali student ID 56432?"*\n• *"What is the fees record of my daughter Maria GR No 563?"*`,
    actionCommand: {
      id: Date.now().toString(),
      actionType: "GENERAL_CHAT",
      summaryText: "Ready for voice or text command",
    },
  };
};


