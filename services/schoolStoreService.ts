import {
  StaffMember,
  StaffAttendanceData,
  SavedQuestionPaper,
  DriveMaterialItem,
  ReadingOcrAssessment,
  AuditLogEntry,
  SchoolTaskAssignment,
  SchoolFinanceEntry,
  PermissionKey,
  RolePermissionProfile,
  ManagedUserAccount,
  SchoolAiAgentConfig,
  SchoolAiProvider,
  StudentExamRecord,
  AttendanceStatus,
} from '../types';
import { saveKeyToNeonDb } from './neonDbService';

const createStaffAvatar = (initials: string, bgHex: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="28" fill="${bgHex}"/>
      <circle cx="80" cy="58" r="28" fill="rgba(255,255,255,0.22)"/>
      <path d="M32 142c8-28 28-42 48-42s40 14 48 42" fill="rgba(255,255,255,0.22)"/>
      <text x="80" y="92" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
    </svg>`
  )}`;

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'stf-101',
    empId: 'EMP-101',
    rfidCardNo: '0099001101',
    name: 'Ustad Ahmed Raza',
    designation: 'Senior Mathematics Teacher',
    subject: 'Mathematics',
    assignedClasses: ['8-A', '9-A', '10-A'],
    phone: '+923009990002',
    email: 'ahmed.raza@visiongrammarschool.edu.pk',
    salaryPKR: 45000,
    status: 'Active',
    role: 'Teacher',
    courseCompletionRate: 92,
    performanceScore: 95,
    photoUrl: createStaffAvatar('AR', '#002366'),
  },
  {
    id: 'stf-102',
    empId: 'EMP-102',
    rfidCardNo: '0099001102',
    name: 'Ustani Sana Fatima',
    designation: 'Science & Biology Head',
    subject: 'General Science / Biology',
    assignedClasses: ['7-A', '8-A', '9-A'],
    phone: '+923009990003',
    email: 'sana.fatima@visiongrammarschool.edu.pk',
    salaryPKR: 42000,
    status: 'Active',
    role: 'Teacher',
    courseCompletionRate: 96,
    performanceScore: 97,
    photoUrl: createStaffAvatar('SF', '#047857'),
  },
  {
    id: 'stf-103',
    empId: 'EMP-103',
    rfidCardNo: '0099001103',
    name: 'Ustad Muhammad Bilal',
    designation: 'English & Literature Teacher',
    subject: 'English',
    assignedClasses: ['6-A', '8-A', '10-A'],
    phone: '+923009990004',
    email: 'm.bilal@visiongrammarschool.edu.pk',
    salaryPKR: 38000,
    status: 'Active',
    role: 'Teacher',
    courseCompletionRate: 84,
    performanceScore: 89,
    photoUrl: createStaffAvatar('MB', '#1d4ed8'),
  },
  {
    id: 'stf-104',
    empId: 'EMP-104',
    rfidCardNo: '0099001104',
    name: 'Ustani Zainab Baloch',
    designation: 'Early Years & Primary Lead (KG–Grade 5)',
    subject: 'English, Urdu & Phonics',
    assignedClasses: ['KG', 'Prep', '1-A', '3-A', '5-A'],
    phone: '+923009990005',
    email: 'zainab.baloch@visiongrammarschool.edu.pk',
    salaryPKR: 36000,
    status: 'Active',
    role: 'Teacher',
    courseCompletionRate: 90,
    performanceScore: 93,
    photoUrl: createStaffAvatar('ZB', '#7c3aed'),
  },
  {
    id: 'stf-105',
    empId: 'EMP-105',
    rfidCardNo: '0099001105',
    name: 'Hafiz Tariq Jamil',
    designation: 'Urdu, Islamiat & Saraiki Teacher',
    subject: 'Urdu & Islamiat',
    assignedClasses: ['6-A', '7-A', '8-A', '9-A'],
    phone: '+923009990006',
    email: 'tariq.jamil@visiongrammarschool.edu.pk',
    salaryPKR: 35000,
    status: 'Active',
    role: 'Teacher',
    courseCompletionRate: 88,
    performanceScore: 91,
    photoUrl: createStaffAvatar('TJ', '#b45309'),
  },
  {
    id: 'stf-106',
    empId: 'EMP-106',
    rfidCardNo: '0099001106',
    name: 'Kamran Lashari',
    designation: 'Campus Admin & RFID Gate Coordinator',
    subject: 'Administration & IT',
    assignedClasses: ['All'],
    phone: '+923009990007',
    email: 'admin@visiongrammarschool.edu.pk',
    salaryPKR: 40000,
    status: 'Active',
    role: 'Staff',
    courseCompletionRate: 100,
    performanceScore: 96,
    photoUrl: createStaffAvatar('KL', '#0f766e'),
  },
];

export const INITIAL_SAVED_QUESTION_PAPERS: SavedQuestionPaper[] = [
  {
    id: 'qp-math-8a-mid',
    examType: 'MidTerm',
    schoolHeaderTitle: 'VISION GRAMMAR SCHOOL — BLOCK 56, DERA GHAZI KHAN',
    grade: '8-A',
    subject: 'Mathematics',
    timeAllowed: '2 Hours 30 Minutes',
    totalMarks: 100,
    coveredSyllabus: 'Unit 1 to Unit 6 (Sets, Real Numbers, Algebra, Linear Equations & Geometry)',
    createdAt: '2026-10-18',
    createdBy: 'Ustad Ahmed Raza',
    examDate: '2026-10-28',
    instructions: [
      'Attempt ALL Multiple Choice Questions in Section A on the OMR/Question Sheet.',
      'Show neat step-by-step mathematical working in Section B and Section C.',
      'Calculators are not allowed for Class 8-A.',
    ],
    mcqs: [
      {
        qNo: 1,
        question: 'If 2x + 6 = 14, then the value of x is:',
        options: ['x = 2', 'x = 4', 'x = 6', 'x = 10'],
        correctAnswer: 'x = 4',
        marks: 5,
      },
      {
        qNo: 2,
        question: 'The square root of 196 is:',
        options: ['12', '13', '14', '16'],
        correctAnswer: '14',
        marks: 5,
      },
      {
        qNo: 3,
        question: 'Which algebraic identity equals (a + b)²?',
        options: ['a² - b²', 'a² + 2ab + b²', 'a² - 2ab + b²', '2a + 2b'],
        correctAnswer: 'a² + 2ab + b²',
        marks: 5,
      },
      {
        qNo: 4,
        question: 'The sum of interior angles of a triangle is always:',
        options: ['90°', '180°', '270°', '360°'],
        correctAnswer: '180°',
        marks: 5,
      },
    ],
    shortQuestions: [
      {
        qNo: 1,
        question: 'Solve the linear equation: 5(x - 2) = 3x + 4 and verify your answer.',
        marks: 10,
        modelAnswer: '5x - 10 = 3x + 4 => 2x = 14 => x = 7. Verification: 5(7-2)=25 and 3(7)+4=25.',
      },
      {
        qNo: 2,
        question: 'Factorize completely: x² + 9x + 20.',
        marks: 10,
        modelAnswer: 'x² + 4x + 5x + 20 = x(x + 4) + 5(x + 4) = (x + 4)(x + 5).',
      },
      {
        qNo: 3,
        question: 'Find the area and perimeter of a rectangular field of length 25m and width 14m.',
        marks: 10,
        modelAnswer: 'Area = 25 × 14 = 350 m². Perimeter = 2(25 + 14) = 78 m.',
      },
      {
        qNo: 4,
        question: 'Simplify using laws of exponents: (2³ × 2⁵) ÷ 2⁴.',
        marks: 10,
        modelAnswer: '2^(3+5-4) = 2⁴ = 16.',
      },
    ],
    longQuestions: [
      {
        qNo: 1,
        question: 'If x + 1/x = 5, find the values of (i) x² + 1/x² and (ii) x³ + 1/x³ showing all algebraic steps.',
        marks: 20,
        markingRubric: '10 marks for squaring both sides to get x² + 1/x² = 23; 10 marks for cubing both sides to get x³ + 1/x³ = 110.',
      },
      {
        qNo: 2,
        question: 'Construct a triangle ABC in which AB = 6cm, BC = 5cm and angle B = 60°. Write the construction steps.',
        marks: 20,
        markingRubric: '12 marks for accurate compass construction; 8 marks for 4 clear steps of construction.',
      },
    ],
  },
  {
    id: 'qp-sci-9a-mid',
    examType: 'MidTerm',
    schoolHeaderTitle: 'VISION GRAMMAR SCHOOL — BLOCK 56, DERA GHAZI KHAN',
    grade: '9-A',
    subject: 'Biology / General Science',
    timeAllowed: '2 Hours 30 Minutes',
    totalMarks: 100,
    coveredSyllabus: 'BISE D.G. Khan Pattern: Cell Biology, Enzymes & Bioenergetics (Photosynthesis)',
    createdAt: '2026-10-19',
    createdBy: 'Ustani Sana Fatima',
    examDate: '2026-10-29',
    instructions: [
      'Draw neat and labeled biological diagrams wherever required.',
      'All questions follow BISE D.G. Khan Board analytical SLO pattern.',
    ],
    mcqs: [
      {
        qNo: 1,
        question: 'Which organelle is known as the powerhouse of the cell?',
        options: ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Nucleus'],
        correctAnswer: 'Mitochondria',
        marks: 5,
      },
      {
        qNo: 2,
        question: 'Photosynthesis takes place in which pigment of plant leaves?',
        options: ['Hemoglobin', 'Chlorophyll', 'Carotene', 'Insulin'],
        correctAnswer: 'Chlorophyll',
        marks: 5,
      },
      {
        qNo: 3,
        question: 'Biological catalysts made of proteins are called:',
        options: ['Hormones', 'Enzymes', 'Lipids', 'Vitamins'],
        correctAnswer: 'Enzymes',
        marks: 5,
      },
      {
        qNo: 4,
        question: 'Which gas is released as a byproduct during the light reactions of photosynthesis?',
        options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Methane'],
        correctAnswer: 'Oxygen',
        marks: 5,
      },
    ],
    shortQuestions: [
      {
        qNo: 1,
        question: 'Differentiate between Prokaryotic and Eukaryotic cells with two examples.',
        marks: 10,
        modelAnswer: 'Eukaryotic cells have a membrane-bound nucleus (Plants, Animals); Prokaryotic cells lack a true nucleus (Bacteria).',
      },
      {
        qNo: 2,
        question: 'Define the Lock and Key Model of enzyme action.',
        marks: 10,
        modelAnswer: 'Proposed by Emil Fischer (1894): Enzyme active site has a specific geometric shape that fits only a specific substrate.',
      },
      {
        qNo: 3,
        question: 'Write the balanced chemical equation of Photosynthesis.',
        marks: 10,
        modelAnswer: '6CO₂ + 6H₂O + Light Energy (Chlorophyll) → C₆H₁₂O₆ + 6O₂.',
      },
      {
        qNo: 4,
        question: 'Why does enzyme activity decrease above optimal temperature (37°C in humans)?',
        marks: 10,
        modelAnswer: 'High temperature breaks globular protein bonds, causing denaturation of the active site.',
      },
    ],
    longQuestions: [
      {
        qNo: 1,
        question: 'Explain the mechanism of Light and Dark reactions of Photosynthesis with a labeled chloroplast diagram.',
        marks: 20,
        markingRubric: '8 marks for Light reaction (Thylakoid), 7 marks for Calvin cycle (Stroma), 5 marks for labeled diagram.',
      },
      {
        qNo: 2,
        question: 'Describe the structure and functions of Cell Membrane (Fluid Mosaic Model) and Nucleus.',
        marks: 20,
        markingRubric: '10 marks for Fluid Mosaic Model + lipid bilayer; 10 marks for Nuclear envelope, nucleolus & chromosomes.',
      },
    ],
  },
];

export const DEFAULT_GOOGLE_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1VisionGrammarSchool_KG_to_Grade10_Resources';

export const INITIAL_DRIVE_MATERIALS: DriveMaterialItem[] = [
  {
    id: 'drv-kg-eng-1',
    grade: 'KG',
    subject: 'English',
    topic: 'Phonics Sounds A–Z & CVC Words',
    title: 'KG Phonics Animated Video + Tracing Worksheet PDF',
    resourceType: 'WorksheetPDF',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_KG_Phonics',
    durationOrPages: '12 Pages Printable PDF + 8m Video',
    scheduleDayLabel: 'Period 1 · 08:00 AM',
    description: 'Ready-made colorful alphabet tracing worksheets, sound flashcards, and classroom phonics song for KG.',
  },
  {
    id: 'drv-prep-math-1',
    grade: 'Prep',
    subject: 'Mathematics',
    topic: 'Counting 1–100 & Visual Addition with Shapes',
    title: 'Prep Number Sense Lesson Plan & Picture Worksheet',
    resourceType: 'LessonPlan',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Prep_Math',
    durationOrPages: '40-Min Lesson Plan + 6 Worksheets',
    scheduleDayLabel: 'Period 2 · 08:40 AM',
    description: 'Hands-on bead counting activity plan and printable color-and-count worksheets.',
  },
  {
    id: 'drv-3a-sci-1',
    grade: '3-A',
    subject: 'General Science',
    topic: 'Parts of a Plant & Life Cycle of a Seed',
    title: 'Grade 3 Plant Parts Video Lecture & Labeling Worksheet',
    resourceType: 'Video',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade3_Science',
    durationOrPages: '14m HD Video + 4 Diagram Sheets',
    scheduleDayLabel: 'Period 3 · 09:20 AM',
    description: 'Visual animation of root, stem, leaf, and flower functions with printable diagram labeling sheet.',
  },
  {
    id: 'drv-5a-urdu-1',
    grade: '5-A',
    subject: 'Urdu',
    topic: 'حمد و نعت، الفاظ معانی اور خوشخطی (نستعلیق)',
    title: 'Grade 5 Urdu Reading Passage, Grammar & Calligraphy PDF',
    resourceType: 'WorksheetPDF',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade5_Urdu',
    durationOrPages: '10 Pages PDF + Audio Recitation',
    scheduleDayLabel: 'Period 4 · 10:00 AM',
    description: 'PCTB aligned Urdu comprehension worksheet, Tashreeh guide, and Nastaliq handwriting practice lines.',
  },
  {
    id: 'drv-8a-math-1',
    grade: '8-A',
    subject: 'Mathematics',
    topic: 'Chapter 2: Linear & Quadratic Equations (Ex 2.1–2.4)',
    title: 'Grade 8 Algebra Video Lecture, Lesson Plan & Practice Sheet',
    resourceType: 'WorksheetPDF',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade8_Math',
    durationOrPages: '18m Video + 25 Solved Problems PDF',
    scheduleDayLabel: 'Period 1 · 08:00 AM (Today)',
    description: 'Complete step-by-step solved exercises, board work script, and 20 practice problems for Class 8-A.',
  },
  {
    id: 'drv-8a-sci-1',
    grade: '8-A',
    subject: 'General Science',
    topic: 'Light, Reflection, Refraction & Lenses',
    title: 'Grade 8 Optics Ray Diagram Video & Lab Activity Sheet',
    resourceType: 'Video',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade8_Science',
    durationOrPages: '15m Video + Lab Worksheet PDF',
    scheduleDayLabel: 'Period 2 · 08:40 AM (Today)',
    description: 'Concave and convex lens ray diagrams explained in Urdu/English with zero-cost classroom mirror experiment.',
  },
  {
    id: 'drv-9a-bio-1',
    grade: '9-A',
    subject: 'Biology',
    topic: 'Chapter 7: Bioenergetics & Photosynthesis (BISE D.G. Khan)',
    title: 'Class 9 BISE Board Past-Paper MCQs, Lesson Plan & Video',
    resourceType: 'LessonPlan',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade9_Biology',
    durationOrPages: '40m Script + 50 Board MCQs PDF',
    scheduleDayLabel: 'Period 3 · 09:20 AM (Today)',
    description: 'Complete Light & Dark reaction lesson plan, chloroplast diagram worksheet, and 5-year BISE DG Khan board questions.',
  },
  {
    id: 'drv-10a-eng-1',
    grade: '10-A',
    subject: 'English',
    topic: 'Direct & Indirect Narration + Paragraph Translation',
    title: 'Matric Class 10 English Grammar Rules PDF & Video Guide',
    resourceType: 'WorksheetPDF',
    driveUrl: 'https://drive.google.com/drive/folders/1VisionGrammarSchool_Grade10_English',
    durationOrPages: '16 Pages Grammar Drill PDF',
    scheduleDayLabel: 'Period 5 · 11:00 AM (Today)',
    description: 'BISE D.G. Khan Matric board Urdu-to-English paragraph translation drills and Direct/Indirect conversion tables.',
  },
];

export const INITIAL_READING_ASSESSMENTS: ReadingOcrAssessment[] = [
  {
    id: 'read-56432-1',
    studentId: '56432',
    studentName: 'Akhtar Ali',
    grade: '8-A',
    subject: 'General Science',
    topicTitle: 'Light, Reflection & Refraction (Page 68)',
    teacherInstructions: 'Read paragraph 1 and 2 aloud clearly. Focus on scientific terms: refraction, incident ray, normal, and medium.',
    capturedBookOcrText:
      'When a ray of light passes from a rarer medium such as air into a denser medium such as glass or water, it bends towards the normal. This bending of light is called refraction of light.',
    studentSpokenTranscript:
      'When a ray of light passes from a rarer medium such as air into a denser medium such as glass or water, it bends towards the normal. This bending of light is called refraction of light.',
    ambientNoiseDb: 36,
    noiseStatus: 'Optimal',
    fluencyScore: 92,
    pronunciationScore: 90,
    overallScoreOutOf10: 9,
    wordsPerMinute: 112,
    mispronouncedWords: ['rarer (slight hesitation)'],
    skippedWords: [],
    strengths: ['Clear Scientific Pronunciation', 'Steady Reading Pace (112 WPM)', 'Accurate Sentence Intonation'],
    weaknesses: ['Pronunciation of multi-syllable vowel words (rarer)'],
    aiFeedback:
      'MashaAllah! Akhtar Ali read the Science passage with 92% fluency and accurate pronunciation of "refraction" and "incident ray" in a quiet classroom (36 dB).',
    remedialTask: 'Practice reading 5 optical terms aloud: Rarer, Denser, Incidence, Refraction, Critical Angle.',
    ocrSnapshotsCount: 3,
    assessedByTeacher: 'Ustani Sana Fatima',
    createdAt: '2026-10-22 09:15 AM',
  },
  {
    id: 'read-563-1',
    studentId: '563',
    studentName: 'Maria Bibi',
    grade: '9-A',
    subject: 'Urdu / Biology',
    topicTitle: 'ضیائی تالیف (Photosynthesis - PCTB Ch. 7)',
    teacherInstructions: 'کتاب کے صفحہ نمبر 118 سے ضیائی تالیف کی تعریف اور مساوات بلند آواز سے پڑھیں۔',
    capturedBookOcrText:
      'پودے سورج کی روشنی، پانی اور کاربن ڈائی آکسائیڈ کی مدد سے کلوروفل کی موجودگی میں اپنی خوراک (گلوکوز) خود تیار کرتے ہیں اور آکسیجن خارج کرتے ہیں۔',
    studentSpokenTranscript:
      'پودے سورج کی روشنی، پانی اور کاربن ڈائی آکسائیڈ کی مدد سے کلوروفل کی موجودگی میں اپنی خوراک خود تیار کرتے ہیں اور آکسیجن خارج کرتے ہیں۔',
    ambientNoiseDb: 34,
    noiseStatus: 'Optimal',
    fluencyScore: 96,
    pronunciationScore: 95,
    overallScoreOutOf10: 9.5,
    wordsPerMinute: 120,
    mispronouncedWords: [],
    skippedWords: [],
    strengths: ['Fluent Urdu Talaffuz', 'Zero Skipped Words', 'Confident Delivery'],
    weaknesses: [],
    aiFeedback:
      'Outstanding recitation! Maria Bibi read the entire biological definition with 96% fluency and crisp pronunciation.',
    remedialTask: 'Ready to lead peer-group reading in Class 9-A.',
    ocrSnapshotsCount: 4,
    assessedByTeacher: 'Ustani Sana Fatima',
    createdAt: '2026-10-22 10:05 AM',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-1001',
    timestamp: '2026-10-23 08:05:12 AM',
    actorName: 'Ustad Ahmed Raza',
    actorRole: 'Teacher',
    actionCategory: 'ATTENDANCE',
    actionTitle: 'Marked Class 8-A Attendance via RFID & AI Photo',
    targetEntity: 'Class 8-A (28 Students)',
    details: 'Verified 27 Present (RFID Gate + Classroom AI Photo Scan) and 1 Absent. Parent SMS dispatched.',
  },
  {
    id: 'aud-1002',
    timestamp: '2026-10-23 09:20:45 AM',
    actorName: 'Ustani Sana Fatima',
    actorRole: 'Teacher',
    actionCategory: 'AI_TUTOR_ASSESSMENT',
    actionTitle: 'Recorded Live Camera & OCR Reading Assessment',
    targetEntity: 'Akhtar Ali (GR #56432 · Class 8-A)',
    details: 'Reading Fluency: 92%, Score: 9/10 on "Light & Refraction". Saved to student permanent learning profile.',
  },
  {
    id: 'aud-1003',
    timestamp: '2026-10-23 10:40:18 AM',
    actorName: 'Ustad Ahmed Raza',
    actorRole: 'Teacher',
    actionCategory: 'EXAM_MARKS',
    actionTitle: 'Entered Mid-Term Marks & Auto-Calculated Positions',
    targetEntity: 'Class 8-A · Mathematics',
    details: 'Entered marks for Akhtar Ali (#56432): 92/100 (A+). Auto-ranked 1st Position in Class 8-A.',
  },
  {
    id: 'aud-1004',
    timestamp: '2026-10-23 11:15:00 AM',
    actorName: 'Ustad Ahmed Raza',
    actorRole: 'Teacher',
    actionCategory: 'QUESTION_PAPER',
    actionTitle: 'Prepared & Printed Mid-Term Question Paper',
    targetEntity: 'Class 8-A · Mathematics (100 Marks)',
    details: 'Generated Section A (MCQs), Section B (Short), Section C (Long) with marking rubric and sent to printer.',
  },
];

export const INITIAL_TASKS: SchoolTaskAssignment[] = [
  {
    id: 'tsk-101',
    title: 'Submit Mid-Term Mathematics Question Paper & Answer Key',
    description: 'Prepare 100-mark BISE pattern paper for Class 8-A & 9-A and print 35 copies for exam hall.',
    assignedToId: 'stf-101',
    assignedToName: 'Ustad Ahmed Raza',
    assignedToRole: 'Teacher',
    targetClass: '8-A & 9-A',
    subject: 'Mathematics',
    dueDate: '2026-10-23',
    createdAt: '2026-10-20',
    priority: 'High',
    status: 'Completed',
    completedAt: '2026-10-23 11:15 AM',
    completionNotes: 'Question paper generated, reviewed, and printed with answer key.',
  },
  {
    id: 'tsk-102',
    title: 'Conduct Individual Reading & OCR Assessment for Weak Readers',
    description: 'Use the AI Reading Tutor camera + mic tool to assess reading fluency of all Class 8-A students.',
    assignedToId: 'stf-102',
    assignedToName: 'Ustani Sana Fatima',
    assignedToRole: 'Teacher',
    targetClass: '8-A',
    subject: 'General Science',
    dueDate: '2026-10-24',
    createdAt: '2026-10-21',
    priority: 'High',
    status: 'In_Progress',
    completionNotes: '18 of 24 students assessed; remaining 6 scheduled for tomorrow Period 2.',
  },
  {
    id: 'tsk-103',
    title: 'Upload Grade 6 & Grade 8 English Worksheets to Google Drive',
    description: 'Organise PDF grammar worksheets for Past Indefinite & Active/Passive voice in the school Drive.',
    assignedToId: 'stf-103',
    assignedToName: 'Ustad Muhammad Bilal',
    assignedToRole: 'Teacher',
    targetClass: '6-A & 8-A',
    subject: 'English',
    dueDate: '2026-10-21',
    createdAt: '2026-10-15',
    priority: 'High',
    status: 'Pending_Overdue',
    completionNotes: 'Previously pending from last week — requires immediate upload today.',
  },
  {
    id: 'tsk-104',
    title: 'Complete Urdu & Saraiki Dictation (Imla) Notebook Checking',
    description: 'Check Nuqta accuracy and Nastaliq handwriting for Class 6-A & 7-A notebooks.',
    assignedToId: 'stf-105',
    assignedToName: 'Hafiz Tariq Jamil',
    assignedToRole: 'Teacher',
    targetClass: '6-A & 7-A',
    subject: 'Urdu & Saraiki',
    dueDate: '2026-10-22',
    createdAt: '2026-10-18',
    priority: 'Medium',
    status: 'Pending_Overdue',
    completionNotes: 'Pending for 7 students who were absent during harvest.',
  },
  {
    id: 'tsk-105',
    title: 'Verify RFID Card Issuing for New KG & Prep Admissions',
    description: 'Link Chinese 125kHz RFID cards for newly admitted early-years students at Gate Terminal.',
    assignedToId: 'stf-106',
    assignedToName: 'Kamran Lashari',
    assignedToRole: 'Staff',
    targetClass: 'KG & Prep',
    subject: 'RFID Gate',
    dueDate: '2026-10-25',
    createdAt: '2026-10-22',
    priority: 'Medium',
    status: 'In_Progress',
  },
];

export const INITIAL_FINANCE_ENTRIES: SchoolFinanceEntry[] = [
  {
    id: 'fin-1',
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Tuition_Fee',
    title: 'Today Class 8-A & 9-A Tuition Fee Collection (12 Challans)',
    amountPKR: 42500,
    recordedBy: 'Kamran Lashari (Admin)',
    referenceNo: 'RCP-OCT-23A',
  },
  {
    id: 'fin-2',
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Admission_Fee',
    title: 'New Admission Registration & Prospectus Fee (3 Students)',
    amountPKR: 15000,
    recordedBy: 'Kamran Lashari (Admin)',
    referenceNo: 'ADM-OCT-09',
  },
  {
    id: 'fin-3',
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Exam_Fee',
    title: 'Mid-Term Examination Paper & Printing Fund Collected',
    amountPKR: 8500,
    recordedBy: 'Kamran Lashari (Admin)',
    referenceNo: 'EXM-OCT-14',
  },
  {
    id: 'fin-4',
    date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    category: 'Printing_Stationery',
    title: 'Mid-Term Question Papers, OMR Sheets & Color DMC Card Stock',
    amountPKR: 6200,
    recordedBy: 'Principal Office',
    referenceNo: 'EXP-PRT-88',
  },
  {
    id: 'fin-5',
    date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    category: 'Utilities_Electricity',
    title: 'MEPCO Campus Electricity & Solar Inverter Maintenance',
    amountPKR: 9800,
    recordedBy: 'Kamran Lashari (Admin)',
    referenceNo: 'EXP-UTL-41',
  },
  {
    id: 'fin-6',
    date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    category: 'Lab_Equipment',
    title: 'Science & Computer Lab USB Webcams + Microphones for Reading Tutor',
    amountPKR: 5400,
    recordedBy: 'Principal Office',
    referenceNo: 'EXP-LAB-19',
  },
];

export const ALL_PERMISSIONS_CATALOG: Array<{
  key: PermissionKey;
  label: string;
  category: 'Attendance' | 'Exams & DMC' | 'Classroom & AI Tutor' | 'Finance' | 'Administration' | 'Public Portal';
  description: string;
}> = [
  { key: 'attendance.rfid', label: 'RFID Card Gate Attendance', category: 'Attendance', description: 'Scan Student & Staff RFID cards (1st Tap IN, 2nd Tap OUT)' },
  { key: 'attendance.ai_photo', label: 'AI Classroom Photo Attendance', category: 'Attendance', description: 'Use biometric AI camera scan to mark class attendance' },
  { key: 'attendance.manual', label: 'Optional Manual Attendance', category: 'Attendance', description: 'Use manual headcount and manual roll-call override' },
  { key: 'attendance.staff', label: 'Staff & Teacher Attendance', category: 'Attendance', description: 'Mark and view teacher/staff daily check-in & check-out' },
  { key: 'exams.paper_create', label: 'Question Paper Preparation', category: 'Exams & DMC', description: 'Create Weekly, Monthly, Mid-Term & Annual question papers' },
  { key: 'exams.paper_print', label: 'Question Paper Printing', category: 'Exams & DMC', description: 'Print formatted exam papers and marking keys' },
  { key: 'exams.ai_check', label: 'AI Answer Sheet Checking', category: 'Exams & DMC', description: 'Use AI vision to assist in grading handwritten answer sheets' },
  { key: 'exams.marks_entry', label: 'Enter & Edit Exam Marks', category: 'Exams & DMC', description: 'Enter student subject marks and compute class/school positions' },
  { key: 'exams.dmc_print', label: 'Print Official Result Cards (DMC)', category: 'Exams & DMC', description: 'Print official DMC cards with school crest and positions' },
  { key: 'tutor.drive_materials', label: 'Google Drive Classroom Materials', category: 'Classroom & AI Tutor', description: 'Access KG–10 videos, lesson plans, and PDF worksheets from Drive' },
  { key: 'tutor.ai_materials', label: 'AI Lesson & Worksheet Generator', category: 'Classroom & AI Tutor', description: 'Generate custom lesson plans, flashcards, and quizzes with AI' },
  { key: 'tutor.reading_ocr', label: 'Live Camera + Voice Reading AI Tutor', category: 'Classroom & AI Tutor', description: 'Assess individual student reading with live camera OCR & voice analysis' },
  { key: 'tutor.classwork_check', label: 'Individual Classwork & Recitation Check', category: 'Classroom & AI Tutor', description: 'Grade individual student notebooks and lesson recitation' },
  { key: 'fees.view', label: 'View Fee Challans & Ledger', category: 'Finance', description: 'View student tuition and exam fee records' },
  { key: 'fees.collect', label: 'Receive Fees & Issue Receipts', category: 'Finance', description: 'Mark fee challans paid and generate receipts' },
  { key: 'fees.expense_manage', label: 'Manage School Income & Expenses', category: 'Finance', description: 'Add and audit daily school income and expense entries' },
  { key: 'admin.access_control', label: 'User & Access Management (RBAC)', category: 'Administration', description: 'Manage roles, permissions, passwords, suspensions & admin promotions' },
  { key: 'admin.theme_cms', label: 'Theme, Banner & Landing Page CMS', category: 'Administration', description: 'Change themes, landing layouts, banners, news, and events' },
  { key: 'admin.ai_agents', label: 'AI Agents, API Keys & Subscription CLIs', category: 'Administration', description: 'Configure Codex CLI, Claude CLI, Gemini CLI, anti-api & API keys' },
  { key: 'admin.audit_logs', label: 'Principal Audit Log Inspector', category: 'Administration', description: 'Inspect all teacher and staff data entries and modifications' },
  { key: 'public.result_lookup', label: 'Public Online DMC Result Lookup', category: 'Public Portal', description: 'Allow visitors to verify student DMC results by Roll/GR No' },
  { key: 'public.admission_apply', label: 'Public Online Admission Form', category: 'Public Portal', description: 'Allow parents/visitors to submit online admission inquiries' },
];

export const INITIAL_PERMISSION_PROFILES: RolePermissionProfile[] = [
  {
    id: 'prof-admin-full',
    name: 'SuperAdmin & Principal Full Command',
    targetRole: 'Admin',
    description: 'Unrestricted access to all academic, financial, RBAC, theme CMS, audit logs, and AI CLI systems.',
    isPredefined: true,
    permissions: ALL_PERMISSIONS_CATALOG.map((p) => p.key),
  },
  {
    id: 'prof-teacher-standard',
    name: 'Standard Classroom Teacher Profile',
    targetRole: 'Teacher',
    description: 'Full access to RFID/AI attendance, Google Drive & AI teaching materials, Live Reading AI Tutor, Question Paper maker, AI Answer Sheet checker, Marks entry, and DMC printing.',
    isPredefined: true,
    permissions: [
      'attendance.rfid',
      'attendance.ai_photo',
      'attendance.manual',
      'exams.paper_create',
      'exams.paper_print',
      'exams.ai_check',
      'exams.marks_entry',
      'exams.dmc_print',
      'tutor.drive_materials',
      'tutor.ai_materials',
      'tutor.reading_ocr',
      'tutor.classwork_check',
      'fees.view',
    ],
  },
  {
    id: 'prof-teacher-restricted',
    name: 'Junior / Subject Teacher (No Marks Edit)',
    targetRole: 'Teacher',
    description: 'Can take RFID/AI attendance, use Google Drive & AI Tutor for reading/classwork, and prepare question papers, but cannot alter finalized DMC marks.',
    isPredefined: true,
    permissions: [
      'attendance.rfid',
      'attendance.ai_photo',
      'exams.paper_create',
      'exams.paper_print',
      'tutor.drive_materials',
      'tutor.ai_materials',
      'tutor.reading_ocr',
      'tutor.classwork_check',
    ],
  },
  {
    id: 'prof-student-portal',
    name: 'Student Smart Learning Profile',
    targetRole: 'Student',
    description: 'Access to personal attendance, DMC results, Google Drive study worksheets, Socratic AI Ustad, and practice quizzes.',
    isPredefined: true,
    permissions: [
      'tutor.drive_materials',
      'tutor.ai_materials',
      'public.result_lookup',
    ],
  },
  {
    id: 'prof-parent-portal',
    name: 'Walidain (Parent) Family Profile',
    targetRole: 'Parent',
    description: 'View child RFID gate IN/OUT logs, print official DMC result cards, check fee challans, and use home AI study coach.',
    isPredefined: true,
    permissions: [
      'exams.dmc_print',
      'fees.view',
      'tutor.drive_materials',
      'public.result_lookup',
    ],
  },
  {
    id: 'prof-public-visitor',
    name: 'Public Website Visitor Profile',
    targetRole: 'Public',
    description: 'Strictly public access: view school information, verify DMC by Roll No, and submit admission applications.',
    isPredefined: true,
    permissions: ['public.result_lookup', 'public.admission_apply'],
  },
];

export const INITIAL_MANAGED_USERS: ManagedUserAccount[] = [
  {
    id: 'usr-admin-1',
    name: 'Principal & SuperAdmin',
    usernameOrId: 'admin',
    email: 'principal@visiongrammarschool.edu.pk',
    phone: '+923009990001',
    role: 'Admin',
    gradeOrDept: 'Executive Office',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-admin-full',
    lastLogin: '2026-10-23 08:00 AM',
  },
  {
    id: 'usr-tch-101',
    name: 'Ustad Ahmed Raza',
    usernameOrId: 'EMP-101',
    email: 'ahmed.raza@visiongrammarschool.edu.pk',
    phone: '+923009990002',
    role: 'Teacher',
    linkedEntityId: 'stf-101',
    gradeOrDept: 'Class 8-A, 9-A (Mathematics)',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-teacher-standard',
    lastLogin: '2026-10-23 08:04 AM',
  },
  {
    id: 'usr-tch-102',
    name: 'Ustani Sana Fatima',
    usernameOrId: 'EMP-102',
    email: 'sana.fatima@visiongrammarschool.edu.pk',
    phone: '+923009990003',
    role: 'Teacher',
    linkedEntityId: 'stf-102',
    gradeOrDept: 'Class 8-A, 9-A (Science & Biology)',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-teacher-standard',
    lastLogin: '2026-10-23 08:12 AM',
  },
  {
    id: 'usr-tch-103',
    name: 'Ustad Muhammad Bilal',
    usernameOrId: 'EMP-103',
    email: 'm.bilal@visiongrammarschool.edu.pk',
    phone: '+923009990004',
    role: 'Teacher',
    linkedEntityId: 'stf-103',
    gradeOrDept: 'Class 6-A, 8-A, 10-A (English)',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-teacher-standard',
    lastLogin: '2026-10-22 01:30 PM',
  },
  {
    id: 'usr-par-56432',
    name: 'Ghulam Mustafa (F/O Akhtar Ali)',
    usernameOrId: 'P-56432',
    email: 'ghulam.mustafa@example.com',
    phone: '+923001234567',
    role: 'Parent',
    linkedEntityId: '56432',
    gradeOrDept: 'Parent · Class 8-A',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-parent-portal',
    lastLogin: '2026-10-22 07:45 PM',
  },
  {
    id: 'usr-stu-56432',
    name: 'Akhtar Ali',
    usernameOrId: '56432',
    email: '56432@visiongrammarschool.edu.pk',
    phone: '+923001234567',
    role: 'Student',
    linkedEntityId: '56432',
    gradeOrDept: 'Class 8-A (GR #56432)',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-student-portal',
    lastLogin: '2026-10-22 08:10 PM',
  },
  {
    id: 'usr-stu-563',
    name: 'Maria Bibi',
    usernameOrId: '563',
    email: '563@visiongrammarschool.edu.pk',
    phone: '+923017654321',
    role: 'Student',
    linkedEntityId: '563',
    gradeOrDept: 'Class 9-A (GR #563)',
    accessPinMask: '••••••',
    status: 'Active',
    profileId: 'prof-student-portal',
    lastLogin: '2026-10-22 06:20 PM',
  },
];

// --- AI AGENTS & SUBSCRIPTION CLI REGISTRY (REFERENCING E:/AKGFlow + anti-api) ---
export const INITIAL_AI_AGENT_CONFIGS: SchoolAiAgentConfig[] = [
  {
    agentKey: 'exam-paper-generator',
    label: '1. Question Paper & Rubric Architect',
    category: 'exam_engine',
    description: 'Generates BISE D.G. Khan pattern Weekly, Monthly, Mid-Term & Annual question papers with marking keys.',
    provider: 'codex-cli',
    model: 'chatgpt-subscription-codex',
    recommendedProvider: 'codex-cli',
    recommendedModel: 'chatgpt-subscription-codex',
    recommendedReason: 'Uses your existing ChatGPT Plus/Pro subscription via Codex CLI (`codex exec`) — zero API token cost & strong structured reasoning.',
  },
  {
    agentKey: 'answer-sheet-checker',
    label: '2. AI Answer Sheet & Homework Grader',
    category: 'exam_engine',
    description: 'Checks student answer sheets and math/science steps against the teacher marking rubric.',
    provider: 'anti-api',
    model: 'claude-sonnet-4-5',
    recommendedProvider: 'anti-api',
    recommendedModel: 'claude-sonnet-4-5',
    recommendedReason: 'Routes through `anti-api` (Antigravity Subscription proxy) or Gemini Vision for step-by-step grading without API billing.',
  },
  {
    agentKey: 'live-reading-ocr-tutor',
    label: '3. Live Camera OCR & Reading Fluency Evaluator',
    category: 'classroom_tutor',
    description: 'Periodically OCR-scans textbook pages from camera and evaluates live student reading pronunciation & WPM.',
    provider: 'gemini-cli',
    model: 'agy-gemini-2.5-pro',
    recommendedProvider: 'gemini-cli',
    recommendedModel: 'agy-gemini-2.5-pro',
    recommendedReason: 'Uses Antigravity CLI (`agy`) / Gemini subscription for fast multimodal OCR + Urdu/Saraiki/English speech alignment.',
  },
  {
    agentKey: 'lesson-worksheet-creator',
    label: '4. Lesson Plan, Worksheet & 24-Day Syllabus Maker',
    category: 'classroom_tutor',
    description: 'Builds daily 40-min teacher scripts (Kitna, Kya, Kaise Parhana Hai) and printable PDF worksheets.',
    provider: 'codex-cli',
    model: 'chatgpt-subscription-codex',
    recommendedProvider: 'codex-cli',
    recommendedModel: 'chatgpt-subscription-codex',
    recommendedReason: 'Leverages ChatGPT subscription via Codex CLI for zero-cost bulk lesson and worksheet generation.',
  },
  {
    agentKey: 'socratic-student-ustad',
    label: '5. Multilingual Socratic AI Ustad (Urdu / Saraiki / English)',
    category: 'classroom_tutor',
    description: 'Guides students step-by-step in Urdu, Saraiki, and English without rote memorization (Ratta).',
    provider: 'claude-cli',
    model: 'claude-code-subscription',
    recommendedProvider: 'claude-cli',
    recommendedModel: 'claude-code-subscription',
    recommendedReason: 'Claude excels at natural Urdu/Saraiki/Arabic script dialogue via Claude Code CLI (`claude -p`).',
  },
  {
    agentKey: 'attendance-vision-agent',
    label: '6. Classroom Group Photo Biometric Scanner',
    category: 'attendance_vision',
    description: 'Detects faces and matches student roster from classroom group photos.',
    provider: 'gemini-api',
    model: 'gemini-2.5-flash',
    recommendedProvider: 'gemini-api',
    recommendedModel: 'gemini-2.5-flash',
    recommendedReason: 'High-speed multi-image face embedding comparison.',
  },
  {
    agentKey: 'principal-audit-analyst',
    label: '7. Principal Executive Audit & DMC Remarks Agent',
    category: 'executive_audit',
    description: 'Summarizes teacher audit logs, syllabus completion, and writes personalized Principal remarks on DMCs.',
    provider: 'anti-api',
    model: 'gemini-2.5-pro',
    recommendedProvider: 'anti-api',
    recommendedModel: 'gemini-2.5-pro',
    recommendedReason: 'Zero-cost executive analysis via Antigravity `anti-api` subscription endpoint.',
  },
];

export const AI_PROVIDER_CATALOG: Record<
  SchoolAiProvider,
  {
    label: string;
    badge: string;
    isSubscription: boolean;
    models: string[];
    cliCommandHint: string;
  }
> = {
  'codex-cli': {
    label: '🔵 ChatGPT Subscription (Codex CLI)',
    badge: 'Zero API Cost · ChatGPT Sub',
    isSubscription: true,
    models: ['chatgpt-subscription-codex', 'o3-codex-sub', 'gpt-4o-codex-sub'],
    cliCommandHint: 'codex login --device-auth  |  codex exec - --json --sandbox read-only',
  },
  'claude-cli': {
    label: '🟣 Claude Subscription (Claude Code CLI)',
    badge: 'Zero API Cost · Claude Sub',
    isSubscription: true,
    models: ['claude-code-subscription', 'claude-sonnet-4-5-sub', 'claude-opus-4-sub'],
    cliCommandHint: 'claude setup-token  |  claude -p "<prompt>" --output-format json',
  },
  'gemini-cli': {
    label: '🟢 Google AI Pro/Ultra (Antigravity CLI `agy`)',
    badge: 'Zero API Cost · Google Sub',
    isSubscription: true,
    models: ['agy-gemini-2.5-pro', 'agy-gemini-2.5-flash'],
    cliCommandHint: 'agy (OAuth token at ~/.gemini/antigravity-cli/antigravity-oauth-token)',
  },
  'anti-api': {
    label: '⚡ anti-api (Antigravity Subscription Proxy)',
    badge: 'OpenAI/Claude Compatible Proxy',
    isSubscription: true,
    models: ['claude-sonnet-4-5', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gpt-4o'],
    cliCommandHint: 'anti-api proxy at http://127.0.0.1:8080/v1 (Antigravity Subscription Pool)',
  },
  'gemini-api': {
    label: '🟢 Google Gemini (API Key)',
    badge: 'API Key',
    isSubscription: false,
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    cliCommandHint: 'Uses GEMINI_API_KEY / AI Studio Key',
  },
  'openai-api': {
    label: '🔵 OpenAI (API Key)',
    badge: 'API Key',
    isSubscription: false,
    models: ['gpt-4o-mini', 'gpt-4o', 'o4-mini'],
    cliCommandHint: 'Uses OPENAI_API_KEY',
  },
  'claude-api': {
    label: '🟣 Anthropic Claude (API Key)',
    badge: 'API Key',
    isSubscription: false,
    models: ['claude-haiku-4-5', 'claude-sonnet-4-5', 'claude-opus-4'],
    cliCommandHint: 'Uses ANTHROPIC_API_KEY',
  },
};

/**
 * Automatically calculates Class Position (per grade + examType)
 * and Overall School Position (across all grades for the same examType)
 * so teachers never have to compute ranks manually!
 */
export function recalculateAllExamPositions(
  records: StudentExamRecord[]
): StudentExamRecord[] {
  const cloned = records.map((r) => ({ ...r }));

  const formatOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // 1. Group by (grade + examType) for Class Position
  const classGroups = new Map<string, StudentExamRecord[]>();
  cloned.forEach((rec) => {
    const key = `${rec.grade.trim().toUpperCase()}__${rec.examType}`;
    const arr = classGroups.get(key) || [];
    arr.push(rec);
    classGroups.set(key, arr);
  });

  classGroups.forEach((group) => {
    group.sort((a, b) => b.percentage - a.percentage || b.obtainedMarks - a.obtainedMarks);
    group.forEach((rec, idx) => {
      rec.positionInClass = `${formatOrdinal(idx + 1)} Position in Class ${rec.grade}`;
    });
  });

  // 2. Group by examType across the entire school for Overall School Position
  const schoolGroups = new Map<string, StudentExamRecord[]>();
  cloned.forEach((rec) => {
    const key = rec.examType;
    const arr = schoolGroups.get(key) || [];
    arr.push(rec);
    schoolGroups.set(key, arr);
  });

  schoolGroups.forEach((group) => {
    group.sort((a, b) => b.percentage - a.percentage || b.obtainedMarks - a.obtainedMarks);
    group.forEach((rec, idx) => {
      rec.overallSchoolPosition = `${formatOrdinal(idx + 1)} in School (${rec.examType})`;
    });
  });

  return cloned;
}

// --- LOCALSTORAGE + NEON DB STORE HELPERS ---
function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T, neonKey?: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (neonKey) {
      saveKeyToNeonDb(neonKey, value);
    }
    window.dispatchEvent(new CustomEvent('vgs-store-updated', { detail: { key } }));
  } catch {
    // ignore quota errors
  }
}

export const loadStaffMembers = (): StaffMember[] =>
  loadJson('vgs_staff_members_v1', INITIAL_STAFF_MEMBERS);
export const getStaffList = loadStaffMembers;

export const saveStaffMembers = (staff: StaffMember[]): void =>
  saveJson('vgs_staff_members_v1', staff, 'staffMembers');

export const loadStaffAttendance = (): StaffAttendanceData => {
  const today = new Date().toISOString().split('T')[0];
  const fallback: StaffAttendanceData = {
    'stf-101': {
      [today]: {
        date: today,
        status: AttendanceStatus.PRESENT,
        checkInTime: '07:42 AM',
        attendanceState: 'IN',
        method: 'RFID_CARD',
        rfidSerial: '0099001101',
      },
    },
    'stf-102': {
      [today]: {
        date: today,
        status: AttendanceStatus.PRESENT,
        checkInTime: '07:45 AM',
        attendanceState: 'IN',
        method: 'RFID_CARD',
        rfidSerial: '0099001102',
      },
    },
    'stf-104': {
      [today]: {
        date: today,
        status: AttendanceStatus.PRESENT,
        checkInTime: '07:48 AM',
        attendanceState: 'IN',
        method: 'AI_PHOTO',
      },
    },
    'stf-105': {
      [today]: {
        date: today,
        status: AttendanceStatus.PRESENT,
        checkInTime: '07:50 AM',
        attendanceState: 'IN',
        method: 'RFID_CARD',
        rfidSerial: '0099001105',
      },
    },
    'stf-106': {
      [today]: {
        date: today,
        status: AttendanceStatus.PRESENT,
        checkInTime: '07:30 AM',
        attendanceState: 'IN',
        method: 'RFID_CARD',
        rfidSerial: '0099001106',
      },
    },
  };
  return loadJson('vgs_staff_attendance_v1', fallback);
};
export const getStaffAttendance = loadStaffAttendance;

export const saveStaffAttendance = (data: StaffAttendanceData): void =>
  saveJson('vgs_staff_attendance_v1', data, 'staffAttendance');

export const loadSavedQuestionPapers = (): SavedQuestionPaper[] =>
  loadJson('vgs_question_papers_v1', INITIAL_SAVED_QUESTION_PAPERS);
export const getSavedQuestionPapers = loadSavedQuestionPapers;

export const saveQuestionPapers = (papers: SavedQuestionPaper[]): void =>
  saveJson('vgs_question_papers_v1', papers, 'questionPapers');

export const loadDriveFolderUrl = (): string =>
  loadJson('vgs_google_drive_url_v1', DEFAULT_GOOGLE_DRIVE_FOLDER_URL);
export const getDriveFolderUrl = loadDriveFolderUrl;

export const saveDriveFolderUrl = (url: string): void =>
  saveJson('vgs_google_drive_url_v1', url, 'driveFolderUrl');

export const loadDriveMaterials = (): DriveMaterialItem[] => {
  const raw = loadJson('vgs_drive_materials_v1', INITIAL_DRIVE_MATERIALS);
  return raw.map((item: any) => ({
    ...item,
    materialType:
      item.materialType ||
      (item.resourceType === 'Video'
        ? 'VIDEO'
        : item.resourceType === 'LessonPlan'
        ? 'LESSON_PLAN'
        : 'WORKSHEET_PDF'),
    scheduledDay: item.scheduledDay || item.scheduleDayLabel || 'Scheduled',
    isAiGenerated: item.isAiGenerated ?? item.resourceType === 'AI_Generated',
  }));
};
export const getDriveMaterials = loadDriveMaterials;

export const saveDriveMaterials = (items: any[]): void =>
  saveJson('vgs_drive_materials_v1', items, 'driveMaterials');

export const loadReadingAssessments = (): any[] => {
  const raw = loadJson('vgs_reading_assessments_v1', INITIAL_READING_ASSESSMENTS);
  return raw.map((r: any) => ({
    ...r,
    grNo: r.grNo || r.studentId,
    activityType: r.activityType || 'READING_OCR',
    accuracyScore: r.accuracyScore ?? r.fluencyScore ?? 90,
    overallScore:
      r.overallScore ??
      (typeof r.overallScoreOutOf10 === 'number'
        ? Math.round(r.overallScoreOutOf10 * 10)
        : 90),
    weaknessesIdentified: r.weaknessesIdentified || r.weaknesses || [],
    assessedBy: r.assessedBy || r.assessedByTeacher || 'Ustad Ahmed Raza',
  }));
};
export const getReadingAssessments = loadReadingAssessments;

export const saveReadingAssessments = (items: any[]): void =>
  saveJson('vgs_reading_assessments_v1', items, 'readingAssessments');

export const loadAuditLogs = (): any[] => {
  const raw = loadJson('vgs_audit_logs_v1', INITIAL_AUDIT_LOGS);
  return raw.map((log: any) => ({
    ...log,
    actionType: log.actionType || log.actionCategory || 'AUDIT',
    targetSummary: log.targetSummary || log.targetEntity || log.actionTitle || '',
  }));
};
export const getAuditLogs = loadAuditLogs;

export const appendAuditLog = (entry: any): AuditLogEntry => {
  const current = loadAuditLogs();
  const created: any = {
    ...entry,
    id: `aud-${Date.now()}`,
    timestamp: new Date().toLocaleString('en-PK', {
      hour12: true,
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    actionCategory: entry.actionCategory || entry.actionType || 'ATTENDANCE',
    actionType: entry.actionType || entry.actionCategory || 'ATTENDANCE',
    actionTitle: entry.actionTitle || entry.targetSummary || entry.actionType || 'Record Updated',
    targetEntity: entry.targetEntity || entry.targetSummary || 'School Record',
    targetSummary: entry.targetSummary || entry.targetEntity || entry.actionTitle || 'School Record',
  };
  const updated = [created, ...current].slice(0, 250);
  saveJson('vgs_audit_logs_v1', updated, 'auditLogs');
  return created;
};

export const loadSchoolTasks = (): any[] => {
  const raw = loadJson('vgs_school_tasks_v1', INITIAL_TASKS);
  return raw.map((t: any) => ({
    ...t,
    status: (t.status || 'IN_PROGRESS').toUpperCase(),
    priority: (t.priority || 'HIGH').toUpperCase(),
  }));
};
export const getSchoolTasks = loadSchoolTasks;

export const saveSchoolTasks = (tasks: any[]): void =>
  saveJson('vgs_school_tasks_v1', tasks, 'schoolTasks');

export const loadFinanceEntries = (): any[] => {
  const raw = loadJson('vgs_finance_entries_v1', INITIAL_FINANCE_ENTRIES);
  return raw.map((f: any) => ({
    ...f,
    type: (f.type || 'INCOME').toUpperCase(),
    description: f.description || f.title || f.category,
  }));
};
export const getSchoolFinance = loadFinanceEntries;

export const saveFinanceEntries = (entries: any[]): void =>
  saveJson('vgs_finance_entries_v1', entries, 'financeEntries');
export const saveSchoolFinance = saveFinanceEntries;

export const ALL_PERMISSION_LABELS = ALL_PERMISSIONS_CATALOG;

export const loadPermissionProfiles = (): any[] => {
  const raw = loadJson('vgs_permission_profiles_v1', INITIAL_PERMISSION_PROFILES);
  return raw.map((p: any) => ({
    ...p,
    roleKey: p.roleKey || (p.targetRole || 'TEACHER').toUpperCase(),
    roleLabel: p.roleLabel || p.name || p.targetRole,
  }));
};
export const getRolePermissionProfiles = loadPermissionProfiles;

export const savePermissionProfiles = (profiles: any[]): void =>
  saveJson('vgs_permission_profiles_v1', profiles, 'permissionProfiles');
export const saveRolePermissionProfiles = savePermissionProfiles;

export const loadManagedUsers = (): any[] => {
  const raw = loadJson('vgs_managed_users_v1', INITIAL_MANAGED_USERS);
  return raw.map((u: any) => ({
    ...u,
    role: (u.role || 'TEACHER').toUpperCase(),
    status: (u.status || 'ACTIVE').toUpperCase(),
    accessPinMask: u.accessPinMask || '••••••••',
  }));
};
export const getManagedUsers = loadManagedUsers;

export const saveManagedUsers = (users: any[]): void =>
  saveJson('vgs_managed_users_v1', users, 'managedUsers');

export const loadAiAgentConfigs = (): any[] => {
  const raw = loadJson('vgs_ai_agent_configs_v1', INITIAL_AI_AGENT_CONFIGS);
  return raw.map((a: any) => ({
    ...a,
    id: a.id || a.agentKey,
    name: a.name || a.label,
    roleDescription: a.roleDescription || a.description,
    effort: a.effort || 'high',
  }));
};
export const getAiAgentsConfig = loadAiAgentConfigs;

export const saveAiAgentConfigs = (configs: any[]): void =>
  saveJson('vgs_ai_agent_configs_v1', configs, 'aiAgentConfigs');
export const saveAiAgentsConfig = saveAiAgentConfigs;

export const getAiApiKeys = (): Record<string, string> =>
  loadJson('vgs_ai_api_keys_v1', {
    ANTI_API_URL: 'http://127.0.0.1:8080/v1',
    GEMINI_API_KEY:
      typeof window !== 'undefined'
        ? localStorage.getItem('custom_gemini_api_key') || ''
        : '',
    OPENAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
  });

export const saveAiApiKeys = (keys: Record<string, string>): void => {
  if (typeof window !== 'undefined' && keys.GEMINI_API_KEY) {
    localStorage.setItem('custom_gemini_api_key', keys.GEMINI_API_KEY);
  }
  saveJson('vgs_ai_api_keys_v1', keys, 'aiApiKeys');
};
