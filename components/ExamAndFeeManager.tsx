import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  StudentExamRecord,
  StudentFeeRecord,
  ExamPaperType,
  SavedQuestionPaper,
  AnswerSheetAiCheckResult,
} from '../types';
import {
  getSavedQuestionPapers,
  saveQuestionPapers,
  recalculateAllExamPositions,
  appendAuditLog,
} from '../services/schoolStoreService';
import { checkAnswerSheetWithAi } from '../services/aiSubscriptionService';
import { generateExamPaper } from '../services/tutorService';
import {
  Award,
  Search,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
  FileText,
  Bot,
  CheckSquare,
  Loader2,
  Upload,
  Eye,
} from 'lucide-react';

interface Props {
  students: Student[];
  examRecords: StudentExamRecord[];
  setExamRecords: React.Dispatch<React.SetStateAction<StudentExamRecord[]>>;
  feeRecords: StudentFeeRecord[];
  setFeeRecords: React.Dispatch<React.SetStateAction<StudentFeeRecord[]>>;
  externalSearchQuery?: string;
  externalMode?: 'exams' | 'fees';
  actorName?: string;
  actorRole?: 'ADMIN' | 'TEACHER' | 'STAFF';
}

const SCHOOL_CLASSES = [
  'KG',
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
];

const SCHOOL_SUBJECTS = [
  'Mathematics',
  'General Science',
  'English',
  'Urdu',
  'Islamiat',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
];

const ExamAndFeeManager: React.FC<Props> = ({
  students,
  examRecords,
  setExamRecords,
  feeRecords,
  setFeeRecords,
  externalSearchQuery = '',
  externalMode,
  actorName = 'Ustad Ahmed Raza',
  actorRole = 'TEACHER',
}) => {
  const [subTab, setSubTab] = useState<'paper_prep' | 'sheet_check' | 'exams' | 'fees'>(
    externalMode || 'exams'
  );
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery);
  const [examFilter, setExamFilter] = useState<'ALL' | ExamPaperType>('ALL');
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});

  // --- STAGE 1: QUESTION PAPER PREPARATION & PRINTING STATE ---
  const [questionPapers, setQuestionPapers] = useState<SavedQuestionPaper[]>(() =>
    getSavedQuestionPapers()
  );
  const [selectedPaperId, setSelectedPaperId] = useState<string>(
    () => getSavedQuestionPapers()[0]?.id || ''
  );
  const [paperTitle, setPaperTitle] = useState<string>('Mid-Term Examination 2026');
  const [paperExamType, setPaperExamType] = useState<ExamPaperType>('MidTerm');
  const [paperGrade, setPaperGrade] = useState<string>('8-A');
  const [paperSubject, setPaperSubject] = useState<string>('Mathematics');
  const [paperTopics, setPaperTopics] = useState<string>(
    'Linear Equations, Algebraic Factorization, Simultaneous Equations, Geometry'
  );
  const [paperTotalMarks, setPaperTotalMarks] = useState<number>(100);
  const [paperDuration, setPaperDuration] = useState<string>('2 Hours');
  const [isGeneratingPaper, setIsGeneratingPaper] = useState<boolean>(false);
  const [showAnswerKeyOnPreview, setShowAnswerKeyOnPreview] = useState<boolean>(false);

  // --- STAGE 2: MANUAL & AI-ASSISTED ANSWER SHEET CHECKING & MARKS ENTRY STATE ---
  const [checkStudentId, setCheckStudentId] = useState<string>(students[0]?.id || '');
  const [checkExamType, setCheckExamType] = useState<ExamPaperType>('MidTerm');
  const [checkingMode, setCheckingMode] = useState<'MANUAL' | 'AI_ASSISTED'>('AI_ASSISTED');
  const [aiSheetSubject, setAiSheetSubject] = useState<string>('Mathematics');
  const [aiSheetRubric, setAiSheetRubric] = useState<string>(
    'Q1: Objective MCQs (30 Marks). Q2: Solve 3x + 9 = 24 and factorize x^2 - 16 (40 Marks). Q3: Prove sum of angles of a triangle is 180 degrees with diagram (30 Marks).'
  );
  const [aiStudentWrittenText, setAiStudentWrittenText] = useState<string>(
    'Q1: All 6 MCQs marked accurately (a) x=5, (b) (x-4)(x+4). Q2: 3x + 9 = 24 => 3x = 15 => x = 5. Factorization: x^2 - 16 = (x - 4)(x + 4) using difference of two squares formula. Q3: Drawn parallel line XY through vertex A. Alternate interior angles are equal, therefore angle A + angle B + angle C = 180 degrees.'
  );
  const [isAiChecking, setIsAiChecking] = useState<boolean>(false);
  const [aiCheckResult, setAiCheckResult] = useState<AnswerSheetAiCheckResult | null>(null);

  // Subject Marks Entry State
  const [mathMarks, setMathMarks] = useState<number>(92);
  const [scienceMarks, setScienceMarks] = useState<number>(88);
  const [englishMarks, setEnglishMarks] = useState<number>(85);
  const [urduMarks, setUrduMarks] = useState<number>(91);
  const [computerMarks, setComputerMarks] = useState<number>(94);
  const [resultSaveToast, setResultSaveToast] = useState<string>('');

  const toggleFlipCard = (cardId: string) => {
    setFlippedCardIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    if (externalMode) {
      setSubTab(externalMode);
    }
  }, [externalMode]);

  // Always ensure Class Positions & Overall School Positions are calculated
  const rankedExamRecords = useMemo(
    () => recalculateAllExamPositions(examRecords),
    [examRecords]
  );

  const filteredExamRecords = useMemo(() => {
    return rankedExamRecords.filter((rec) => {
      const matchesType = examFilter === 'ALL' || rec.examType === examFilter;
      if (!searchQuery.trim()) return matchesType;
      const q = searchQuery.toLowerCase().trim();
      const matchesStudent =
        rec.studentName.toLowerCase().includes(q) ||
        rec.grNo.toLowerCase().includes(q) ||
        rec.studentId.toLowerCase().includes(q) ||
        rec.grade.toLowerCase().includes(q);
      return matchesType && matchesStudent;
    });
  }, [rankedExamRecords, searchQuery, examFilter]);

  const filteredFeeRecords = useMemo(() => {
    return feeRecords.filter((fee) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        fee.studentName.toLowerCase().includes(q) ||
        fee.grNo.toLowerCase().includes(q) ||
        fee.studentId.toLowerCase().includes(q) ||
        fee.grade.toLowerCase().includes(q)
      );
    });
  }, [feeRecords, searchQuery]);

  const activePaper = useMemo(
    () => questionPapers.find((p) => p.id === selectedPaperId) || questionPapers[0] || null,
    [questionPapers, selectedPaperId]
  );

  // --- GENERATE & SAVE QUESTION PAPER ---
  const handleCreateQuestionPaper = async () => {
    setIsGeneratingPaper(true);
    try {
      const generated = await generateExamPaper(
        paperSubject,
        paperGrade,
        paperExamType,
        paperTopics,
        paperTotalMarks
      );
      const newPaper: SavedQuestionPaper = {
        id: `qp-${Date.now()}`,
        title: `${paperExamType} Examination 2026 — ${paperSubject}`,
        examType: paperExamType,
        grade: paperGrade,
        subject: paperSubject,
        totalMarks: paperTotalMarks,
        durationMinutes: paperDuration.includes('1') ? 60 : 120,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: actorName,
        instructions: [
          'Attempt all questions neatly on the official Vision Grammar School answer sheet.',
          'Write your Student Name, Class, and GR Number clearly on the top right corner.',
          'Overwriting in Section A (MCQs) is strictly not allowed.',
        ],
        mcqs:
          generated?.mcqs?.length > 0
            ? generated.mcqs
            : [
                {
                  question: `Which core principle applies to ${paperTopics.split(',')[0] || paperSubject}?`,
                  options: [
                    'Conservation & equivalence law',
                    'Random approximation',
                    'Zero-sum constant',
                    'None of these',
                  ],
                  correctOption: 'Conservation & equivalence law',
                  marks: 5,
                },
                {
                  question: `In Class ${paperGrade} ${paperSubject}, identify the standard unit/form used in ${paperTopics.split(',')[1] || 'problem solving'}:`,
                  options: ['Standard SI / Canonical Form', 'Arbitrary Ratio', 'Scalar Null', 'Vector Inverse'],
                  correctOption: 'Standard SI / Canonical Form',
                  marks: 5,
                },
              ],
        shortQuestions:
          generated?.shortQuestions?.length > 0
            ? generated.shortQuestions.map((sq: any) => ({
                question: sq.question,
                marks: sq.marks || 10,
                answerKey: sq.rubric || 'Award full marks for accurate definition and formula.',
              }))
            : [
                {
                  question: `Define the fundamental concept of ${paperTopics.split(',')[0] || paperSubject} with two examples.`,
                  marks: 15,
                  answerKey: 'Clear definition (8 marks) + two valid examples (7 marks).',
                },
                {
                  question: `Solve and simplify the standard problem from ${paperTopics}.`,
                  marks: 15,
                  answerKey: 'Step-by-step derivation and final boxed answer.',
                },
              ],
        longQuestions:
          generated?.longQuestions?.length > 0
            ? generated.longQuestions.map((lq: any) => ({
                question: lq.question,
                marks: lq.marks || 30,
                answerKey: lq.rubric || 'Comprehensive explanation with labeled diagram.',
              }))
            : [
                {
                  question: `Explain ${paperTopics} in detail with complete mathematical/scientific derivation and labeled diagram.`,
                  marks: 30,
                  answerKey: 'Theory (10), Derivation/Steps (12), Labeled Diagram (8).',
                },
              ],
      };

      const updated = [newPaper, ...questionPapers];
      setQuestionPapers(updated);
      saveQuestionPapers(updated);
      setSelectedPaperId(newPaper.id);

      appendAuditLog({
        actorName,
        actorRole,
        actionType: 'QUESTION_PAPER_CREATED',
        targetSummary: `${newPaper.subject} (Class ${newPaper.grade} · ${newPaper.examType})`,
        details: `Created & saved printable question paper "${newPaper.title}" (${newPaper.totalMarks} marks).`,
      });
    } finally {
      setIsGeneratingPaper(false);
    }
  };

  // --- PRINT FORMATTED QUESTION PAPER ---
  const handlePrintQuestionPaper = (paper: SavedQuestionPaper, includeKey: boolean) => {
    const win = window.open('', '_blank', 'width=900,height=750');
    if (!win) return window.print();
    const logoUrl = `${window.location.origin}/vision-logo-crest.png`;
    win.document.write(`
      <html>
        <head>
          <title>${paper.title} - Vision Grammar School</title>
          <style>
            body { font-family: 'Georgia', serif; color: #0f172a; padding: 28px; max-width: 820px; margin: 0 auto; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #1e3a8a; padding-bottom: 14px; margin-bottom: 16px; }
            .header img { width: 78px; height: 78px; object-fit: contain; }
            .school-title { text-align: center; flex: 1; }
            .school-title h1 { margin: 0; font-size: 24px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 1px; }
            .school-title p { margin: 3px 0; font-size: 12px; font-weight: bold; color: #334155; }
            .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; border: 1px solid #cbd5e1; padding: 10px; background: #f8fafc; margin-bottom: 16px; font-size: 12px; }
            .section-title { background: #1e3a8a; color: white; padding: 6px 12px; font-size: 13px; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; }
            .q-item { margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
            .options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; margin-top: 4px; padding-left: 16px; font-size: 12px; }
            .key-box { margin-top: 4px; padding: 4px 8px; background: #ecfdf5; border-left: 3px solid #059669; font-size: 11px; color: #065f46; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="Vision Grammar School" />
            <div class="school-title">
              <h1>Vision Grammar School</h1>
              <p>Block 56, Near Comprehensive School, D.G. Khan</p>
              <p>${paper.title}</p>
            </div>
            <div style="text-align:right;font-size:12px;font-weight:bold;">
              <div>Class: ${paper.grade}</div>
              <div>Subject: ${paper.subject}</div>
              <div>Max Marks: ${paper.totalMarks}</div>
              <div>Time: ${paper.durationMinutes} Mins</div>
            </div>
          </div>
          <div class="meta-grid">
            <div><strong>Student Name:</strong> ____________________</div>
            <div><strong>GR No:</strong> ____________</div>
            <div><strong>Section:</strong> ___________</div>
            <div><strong>Date:</strong> ${paper.createdAt}</div>
          </div>
          <div style="font-size:12px;margin-bottom:12px;">
            <strong>Instructions:</strong> ${paper.instructions.join(' • ')}
          </div>
          <div class="section-title">Section A — Objective MCQs</div>
          ${paper.mcqs
            .map(
              (m, idx) => `
            <div class="q-item">
              <strong>Q1.${idx + 1}:</strong> ${m.question} <span style="float:right;font-weight:bold;">(${m.marks} Marks)</span>
              <div class="options">
                ${m.options.map((opt, oi) => `<div>(${String.fromCharCode(97 + oi)}) ${opt}</div>`).join('')}
              </div>
              ${includeKey ? `<div class="key-box"><strong>Answer Key:</strong> ${m.correctOption}</div>` : ''}
            </div>`
            )
            .join('')}
          <div class="section-title">Section B — Short Answer Questions</div>
          ${paper.shortQuestions
            .map(
              (sq, idx) => `
            <div class="q-item">
              <strong>Q2.${idx + 1}:</strong> ${sq.question} <span style="float:right;font-weight:bold;">(${sq.marks} Marks)</span>
              ${includeKey ? `<div class="key-box"><strong>Rubric / Key:</strong> ${sq.answerKey}</div>` : ''}
            </div>`
            )
            .join('')}
          <div class="section-title">Section C — Descriptive / Long Questions</div>
          ${paper.longQuestions
            .map(
              (lq, idx) => `
            <div class="q-item">
              <strong>Q3.${idx + 1}:</strong> ${lq.question} <span style="float:right;font-weight:bold;">(${lq.marks} Marks)</span>
              ${includeKey ? `<div class="key-box"><strong>Rubric / Key:</strong> ${lq.answerKey}</div>` : ''}
            </div>`
            )
            .join('')}
          <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // --- STAGE 2: RUN AI ANSWER SHEET CHECKER ---
  const handleRunAiAnswerCheck = async () => {
    const st = students.find((s) => s.id === checkStudentId) || students[0];
    if (!st) return;
    setIsAiChecking(true);
    try {
      const result = await checkAnswerSheetWithAi({
        studentName: st.name,
        grNo: st.grNo,
        subject: aiSheetSubject,
        maxMarks: 100,
        questionRubric: aiSheetRubric,
        studentWrittenAnswer: aiStudentWrittenText,
      });
      setAiCheckResult(result);

      // Automatically apply the AI-checked score to the matching subject input!
      const sLower = aiSheetSubject.toLowerCase();
      if (sLower.includes('math')) setMathMarks(result.obtainedMarks);
      else if (sLower.includes('sci') || sLower.includes('phy') || sLower.includes('chem') || sLower.includes('bio'))
        setScienceMarks(result.obtainedMarks);
      else if (sLower.includes('eng')) setEnglishMarks(result.obtainedMarks);
      else if (sLower.includes('urd') || sLower.includes('isl')) setUrduMarks(result.obtainedMarks);
      else if (sLower.includes('comp')) setComputerMarks(result.obtainedMarks);

      appendAuditLog({
        actorName,
        actorRole,
        actionType: 'EXAM_SHEET_AI_CHECK',
        targetSummary: `${st.name} (GR #${st.grNo}) — ${aiSheetSubject}`,
        details: `AI Answer Sheet Checker awarded ${result.obtainedMarks}/100 in ${aiSheetSubject}.`,
      });
    } finally {
      setIsAiChecking(false);
    }
  };

  // --- STAGE 2 -> STAGE 3: SAVE MARKS & AUTO-CALCULATE CLASS & SCHOOL POSITIONS ---
  const handleSaveMarksAndGenerateDmc = () => {
    const st = students.find((s) => s.id === checkStudentId) || students[0];
    if (!st) return;

    const gradeLetter = (score: number) =>
      score >= 85 ? 'A+' : score >= 75 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';

    const subjects = [
      {
        subject: 'Mathematics',
        totalMarks: 100,
        obtainedMarks: mathMarks,
        grade: gradeLetter(mathMarks),
        remarks: mathMarks >= 85 ? 'Excellent problem-solving' : 'Satisfactory',
      },
      {
        subject: 'General Science',
        totalMarks: 100,
        obtainedMarks: scienceMarks,
        grade: gradeLetter(scienceMarks),
        remarks: scienceMarks >= 85 ? 'Strong scientific concepts' : 'Good effort',
      },
      {
        subject: 'English',
        totalMarks: 100,
        obtainedMarks: englishMarks,
        grade: gradeLetter(englishMarks),
        remarks: englishMarks >= 85 ? 'Fluent grammar & writing' : 'Satisfactory',
      },
      {
        subject: 'Urdu',
        totalMarks: 100,
        obtainedMarks: urduMarks,
        grade: gradeLetter(urduMarks),
        remarks: urduMarks >= 85 ? 'Neat Nastaliq & comprehension' : 'Good',
      },
      {
        subject: 'Computer Science',
        totalMarks: 100,
        obtainedMarks: computerMarks,
        grade: gradeLetter(computerMarks),
        remarks: computerMarks >= 85 ? 'Outstanding practical skills' : 'Good',
      },
    ];

    const totalMarks = 500;
    const obtainedMarks =
      mathMarks + scienceMarks + englishMarks + urduMarks + computerMarks;
    const percentage = Math.round((obtainedMarks / totalMarks) * 1000) / 10;
    const overallGrade = gradeLetter(percentage);

    const newRec: StudentExamRecord = {
      id: `ex-${Date.now()}`,
      studentId: st.id,
      grNo: st.grNo,
      studentName: st.name,
      grade: st.grade,
      examType: checkExamType,
      termLabel: `${checkExamType} Examination 2026`,
      date: new Date().toISOString().split('T')[0],
      subjects,
      totalMarks,
      obtainedMarks,
      percentage,
      overallGrade,
      checkedByMode: checkingMode,
      checkedByTeacher: actorName,
      aiPrincipalRemarks: `${st.name} secured ${percentage}% (${overallGrade}) in ${checkExamType} Exam. Checked via ${
        checkingMode === 'AI_ASSISTED' ? 'AI-Assisted Rubric Grader' : 'Manual Teacher Evaluation'
      } by ${actorName}.`,
    };

    const recalculated = recalculateAllExamPositions([newRec, ...examRecords]);
    setExamRecords(recalculated);

    const savedCard = recalculated.find((r) => r.id === newRec.id);
    appendAuditLog({
      actorName,
      actorRole,
      actionType: 'EXAM_MARKS_ENTRY',
      targetSummary: `${st.name} (GR #${st.grNo} · Class ${st.grade})`,
      details: `Entered ${checkExamType} marks (${obtainedMarks}/${totalMarks}, ${percentage}%, Grade ${overallGrade}). Auto-calculated Class Pos: ${savedCard?.positionInClass}, School Pos: ${savedCard?.overallSchoolPosition}.`,
    });

    setResultSaveToast(
      `✓ Result Card Generated for ${st.name} (GR #${st.grNo})! Class Position: ${savedCard?.positionInClass} • School Position: ${savedCard?.overallSchoolPosition}`
    );
    setTimeout(() => {
      setResultSaveToast('');
      setSubTab('exams');
    }, 1800);
  };

  // --- PRINT OFFICIAL RESULT CARD (DMC) WITH ORIGINAL LOGO, CLASS & SCHOOL POSITIONS ---
  const handlePrintResultCard = (rec: StudentExamRecord) => {
    const win = window.open('', '_blank', 'width=920,height=780');
    if (!win) return window.print();
    const logoUrl = `${window.location.origin}/vision-logo-crest.png`;
    win.document.write(`
      <html>
        <head>
          <title>Official Result Card - ${rec.studentName} (GR #${rec.grNo})</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a; padding: 24px; max-width: 840px; margin: 0 auto; }
            .card { border: 3px solid #1e3a8a; border-radius: 16px; padding: 24px; position: relative; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 14px; margin-bottom: 16px; }
            .header img { width: 84px; height: 84px; object-fit: contain; }
            .title-center { text-align: center; flex: 1; }
            .title-center h1 { margin: 0; font-size: 26px; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
            .title-center p { margin: 4px 0; font-size: 12px; font-weight: 600; color: #475569; }
            .badge { display: inline-block; background: #1e3a8a; color: white; padding: 4px 14px; border-radius: 99px; font-size: 12px; font-weight: bold; margin-top: 4px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
            th { background: #1e3a8a; color: white; text-align: left; padding: 10px; text-transform: uppercase; font-size: 11px; }
            td { border-bottom: 1px solid #cbd5e1; padding: 10px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
            .summary-box { border: 2px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center; background: #f8fafc; }
            .summary-box .lbl { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; }
            .summary-box .val { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 3px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 38px; padding-top: 12px; font-size: 12px; font-weight: bold; }
            .sig-line { border-top: 1px solid #334155; width: 180px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <img src="${logoUrl}" alt="Vision Grammar School Logo" />
              <div class="title-center">
                <h1>Vision Grammar School</h1>
                <p>Block 56, Near Comprehensive School, D.G. Khan</p>
                <span class="badge">OFFICIAL DETAILED MARKS CERTIFICATE (DMC) — ${rec.termLabel}</span>
              </div>
              <div style="text-align:right;font-size:12px;font-weight:bold;">
                <div>GR No: #${rec.grNo}</div>
                <div>Class: ${rec.grade}</div>
                <div>Date: ${rec.date}</div>
              </div>
            </div>

            <div class="info-grid">
              <div><strong>Student Name:</strong> ${rec.studentName}</div>
              <div><strong>GR Number:</strong> #${rec.grNo}</div>
              <div><strong>Class / Section:</strong> ${rec.grade}</div>
              <div><strong>Examination:</strong> ${rec.termLabel}</div>
              <div><strong>Issue Date:</strong> ${rec.date}</div>
              <div><strong>Checked Mode:</strong> ${rec.checkedByMode || 'TEACHER_VERIFIED'}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject</th>
                  <th>Total Marks</th>
                  <th>Obtained Marks</th>
                  <th>Grade</th>
                  <th>Teacher Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${rec.subjects
                  .map(
                    (s, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${s.subject}</strong></td>
                    <td>${s.totalMarks}</td>
                    <td><strong>${s.obtainedMarks}</strong></td>
                    <td><strong>${s.grade}</strong></td>
                    <td>${s.remarks}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="summary-grid">
              <div class="summary-box">
                <div class="lbl">Total Marks</div>
                <div class="val">${rec.obtainedMarks} / ${rec.totalMarks} (${rec.percentage}%)</div>
              </div>
              <div class="summary-box">
                <div class="lbl">Overall Grade</div>
                <div class="val" style="color:#059669;">Grade ${rec.overallGrade}</div>
              </div>
              <div class="summary-box">
                <div class="lbl">Class Position</div>
                <div class="val" style="color:#b45309;">🏆 ${rec.positionInClass || 'Calculated'}</div>
              </div>
              <div class="summary-box">
                <div class="lbl">Overall School Position</div>
                <div class="val" style="color:#1d4ed8;">🌟 ${rec.overallSchoolPosition || 'Calculated'}</div>
              </div>
            </div>

            <div style="font-size:12px;background:#f1f5f9;padding:10px;border-radius:8px;">
              <strong>Principal / Examiner Remarks:</strong> ${rec.aiPrincipalRemarks}
            </div>

            <div class="signatures">
              <div class="sig-line">Class Teacher (${rec.checkedByTeacher || actorName})</div>
              <div class="sig-line">Controller of Examinations</div>
              <div class="sig-line">Principal — Vision Grammar School</div>
            </div>
          </div>
          <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const markFeePaid = (feeId: string) => {
    const targetFee = feeRecords.find((f) => f.id === feeId);
    setFeeRecords((prev) =>
      prev.map((f) =>
        f.id === feeId
          ? {
              ...f,
              paidAmountPKR: f.totalDuePKR,
              balancePKR: 0,
              status: 'Paid',
              lastPaymentDate: new Date().toISOString().split('T')[0],
              receiptNo: `RCP-${Math.floor(10000 + Math.random() * 90000)}`,
            }
          : f
      )
    );
    if (targetFee) {
      appendAuditLog({
        actorName,
        actorRole,
        actionType: 'FEE_UPDATED',
        targetSummary: `${targetFee.studentName} (GR #${targetFee.grNo})`,
        details: `Marked ${targetFee.monthLabel} fee (Rs. ${targetFee.totalDuePKR.toLocaleString()}) as Paid.`,
      });
    }
  };

  return (
    <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 shadow-2xl space-y-6 text-cyber-100">
      {/* Official Vision Grammar School Branded Header & Lifecycle Sub-Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyber-700 pb-5">
        <div className="flex items-center gap-4">
          <img
            src="/vision-logo-crest.png"
            alt="Vision Grammar School Seal"
            className="w-14 h-14 object-contain drop-shadow-md shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-500/20 border border-cyber-500/40 text-cyber-400 text-[10px] font-mono uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Vision Grammar School · Complete Exam & Result Lifecycle
            </div>
            <h2 className="text-2xl font-bold text-white font-mono uppercase">
              Exam Papers, AI/Manual Answer Checking, Auto-Ranked DMCs & Fees
            </h2>
            <p className="text-xs text-cyber-400">
              1) Question Paper Prep & Print → 2) Manual or AI Answer Sheet Checking & Marks Entry → 3) Auto Class & School Position Result Cards!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('paper_prep')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
              subTab === 'paper_prep'
                ? 'bg-amber-500 text-black shadow-lg'
                : 'bg-cyber-950 border border-cyber-700 text-cyber-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 1. Question Papers & Print
          </button>
          <button
            onClick={() => setSubTab('sheet_check')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
              subTab === 'sheet_check'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-cyber-950 border border-cyber-700 text-cyber-300 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" /> 2. Check Sheets & Enter Marks
          </button>
          <button
            onClick={() => setSubTab('exams')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
              subTab === 'exams'
                ? 'bg-cyber-500 text-black shadow-neon'
                : 'bg-cyber-950 border border-cyber-700 text-cyber-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> 3. Result Cards (DMCs)
          </button>
          <button
            onClick={() => setSubTab('fees')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
              subTab === 'fees'
                ? 'bg-emerald-500 text-black shadow-lg'
                : 'bg-cyber-950 border border-cyber-700 text-cyber-300 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> 4. Fee Ledger (PKR)
          </button>
        </div>
      </div>

      {/* ===================================================================
          STAGE 1: QUESTION PAPER PREPARATION & PRINTING FOR EACH SUBJECT
          =================================================================== */}
      {subTab === 'paper_prep' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Paper Builder Form */}
          <div className="lg:col-span-5 bg-cyber-900/90 border border-cyber-700 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Prepare Subject Question Paper
            </h3>
            <p className="text-xs text-cyber-400">
              Select class, subject, and topics to prepare a formatted Vision Grammar School question paper ready for printing.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-cyber-400 mb-1">Class / Grade</label>
                <select
                  value={paperGrade}
                  onChange={(e) => setPaperGrade(e.target.value)}
                  className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {SCHOOL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-cyber-400 mb-1">Subject</label>
                <select
                  value={paperSubject}
                  onChange={(e) => setPaperSubject(e.target.value)}
                  className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {SCHOOL_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-cyber-400 mb-1">Exam Term</label>
                <select
                  value={paperExamType}
                  onChange={(e) => setPaperExamType(e.target.value as ExamPaperType)}
                  className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="Weekly">Weekly Test</option>
                  <option value="Monthly">Monthly Test</option>
                  <option value="MidTerm">Mid-Term Exam</option>
                  <option value="Annual">Annual Exam</option>
                </select>
              </div>
              <div>
                <label className="block text-cyber-400 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={paperTotalMarks}
                  onChange={(e) => setPaperTotalMarks(Number(e.target.value))}
                  className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-cyber-400 mb-1">Chapters / Topics Covered</label>
              <textarea
                rows={3}
                value={paperTopics}
                onChange={(e) => setPaperTopics(e.target.value)}
                className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-3 text-white"
                placeholder="Enter chapters or topics for MCQs, Short & Long Questions..."
              />
            </div>

            <button
              type="button"
              disabled={isGeneratingPaper}
              onClick={handleCreateQuestionPaper}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg"
            >
              {isGeneratingPaper ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparing Question Paper...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Prepare & Save Printable Question Paper
                </>
              )}
            </button>

            <div className="pt-3 border-t border-cyber-800 space-y-2">
              <div className="text-[11px] font-mono uppercase text-cyber-400">
                Saved Question Papers ({questionPapers.length})
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {questionPapers.map((qp) => (
                  <div
                    key={qp.id}
                    onClick={() => setSelectedPaperId(qp.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      activePaper?.id === qp.id
                        ? 'bg-cyber-800 border-amber-400 text-white'
                        : 'bg-cyber-950/70 border-cyber-800 text-cyber-300 hover:border-cyber-600'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{qp.title}</div>
                      <div className="text-[10px] text-cyber-400 font-mono">
                        Class {qp.grade} · {qp.totalMarks} Marks · Created by {qp.createdBy}
                      </div>
                    </div>
                    <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Formatted Printable Question Paper Preview */}
          <div className="lg:col-span-7 bg-white text-slate-900 rounded-2xl p-6 shadow-xl border-2 border-slate-300 space-y-4">
            {activePaper ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-blue-900 pb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/vision-logo-crest.png"
                      alt="Vision Grammar School"
                      className="w-14 h-14 object-contain"
                    />
                    <div>
                      <h3 className="text-xl font-black uppercase text-blue-950">
                        Vision Grammar School
                      </h3>
                      <p className="text-xs font-bold text-slate-600">
                        {activePaper.title} • Class {activePaper.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAnswerKeyOnPreview(!showAnswerKeyOnPreview)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />{' '}
                      {showAnswerKeyOnPreview ? 'Hide Rubric Key' : 'Show Rubric Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintQuestionPaper(activePaper, false)}
                      className="px-4 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Question Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintQuestionPaper(activePaper, true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print with Answer Key
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 bg-slate-100 p-2.5 rounded-xl text-xs font-bold text-slate-700">
                  <div>Class: {activePaper.grade}</div>
                  <div>Subject: {activePaper.subject}</div>
                  <div>Total Marks: {activePaper.totalMarks}</div>
                  <div>Time: {activePaper.durationMinutes} Mins</div>
                </div>

                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 text-xs">
                  <div>
                    <div className="bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold uppercase mb-2">
                      Section A — Objective MCQs
                    </div>
                    {activePaper.mcqs.map((m, idx) => (
                      <div key={idx} className="mb-3 pb-2 border-b border-slate-200">
                        <div className="font-bold text-slate-900">
                          Q1.{idx + 1}: {m.question}{' '}
                          <span className="text-blue-800">({m.marks} Marks)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-1 pl-3 text-slate-700">
                          {m.options.map((opt, oi) => (
                            <div key={oi}>
                              ({String.fromCharCode(97 + oi)}) {opt}
                            </div>
                          ))}
                        </div>
                        {showAnswerKeyOnPreview && (
                          <div className="mt-1 text-emerald-700 font-bold">
                            ✓ Correct Answer: {m.correctOption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold uppercase mb-2">
                      Section B — Short Answer Questions
                    </div>
                    {activePaper.shortQuestions.map((sq, idx) => (
                      <div key={idx} className="mb-2.5 pb-2 border-b border-slate-200">
                        <div className="font-bold text-slate-900">
                          Q2.{idx + 1}: {sq.question}{' '}
                          <span className="text-blue-800">({sq.marks} Marks)</span>
                        </div>
                        {showAnswerKeyOnPreview && (
                          <div className="mt-1 text-emerald-700 font-semibold">
                            ✓ Marking Rubric: {sq.answerKey}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="bg-blue-950 text-white px-3 py-1.5 rounded-lg font-bold uppercase mb-2">
                      Section C — Long / Descriptive Questions
                    </div>
                    {activePaper.longQuestions.map((lq, idx) => (
                      <div key={idx} className="mb-2.5">
                        <div className="font-bold text-slate-900">
                          Q3.{idx + 1}: {lq.question}{' '}
                          <span className="text-blue-800">({lq.marks} Marks)</span>
                        </div>
                        {showAnswerKeyOnPreview && (
                          <div className="mt-1 text-emerald-700 font-semibold">
                            ✓ Marking Rubric: {lq.answerKey}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ===================================================================
          STAGE 2: MANUAL OR AI-ASSISTED ANSWER SHEET CHECKING & MARKS ENTRY
          =================================================================== */}
      {subTab === 'sheet_check' && (
        <div className="space-y-6">
          {resultSaveToast && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{resultSaveToast}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 6 Cols: Manual vs AI-Assisted Answer Sheet Checking */}
            <div className="lg:col-span-6 bg-cyber-900/90 border border-cyber-700 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyber-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono">
                    Post-Exam Answer Sheet Checking
                  </h3>
                  <p className="text-xs text-cyber-400">
                    Check answer sheets manually OR use AI to assist with rubric grading
                  </p>
                </div>
                <div className="flex bg-cyber-950 p-1 rounded-xl border border-cyber-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setCheckingMode('MANUAL')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${
                      checkingMode === 'MANUAL'
                        ? 'bg-cyber-500 text-black'
                        : 'text-cyber-400 hover:text-white'
                    }`}
                  >
                    ✍️ Manual Check
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckingMode('AI_ASSISTED')}
                    className={`px-3 py-1.5 rounded-lg font-bold ${
                      checkingMode === 'AI_ASSISTED'
                        ? 'bg-purple-500 text-white'
                        : 'text-cyber-400 hover:text-white'
                    }`}
                  >
                    🤖 AI-Assisted Check
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-cyber-400 mb-1">Select Student</label>
                  <select
                    value={checkStudentId}
                    onChange={(e) => setCheckStudentId(e.target.value)}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (GR #{s.grNo} · {s.grade})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Exam Term</label>
                  <select
                    value={checkExamType}
                    onChange={(e) => setCheckExamType(e.target.value as ExamPaperType)}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    <option value="Weekly">Weekly Test</option>
                    <option value="Monthly">Monthly Test</option>
                    <option value="MidTerm">Mid-Term Exam</option>
                    <option value="Annual">Annual Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Subject Sheet</label>
                  <select
                    value={aiSheetSubject}
                    onChange={(e) => setAiSheetSubject(e.target.value)}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-bold"
                  >
                    {SCHOOL_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {checkingMode === 'AI_ASSISTED' ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-cyber-400 mb-1">
                      Question Paper Rubric / Expected Key
                    </label>
                    <textarea
                      rows={2}
                      value={aiSheetRubric}
                      onChange={(e) => setAiSheetRubric(e.target.value)}
                      className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-cyber-400 mb-1">
                      Student Answer Sheet Text / OCR Scan
                    </label>
                    <textarea
                      rows={3}
                      value={aiStudentWrittenText}
                      onChange={(e) => setAiStudentWrittenText(e.target.value)}
                      className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isAiChecking}
                    onClick={handleRunAiAnswerCheck}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl uppercase flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isAiChecking ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> AI Grading Answer Sheet...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" /> Check Answer Sheet with AI & Auto-Fill Marks
                      </>
                    )}
                  </button>

                  {aiCheckResult && (
                    <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-200">
                          AI Evaluation ({aiCheckResult.subject})
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500 text-black font-extrabold">
                          Awarded: {aiCheckResult.obtainedMarks} / {aiCheckResult.maxMarks}
                        </span>
                      </div>
                      <p className="text-cyber-200">{aiCheckResult.feedback}</p>
                      <div className="space-y-1 pt-1">
                        {aiCheckResult.questionBreakdown.map((qb) => (
                          <div
                            key={qb.qNo}
                            className="flex items-center justify-between text-[11px] bg-cyber-950/70 px-2.5 py-1.5 rounded-lg"
                          >
                            <span>
                              <strong>Q{qb.qNo}:</strong> {qb.remarks}
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {qb.awarded}/{qb.max}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-cyber-950 border border-cyber-800 text-xs text-cyber-300">
                  ✍️ <strong>Manual Checking Active:</strong> Check the physical paper answer sheets by hand and enter the subject-wise marks on the right panel. The system will automatically compute total marks, grade, Class Position, and Overall School Position.
                </div>
              )}
            </div>

            {/* Right 6 Cols: Subject Marks Entry & Auto-Position Result Card Generator */}
            <div className="lg:col-span-6 bg-cyber-900/90 border border-cyber-700 rounded-2xl p-5 space-y-4">
              <div className="border-b border-cyber-800 pb-3">
                <h3 className="text-base font-bold text-white uppercase font-mono flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" /> Enter Subject-Wise Marks & Auto-Rank
                </h3>
                <p className="text-xs text-cyber-400">
                  Class Position & Overall School Position are calculated automatically across all classes!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-cyber-400 mb-1">Mathematics (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={mathMarks}
                    onChange={(e) => setMathMarks(Number(e.target.value))}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">General Science (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scienceMarks}
                    onChange={(e) => setScienceMarks(Number(e.target.value))}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">English (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={englishMarks}
                    onChange={(e) => setEnglishMarks(Number(e.target.value))}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Urdu (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={urduMarks}
                    onChange={(e) => setUrduMarks(Number(e.target.value))}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Computer Science (/100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={computerMarks}
                    onChange={(e) => setComputerMarks(Number(e.target.value))}
                    className="w-full bg-cyber-950 border border-cyber-700 rounded-xl p-2.5 text-white font-mono font-bold text-base"
                  />
                </div>
                <div className="bg-cyber-950 border border-emerald-500/40 rounded-xl p-2.5 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-mono uppercase text-cyber-400">
                    Auto Total
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    {mathMarks + scienceMarks + englishMarks + urduMarks + computerMarks} / 500
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyber-950 border border-cyber-800 text-xs space-y-1 text-cyber-300">
                <div>
                  ✓ <strong>Original School Logo & Name:</strong> Vision Grammar School (`/vision-logo-crest.png`)
                </div>
                <div>
                  ✓ <strong>Auto-Calculated Positions:</strong> Class Position + Overall School Position
                </div>
                <div>
                  ✓ <strong>Principal Audit Log:</strong> Recorded under {actorName} ({actorRole})
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMarksAndGenerateDmc}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg"
              >
                <Award className="w-4 h-4" /> Save Marks, Auto-Calculate Positions & Generate Printable Result Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          STAGE 3: OFFICIAL RESULT CARDS (DMCs) WITH AUTO CLASS & SCHOOL POSITIONS
          =================================================================== */}
      {subTab === 'exams' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'Weekly', 'Monthly', 'MidTerm', 'Annual'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setExamFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase border transition-all ${
                    examFilter === t
                      ? 'bg-purple-500/20 border-purple-400 text-white font-bold'
                      : 'bg-cyber-900 border-cyber-700 text-cyber-400 hover:text-white'
                  }`}
                >
                  {t === 'ALL' ? 'All Exams' : `${t} Results`}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-64">
                <Search className="w-4 h-4 text-cyber-400 absolute left-3 top-2.5" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Student, GR No or Class..."
                  className="w-full bg-cyber-950 border border-cyber-600 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <button
                onClick={() => setSubTab('sheet_check')}
                className="px-4 py-2 bg-cyber-500 hover:bg-cyber-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Enter Marks / Check Sheets
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredExamRecords.map((rec) => {
              const isFlipped = !!flippedCardIds[rec.id];
              const studentFees = feeRecords.filter(
                (f) => f.studentId === rec.studentId || f.grNo === rec.grNo
              );
              return (
                <div
                  key={rec.id}
                  className={`dmc-3d-card bg-cyber-900/80 border border-cyber-700 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden ${
                    isFlipped ? 'is-flipped-3d' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-cyber-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src="/vision-logo-crest.png"
                        alt="Vision Grammar School"
                        className="w-12 h-12 object-contain shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {isFlipped ? 'Fee Ledger Backside' : `${rec.examType} DMC`}
                          </span>
                          <span className="text-xs font-mono text-cyber-300">
                            GR No: <strong className="text-white">#{rec.grNo}</strong>
                          </span>
                          <span className="text-xs font-mono text-cyber-400">
                            Date: {rec.date}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {rec.studentName}{' '}
                          <span className="text-xs text-cyber-400 font-normal">
                            (Class {rec.grade})
                          </span>
                        </h3>
                        <div className="text-xs text-cyber-400">
                          Vision Grammar School • {rec.termLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-emerald-400">
                        {rec.percentage}% ({rec.overallGrade})
                      </div>
                      <div className="text-xs text-cyber-200 font-mono">
                        Total: {rec.obtainedMarks} / {rec.totalMarks}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold">
                          🏆 Class Pos: {rec.positionInClass}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 border border-blue-400/40 text-[10px] font-mono text-blue-300 font-bold">
                          🌟 School Pos: {rec.overallSchoolPosition}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isFlipped ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-cyber-800 text-cyber-400 font-mono uppercase text-[10px]">
                            <th className="py-1.5">Subject</th>
                            <th className="py-1.5">Marks</th>
                            <th className="py-1.5">Grade</th>
                            <th className="py-1.5">Teacher Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-800/60">
                          {rec.subjects.map((sub, i) => (
                            <tr key={i}>
                              <td className="py-2 font-bold text-white">{sub.subject}</td>
                              <td className="py-2 text-cyber-200 font-mono">
                                {sub.obtainedMarks} / {sub.totalMarks}
                              </td>
                              <td className="py-2">
                                <span className="px-2 py-0.5 rounded bg-cyber-800 text-emerald-300 font-bold">
                                  {sub.grade}
                                </span>
                              </td>
                              <td className="py-2 text-cyber-400">{sub.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-3 py-2">
                      <div className="flex items-center justify-between text-xs font-bold text-cyber-400 uppercase">
                        <span>Fee Challan History ({rec.studentName})</span>
                        <span>GR #{rec.grNo}</span>
                      </div>
                      {studentFees.length === 0 ? (
                        <div className="p-4 rounded-xl bg-cyber-950 text-xs text-cyber-400">
                          No fee invoices found for this student.
                        </div>
                      ) : (
                        studentFees.map((f) => (
                          <div
                            key={f.id}
                            className="p-3 rounded-xl bg-cyber-950 border border-cyber-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <strong className="text-white">{f.monthLabel}</strong>
                              <div className="text-[11px] text-cyber-400">
                                Total: Rs. {f.totalDuePKR.toLocaleString()} · Paid: Rs.{' '}
                                {f.paidAmountPKR.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400">
                                Due: Rs. {f.balancePKR.toLocaleString()}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-cyber-800 text-[10px] font-bold">
                                {f.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-cyber-950/70 border border-cyber-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-cyber-200 flex-1 min-w-[180px]">
                      <strong className="text-cyber-400">Remarks: </strong>
                      {rec.aiPrincipalRemarks}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFlipCard(rec.id)}
                        className="px-3 py-1.5 bg-cyber-800 hover:bg-cyber-700 text-white rounded-lg text-xs font-bold"
                      >
                        ↻ {isFlipped ? 'View DMC' : 'Fee Challan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrintResultCard(rec)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs flex items-center gap-1 shadow"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Official Result Card
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          STAGE 4: STUDENT FEE LEDGER (PKR)
          =================================================================== */}
      {subTab === 'fees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-cyber-900/70 border border-cyber-700">
              <div className="text-[10px] font-mono uppercase text-cyber-400">
                Total Fee Records Shown
              </div>
              <div className="text-2xl font-bold text-white mt-1">
                {filteredFeeRecords.length} Students
              </div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-700/50">
              <div className="text-[10px] font-mono uppercase text-emerald-400">
                Total Collected (PKR)
              </div>
              <div className="text-2xl font-bold text-emerald-300 mt-1">
                Rs.{' '}
                {filteredFeeRecords
                  .reduce((sum, f) => sum + f.paidAmountPKR, 0)
                  .toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50">
              <div className="text-[10px] font-mono uppercase text-amber-400">
                Pending Dues (PKR)
              </div>
              <div className="text-2xl font-bold text-amber-300 mt-1">
                Rs.{' '}
                {filteredFeeRecords
                  .reduce((sum, f) => sum + f.balancePKR, 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-cyber-900/70 border border-cyber-700 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cyber-800 text-cyber-400 font-mono uppercase text-[10px] bg-cyber-950/60">
                  <th className="p-4">GR No / ID</th>
                  <th className="p-4">Student & Father Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Month</th>
                  <th className="p-4">Total Fee (PKR)</th>
                  <th className="p-4">Paid (PKR)</th>
                  <th className="p-4">Balance (PKR)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-800">
                {filteredFeeRecords.map((fee) => (
                  <tr key={fee.id} className="hover:bg-cyber-800/40">
                    <td className="p-4 font-mono font-bold text-cyber-400">#{fee.grNo}</td>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{fee.studentName}</div>
                      <div className="text-cyber-400 text-[11px]">S/D of {fee.fatherName}</div>
                    </td>
                    <td className="p-4 text-white">{fee.grade}</td>
                    <td className="p-4 text-cyber-300">{fee.monthLabel}</td>
                    <td className="p-4 font-mono text-white">
                      Rs. {fee.totalDuePKR.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-emerald-400">
                      Rs. {fee.paidAmountPKR.toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-amber-400 font-bold">
                      Rs. {fee.balancePKR.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          fee.status === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : fee.status === 'Partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {fee.status === 'Paid' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {fee.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {fee.status !== 'Paid' && (
                          <button
                            onClick={() => markFeePaid(fee.id)}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-[11px]"
                          >
                            Receive Fee
                          </button>
                        )}
                        <button
                          onClick={() => window.print()}
                          className="px-2.5 py-1 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 text-white rounded-lg text-[11px] flex items-center gap-1"
                        >
                          <FileSpreadsheet className="w-3 h-3" /> Voucher
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAndFeeManager;
