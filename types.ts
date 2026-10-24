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
  overallSchoolPosition?: string;
  checkedByMode?: 'MANUAL' | 'AI_ASSISTED';
  checkedByTeacher?: string;
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

// --- STAFF / TEACHER ATTENDANCE & DIRECTORY TYPES ---
export interface StaffMember {
  id: string;
  empId: string;
  rfidCardNo: string;
  name: string;
  designation: string;
  subject: string;
  assignedClasses: string[];
  phone: string;
  email: string;
  salaryPKR: number;
  status: 'Active' | 'Suspended';
  role: 'Teacher' | 'Admin' | 'Staff';
  courseCompletionRate: number; // 0 to 100
  performanceScore: number;     // 0 to 100
  photoUrl?: string;
}

export interface StaffAttendanceData {
  [staffId: string]: {
    [date: string]: DailyRecord;
  };
}

// --- SAVED QUESTION PAPERS & AI ANSWER SHEET CHECKING ---
export interface SavedQuestionPaper extends ExamPaperResult {
  id: string;
  createdAt: string;
  createdBy: string;
  examDate: string;
  instructions: string[];
}

export interface AnswerSheetAiCheckResult {
  studentId: string;
  subject: string;
  totalMarks: number;
  suggestedObtainedMarks: number;
  grade: string;
  questionBreakdown: {
    qLabel: string;
    maxMarks: number;
    awardedMarks: number;
    feedback: string;
  }[];
  overallRemarks: string;
  detectedWeaknesses: string[];
}

// --- GOOGLE DRIVE CLASSROOM LEARNING MATERIALS (KG TO GRADE 10) ---
export interface DriveMaterialItem {
  id: string;
  grade: string; // 'KG' | 'Nursery' | 'Prep' | '1-A' ... '10-A'
  subject: string;
  topic: string;
  title: string;
  resourceType: 'Video' | 'LessonPlan' | 'WorksheetPDF' | 'AI_Generated';
  driveUrl: string;
  durationOrPages: string;
  scheduleDayLabel?: string;
  description: string;
}

// --- LIVE CAMERA + VOICE + OCR READING ASSESSMENT RECORD ---
export interface ReadingOcrAssessment {
  id: string;
  studentId: string;
  studentName: string;
  grade: string;
  subject: string;
  topicTitle: string;
  teacherInstructions: string;
  capturedBookOcrText: string;
  studentSpokenTranscript: string;
  ambientNoiseDb: number;
  noiseStatus: 'Optimal' | 'Moderate' | 'Noisy';
  fluencyScore: number;        // 0 to 100
  pronunciationScore: number;  // 0 to 100
  overallScoreOutOf10: number; // 0 to 10
  wordsPerMinute: number;
  mispronouncedWords: string[];
  skippedWords: string[];
  strengths: string[];
  weaknesses: string[];
  aiFeedback: string;
  remedialTask: string;
  ocrSnapshotsCount: number;
  assessedByTeacher: string;
  createdAt: string;
}

// --- AUDIT LOG SYSTEM (FOR PRINCIPAL OVERSIGHT OF ALL TEACHER ENTRIES/EDITS) ---
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'Teacher' | 'Admin' | 'Principal' | 'Staff';
  actionCategory: 'ATTENDANCE' | 'EXAM_MARKS' | 'QUESTION_PAPER' | 'AI_TUTOR_ASSESSMENT' | 'SYLLABUS' | 'ACCESS_CONTROL' | 'FINANCE';
  actionTitle: string;
  targetEntity: string;
  details: string;
}

// --- PRINCIPAL TASK ASSIGNMENT & TRACKING ---
export interface SchoolTaskAssignment {
  id: string;
  title: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  assignedToRole: 'Teacher' | 'Staff' | 'Admin';
  targetClass?: string;
  subject?: string;
  dueDate: string;
  createdAt: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Completed' | 'In_Progress' | 'Pending_Overdue';
  completedAt?: string;
  completionNotes?: string;
}

// --- SCHOOL INCOME & EXPENSE LEDGER ---
export interface SchoolFinanceEntry {
  id: string;
  date: string;
  type: 'Income' | 'Expense';
  category: 'Tuition_Fee' | 'Admission_Fee' | 'Exam_Fee' | 'Staff_Salary' | 'Utilities_Electricity' | 'Printing_Stationery' | 'Campus_Maintenance' | 'Lab_Equipment';
  title: string;
  amountPKR: number;
  recordedBy: string;
  referenceNo?: string;
}

// --- ACCESS MANAGEMENT (RBAC PROFILES, PERMISSIONS CHECKLIST & USER ACCOUNTS) ---
export type PermissionKey =
  | 'attendance.rfid'
  | 'attendance.ai_photo'
  | 'attendance.manual'
  | 'attendance.staff'
  | 'exams.paper_create'
  | 'exams.paper_print'
  | 'exams.ai_check'
  | 'exams.marks_entry'
  | 'exams.dmc_print'
  | 'tutor.drive_materials'
  | 'tutor.ai_materials'
  | 'tutor.reading_ocr'
  | 'tutor.classwork_check'
  | 'fees.view'
  | 'fees.collect'
  | 'fees.expense_manage'
  | 'admin.access_control'
  | 'admin.theme_cms'
  | 'admin.ai_agents'
  | 'admin.audit_logs'
  | 'public.result_lookup'
  | 'public.admission_apply';

export interface RolePermissionProfile {
  id: string;
  name: string;
  targetRole: 'Admin' | 'Principal' | 'Teacher' | 'Parent' | 'Student' | 'Public';
  description: string;
  isPredefined: boolean;
  permissions: PermissionKey[];
}

export interface ManagedUserAccount {
  id: string;
  name: string;
  usernameOrId: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Principal' | 'Teacher' | 'Parent' | 'Student';
  linkedEntityId?: string; // studentId or staffId
  gradeOrDept?: string;
  accessPinMask?: string;  // Masked indicator only (no plaintext credentials in repo)
  status: 'Active' | 'Suspended';
  profileId: string;
  customPermissions?: PermissionKey[];
  lastLogin?: string;
}

// --- AI AGENTS, SUBSCRIPTION CLI & ANTI-API CONFIGURATION ---
export type SchoolAiProvider =
  | 'codex-cli'      // ChatGPT Plus/Pro Subscription via Codex CLI
  | 'claude-cli'     // Claude Pro/Max Subscription via Claude Code CLI
  | 'gemini-cli'     // Google AI Pro/Ultra Subscription via Antigravity CLI (agy)
  | 'anti-api'       // Antigravity Subscription Local Proxy (anti-api repo)
  | 'gemini-api'     // Google Gemini Paid/Free API Key
  | 'openai-api'     // OpenAI API Key
  | 'claude-api';    // Anthropic Claude API Key

export interface SchoolAiAgentConfig {
  agentKey: string;
  label: string;
  category: 'attendance_vision' | 'exam_engine' | 'classroom_tutor' | 'executive_audit';
  description: string;
  provider: SchoolAiProvider;
  model: string;
  recommendedProvider: SchoolAiProvider;
  recommendedModel: string;
  recommendedReason: string;
}
