
export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  ON_LEAVE = 'On Leave',
  HOLIDAY = 'Holiday',
  UNMARKED = 'Unmarked'
}

export interface Student {
  id: string;
  grNo: string;          // General Registered No
  rfidCardNo?: string;   // USB RFID Card Serial Number (e.g. 0005643210)
  name: string;
  fatherName: string;    // Father / Guardian Name
  gender: 'Male' | 'Female';
  dob: string;           // Date of Birth YYYY-MM-DD
  parentPhone: string;   // Father Mobile No (for GSM SIM SMS & WhatsApp)
  parentEmail?: string;  // Parent Email (for Backend Email Alerts)
  grade: string;         // Class/Standard
  photoUrl?: string;
}

export interface DailyRecord {
  date: string; // ISO string YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;      // 1st Tap (IN) or AI Photo Check-in time
  checkOutTime?: string;     // 2nd Tap (OUT) Departure time
  attendanceState?: 'IN' | 'OUT' | 'ABSENT' | 'LEAVE';
  method?: 'RFID_CARD' | 'AI_PHOTO' | 'MANUAL';
  rfidSerial?: string;
  smsNotified?: boolean;
}

export interface AttendanceData {
  [studentId: string]: {
    [date: string]: DailyRecord;
  };
}

export interface ProcessingResult {
  presentNames: string[];
  absentNames: string[];
  description: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

// --- TUTOR MODULE TYPES ---

export type Subject = 'English' | 'Math' | 'Science' | 'History' | 'Urdu' | 'Saraiki' | 'Sindhi' | 'Computer';
export type AssessmentType = 'Reading' | 'Writing' | 'Math';
export type Language = 'English' | 'Urdu' | 'Saraiki' | 'Balochi' | 'Sindhi';
export type MaterialType = 'LessonPlan' | 'Flashcards' | 'Quiz' | 'Activity' | 'CatchUpPack';

export interface CurriculumTopic {
  id: string;
  grade: string;
  subject: Subject;
  title: string;
  description: string;
  language: Language;         // Multilingual & Mother-Tongue Bridge support (English, Urdu, Saraiki, Balochi, Sindhi)
  referenceImageUrl?: string; // Photo of PCTB textbook, formula sheet, or handwriting sample
  referenceText?: string;     // The ground truth text (for reading comparison)
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  topicId: string;
  date: string;
  type: AssessmentType;
  score: number; // 0 to 10
  aiFeedback: string;
  remedialTask?: string; // e.g., "Write 'Elephant' 20 times"
  strengths?: string[];   // New: extracted tags
  weaknesses?: string[];  // New: extracted tags
}

export interface StudentLearningProfile {
  studentId: string;
  strengths: string[];
  weaknesses: string[];
  lastTopicId?: string;
  lastAssessmentDate?: string;
  completedHomeworks: string[]; // List of Topic IDs marked complete
}

export interface GeneratedContent {
  id: string;
  type: MaterialType;
  title: string;
  content: string; // Markdown content
  createdAt: string;
}

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint: string;
  example: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
}

export interface StructuredLessonPlan {
  title: string;
  duration: string;
  objectives: string[];
  warmUp: string;
  coreConceptExplanation: string;
  motherTongueBridge: string;
  multigradeSplit: string;
  guidedPractice: string;
  homeActivity: string;
  teacherTips: string;
}

export interface SocraticMessage {
  id: string;
  role: 'student' | 'tutor';
  text: string;
  hintBell?: string;
  timestamp: string;
}

export interface TextbookScanResult {
  title: string;
  eli10Summary: string;
  motherTongueExplanation: string;
  keyTakeaways: string[];
  vocabulary: {
    term: string;
    definition: string;
    localMeaning: string;
  }[];
  mindMap: {
    branch: string;
    nodes: string[];
  }[];
  noLabExperiment: string;
  practicePrompts: string[];
}

export interface WhiteboardHintResult {
  status: 'on_track' | 'needs_correction' | 'solved';
  praise: string;
  detectedIssue: string;
  nextStepHint: string;
}

// --- CUSTOMER VOICE NOTE REQUIREMENTS: BEACONHOUSE / CITY / ALLIED STYLE AI AGENT ---

export type ExamPaperType = 'Weekly' | 'Monthly' | 'MidTerm' | 'Annual';

export interface DailyTeachingPlan {
  dayNumber: number;
  dateLabel: string;          // e.g., "Mon, 02 Nov 2026"
  dayType: 'Teaching' | 'Revision' | 'WeeklyTest' | 'MonthlyTest';
  unitAndPages: string;       // Kitna parhana hai (e.g., "Unit 3: Fractions - Pages 24 to 26")
  topicTitle: string;         // Kya parhana hai
  learningOutcome: string;    // SLO (Student Learning Outcome - Beaconhouse/Allied standard)
  howToTeach: string;         // Kaise parhana hai (Step-by-step 40-min methodology for teacher)
  boardWorkAndMaterial: string; // Teacher Mawaad (Key definitions, board diagram, examples)
  classwork: string;          // CW notebook task
  homework: string;           // HW diary task
}

export interface MonthlyAcademicPlan {
  grade: string;
  subject: string;
  monthLabel: string;
  syllabusSource: string;     // e.g., "PCTB / Afaq / Oxford / Custom School Course"
  monthlyOverview: string;
  days: DailyTeachingPlan[];
}

export interface ExamPaperResult {
  examType: ExamPaperType;
  schoolHeaderTitle: string;
  grade: string;
  subject: string;
  timeAllowed: string;
  totalMarks: number;
  coveredSyllabus: string;
  mcqs: {
    qNo: number;
    question: string;
    options: string[];
    correctAnswer: string;
    marks: number;
  }[];
  shortQuestions: {
    qNo: number;
    question: string;
    marks: number;
    modelAnswer: string;
  }[];
  longQuestions: {
    qNo: number;
    question: string;
    marks: number;
    markingRubric: string;
  }[];
}

// --- EXAM RESULTS, FEE LEDGER & FLOATING AI ASSISTANT AUTO-CONTROL TYPES ---

export interface SubjectMark {
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  grade: string;
  remarks: string;
}

export interface StudentExamRecord {
  id: string;
  studentId: string;
  grNo: string;
  studentName: string;
  grade: string;
  examType: ExamPaperType; // 'Weekly' | 'Monthly' | 'MidTerm' | 'Annual'
  termLabel: string;       // e.g., "Mid-Term Exam 2026" or "Annual Final Exam 2026"
  date: string;
  subjects: SubjectMark[];
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  overallGrade: string;
  positionInClass?: string;
  aiPrincipalRemarks: string;
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  grNo: string;
  studentName: string;
  fatherName: string;
  grade: string;
  monthLabel: string;      // e.g., "October 2026"
  tuitionFeePKR: number;
  examFeePKR: number;
  totalDuePKR: number;
  paidAmountPKR: number;
  balancePKR: number;
  status: 'Paid' | 'Partial' | 'Pending';
  dueDate: string;
  lastPaymentDate?: string;
  receiptNo?: string;
}

export interface AssistantActionCommand {
  id: string;
  actionType:
    | 'GENERATE_EXAM_PAPER'
    | 'GENERATE_MONTHLY_PLAN'
    | 'GENERATE_LESSON_PLAN'
    | 'LOOKUP_EXAM_RESULT'
    | 'LOOKUP_FEE_RECORD'
    | 'NAVIGATE_TAB'
    | 'GENERAL_CHAT';
  targetTab?: 'attendance' | 'students' | 'reports' | 'records' | 'tutor';
  tutorView?: 'dashboard' | 'system_agent' | 'hub' | 'socratic' | 'scanner' | 'whiteboard' | 'catchup' | 'assessment' | 'curriculum';
  grade?: string;
  subject?: string;
  chaptersOrTopic?: string;
  examType?: ExamPaperType;
  studentQuery?: string; // Name, Student ID, or GR No (e.g., "Akhtar Ali", "56432", "Maria", "563")
  summaryText: string;
}



