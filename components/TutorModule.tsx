import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Student,
  CurriculumTopic,
  AssessmentRecord,
  Subject,
  AssessmentType,
  Language,
  StudentLearningProfile,
  AttendanceData,
  DailyRecord,
  AttendanceStatus,
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
  AssistantActionCommand,
} from '../types';
import {
  assessStudentWork,
  generateStructuredLessonPlan,
  generateInteractiveFlashcards,
  generateInteractiveQuiz,
  askSocraticTutor,
  analyzeTextbookPage,
  analyzeWhiteboardWork,
  generateCatchUpStudyPack,
  generateMonthlyAcademicPlanner,
  generateDailyTeacherMawaad,
  generateExamPaper,
} from '../services/tutorService';
import { getActiveApiKey } from '../services/geminiService';
import {
  Brain,
  BookOpen,
  Camera,
  Mic,
  PenTool,
  Plus,
  StopCircle,
  ChevronRight,
  Check,
  AlertTriangle,
  Trash2,
  TrendingUp,
  X,
  Volume2,
  Sparkles,
  Printer,
  Calendar,
  Award,
  MessageSquare,
  Layers,
  FileText,
  Key,
  RotateCcw,
  Send,
  Lightbulb,
  Users,
  Share2,
  CheckCircle2,
  XCircle,
  Compass,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Props {
  students: Student[];
  attendanceData?: AttendanceData;
  externalCommand?: AssistantActionCommand | null;
}

const DEFAULT_DGK_TOPICS: CurriculumTopic[] = [
  {
    id: 'dgk-1',
    grade: '9-A',
    subject: 'Science',
    title: 'Photosynthesis & Crop Irrigation (PCTB Bio Ch.7)',
    description:
      'How plants convert sunlight and canal water into glucose and oxygen, connected to wheat and cotton crops in Dera Ghazi Khan.',
    language: 'Urdu',
    referenceText:
      'پودے سورج کی روشنی، پانی اور کاربن ڈائی آکسائیڈ کی مدد سے اپنی خوراک خود تیار کرتے ہیں۔ اس عمل کو ضیائی تالیف (Photosynthesis) کہتے ہیں۔',
  },
  {
    id: 'dgk-2',
    grade: '10-A',
    subject: 'Math',
    title: 'Quadratic Equations & Land Area (BISE DG Khan Ch.1)',
    description:
      'Solving ax² + bx + c = 0 by factorization and quadratic formula, applied to calculating rectangular field dimensions.',
    language: 'English',
    referenceText: 'Solve x² + 5x + 6 = 0 by factoring into (x + 2)(x + 3) = 0.',
  },
  {
    id: 'dgk-3',
    grade: '8-A',
    subject: 'English',
    title: 'Past Indefinite & Continuous Tenses (Mother-Tongue Bridge)',
    description:
      'Translating Saraiki and Urdu past actions into accurate English sentences for BISE DG Khan translation & grammar paper.',
    language: 'Saraiki',
    referenceText:
      'Yesterday the farmers harvested the wheat crop before the rain started.',
  },
  {
    id: 'dgk-4',
    grade: '6-A',
    subject: 'Saraiki',
    title: 'Saraiki Alphabets (ٻ، ڄ، ݙ، ڳ، ݨ) & Foundational Reading',
    description:
      'Mastering the 5 distinct Saraiki implosive letters and transitioning smoothly between Saraiki mother tongue and Urdu script.',
    language: 'Saraiki',
    referenceText: 'ٻال سکول ویندے ہن تے شوق نال کتاب پڑھدے ہن۔',
  },
];

type TutorView =
  | 'dashboard'
  | 'system_agent'
  | 'curriculum'
  | 'assessment'
  | 'hub'
  | 'socratic'
  | 'scanner'
  | 'whiteboard'
  | 'catchup';

const TutorModule: React.FC<Props> = ({
  students,
  attendanceData = {},
  externalCommand = null,
}) => {
  const [view, setView] = useState<TutorView>('dashboard');

  // API Key State
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('custom_gemini_api_key') || '';
  });
  const [showKeyBanner, setShowKeyBanner] = useState<boolean>(false);
  const hasActiveKey = Boolean(getActiveApiKey());

  const saveCustomApiKey = () => {
    localStorage.setItem('custom_gemini_api_key', apiKeyInput.trim());
    setShowKeyBanner(false);
  };

  // Curriculum State (seeded with D.G. Khan / PCTB topics if empty)
  const [topics, setTopics] = useState<CurriculumTopic[]>(() => {
    const saved = localStorage.getItem('tutor_topics');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return DEFAULT_DGK_TOPICS;
  });

  // Assessment History State
  const [history, setHistory] = useState<AssessmentRecord[]>(() => {
    const saved = localStorage.getItem('tutor_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Learning Profiles State
  const [profiles, setProfiles] = useState<Record<string, StudentLearningProfile>>(() => {
    const saved = localStorage.getItem('tutor_profiles');
    return saved ? JSON.parse(saved) : {};
  });

  // Shared Selection State
  const [activeStudentId, setActiveStudentId] = useState<string>(students[0]?.id || '');
  const [activeTopicId, setActiveTopicId] = useState<string>(DEFAULT_DGK_TOPICS[0]?.id || '');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('Writing');
  const [analyticsStudentId, setAnalyticsStudentId] = useState<string>('');

  useEffect(() => {
    if (students.length > 0 && !students.some((s) => s.id === activeStudentId)) {
      setActiveStudentId(students[0].id);
    }
  }, [students, activeStudentId]);

  // Assessment Media State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestResult, setLatestResult] = useState<{
    score: number;
    feedback: string;
    remedialTask: string;
    strengths: string[];
    weaknesses: string[];
  } | null>(null);
  const [isSpeakingFeedback, setIsSpeakingFeedback] = useState(false);

  // --- AI STUDIO (LESSON PLAN / FLASHCARDS / MCQ QUIZ) STATE ---
  const [hubMode, setHubMode] = useState<'lesson' | 'flashcards' | 'quiz'>('lesson');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMultigradeMode, setIsMultigradeMode] = useState(true);
  const [quizCount, setQuizCount] = useState<number>(5);
  const [lessonPlan, setLessonPlan] = useState<StructuredLessonPlan | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [masteredCards, setMasteredCards] = useState<Record<string, boolean>>({});
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // --- SOCRATIC TUTOR STATE ---
  const [socraticLanguage, setSocraticLanguage] = useState<Language>('Saraiki');
  const [socraticMessages, setSocraticMessages] = useState<SocraticMessage[]>([
    {
      id: 'welcome-1',
      role: 'tutor',
      text: 'Assalam-o-Alaikum! I am your AI Ustad (استاد). Ask me any question from Math, Science, or English in English, Urdu, or Saraiki. Instead of Ratta (rote memorization), we will solve it step by step!',
      hintBell: 'Try asking: "How does Photosynthesis work in wheat plants?" or "Explain Quadratic Equations in simple Saraiki/Urdu"',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [socraticInput, setSocraticInput] = useState('');
  const [isSocraticLoading, setIsSocraticLoading] = useState(false);

  // --- TEXTBOOK SCANNER & VILLAGE LAB STATE ---
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanText, setScanText] = useState<string>('');
  const [scanLanguage, setScanLanguage] = useState<Language>('Urdu');
  const [scanResult, setScanResult] = useState<TextbookScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // --- ON-SCREEN SMART WHITEBOARD STATE ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#38bdf8');
  const [penSize, setPenSize] = useState(4);
  const [whiteboardPrompt, setWhiteboardPrompt] = useState(
    'Solve: 2x + 6 = 14 (Show each step clearly)'
  );
  const [whiteboardHint, setWhiteboardHint] = useState<WhiteboardHintResult | null>(null);
  const [isCheckingBoard, setIsCheckingBoard] = useState(false);

  // --- ATTENDANCE CATCH-UP PACK STATE ---
  const [catchUpReason, setCatchUpReason] = useState<string>(
    'Wheat / Cotton Harvest Season (فصل دی کٹائی / چنائی)'
  );
  const [catchUpResult, setCatchUpResult] = useState<{
    studyPackMarkdown: string;
    parentWhatsAppMessage: string;
  } | null>(null);
  const [isGeneratingCatchUp, setIsGeneratingCatchUp] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('tutor_topics', JSON.stringify(topics));
  }, [topics]);
  useEffect(() => {
    localStorage.setItem('tutor_history', JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem('tutor_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Initialize Canvas background when switching to whiteboard
  useEffect(() => {
    if (view === 'whiteboard' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [view]);

  // Helpers
  const getStudentName = (id: string) =>
    students.find((s) => s.id === id)?.name || 'Unknown Student';
  const getTopicTitle = (id: string) =>
    topics.find((t) => t.id === id)?.title || 'General Topic';

  const updateStudentProfile = (
    studentId: string,
    result: { strengths: string[]; weaknesses: string[] },
    topicId: string
  ) => {
    const current = profiles[studentId] || {
      studentId,
      strengths: [],
      weaknesses: [],
      completedHomeworks: [],
    };

    const uniqueStrengths = Array.from(
      new Set([...current.strengths, ...result.strengths])
    );
    let uniqueWeaknesses = Array.from(
      new Set([...current.weaknesses, ...result.weaknesses])
    );
    uniqueWeaknesses = uniqueWeaknesses.filter(
      (w) => !uniqueStrengths.some((s) => s.toLowerCase().includes(w.toLowerCase()))
    );

    setProfiles((prev) => ({
      ...prev,
      [studentId]: {
        ...current,
        strengths: uniqueStrengths,
        weaknesses: uniqueWeaknesses,
        lastAssessmentDate: new Date().toISOString(),
        lastTopicId: topicId,
      },
    }));
  };

  // Absentee detection across AttendanceData
  const absentStudentsSummary = useMemo(() => {
    return students.map((student) => {
      const records: Record<string, DailyRecord> = attendanceData[student.id] || {};
      const absentDates = Object.entries(records)
        .filter(
          ([_, rec]) =>
            rec.status === AttendanceStatus.ABSENT ||
            rec.status === AttendanceStatus.ON_LEAVE
        )
        .map(([date]) => date)
        .sort()
        .reverse();
      return {
        student,
        absentDates,
      };
    });
  }, [students, attendanceData]);

  // Analytics Chart Prep
  const chartData = useMemo(() => {
    if (!analyticsStudentId) return [];
    const studentRecords = history
      .filter((h) => h.studentId === analyticsStudentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return studentRecords.map((record) => {
      const topic = topics.find((t) => t.id === record.topicId);
      const subject = topic?.subject || 'Other';
      return {
        date: new Date(record.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        fullDate: new Date(record.date).toLocaleString(),
        [subject]: record.score,
        topicTitle: topic?.title,
        feedback: record.aiFeedback,
        score: record.score,
      };
    });
  }, [history, analyticsStudentId, topics]);

  const activeSubjects = useMemo(() => {
    if (!analyticsStudentId) return [];
    const studentRecords = history.filter((h) => h.studentId === analyticsStudentId);
    const subjects = new Set<string>();
    studentRecords.forEach((r) => {
      const topic = topics.find((t) => t.id === r.topicId);
      if (topic?.subject) subjects.add(topic.subject);
    });
    return Array.from(subjects);
  }, [history, analyticsStudentId, topics]);

  const SUBJECT_COLORS: Record<string, string> = {
    English: '#3b82f6',
    Math: '#ef4444',
    Science: '#10b981',
    History: '#f59e0b',
    Urdu: '#22c55e',
    Saraiki: '#a855f7',
    Sindhi: '#eab308',
    Computer: '#06b6d4',
    Other: '#8b5cf6',
  };

  // Curriculum Handlers
  const [newTopic, setNewTopic] = useState<Partial<CurriculumTopic>>({
    subject: 'Science',
    grade: '10-A',
    language: 'Saraiki',
  });

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setNewTopic({ ...newTopic, referenceImageUrl: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const saveTopic = () => {
    if (!newTopic.title || !newTopic.description)
      return alert('Title and Description required');
    const topic: CurriculumTopic = {
      id: Date.now().toString(),
      grade: newTopic.grade || '10-A',
      subject: (newTopic.subject as Subject) || 'Science',
      title: newTopic.title,
      description: newTopic.description,
      language: (newTopic.language as Language) || 'Urdu',
      referenceImageUrl: newTopic.referenceImageUrl,
      referenceText: newTopic.referenceText,
    };
    setTopics([topic, ...topics]);
    setActiveTopicId(topic.id);
    setNewTopic({
      subject: 'Science',
      grade: '10-A',
      title: '',
      description: '',
      referenceText: '',
      language: 'Saraiki',
    });
  };

  const deleteTopic = (id: string) => setTopics(topics.filter((t) => t.id !== id));

  // Assessment Audio & Image Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setAudioBlob(reader.result as string);
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const runAssessment = async () => {
    if (!activeStudentId || !activeTopicId) return;
    const topic = topics.find((t) => t.id === activeTopicId);
    const media = assessmentType === 'Reading' ? audioBlob : capturedImage;
    if (!media) return alert('Please capture student work or record audio first.');

    setIsProcessing(true);
    const result = await assessStudentWork(
      assessmentType,
      topic?.language || 'English',
      media,
      topic?.referenceImageUrl,
      topic?.referenceText
    );
    setLatestResult(result);

    const record: AssessmentRecord = {
      id: Date.now().toString(),
      studentId: activeStudentId,
      topicId: activeTopicId,
      date: new Date().toISOString(),
      type: assessmentType,
      score: result.score,
      aiFeedback: result.feedback,
      remedialTask: result.remedialTask,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
    };
    setHistory([record, ...history]);
    updateStudentProfile(activeStudentId, result, activeTopicId);
    setIsProcessing(false);
  };

  const resetAssessment = () => {
    setCapturedImage(null);
    setAudioBlob(null);
    setLatestResult(null);
    window.speechSynthesis.cancel();
    setIsSpeakingFeedback(false);
  };

  const speakText = (text: string) => {
    if (isSpeakingFeedback) {
      window.speechSynthesis.cancel();
      setIsSpeakingFeedback(false);
      return;
    }
    const cleanText = text.replace(/\*|\#/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setIsSpeakingFeedback(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeakingFeedback(true);
  };

  const handleCaptureImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCapturedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- AI STUDIO CREATOR HANDLERS (LESSON PLAN, FLASHCARDS, MCQ QUIZ) ---
  const handleRunCreator = async (mode: 'lesson' | 'flashcards' | 'quiz') => {
    setHubMode(mode);
    setIsGenerating(true);

    const student = students.find((s) => s.id === activeStudentId) || students[0];
    const topic = topics.find((t) => t.id === activeTopicId) || topics[0] || DEFAULT_DGK_TOPICS[0];
    const targetStudentId = student?.id || activeStudentId || 'stu-101';
    const profile = profiles[targetStudentId] || {
      studentId: targetStudentId,
      strengths: [],
      weaknesses: [],
      completedHomeworks: [],
    };

    if (student && topic) {
      try {
        if (mode === 'lesson') {
          const plan = await generateStructuredLessonPlan(
            student.name,
            topic,
            profile,
            isMultigradeMode
          );
          setLessonPlan(plan);
        } else if (mode === 'flashcards') {
          const cards = await generateInteractiveFlashcards(
            student.name,
            topic,
            profile,
            6
          );
          setFlashcards(cards);
          setFlippedCards({});
          setMasteredCards({});
        } else if (mode === 'quiz') {
          const questions = await generateInteractiveQuiz(
            student.name,
            topic,
            profile,
            quizCount
          );
          setQuizQuestions(questions);
          setSelectedAnswers({});
          setQuizSubmitted(false);
        }
      } catch (e) {
        alert('Error generating AI content. Please verify your Gemini API Key.');
      }
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if (view === 'hub' && !lessonPlan && flashcards.length === 0 && quizQuestions.length === 0 && !isGenerating) {
      const student = students.find((s) => s.id === activeStudentId) || students[0];
      const topic = topics.find((t) => t.id === activeTopicId) || topics[0] || DEFAULT_DGK_TOPICS[0];
      if (!student || !topic) return;
      const targetStudentId = student.id;
      const profile = profiles[targetStudentId] || {
        studentId: targetStudentId,
        strengths: [],
        weaknesses: [],
        completedHomeworks: [],
      };
      Promise.all([
        generateStructuredLessonPlan(student.name, topic, profile, isMultigradeMode),
        generateInteractiveFlashcards(student.name, topic, profile, 6),
        generateInteractiveQuiz(student.name, topic, profile, quizCount),
      ])
        .then(([plan, cards, questions]) => {
          setLessonPlan(plan);
          setFlashcards(cards);
          setQuizQuestions(questions);
        })
        .catch(() => {
          // Ignore silent init error
        });
    }
  }, [view]);

  const submitInteractiveQuiz = () => {
    if (quizQuestions.length === 0) return;
    setQuizSubmitted(true);

    let correctCount = 0;
    const newStrengths: string[] = [];
    const newWeaknesses: string[] = [];

    quizQuestions.forEach((q) => {
      const chosen = selectedAnswers[q.id];
      if (chosen === q.correctIndex) {
        correctCount++;
        newStrengths.push(q.conceptTag);
      } else {
        newWeaknesses.push(q.conceptTag);
      }
    });

    const normalizedScore = Math.round((correctCount / quizQuestions.length) * 10);
    const record: AssessmentRecord = {
      id: Date.now().toString(),
      studentId: activeStudentId,
      topicId: activeTopicId,
      date: new Date().toISOString(),
      type: 'Writing',
      score: normalizedScore,
      aiFeedback: `Interactive MCQ Quiz Completed: ${correctCount}/${quizQuestions.length} correct (${normalizedScore}/10).`,
      remedialTask:
        newWeaknesses.length > 0
          ? `Review flashcards and Socratic Coach for: ${newWeaknesses.join(', ')}`
          : 'All MCQ concepts mastered!',
      strengths: newStrengths,
      weaknesses: newWeaknesses,
    };

    setHistory([record, ...history]);
    updateStudentProfile(
      activeStudentId,
      { strengths: newStrengths, weaknesses: newWeaknesses },
      activeTopicId
    );
  };

  // --- SOCRATIC TUTOR HANDLER ---
  const handleSendSocratic = async () => {
    if (!socraticInput.trim()) return;
    const student = students.find((s) => s.id === activeStudentId) || students[0];
    const topic = topics.find((t) => t.id === activeTopicId);

    const userMsg: SocraticMessage = {
      id: Date.now().toString(),
      role: 'student',
      text: socraticInput.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    const updatedHistory = [...socraticMessages, userMsg];
    setSocraticMessages(updatedHistory);
    setSocraticInput('');
    setIsSocraticLoading(true);

    const res = await askSocraticTutor(
      student?.name || 'Student',
      topic,
      socraticLanguage,
      updatedHistory,
      userMsg.text
    );

    const tutorMsg: SocraticMessage = {
      id: (Date.now() + 1).toString(),
      role: 'tutor',
      text: res.reply,
      hintBell: res.followUpHint,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSocraticMessages([...updatedHistory, tutorMsg]);
    setIsSocraticLoading(false);
  };

  // --- TEXTBOOK SCANNER HANDLER ---
  const handleScanImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRunScanner = async () => {
    if (!scanImage && !scanText.trim()) {
      return alert('Please upload a textbook page photo or paste passage text first.');
    }
    setIsScanning(true);
    try {
      const res = await analyzeTextbookPage(scanImage, scanText, scanLanguage);
      setScanResult(res);
    } catch (e) {
      alert('Failed to scan textbook page. Please check your Gemini API Key.');
    }
    setIsScanning(false);
  };

  // --- WHITEBOARD CANVAS HANDLERS ---
  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setWhiteboardHint(null);
    }
  };

  const handleCheckWhiteboard = async () => {
    if (!canvasRef.current) return;
    setIsCheckingBoard(true);
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const topic = topics.find((t) => t.id === activeTopicId);
    const res = await analyzeWhiteboardWork(
      dataUrl,
      whiteboardPrompt,
      topic?.language || 'Urdu'
    );
    setWhiteboardHint(res);
    setIsCheckingBoard(false);
  };

  // --- ATTENDANCE CATCH-UP HANDLER ---
  const handleGenerateCatchUp = async (studentId: string, absentDates: string[]) => {
    const student = students.find((s) => s.id === studentId);
    const topic = topics.find((t) => t.id === activeTopicId) || topics[0];
    if (!student || !topic) return;

    setActiveStudentId(studentId);
    setIsGeneratingCatchUp(true);
    const res = await generateCatchUpStudyPack(
      student.name,
      absentDates,
      topic,
      catchUpReason
    );
    setCatchUpResult(res);
    setIsGeneratingCatchUp(false);
  };

  // --- SYSTEM SCHOOL AI AGENT STATE (BEACONHOUSE / CITY / ALLIED MONTHLY PLANNER & EXAM ENGINE) ---
  const [sysSubMode, setSysSubMode] = useState<'planner' | 'exams'>('planner');
  const [sysGrade, setSysGrade] = useState<string>('8-A');
  const [sysSubject, setSysSubject] = useState<string>('Math');
  const [sysMonthLabel, setSysMonthLabel] = useState<string>('November 2026');
  const [sysStartDate, setSysStartDate] = useState<string>('2026-11-02');
  const [sysSyllabusSource, setSysSyllabusSource] = useState<string>(
    'Own School Syllabus (PCTB / Afaq / Oxford)'
  );
  const [sysCoursePortion, setSysCoursePortion] = useState<string>(
    'Half Course: Chapters 1 to 10 (Pages 1 to 85)'
  );
  const [sysBookImage, setSysBookImage] = useState<string | null>(null);
  const [sysLanguage, setSysLanguage] = useState<Language>('Urdu');
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyAcademicPlan | null>(null);
  const [isBuildingPlan, setIsBuildingPlan] = useState<boolean>(false);
  const [completedPlanDays, setCompletedPlanDays] = useState<Record<number, boolean>>({});
  const [activeDayMawaad, setActiveDayMawaad] = useState<{
    dayNumber: number;
    dateLabel: string;
    title: string;
    markdown: string;
  } | null>(null);
  const [isLoadingMawaad, setIsLoadingMawaad] = useState<boolean>(false);

  // Exam Paper Generator State
  const [examPaperType, setExamPaperType] = useState<ExamPaperType>('MidTerm');
  const [schoolNameHeader, setSchoolNameHeader] = useState<string>(
    'Vision Grammar School, Block 56, D.G. Khan'
  );
  const [generatedExamPaper, setGeneratedExamPaper] = useState<ExamPaperResult | null>(null);
  const [isBuildingExam, setIsBuildingExam] = useState<boolean>(false);
  const [showMarkingKey, setShowMarkingKey] = useState<boolean>(true);
  const sysBookInputRef = useRef<HTMLInputElement | null>(null);

  const handleBuildMonthlyPlan = async (
    overrideGrade?: string,
    overrideSubject?: string,
    overridePortion?: string
  ) => {
    const g = overrideGrade || sysGrade;
    const s = overrideSubject || sysSubject;
    const p = overridePortion || sysCoursePortion;
    setIsBuildingPlan(true);
    try {
      const plan = await generateMonthlyAcademicPlanner(
        g,
        s,
        sysMonthLabel,
        sysStartDate,
        sysSyllabusSource,
        p,
        sysBookImage,
        sysLanguage
      );
      setMonthlyPlan(plan);
    } catch (e) {
      alert('Failed to generate Monthly Academic Plan. Check your Gemini API Key.');
    }
    setIsBuildingPlan(false);
  };

  const handleOpenDayMawaad = async (day: DailyTeachingPlan) => {
    setIsLoadingMawaad(true);
    const md = await generateDailyTeacherMawaad(sysGrade, sysSubject, day, sysLanguage);
    setActiveDayMawaad({
      dayNumber: day.dayNumber,
      dateLabel: day.dateLabel,
      title: day.topicTitle,
      markdown: md,
    });
    setIsLoadingMawaad(false);
  };

  const handleBuildExamPaper = async (
    overrideType?: ExamPaperType,
    overrideGrade?: string,
    overrideSubject?: string,
    overridePortion?: string
  ) => {
    const t = overrideType || examPaperType;
    const g = overrideGrade || sysGrade;
    const s = overrideSubject || sysSubject;
    const p = overridePortion || sysCoursePortion;
    setIsBuildingExam(true);
    try {
      const paper = await generateExamPaper(
        t,
        schoolNameHeader,
        g,
        s,
        p,
        sysLanguage
      );
      setGeneratedExamPaper(paper);
    } catch (e) {
      alert('Failed to generate Exam Paper. Check your Gemini API Key.');
    }
    setIsBuildingExam(false);
  };

  // Auto-populate starter 24-Day Monthly Plan & Exam Paper when System School AI Agent opens
  useEffect(() => {
    if (view === 'system_agent') {
      if (!monthlyPlan && !isBuildingPlan) {
        handleBuildMonthlyPlan();
      }
      if (!generatedExamPaper && !isBuildingExam) {
        handleBuildExamPaper();
      }
    }
  }, [view]);

  // Listen for Voice/Text Auto-Control Commands from FloatingAiAssistant
  useEffect(() => {
    if (!externalCommand) return;
    if (externalCommand.tutorView) {
      setView(externalCommand.tutorView);
    }
    if (externalCommand.grade) setSysGrade(externalCommand.grade);
    if (externalCommand.subject) setSysSubject(externalCommand.subject);
    if (externalCommand.chaptersOrTopic) {
      setSysCoursePortion(externalCommand.chaptersOrTopic);
    }

    if (externalCommand.actionType === 'GENERATE_EXAM_PAPER') {
      setView('system_agent');
      setSysSubMode('exams');
      const eType = externalCommand.examType || 'MidTerm';
      setExamPaperType(eType);
      handleBuildExamPaper(
        eType,
        externalCommand.grade || sysGrade,
        externalCommand.subject || sysSubject,
        externalCommand.chaptersOrTopic || sysCoursePortion
      );
    } else if (
      externalCommand.actionType === 'GENERATE_MONTHLY_PLAN' ||
      externalCommand.actionType === 'GENERATE_LESSON_PLAN'
    ) {
      setView('system_agent');
      setSysSubMode('planner');
      handleBuildMonthlyPlan(
        externalCommand.grade || sysGrade,
        externalCommand.subject || sysSubject,
        externalCommand.chaptersOrTopic || sysCoursePortion
      );
    }
  }, [externalCommand]);

  // --- RENDER NAVIGATION BAR ---
  const renderNavPills = () => (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-cyber-700">
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'dashboard', label: 'Overview', icon: Brain },
          {
            id: 'system_agent',
            label: '🏛️ System School AI Agent (Monthly Plan & Exams)',
            icon: Calendar,
          },
          { id: 'hub', label: 'Lesson / Flashcards / MCQ Creator', icon: Sparkles },
          { id: 'socratic', label: 'Socratic AI Ustad', icon: MessageSquare },
          { id: 'scanner', label: 'Textbook Scanner & Village Lab', icon: FileText },
          { id: 'whiteboard', label: 'Live Whiteboard', icon: PenTool },
          { id: 'catchup', label: 'Harvest/Flood Catch-Up', icon: Compass },
          { id: 'assessment', label: 'Grade Homework', icon: Camera },
          { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as TutorView)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase flex items-center gap-2 transition-all ${
                active
                  ? 'bg-cyber-500 text-black shadow-neon'
                  : 'bg-cyber-900/80 text-cyber-300 border border-cyber-700 hover:border-cyber-500 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowKeyBanner(!showKeyBanner)}
        className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
          hasActiveKey
            ? 'bg-green-950/50 border-green-700 text-green-400'
            : 'bg-amber-950/60 border-amber-600 text-amber-300 animate-pulse'
        }`}
      >
        <Key className="w-3.5 h-3.5" />
        {hasActiveKey ? 'Gemini API Key Active' : 'Set Gemini API Key'}
      </button>
    </div>
  );

  // --- RENDER VIEWS ---
  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in">
      {/* Customer Voice Note Flagship Banner: Beaconhouse / City / Allied Level AI System Agent */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-cyber-900 to-blue-950/80 border-2 border-emerald-500/60 p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono uppercase">
            ★ Customer Voice Note Solution • Beaconhouse / City School / Allied Standard
          </div>
          <h3 className="text-2xl font-bold text-white">
            Whole-Month Date-Wise & Day-Wise Syllabus Planner, Teacher &ldquo;Mawaad&rdquo; & Exam Engine
          </h3>
          <p className="text-sm text-cyber-200 leading-relaxed">
            Generates a complete <strong>24-Day Date-Wise & Day-Wise Monthly Academic Calendar</strong> for{' '}
            <strong>your school&apos;s own course & books</strong> — telling every teacher{' '}
            <em>Kitna parhana hai, Kya parhana hai, aur Kaise parhana hai</em> with 1-click{' '}
            <strong>Teacher Mawaad (تدریسی مواد)</strong> and automated{' '}
            <strong>Weekly, Monthly, Mid-Term & Annual Exam Papers</strong>!
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              setView('system_agent');
              setSysSubMode('planner');
            }}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs font-mono uppercase shadow-lg"
          >
            🗓️ Open Monthly Date-Wise Planner
          </button>
          <button
            onClick={() => {
              setView('system_agent');
              setSysSubMode('exams');
            }}
            className="px-6 py-3 bg-cyber-500 hover:bg-cyber-400 text-black font-bold rounded-xl text-xs font-mono uppercase shadow-lg"
          >
            📝 Generate Weekly/Monthly/Term/Annual Exam
          </button>
        </div>
      </div>

      {/* Regional Impact Banner for Dera Ghazi Khan & South Punjab */}
      <div className="bg-gradient-to-r from-cyber-900 via-cyber-800 to-purple-950/60 border border-cyber-600 p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-500/20 border border-cyber-500/40 text-cyber-400 text-[11px] font-mono uppercase">
              South Punjab & Dera Ghazi Khan Smart Education Suite
            </div>
            <h3 className="text-2xl font-bold text-white">
              Solving Ground-Level School Challenges with Gemini AI
            </h3>
            <p className="text-sm text-cyber-300 leading-relaxed">
              Built for schools in <strong>D.G. Khan, Taunsa, Rajanpur, Muzaffargarh & Layyah</strong>:
              bridges the <strong>Saraiki/Balochi mother-tongue gap</strong> with Urdu & English textbooks, empowers{' '}
              <strong>single-teacher multigrade classrooms</strong>, replaces rote memorization (<em>Ratta</em>) with{' '}
              <strong>BISE DG Khan interactive MCQs & Socratic coaching</strong>, and generates{' '}
              <strong>Harvest & Flood Missed-Class Catch-Up Packs</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-cyber-950/70 border border-cyber-700 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-cyber-400">{topics.length}</div>
              <div className="text-[10px] font-mono uppercase text-cyber-500">PCTB Topics</div>
            </div>
            <div className="bg-cyber-950/70 border border-cyber-700 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-400">{history.length}</div>
              <div className="text-[10px] font-mono uppercase text-cyber-500">AI Assessments</div>
            </div>
          </div>
        </div>

        {/* 6 Smart Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => setView('hub')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-purple-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-purple-400">
                Multigrade + BISE MCQs
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-purple-300">
              1. Lesson Plan, Flashcards & MCQ Creator
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              One-click multigrade lesson plans, interactive flip flashcards, and auto-graded BISE DG Khan MCQs.
            </p>
          </button>

          <button
            onClick={() => setView('socratic')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-cyber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-cyber-500/20 text-cyber-400">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-cyber-400">
                Saraiki / Urdu / English
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-cyber-300">
              2. Socratic "AI Ustad" Doubt-Solver
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              Ends blind Ratta by explaining tough English & Science concepts in Saraiki, Urdu, Balochi, or English with step-by-step hints.
            </p>
          </button>

          <button
            onClick={() => setView('scanner')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-emerald-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileText className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-emerald-400">
                No-Lab Village Science
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-emerald-300">
              3. Textbook Scanner & Mind-Map
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              Snap any textbook page to get simple summaries, trilingual vocabulary, mind-maps, and zero-cost village experiments.
            </p>
          </button>

          <button
            onClick={() => setView('whiteboard')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-blue-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <PenTool className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-blue-400">
                Live Vision Hints
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-blue-300">
              4. Smart Whiteboard & Scratchpad
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              Practice Math steps or Urdu/Saraiki script directly on-screen and let Gemini check your step before you finish.
            </p>
          </button>

          <button
            onClick={() => setView('catchup')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-amber-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Compass className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-amber-400">
                Harvest & Flood Bridge
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-amber-300">
              5. Attendance-Linked Catch-Up Pack
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              Auto-detects absent students (wheat/cotton harvest or Rod-Kohi flood days) and builds a 15-min home study pack + WhatsApp alert.
            </p>
          </button>

          <button
            onClick={() => setView('assessment')}
            className="p-4 bg-cyber-900/90 hover:bg-cyber-800 border border-pink-500/40 rounded-xl text-left transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                <Camera className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-mono uppercase text-pink-400">
                Handwriting & Audio
              </span>
            </div>
            <div className="font-bold text-white group-hover:text-pink-300">
              6. Notebook & Oral Fluency Grader
            </div>
            <p className="text-xs text-cyber-400 mt-1">
              Snap a photo of notebook homework or record oral reading in English, Urdu, Saraiki, or Sindhi for instant grading.
            </p>
          </button>
        </div>
      </div>

      {/* Performance Analytics Chart */}
      <div className="bg-cyber-800/30 border border-cyber-700 p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" /> Student Mastery & Quiz Analytics
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyber-400 uppercase">Select Student:</span>
            <select
              value={analyticsStudentId}
              onChange={(e) => setAnalyticsStudentId(e.target.value)}
              className="bg-cyber-900 border border-cyber-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-cyber-500"
            >
              <option value="">-- View Student Progress --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.grade})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[260px] w-full bg-cyber-900/40 rounded-xl p-4 border border-cyber-800">
          {!analyticsStudentId ? (
            <div className="h-full flex flex-col items-center justify-center text-cyber-500 opacity-60">
              <TrendingUp className="w-10 h-10 mb-2" />
              <p className="text-sm">Select a student above to view their assessment & MCQ quiz trend.</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-cyber-500 font-mono text-sm">
              No assessment or quiz history recorded for this student yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f1f5f9',
                  }}
                />
                <Legend />
                {activeSubjects.map((subject) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={SUBJECT_COLORS[subject] || '#38bdf8'}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );

  // --- VIEW 1: AI CREATOR STUDIO (LESSON PLAN, INTERACTIVE FLASHCARDS, AUTO-GRADED MCQ QUIZ) ---
  const renderHub = () => {
    const selectedStudentProfile = activeStudentId ? profiles[activeStudentId] : null;
    const activeTopic = topics.find((t) => t.id === activeTopicId);

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-mono text-purple-400 uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Lesson Planner, Flashcards & MCQ Quiz Creator
            </h3>
            <p className="text-xs text-cyber-400">
              Powered by Google Gemini API • Tailored to each student&apos;s strengths, weaknesses, and mother tongue.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-cyber-900/70 p-4 rounded-xl border border-cyber-700 space-y-4">
              <div>
                <label className="text-xs text-cyber-400 uppercase font-bold mb-1.5 block">
                  1. Select Student
                </label>
                <select
                  value={activeStudentId}
                  onChange={(e) => setActiveStudentId(e.target.value)}
                  className="w-full bg-cyber-800 border border-cyber-600 p-2.5 rounded-lg text-white text-sm outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentProfile && (
                <div className="p-3 bg-cyber-950/60 rounded-lg border border-cyber-800 space-y-2">
                  <div>
                    <div className="text-[10px] text-green-400 uppercase font-bold mb-1">
                      Recorded Strengths
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudentProfile.strengths.length > 0 ? (
                        selectedStudentProfile.strengths.slice(0, 5).map((s, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-green-900/30 border border-green-800 rounded text-[10px] text-green-300"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-cyber-600 text-xs">No tags yet</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-red-400 uppercase font-bold mb-1">
                      Target Weaknesses (AI Will Reinforce)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudentProfile.weaknesses.length > 0 ? (
                        selectedStudentProfile.weaknesses.slice(0, 5).map((w, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-red-900/30 border border-red-800 rounded text-[10px] text-red-300"
                          >
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="text-cyber-600 text-xs">No weaknesses logged</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-cyber-400 uppercase font-bold mb-1.5 block">
                  2. Select Curriculum Topic
                </label>
                <select
                  value={activeTopicId}
                  onChange={(e) => setActiveTopicId(e.target.value)}
                  className="w-full bg-cyber-800 border border-cyber-600 p-2.5 rounded-lg text-white text-sm outline-none"
                >
                  <option value="">-- Choose Topic --</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.subject} • {t.language})
                    </option>
                  ))}
                </select>
              </div>

              {/* Multigrade Classroom Toggle (South Punjab Single-Teacher Solution) */}
              <div className="pt-2 border-t border-cyber-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-cyber-400" /> Single-Teacher Multigrade Mode
                  </div>
                  <div className="text-[10px] text-cyber-400">
                    Adds split-class activity so other grades stay busy
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isMultigradeMode}
                  onChange={(e) => setIsMultigradeMode(e.target.checked)}
                  className="w-4 h-4 accent-cyber-500"
                />
              </div>

              {/* MCQ Count Selector */}
              <div className="pt-2 border-t border-cyber-800 flex items-center justify-between">
                <span className="text-xs text-cyber-300 font-bold">MCQ Quiz Questions:</span>
                <select
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="bg-cyber-800 border border-cyber-600 rounded px-2 py-1 text-xs text-white"
                >
                  <option value={3}>3 MCQs</option>
                  <option value={5}>5 MCQs</option>
                  <option value={8}>8 MCQs</option>
                  <option value={10}>10 MCQs</option>
                </select>
              </div>

              {/* 3 AI Generator Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleRunCreator('lesson')}
                  disabled={isGenerating}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    hubMode === 'lesson'
                      ? 'bg-blue-600/20 border-blue-400 text-white'
                      : 'bg-cyber-800 hover:bg-cyber-700 border-cyber-600 text-cyber-200'
                  }`}
                >
                  <Calendar className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Generate Smart Lesson Plan</div>
                    <div className="text-[10px] text-cyber-400">
                      With Saraiki/Urdu Bridge & Multigrade Split
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunCreator('flashcards')}
                  disabled={isGenerating}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    hubMode === 'flashcards'
                      ? 'bg-amber-600/20 border-amber-400 text-white'
                      : 'bg-cyber-800 hover:bg-cyber-700 border-cyber-600 text-cyber-200'
                  }`}
                >
                  <Layers className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Create Interactive Flashcards</div>
                    <div className="text-[10px] text-cyber-400">
                      Interactive Flip Cards + Mother-Tongue Hints
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleRunCreator('quiz')}
                  disabled={isGenerating}
                  className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    hubMode === 'quiz'
                      ? 'bg-emerald-600/20 border-emerald-400 text-white'
                      : 'bg-cyber-800 hover:bg-cyber-700 border-cyber-600 text-cyber-200'
                  }`}
                >
                  <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold">Create Auto-Graded MCQ Quiz</div>
                    <div className="text-[10px] text-cyber-400">
                      BISE DG Khan Style • Updates Student Profile
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Output Canvas */}
          <div className="lg:col-span-8 bg-cyber-900/60 border border-cyber-700 rounded-2xl p-6 min-h-[520px] relative">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center py-24">
                <div className="animate-spin w-12 h-12 border-4 border-cyber-500 border-t-transparent rounded-full mb-4"></div>
                <div className="text-white font-bold">
                  Gemini AI is crafting {hubMode.toUpperCase()} for {getStudentName(activeStudentId)}...
                </div>
                <div className="text-xs text-cyber-400 mt-1">
                  Aligning with {activeTopic?.title} ({activeTopic?.language})
                </div>
              </div>
            ) : hubMode === 'lesson' && lessonPlan ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-700 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {lessonPlan.duration}
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">{lessonPlan.title}</h2>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded-lg text-xs text-white flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Plan
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-cyber-950/60 rounded-xl border border-cyber-800">
                    <div className="text-xs font-bold text-blue-400 uppercase mb-2">
                      Learning Objectives
                    </div>
                    <ul className="list-disc list-inside text-xs text-cyber-200 space-y-1">
                      {lessonPlan.objectives.map((obj, idx) => (
                        <li key={idx}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-700/50">
                    <div className="text-xs font-bold text-purple-300 uppercase mb-2">
                      Mother-Tongue Bridge (Saraiki / Urdu Anti-Ratta)
                    </div>
                    <p className="text-xs text-cyber-100 leading-relaxed">
                      {lessonPlan.motherTongueBridge}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-700/40">
                  <div className="text-xs font-bold text-amber-300 uppercase mb-1 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Single-Teacher Multigrade Classroom Strategy
                  </div>
                  <p className="text-xs text-cyber-200 leading-relaxed">
                    {lessonPlan.multigradeSplit}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-cyber-950/60 rounded-xl border border-cyber-800">
                    <strong className="text-cyber-400 uppercase block mb-1">
                      1. Warm-Up Hook (5 Mins):
                    </strong>
                    <span className="text-cyber-100">{lessonPlan.warmUp}</span>
                  </div>
                  <div className="p-3.5 bg-cyber-950/60 rounded-xl border border-cyber-800">
                    <strong className="text-cyber-400 uppercase block mb-1">
                      2. Core Concept Explanation:
                    </strong>
                    <span className="text-cyber-100">{lessonPlan.coreConceptExplanation}</span>
                  </div>
                  <div className="p-3.5 bg-cyber-950/60 rounded-xl border border-cyber-800">
                    <strong className="text-cyber-400 uppercase block mb-1">
                      3. Guided Practice & No-Cost Home Activity:
                    </strong>
                    <p className="text-cyber-100 mb-1">{lessonPlan.guidedPractice}</p>
                    <p className="text-emerald-300">Home Task: {lessonPlan.homeActivity}</p>
                  </div>
                </div>
              </div>
            ) : hubMode === 'flashcards' && flashcards.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-cyber-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white">
                      Interactive Study Flashcards ({Object.keys(masteredCards).filter((k) => masteredCards[k]).length}/{flashcards.length} Mastered)
                    </h4>
                    <p className="text-xs text-cyber-400">
                      Click any card to flip between Question and Answer.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flashcards.map((card, idx) => {
                    const isFlipped = Boolean(flippedCards[card.id]);
                    const isMastered = Boolean(masteredCards[card.id]);
                    return (
                      <div
                        key={card.id || idx}
                        onClick={() =>
                          setFlippedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))
                        }
                        className={`cursor-pointer p-5 rounded-2xl border transition-all min-h-[190px] flex flex-col justify-between ${
                          isMastered
                            ? 'bg-emerald-950/30 border-emerald-600/60'
                            : isFlipped
                            ? 'bg-purple-950/40 border-purple-500'
                            : 'bg-cyber-950/80 border-cyber-700 hover:border-cyber-500'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                          <span className={isFlipped ? 'text-purple-300' : 'text-cyber-400'}>
                            {isFlipped ? 'BACK (ANSWER & EXAMPLE)' : `CARD #${idx + 1} • CLICK TO FLIP`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMasteredCards((prev) => ({
                                ...prev,
                                [card.id]: !prev[card.id],
                              }));
                            }}
                            className={`px-2 py-0.5 rounded border ${
                              isMastered
                                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                                : 'border-cyber-700 text-cyber-400 hover:text-white'
                            }`}
                          >
                            {isMastered ? '✓ Mastered' : 'Mark Mastered'}
                          </button>
                        </div>

                        <div className="my-3">
                          {!isFlipped ? (
                            <div className="text-base font-bold text-white">{card.front}</div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm font-bold text-emerald-300">{card.back}</div>
                              <div className="text-xs text-cyber-300 italic">
                                Example: {card.example}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-lg px-2.5 py-1.5">
                          💡 Hint: {card.hint}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : hubMode === 'quiz' && quizQuestions.length > 0 ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-cyber-700 pb-3">
                  <div>
                    <h4 className="font-bold text-white">
                      Interactive BISE DG Khan Style MCQ Quiz ({quizQuestions.length} Questions)
                    </h4>
                    <p className="text-xs text-cyber-400">
                      Select options below and click Submit to auto-grade and update {getStudentName(activeStudentId)}&apos;s learning profile.
                    </p>
                  </div>
                  {quizSubmitted && (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-bold text-sm">
                      Score:{' '}
                      {
                        quizQuestions.filter(
                          (q) => selectedAnswers[q.id] === q.correctIndex
                        ).length
                      }{' '}
                      / {quizQuestions.length}
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {quizQuestions.map((q, qIdx) => {
                    const userChoice = selectedAnswers[q.id];
                    return (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-xl bg-cyber-950/70 border border-cyber-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-bold text-white">
                            Q{qIdx + 1}. {q.question}
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-800 text-cyber-400 shrink-0">
                            {q.conceptTag}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = userChoice === optIdx;
                            const isCorrect = q.correctIndex === optIdx;
                            let btnStyle =
                              'bg-cyber-900 border-cyber-700 text-cyber-200 hover:border-cyber-500';
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle =
                                  'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-bold';
                              } else if (isSelected && !isCorrect) {
                                btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
                              }
                            } else if (isSelected) {
                              btnStyle = 'bg-cyber-500/20 border-cyber-400 text-white font-bold';
                            }

                            return (
                              <button
                                key={optIdx}
                                disabled={quizSubmitted}
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx,
                                  }))
                                }
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between gap-2 ${btnStyle}`}
                              >
                                <span>
                                  <strong className="mr-1.5">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </strong>
                                  {opt}
                                </span>
                                {quizSubmitted && isCorrect && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                                {quizSubmitted && isSelected && !isCorrect && (
                                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="p-2.5 rounded-lg bg-cyber-900 border border-cyber-700 text-xs text-cyber-300">
                            <strong className="text-cyber-400">Explanation: </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!quizSubmitted && (
                  <button
                    onClick={submitInteractiveQuiz}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
                  >
                    Submit MCQ Answers & Save to Student Profile
                  </button>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-cyber-500">
                <Sparkles className="w-12 h-12 mb-3 text-purple-400/50" />
                <div className="text-base font-bold text-white">
                  Select a Tool on the Left to Generate Smart Materials
                </div>
                <p className="text-xs text-cyber-400 max-w-md mt-1">
                  Create Multigrade Lesson Plans, clickable 3D Flashcards, or auto-graded BISE DG Khan MCQ Quizzes tailored to {getStudentName(activeStudentId)}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 2: SOCRATIC "AI USTAD" DOUBT-SOLVER ---
  const renderSocratic = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-mono text-cyber-400 uppercase flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Socratic &ldquo;AI Ustad&rdquo; (Mother-Tongue Concept Coach)
          </h3>
          <p className="text-xs text-cyber-400">
            Replaces blind rote learning (Ratta) with step-by-step hints and local D.G. Khan analogies in Saraiki, Urdu, Balochi, Sindhi & English.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={socraticLanguage}
            onChange={(e) => setSocraticLanguage(e.target.value as Language)}
            className="bg-cyber-900 border border-cyber-600 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            <option value="Saraiki">Saraiki Bridge (سرائیکی + اردو)</option>
            <option value="Urdu">Urdu Medium (اردو)</option>
            <option value="English">Simple English + Urdu Hints</option>
            <option value="Balochi">Balochi Bridge (بلوچی)</option>
            <option value="Sindhi">Sindhi (سنڌي)</option>
          </select>
        </div>
      </div>

      <div className="bg-cyber-900/70 border border-cyber-700 rounded-2xl p-4 flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {socraticMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'student' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'student'
                    ? 'bg-cyber-500 text-black font-medium'
                    : 'bg-cyber-800 border border-cyber-700 text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono uppercase opacity-70">
                  <span>{msg.role === 'student' ? getStudentName(activeStudentId) : 'AI Ustad'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.hintBell && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs text-amber-300 flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Guiding Hint:</strong> {msg.hintBell}
                    </span>
                  </div>
                )}
                {msg.role === 'tutor' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyber-400 hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen Aloud
                  </button>
                )}
              </div>
            </div>
          ))}
          {isSocraticLoading && (
            <div className="text-xs text-cyber-400 font-mono animate-pulse">
              AI Ustad is thinking of a guiding hint...
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-cyber-800 flex gap-2">
          <input
            value={socraticInput}
            onChange={(e) => setSocraticInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendSocratic()}
            placeholder={`Ask a doubt in ${socraticLanguage}, Urdu, or English (e.g., "Why do we balance chemical equations?")...`}
            className="flex-1 bg-cyber-950 border border-cyber-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyber-500"
          />
          <button
            onClick={handleSendSocratic}
            disabled={isSocraticLoading}
            className="px-5 py-3 bg-cyber-500 hover:bg-cyber-400 text-black font-bold rounded-xl flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Ask
          </button>
        </div>
      </div>
    </div>
  );

  // --- VIEW 3: TEXTBOOK SCANNER & ZERO-EQUIPMENT VILLAGE SCIENCE LAB ---
  const renderScanner = () => (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h3 className="text-xl font-mono text-emerald-400 uppercase flex items-center gap-2">
          <FileText className="w-5 h-5" /> PCTB Textbook Page Scanner & Virtual Village Lab
        </h3>
        <p className="text-xs text-cyber-400">
          Designed for schools without science labs or extra reference books: snap any textbook page to get a simple summary, Saraiki/Urdu explanation, Mind-Map, and a Zero-Cost Village Experiment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-cyber-900/70 border border-cyber-700 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-cyber-400 uppercase font-bold block mb-1.5">
              1. Upload Textbook Page Photo (Optional)
            </label>
            <input
              type="file"
              ref={scanFileInputRef}
              onChange={handleScanImageUpload}
              accept="image/*"
              className="hidden"
            />
            {scanImage ? (
              <div className="relative">
                <img
                  src={scanImage}
                  className="w-full h-44 object-contain bg-black rounded-xl border border-cyber-700"
                />
                <button
                  onClick={() => setScanImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => scanFileInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-cyber-600 hover:border-emerald-400 rounded-xl flex flex-col items-center justify-center text-cyber-400 hover:text-white transition-all"
              >
                <Camera className="w-7 h-7 mb-2 text-emerald-400" />
                <span className="text-xs font-mono uppercase">Snap / Upload Textbook Page</span>
              </button>
            )}
          </div>

          <div>
            <label className="text-xs text-cyber-400 uppercase font-bold block mb-1.5">
              2. Or Paste Textbook Paragraph / Topic Notes
            </label>
            <textarea
              value={scanText}
              onChange={(e) => setScanText(e.target.value)}
              placeholder="Paste any difficult English, Science, or Math passage here..."
              className="w-full h-28 bg-cyber-950 border border-cyber-700 rounded-xl p-3 text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-cyber-400 uppercase font-bold">Explanation Language:</span>
            <select
              value={scanLanguage}
              onChange={(e) => setScanLanguage(e.target.value as Language)}
              className="bg-cyber-800 border border-cyber-600 rounded-lg px-3 py-1.5 text-xs text-white"
            >
              <option value="Urdu">Urdu + Saraiki Bridge</option>
              <option value="Saraiki">Saraiki (سرائیکی)</option>
              <option value="English">Simple English</option>
              <option value="Balochi">Balochi</option>
              <option value="Sindhi">Sindhi</option>
            </select>
          </div>

          <button
            onClick={handleRunScanner}
            disabled={isScanning}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all"
          >
            {isScanning ? 'Scanning & Building Mind-Map...' : 'Generate Smart Summary & Village Lab'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-cyber-900/60 border border-cyber-700 rounded-2xl p-6 space-y-5">
          {scanResult ? (
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-white">{scanResult.title}</h4>

              <div className="p-4 rounded-xl bg-cyber-950/70 border border-cyber-800">
                <div className="text-xs font-bold text-emerald-400 uppercase mb-1">
                  Explain Like I&apos;m 10 (Simple Summary)
                </div>
                <p className="text-xs text-cyber-100 leading-relaxed">{scanResult.eli10Summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-700/50">
                <div className="text-xs font-bold text-purple-300 uppercase mb-1">
                  Mother-Tongue Explanation (Saraiki / Urdu)
                </div>
                <p className="text-sm text-white leading-relaxed" dir="rtl">
                  {scanResult.motherTongueExplanation}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/40">
                <div className="text-xs font-bold text-amber-300 uppercase mb-1">
                  🧪 Zero-Equipment Rural / Home Science Experiment
                </div>
                <p className="text-xs text-cyber-100 leading-relaxed">
                  {scanResult.noLabExperiment}
                </p>
              </div>

              {/* Mind Map Branches */}
              <div>
                <div className="text-xs font-bold text-cyber-400 uppercase mb-2">
                  Visual Concept Mind-Map
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {scanResult.mindMap.map((branch, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-cyber-950/80 border border-cyber-700"
                    >
                      <div className="text-xs font-bold text-cyber-400 mb-1.5">
                        {branch.branch}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {branch.nodes.map((n, j) => (
                          <span
                            key={j}
                            className="px-2 py-1 rounded bg-cyber-800 text-[11px] text-white"
                          >
                            → {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trilingual Vocabulary */}
              <div>
                <div className="text-xs font-bold text-cyber-400 uppercase mb-2">
                  Key Terms & Local Meaning
                </div>
                <div className="space-y-1.5">
                  {scanResult.vocabulary.map((v, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-cyber-950/60 border border-cyber-800 flex flex-wrap justify-between items-center gap-2 text-xs"
                    >
                      <div>
                        <strong className="text-white">{v.term}:</strong>{' '}
                        <span className="text-cyber-300">{v.definition}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {v.localMeaning}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-cyber-500">
              <FileText className="w-12 h-12 mb-3 text-emerald-400/40" />
              <div className="text-base font-bold text-white">
                Turn Any Textbook Page Into Interactive Notes
              </div>
              <p className="text-xs text-cyber-400 max-w-md mt-1">
                Upload a photo of a Punjab Textbook Board page or paste a paragraph on the left to generate a Mother-Tongue breakdown and a No-Lab Science Experiment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- VIEW 4: ON-SCREEN SMART WHITEBOARD & SCRATCHPAD ---
  const renderWhiteboard = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-mono text-blue-400 uppercase flex items-center gap-2">
            <PenTool className="w-5 h-5" /> Smart Whiteboard & Live AI Step Coach
          </h3>
          <p className="text-xs text-cyber-400">
            Practice Math steps, Science diagrams, or Urdu/Saraiki handwriting strokes on-screen and click &ldquo;AI Check My Step&rdquo;.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['#38bdf8', '#4ade80', '#facc15', '#f87171', '#ffffff'].map((color) => (
            <button
              key={color}
              onClick={() => setPenColor(color)}
              className={`w-6 h-6 rounded-full border-2 ${
                penColor === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={clearWhiteboard}
            className="px-3 py-1.5 bg-cyber-800 hover:bg-red-950 border border-cyber-600 rounded-lg text-xs text-cyber-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Board
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={whiteboardPrompt}
          onChange={(e) => setWhiteboardPrompt(e.target.value)}
          placeholder="Target Problem or Script Practice Prompt..."
          className="flex-1 bg-cyber-900 border border-cyber-600 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
        />
        <button
          onClick={handleCheckWhiteboard}
          disabled={isCheckingBoard}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-xl text-sm"
        >
          {isCheckingBoard ? 'Inspecting Canvas...' : '✨ AI Check My Step'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <canvas
            ref={canvasRef}
            width={800}
            height={420}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[380px] bg-slate-950 border-2 border-cyber-600 rounded-2xl cursor-crosshair touch-none shadow-inner"
          />
        </div>

        <div className="lg:col-span-4 bg-cyber-900/70 border border-cyber-700 rounded-2xl p-5 flex flex-col justify-between">
          {whiteboardHint ? (
            <div className="space-y-4">
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  whiteboardHint.status === 'needs_correction'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {whiteboardHint.status === 'needs_correction'
                  ? 'Check This Step'
                  : 'On the Right Track!'}
              </div>
              <div>
                <div className="text-xs text-cyber-400 uppercase font-bold">Encouragement</div>
                <p className="text-sm text-white mt-1">{whiteboardHint.praise}</p>
              </div>
              <div>
                <div className="text-xs text-amber-400 uppercase font-bold">Observation</div>
                <p className="text-xs text-cyber-200 mt-1">{whiteboardHint.detectedIssue}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-700/50">
                <div className="text-xs text-blue-300 uppercase font-bold mb-1">
                  Next Step Hint
                </div>
                <p className="text-xs text-white leading-relaxed">
                  {whiteboardHint.nextStepHint}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center my-auto text-cyber-500 space-y-2">
              <PenTool className="w-10 h-10 mx-auto text-blue-400/40" />
              <div className="text-sm font-bold text-white">Write or Draw on the Canvas</div>
              <p className="text-xs text-cyber-400">
                Write a math equation step or practice Urdu/Saraiki letters (ٻ, ڄ, ݙ, ڳ, ݨ) and click &ldquo;AI Check My Step&rdquo; for instant guidance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // --- VIEW 5: ATTENDANCE-LINKED "HARVEST & FLOOD" MISSED CLASS CATCH-UP HUB ---
  const renderCatchUp = () => (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h3 className="text-xl font-mono text-amber-400 uppercase flex items-center gap-2">
          <Compass className="w-5 h-5" /> Attendance-Linked &ldquo;Missed Class Catch-Up&rdquo; Generator
        </h3>
        <p className="text-xs text-cyber-400">
          Addresses chronic seasonal absenteeism in D.G. Khan, Rajanpur & Taunsa (Wheat/Cotton harvesting, Koh-e-Suleman Rod-Kohi floods, or transport gaps) with 15-minute home Catch-Up Packs & WhatsApp parent alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-cyber-900/70 border border-cyber-700 rounded-2xl p-5 space-y-4">
          <div>
            <label className="text-xs text-cyber-400 uppercase font-bold block mb-1.5">
              1. Reason for Absence (Regional Context)
            </label>
            <select
              value={catchUpReason}
              onChange={(e) => setCatchUpReason(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="Wheat / Cotton Harvest Season (فصل دی کٹائی / چنائی)">
                Wheat / Cotton Harvest Season (فصل دی کٹائی / چنائی)
              </option>
              <option value="Monsoon / Hill-Torrent Flood Disruption (رود کوہی / بارش)">
                Monsoon / Hill-Torrent Flood Disruption (رود کوہی / بارش)
              </option>
              <option value="Remote Village Transport / Distance Issue">
                Remote Village Transport / Distance Issue
              </option>
              <option value="Health / Family Emergency">Health / Family Emergency</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-cyber-400 uppercase font-bold block mb-1.5">
              2. Missed Curriculum Topic
            </label>
            <select
              value={activeTopicId}
              onChange={(e) => setActiveTopicId(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-xl p-2.5 text-xs text-white"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.subject})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-xs text-cyber-400 uppercase font-bold">
              3. Select Student to Build Catch-Up Pack
            </div>
            {absentStudentsSummary.map(({ student, absentDates }) => (
              <div
                key={student.id}
                className="p-3 rounded-xl bg-cyber-950/70 border border-cyber-800 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-sm font-bold text-white">{student.name}</div>
                  <div className="text-[11px] text-cyber-400">
                    Grade {student.grade} •{' '}
                    {absentDates.length > 0 ? (
                      <span className="text-amber-400">
                        {absentDates.length} Absent/Leave day(s) recorded
                      </span>
                    ) : (
                      <span>Generate proactive home study pack</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleGenerateCatchUp(student.id, absentDates)}
                  disabled={isGeneratingCatchUp}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs shrink-0"
                >
                  Build Pack
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 bg-cyber-900/60 border border-cyber-700 rounded-2xl p-6">
          {isGeneratingCatchUp ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full mb-3"></div>
              <div className="text-white font-bold">
                Creating 15-Minute Catch-Up Pack & Parent WhatsApp Note...
              </div>
            </div>
          ) : catchUpResult ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-600/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase">
                    Parent WhatsApp Message (Urdu / Roman Urdu)
                  </span>
                  {(() => {
                    const st = students.find((s) => s.id === activeStudentId);
                    const phone = st?.parentPhone?.replace(/[^0-9]/g, '') || '';
                    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
                      catchUpResult.parentWhatsAppMessage
                    )}`;
                    return (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5"
                      >
                        <Share2 className="w-3.5 h-3.5" /> Send via WhatsApp
                      </a>
                    );
                  })()}
                </div>
                <p className="text-xs text-cyber-100">{catchUpResult.parentWhatsAppMessage}</p>
              </div>

              <div className="p-5 rounded-xl bg-white text-black space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-xs font-bold uppercase text-gray-500">
                    Printable 15-Minute Home Catch-Up Sheet
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="px-2.5 py-1 bg-gray-900 text-white rounded text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-xs leading-relaxed font-serif">
                  {catchUpResult.studyPackMarkdown}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 text-cyber-500">
              <Compass className="w-12 h-12 mb-3 text-amber-400/40" />
              <div className="text-base font-bold text-white">
                Keep Every Child on Track During Harvest & Monsoon Seasons
              </div>
              <p className="text-xs text-cyber-400 max-w-md mt-1">
                Click &ldquo;Build Pack&rdquo; next to any student on the left to generate a 15-minute home Catch-Up Sheet and a 1-click WhatsApp briefing for their parents.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurriculum = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-mono text-cyber-400 uppercase">
          PCTB / BISE DG Khan Curriculum Setup
        </h3>
      </div>

      <div className="bg-cyber-900/50 border border-cyber-700 p-6 rounded-xl">
        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyber-500" /> Add New Curriculum Topic
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Topic Title (e.g., Quadratic Equations, Saraiki Phonetics)"
            value={newTopic.title || ''}
            onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
            className="bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-white outline-none"
          />
          <div className="flex gap-2">
            <select
              value={newTopic.subject}
              onChange={(e) =>
                setNewTopic({ ...newTopic, subject: e.target.value as Subject })
              }
              className="bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-white outline-none flex-1"
            >
              <option>English</option>
              <option>Math</option>
              <option>Science</option>
              <option>Urdu</option>
              <option>Saraiki</option>
              <option>Computer</option>
              <option>History</option>
              <option>Sindhi</option>
            </select>
            <select
              value={newTopic.language}
              onChange={(e) =>
                setNewTopic({ ...newTopic, language: e.target.value as Language })
              }
              className="bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-white outline-none flex-1"
            >
              <option value="Saraiki">Saraiki (سرائیکی Bridge)</option>
              <option value="Urdu">Urdu (اردو)</option>
              <option value="English">English</option>
              <option value="Balochi">Balochi (بلوچی)</option>
              <option value="Sindhi">Sindhi (سنڌي)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <textarea
              placeholder="Description & Learning Objectives"
              value={newTopic.description || ''}
              onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
              className="w-full bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-white outline-none h-20"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-cyber-500 mb-1">
              Reference Text (For Reading Tasks or Answer Key)
            </label>
            <textarea
              placeholder="Enter ground truth text here (supports English, Urdu, Saraiki, Balochi & Sindhi script)..."
              value={newTopic.referenceText || ''}
              onChange={(e) =>
                setNewTopic({ ...newTopic, referenceText: e.target.value })
              }
              dir={
                newTopic.language && newTopic.language !== 'English' ? 'rtl' : 'ltr'
              }
              className="w-full bg-cyber-900 border border-cyber-600 rounded px-3 py-2 text-white outline-none h-16 font-mono text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs text-cyber-500 mb-1">
              Reference Image (PCTB Textbook Page / Diagram)
            </label>
            <input
              type="file"
              onChange={handleRefImageUpload}
              accept="image/*"
              className="block w-full text-sm text-cyber-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cyber-700 file:text-cyber-200 hover:file:bg-cyber-600"
            />
            {newTopic.referenceImageUrl && (
              <img
                src={newTopic.referenceImageUrl}
                className="mt-2 h-20 rounded border border-cyber-600"
              />
            )}
          </div>
        </div>
        <button
          onClick={saveTopic}
          className="mt-4 w-full bg-cyber-600 hover:bg-cyber-500 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Save Topic to Curriculum
        </button>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm text-cyber-500 font-mono uppercase">Active Topics</h4>
        {topics.map((t) => (
          <div
            key={t.id}
            className="bg-cyber-800 p-3.5 rounded-xl border border-cyber-700 flex justify-between items-center"
          >
            <div>
              <div className="text-white font-bold flex items-center gap-2">
                {t.title}
                <span className="text-[10px] bg-cyber-900 border border-cyber-600 px-2 py-0.5 rounded text-cyber-400 uppercase">
                  {t.language}
                </span>
              </div>
              <div className="text-xs text-cyber-400">
                {t.subject} • Grade {t.grade} — {t.description}
              </div>
            </div>
            <button
              onClick={() => deleteTopic(t.id)}
              className="text-red-400 hover:text-red-300 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAssessment = () => (
    <div className="animate-in fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-mono text-cyber-400 uppercase">
          Multimodal Homework & Oral Reading Grader
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <select
          value={activeStudentId}
          onChange={(e) => {
            setActiveStudentId(e.target.value);
            resetAssessment();
          }}
          className="bg-cyber-900 border border-cyber-600 p-3 rounded-xl text-white outline-none"
        >
          <option value="">Select Student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.grade})
            </option>
          ))}
        </select>
        <select
          value={activeTopicId}
          onChange={(e) => {
            setActiveTopicId(e.target.value);
            resetAssessment();
          }}
          className="bg-cyber-900 border border-cyber-600 p-3 rounded-xl text-white outline-none"
        >
          <option value="">Select Topic</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.language})
            </option>
          ))}
        </select>
        <select
          value={assessmentType}
          onChange={(e) => {
            setAssessmentType(e.target.value as AssessmentType);
            resetAssessment();
          }}
          className="bg-cyber-900 border border-cyber-600 p-3 rounded-xl text-white outline-none"
        >
          <option value="Writing">Writing / Notebook Script</option>
          <option value="Reading">Reading / Oral Fluency</option>
          <option value="Math">Math Step-by-Step Solution</option>
        </select>
      </div>

      {activeStudentId && activeTopicId && (
        <div className="bg-cyber-900/50 border border-cyber-700 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
          {latestResult ? (
            <div className="w-full max-w-4xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Assessment Result</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      speakText(
                        `Score ${latestResult.score} out of 10. ${latestResult.feedback}. Remedial Task: ${latestResult.remedialTask}`
                      )
                    }
                    className={`p-2 rounded-full border transition-colors ${
                      isSpeakingFeedback
                        ? 'bg-red-500/20 text-red-400 border-red-500'
                        : 'bg-cyber-800 text-cyber-400 border-cyber-600 hover:text-white'
                    }`}
                  >
                    {isSpeakingFeedback ? (
                      <StopCircle className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={resetAssessment}
                    className="text-sm text-cyber-400 hover:text-white underline"
                  >
                    New Assessment
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-cyber-800 rounded-xl border border-cyber-600 flex flex-col justify-center items-center">
                  <div className="text-xs text-cyber-400 uppercase tracking-widest">Score</div>
                  <div
                    className={`text-6xl font-bold mt-2 ${
                      latestResult.score > 7
                        ? 'text-green-400'
                        : latestResult.score > 4
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {latestResult.score}/10
                  </div>
                </div>
                <div className="col-span-2 p-5 bg-cyber-800/50 rounded-xl border border-cyber-600 text-left max-h-[380px] overflow-y-auto">
                  <div className="text-xs text-cyber-400 uppercase mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Detailed AI Feedback
                  </div>
                  <div className="text-sm text-white whitespace-pre-wrap leading-relaxed font-mono">
                    {latestResult.feedback}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {latestResult.strengths.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-green-900/30 text-green-400 border border-green-800 px-2 py-1 rounded"
                      >
                        {s}
                      </span>
                    ))}
                    {latestResult.weaknesses.map((w, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-red-900/30 text-red-400 border border-red-800 px-2 py-1 rounded"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-1" />
                <div>
                  <div className="text-sm font-bold text-red-400 uppercase">Remedial Task</div>
                  <p className="text-white mt-1">{latestResult.remedialTask}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {assessmentType === 'Reading' ? (
                <div className="text-center space-y-6">
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${
                      isRecording
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-cyber-800 border-2 border-cyber-600'
                    }`}
                  >
                    <Mic className={`w-10 h-10 ${isRecording ? 'text-white' : 'text-cyber-400'}`} />
                  </div>
                  {audioBlob ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-800">
                        <Check className="w-4 h-4" /> Audio Captured
                      </div>
                      <button
                        onClick={() => setAudioBlob(null)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-8 py-3 rounded-full font-bold uppercase tracking-widest ${
                        isRecording
                          ? 'bg-red-600 text-white'
                          : 'bg-cyber-500 text-black hover:bg-cyber-400'
                      }`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center w-full max-w-md">
                  {capturedImage ? (
                    <div className="relative">
                      <img
                        src={capturedImage}
                        className="w-full h-64 object-contain bg-black rounded-lg border border-cyber-700"
                      />
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="absolute top-2 right-2 bg-black/60 p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-cyber-600 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-cyber-800/50 hover:border-cyber-400"
                    >
                      <Camera className="w-10 h-10 text-cyber-400 mb-3" />
                      <span className="text-cyber-400 font-mono uppercase text-sm">
                        Upload Student Notebook Photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCaptureImage}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}

              <div className="mt-8">
                <button
                  onClick={runAssessment}
                  disabled={isProcessing || (!capturedImage && !audioBlob)}
                  className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
                    isProcessing || (!capturedImage && !audioBlob)
                      ? 'bg-cyber-800 text-cyber-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-400 text-black'
                  }`}
                >
                  {isProcessing ? 'Analyzing with Gemini...' : 'Run AI Assessment'}
                  {!isProcessing && <ChevronRight className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  // --- VIEW: SYSTEM SCHOOL AI AGENT (BEACONHOUSE / CITY / ALLIED MONTHLY PLANNER & EXAM ENGINE) ---
  const renderSystemSchoolAgent = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-700 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase mb-1">
            Beaconhouse • The City School • Allied School Level Academic System
          </div>
          <h3 className="text-xl font-bold text-white">
            AI System School Agent — Whole-Month Date-Wise Planner, Teacher &ldquo;Mawaad&rdquo; & Exam Engine
          </h3>
          <p className="text-xs text-cyber-400">
            Designed for your school&apos;s own course & books: tells teachers <em>Kitna parhana hai, Kya parhana hai, aur Kaise parhana hai</em> every day of the month, plus generates Weekly, Monthly, Mid-Term & Annual Exams.
          </p>
        </div>

        <div className="flex p-1 bg-cyber-950 border border-cyber-700 rounded-xl shrink-0">
          <button
            onClick={() => setSysSubMode('planner')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
              sysSubMode === 'planner'
                ? 'bg-emerald-500 text-black'
                : 'text-cyber-400 hover:text-white'
            }`}
          >
            🗓️ Monthly Date-Wise Planner & Mawaad
          </button>
          <button
            onClick={() => setSysSubMode('exams')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase transition-all ${
              sysSubMode === 'exams'
                ? 'bg-cyber-500 text-black'
                : 'text-cyber-400 hover:text-white'
            }`}
          >
            📝 Weekly / Monthly / Term / Annual Exams
          </button>
        </div>
      </div>

      {/* Shared Course & Syllabus Configuration Box */}
      <div className="bg-cyber-900/70 border border-cyber-700 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-cyber-400 font-bold uppercase mb-1">
              1. Class / Grade
            </label>
            <select
              value={sysGrade}
              onChange={(e) => setSysGrade(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-lg p-2.5 text-white outline-none"
            >
              {[
                'Nursery',
                'Prep',
                '1-A',
                '2-A',
                '3-A',
                '4-A',
                '5-A',
                '6-A',
                '7-A',
                '8-A',
                '9-A',
                '10-A',
              ].map((g) => (
                <option key={g} value={g}>
                  Class {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-cyber-400 font-bold uppercase mb-1">
              2. Subject
            </label>
            <select
              value={sysSubject}
              onChange={(e) => setSysSubject(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-lg p-2.5 text-white outline-none"
            >
              {[
                'Math',
                'Science',
                'English',
                'Urdu',
                'Computer',
                'History',
                'Saraiki',
                'Sindhi',
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-cyber-400 font-bold uppercase mb-1">
              3. Month & Start Date
            </label>
            <input
              type="date"
              value={sysStartDate}
              onChange={(e) => setSysStartDate(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-lg p-2.5 text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-cyber-400 font-bold uppercase mb-1">
              4. School Course / Publisher
            </label>
            <select
              value={sysSyllabusSource}
              onChange={(e) => setSysSyllabusSource(e.target.value)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-lg p-2.5 text-white outline-none"
            >
              <option value="Own School Syllabus (PCTB Punjab Board)">
                PCTB (Punjab Textbook Board)
              </option>
              <option value="Afaq Sun Series (Apna Course)">Afaq Sun Series</option>
              <option value="Oxford University Press Pakistan">Oxford Pakistan</option>
              <option value="Gohar / Custom School Course">
                Gohar / Custom School Course
              </option>
            </select>
          </div>

          <div>
            <label className="block text-cyber-400 font-bold uppercase mb-1">
              5. Medium / Language
            </label>
            <select
              value={sysLanguage}
              onChange={(e) => setSysLanguage(e.target.value as Language)}
              className="w-full bg-cyber-800 border border-cyber-600 rounded-lg p-2.5 text-white outline-none"
            >
              <option value="Urdu">English + Urdu Bridge</option>
              <option value="Saraiki">Saraiki + Urdu Bridge</option>
              <option value="English">English Medium</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-8">
            <label className="block text-xs text-cyber-400 font-bold uppercase mb-1">
              Target Course Portion (Chapters, Topics, or Book Page Range to Cover)
            </label>
            <input
              value={sysCoursePortion}
              onChange={(e) => setSysCoursePortion(e.target.value)}
              placeholder="e.g., Chapter 1 to 3 (Pages 1–42) or Chapter: Light & Reflection..."
              className="w-full bg-cyber-950 border border-cyber-600 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="lg:col-span-4 flex gap-2">
            <input
              type="file"
              ref={sysBookInputRef}
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onloadend = () => setSysBookImage(r.result as string);
                  r.readAsDataURL(f);
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => sysBookInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded-xl text-xs text-cyber-200 flex items-center justify-center gap-1.5"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              {sysBookImage ? '✓ Book Photo Attached' : 'Upload Book Index Photo'}
            </button>
          </div>
        </div>
      </div>

      {/* MODE A: WHOLE-MONTH DATE-WISE & DAY-WISE ACADEMIC PLANNER */}
      {sysSubMode === 'planner' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => handleBuildMonthlyPlan()}
              disabled={isBuildingPlan}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs uppercase font-mono shadow-lg flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isBuildingPlan
                ? 'Building 24-Day Date-Wise Plan...'
                : 'Generate Full-Month Date-Wise & Day-Wise Plan'}
            </button>

            {monthlyPlan && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-700 px-3 py-1.5 rounded-lg">
                  Principal Audit:{' '}
                  {Object.values(completedPlanDays).filter(Boolean).length} /{' '}
                  {monthlyPlan.days.length} Days Completed
                </span>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded-xl text-xs text-white flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Monthly Planner
                </button>
              </div>
            )}
          </div>

          {/* Modal for 1-Click Daily Teacher Mawaad */}
          {activeDayMawaad && (
            <div className="p-6 rounded-2xl bg-white text-black border-4 border-emerald-500 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <span className="text-xs font-mono uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold">
                    Ready-to-Teach Teacher Mawaad • Day {activeDayMawaad.dayNumber} ({activeDayMawaad.dateLabel})
                  </span>
                  <h4 className="text-lg font-bold mt-1">{activeDayMawaad.title}</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Handout
                  </button>
                  <button
                    onClick={() => setActiveDayMawaad(null)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-xs leading-relaxed font-serif max-h-[360px] overflow-y-auto">
                {activeDayMawaad.markdown}
              </div>
            </div>
          )}

          {monthlyPlan ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyber-950/80 border border-cyber-700 text-xs text-cyber-200">
                <strong className="text-emerald-400 uppercase block mb-1">
                  Monthly Pacing Overview ({monthlyPlan.grade} • {monthlyPlan.subject} • {monthlyPlan.syllabusSource}):
                </strong>
                {monthlyPlan.monthlyOverview}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyPlan.days.map((d) => {
                  const isDone = Boolean(completedPlanDays[d.dayNumber]);
                  const badgeStyle =
                    d.dayType === 'WeeklyTest'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : d.dayType === 'MonthlyTest'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : d.dayType === 'Revision'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';

                  return (
                    <div
                      key={d.dayNumber}
                      className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-600/60'
                          : 'bg-cyber-900/80 border-cyber-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-cyber-950 font-mono font-bold text-xs text-white">
                            Day {d.dayNumber} • {d.dateLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${badgeStyle}`}
                          >
                            {d.dayType}
                          </span>
                        </div>

                        <label className="flex items-center gap-1 text-[11px] text-cyber-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() =>
                              setCompletedPlanDays((prev) => ({
                                ...prev,
                                [d.dayNumber]: !prev[d.dayNumber],
                              }))
                            }
                            className="accent-emerald-500"
                          />
                          <span>Done</span>
                        </label>
                      </div>

                      <div>
                        <div className="text-[11px] font-mono text-cyber-400">
                          📖 <strong>Kitna Parhana Hai:</strong> {d.unitAndPages}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          🎯 {d.topicTitle}
                        </div>
                        <div className="text-[11px] text-cyber-300 italic">
                          SLO: {d.learningOutcome}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cyber-950/70 border border-cyber-800 text-xs space-y-1">
                        <div>
                          <strong className="text-cyber-400">Kaise Parhana Hai (40m): </strong>
                          <span className="text-cyber-100 whitespace-pre-wrap">
                            {d.howToTeach}
                          </span>
                        </div>
                        <div>
                          <strong className="text-purple-300">Board & Mawaad: </strong>
                          <span className="text-cyber-200">{d.boardWorkAndMaterial}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                        <div className="text-cyber-300">
                          <strong className="text-emerald-400">CW:</strong> {d.classwork} |{' '}
                          <strong className="text-amber-400">HW:</strong> {d.homework}
                        </div>
                        <button
                          onClick={() => handleOpenDayMawaad(d)}
                          disabled={isLoadingMawaad}
                          className="px-3 py-1 rounded-lg bg-cyber-800 hover:bg-emerald-500 hover:text-black border border-cyber-600 text-cyber-200 font-bold transition-all"
                        >
                          📄 Full Teacher Mawaad
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-cyber-900/40 border border-dashed border-cyber-700 rounded-2xl text-cyber-400">
              Click <strong>&ldquo;Generate Full-Month Date-Wise & Day-Wise Plan&rdquo;</strong> above (or ask the Floating Voice AI Assistant) to build a complete 24-working-day Beaconhouse/Allied-level schedule for your school&apos;s course!
            </div>
          )}
        </div>
      )}

      {/* MODE B: WEEKLY, MONTHLY, MID-TERM & ANNUAL EXAM PAPER GENERATOR */}
      {sysSubMode === 'exams' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-cyber-900/60 p-4 rounded-2xl border border-cyber-700">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'Weekly', label: 'Weekly Test (20 Marks)' },
                  { id: 'Monthly', label: 'Monthly Test (40 Marks)' },
                  { id: 'MidTerm', label: 'Mid-Term Exam (75 Marks)' },
                  { id: 'Annual', label: 'Annual Final Exam (100 Marks)' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setExamPaperType(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono uppercase border transition-all ${
                    examPaperType === item.id
                      ? 'bg-cyber-500 text-black border-cyber-400 shadow-neon'
                      : 'bg-cyber-950 text-cyber-300 border-cyber-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBuildExamPaper()}
                disabled={isBuildingExam}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs uppercase font-mono"
              >
                {isBuildingExam
                  ? 'Generating Exam Paper...'
                  : `Generate ${examPaperType} Paper + Key`}
              </button>
            </div>
          </div>

          {generatedExamPaper ? (
            <div className="bg-white text-black rounded-2xl p-8 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/vision-logo-seal.png"
                    alt="Vision Grammar School Seal"
                    className="w-16 h-16 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-[11px] font-bold tracking-widest uppercase text-blue-900">
                      VISION GRAMMAR SCHOOL • BLOCK 56, D.G. KHAN (Learn • Grow • Succeed)
                    </div>
                    <h2 className="text-2xl font-bold uppercase">
                      {generatedExamPaper.schoolHeaderTitle}
                    </h2>
                    <p className="text-xs text-gray-700 font-mono mt-1">
                      Class: <strong>{generatedExamPaper.grade}</strong> | Subject:{' '}
                      <strong>{generatedExamPaper.subject}</strong> | Time:{' '}
                      <strong>{generatedExamPaper.timeAllowed}</strong> | Total Marks:{' '}
                      <strong>{generatedExamPaper.totalMarks}</strong>
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Syllabus Covered: {generatedExamPaper.coveredSyllabus}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => setShowMarkingKey(!showMarkingKey)}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-400 text-xs font-bold"
                  >
                    {showMarkingKey ? 'Hide Teacher Answer Key' : 'Show Teacher Answer Key'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Exam Paper
                  </button>
                </div>
              </div>

              {/* Section A: Objective MCQs */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase border-b pb-1">
                  Section A — Objective Multiple Choice Questions (MCQs)
                </h3>
                <div className="space-y-3 text-xs">
                  {generatedExamPaper.mcqs.map((m) => (
                    <div key={m.qNo} className="space-y-1">
                      <div className="font-bold">
                        Q{m.qNo}. {m.question} ({m.marks} Mark)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4">
                        {m.options.map((opt, idx) => (
                          <div key={idx}>
                            ({String.fromCharCode(65 + idx)}) {opt}
                          </div>
                        ))}
                      </div>
                      {showMarkingKey && (
                        <div className="text-emerald-700 font-mono text-[11px] pl-4">
                          ✓ Answer Key: {m.correctAnswer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B: Short Questions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase border-b pb-1">
                  Section B — Subjective Short Questions
                </h3>
                <div className="space-y-2.5 text-xs">
                  {generatedExamPaper.shortQuestions.map((sq) => (
                    <div key={sq.qNo} className="space-y-1">
                      <div className="font-bold">
                        Q{sq.qNo}. {sq.question} ({sq.marks} Marks)
                      </div>
                      {showMarkingKey && (
                        <div className="p-2 rounded bg-gray-100 text-gray-800 font-mono text-[11px]">
                          <strong>Model Answer:</strong> {sq.modelAnswer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section C: Long / Extensive Questions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase border-b pb-1">
                  Section C — Extensive / Long Questions
                </h3>
                <div className="space-y-2.5 text-xs">
                  {generatedExamPaper.longQuestions.map((lq) => (
                    <div key={lq.qNo} className="space-y-1">
                      <div className="font-bold">
                        Q{lq.qNo}. {lq.question} ({lq.marks} Marks)
                      </div>
                      {showMarkingKey && (
                        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px]">
                          <strong>Marking Rubric:</strong> {lq.markingRubric}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-cyber-900/40 border border-dashed border-cyber-700 rounded-2xl text-cyber-400">
              Select <strong>Weekly, Monthly, Mid-Term, or Annual Exam</strong> above and click Generate (or tell the Floating Voice AI Assistant: <em>&ldquo;Generate exam paper of Mathematics class 8th half course from chapter 1 to 10&rdquo;</em>)!
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 shadow-2xl min-h-[600px] text-cyber-100">
      {renderNavPills()}

      {/* Expandable Gemini API Key Banner */}
      {showKeyBanner && (
        <div className="mb-6 p-4 rounded-xl bg-cyber-950 border border-cyber-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-cyber-200">
            <strong className="text-cyber-400 block">
              Configure Google Gemini API Key (For Lesson Plans, Flashcards, MCQs & Vision)
            </strong>
            Paste your key from Google AI Studio. Stored locally in your browser.
          </div>
          <div className="flex w-full sm:w-auto gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 sm:w-64 bg-cyber-900 border border-cyber-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
            />
            <button
              onClick={saveCustomApiKey}
              className="px-4 py-1.5 bg-cyber-500 text-black font-bold text-xs rounded-lg"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {view === 'dashboard' && renderDashboard()}
      {view === 'system_agent' && renderSystemSchoolAgent()}
      {view === 'hub' && renderHub()}
      {view === 'socratic' && renderSocratic()}
      {view === 'scanner' && renderScanner()}
      {view === 'whiteboard' && renderWhiteboard()}
      {view === 'catchup' && renderCatchUp()}
      {view === 'curriculum' && renderCurriculum()}
      {view === 'assessment' && renderAssessment()}
    </div>
  );
};

export default TutorModule;
