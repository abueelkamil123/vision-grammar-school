import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  StudentExamRecord,
  StudentFeeRecord,
  ExamPaperType,
} from '../types';
import {
  Award,
  Search,
  Printer,
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';

interface Props {
  students: Student[];
  examRecords: StudentExamRecord[];
  setExamRecords: React.Dispatch<React.SetStateAction<StudentExamRecord[]>>;
  feeRecords: StudentFeeRecord[];
  setFeeRecords: React.Dispatch<React.SetStateAction<StudentFeeRecord[]>>;
  externalSearchQuery?: string;
  externalMode?: 'exams' | 'fees';
}

const ExamAndFeeManager: React.FC<Props> = ({
  students,
  examRecords,
  setExamRecords,
  feeRecords,
  setFeeRecords,
  externalSearchQuery = '',
  externalMode,
}) => {
  const [subTab, setSubTab] = useState<'exams' | 'fees'>(externalMode || 'exams');
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery);
  const [examFilter, setExamFilter] = useState<'ALL' | ExamPaperType>('ALL');
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [flippedCardIds, setFlippedCardIds] = useState<Record<string, boolean>>({});

  const toggleFlipCard = (cardId: string) => {
    setFlippedCardIds((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  // Sync when Floating AI Assistant triggers a lookup
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

  // Filtered Exam Results
  const filteredExamRecords = useMemo(() => {
    return examRecords.filter((rec) => {
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
  }, [examRecords, searchQuery, examFilter]);

  // Filtered Fee Records
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

  // New Exam Record Form State
  const [newExamStudentId, setNewExamStudentId] = useState<string>(students[0]?.id || '');
  const [newExamType, setNewExamType] = useState<ExamPaperType>('MidTerm');
  const [newMathScore, setNewMathScore] = useState<number>(88);
  const [newScienceScore, setNewScienceScore] = useState<number>(84);
  const [newEnglishScore, setNewEnglishScore] = useState<number>(79);
  const [newUrduScore, setNewUrduScore] = useState<number>(91);

  const handleAddExamRecord = () => {
    const st = students.find((s) => s.id === newExamStudentId);
    if (!st) return;

    const subjects = [
      {
        subject: 'Mathematics',
        totalMarks: 100,
        obtainedMarks: newMathScore,
        grade: newMathScore >= 80 ? 'A+' : newMathScore >= 70 ? 'A' : 'B',
        remarks: 'Strong step-by-step problem solving',
      },
      {
        subject: 'General Science',
        totalMarks: 100,
        obtainedMarks: newScienceScore,
        grade: newScienceScore >= 80 ? 'A+' : newScienceScore >= 70 ? 'A' : 'B',
        remarks: 'Good conceptual grasp',
      },
      {
        subject: 'English',
        totalMarks: 100,
        obtainedMarks: newEnglishScore,
        grade: newEnglishScore >= 80 ? 'A+' : newEnglishScore >= 70 ? 'A' : 'B',
        remarks: 'Neat grammar & translation',
      },
      {
        subject: 'Urdu',
        totalMarks: 100,
        obtainedMarks: newUrduScore,
        grade: newUrduScore >= 80 ? 'A+' : newUrduScore >= 70 ? 'A' : 'B',
        remarks: 'Excellent Nastaliq handwriting',
      },
    ];

    const totalMarks = 400;
    const obtainedMarks = newMathScore + newScienceScore + newEnglishScore + newUrduScore;
    const percentage = Math.round((obtainedMarks / totalMarks) * 1000) / 10;
    const overallGrade =
      percentage >= 85 ? 'A+' : percentage >= 75 ? 'A' : percentage >= 65 ? 'B' : 'C';

    const newRec: StudentExamRecord = {
      id: Date.now().toString(),
      studentId: st.id,
      grNo: st.grNo,
      studentName: st.name,
      grade: st.grade,
      examType: newExamType,
      termLabel: `${newExamType} Examination 2026`,
      date: new Date().toISOString().split('T')[0],
      subjects,
      totalMarks,
      obtainedMarks,
      percentage,
      overallGrade,
      positionInClass: percentage >= 85 ? 'Top 3 Merit' : 'Promoted',
      aiPrincipalRemarks: `${st.name} achieved ${percentage}% (${overallGrade}) in ${newExamType} Exam. Keep up the great effort!`,
    };

    setExamRecords([newRec, ...examRecords]);
    setShowAddExamModal(false);
  };

  const markFeePaid = (feeId: string) => {
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
  };

  return (
    <div className="bg-cyber-800/50 backdrop-blur-xl p-6 rounded-2xl border border-cyber-700 shadow-2xl space-y-6 text-cyber-100">
      {/* Official Vision Grammar School Branded Header & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cyber-700 pb-5">
        <div className="flex items-center gap-4">
          <img
            src="/vision-logo-crest.png"
            alt="Vision Grammar School Seal"
            className="w-14 h-14 object-contain drop-shadow-md shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-500/20 border border-cyber-500/40 text-cyber-400 text-[10px] font-mono uppercase mb-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Vision Grammar School · Block 56, D.G. Khan
            </div>
            <h2 className="text-2xl font-bold text-white font-mono uppercase">
              Official Exam DMC & Fee Ledger (PKR)
            </h2>
            <p className="text-xs text-cyber-400">
              Search by Student Name, Student ID, or GR No (e.g., <strong>Akhtar Ali / 56432</strong> or{' '}
              <strong>Maria / 563</strong>) — or switch between DMC & Fee Challan on any card!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-cyber-400 absolute left-3.5 top-3" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, ID (56432) or GR (563)..."
              className="w-full bg-cyber-950 border border-cyber-600 focus:border-cyber-400 rounded-xl pl-10 pr-8 py-2.5 text-xs text-white outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-cyber-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex p-1 bg-cyber-950 border border-cyber-700 rounded-xl">
            <button
              onClick={() => setSubTab('exams')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
                subTab === 'exams'
                  ? 'bg-cyber-500 text-black shadow-neon'
                  : 'text-cyber-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" /> Exam & Test Results
            </button>
            <button
              onClick={() => setSubTab('fees')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase font-mono flex items-center gap-1.5 transition-all ${
                subTab === 'fees'
                  ? 'bg-emerald-500 text-black'
                  : 'text-cyber-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Fee Record (PKR)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Filter Chips for Demo Students */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-cyber-400 font-mono uppercase text-[10px]">Quick Jump:</span>
        <button
          onClick={() => {
            setSearchQuery('56432');
            setSubTab('exams');
          }}
          className="px-3 py-1 rounded-full bg-cyber-900 hover:bg-cyber-700 border border-cyber-600 text-cyber-200"
        >
          🎓 Akhtar Ali (ID: 56432 • Mid-Term & Annual Result)
        </button>
        <button
          onClick={() => {
            setSearchQuery('563');
            setSubTab('fees');
          }}
          className="px-3 py-1 rounded-full bg-cyber-900 hover:bg-cyber-700 border border-cyber-600 text-cyber-200"
        >
          💳 Maria (GR No: 563 • Fee Record)
        </button>
        <button
          onClick={() => setSearchQuery('')}
          className="px-3 py-1 rounded-full bg-cyber-950 hover:bg-cyber-800 border border-cyber-800 text-cyber-400"
        >
          Show All Students
        </button>
      </div>

      {/* SUB-TAB 1: EXAM & TEST RESULTS (WEEKLY, MONTHLY, MID-TERM, ANNUAL) */}
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

            <button
              onClick={() => setShowAddExamModal(!showAddExamModal)}
              className="px-4 py-2 bg-cyber-500 hover:bg-cyber-400 text-black font-bold rounded-xl text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Enter New Exam Result
            </button>
          </div>

          {showAddExamModal && (
            <div className="p-5 rounded-2xl bg-cyber-950 border border-cyber-600 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase font-mono">
                Add Weekly / Monthly / Mid-Term / Annual Result Card
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="block text-cyber-400 mb-1">Student</label>
                  <select
                    value={newExamStudentId}
                    onChange={(e) => setNewExamStudentId(e.target.value)}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (GR: {s.grNo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Exam Type</label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value as ExamPaperType)}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  >
                    <option value="Weekly">Weekly Test</option>
                    <option value="Monthly">Monthly Test</option>
                    <option value="MidTerm">Mid-Term Exam</option>
                    <option value="Annual">Annual Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Math (/100)</label>
                  <input
                    type="number"
                    value={newMathScore}
                    onChange={(e) => setNewMathScore(Number(e.target.value))}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Science (/100)</label>
                  <input
                    type="number"
                    value={newScienceScore}
                    onChange={(e) => setNewScienceScore(Number(e.target.value))}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">English (/100)</label>
                  <input
                    type="number"
                    value={newEnglishScore}
                    onChange={(e) => setNewEnglishScore(Number(e.target.value))}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-cyber-400 mb-1">Urdu (/100)</label>
                  <input
                    type="number"
                    value={newUrduScore}
                    onChange={(e) => setNewUrduScore(Number(e.target.value))}
                    className="w-full bg-cyber-900 border border-cyber-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 rounded-lg bg-cyber-800 text-xs text-cyber-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExamRecord}
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                >
                  Save Result Card
                </button>
              </div>
            </div>
          )}

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
                        className="w-11 h-11 object-contain shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {isFlipped ? 'Fee Ledger Backside' : `${rec.examType} DMC`}
                          </span>
                          <span className="text-xs font-mono text-cyber-400">
                            ID / GR No: <strong className="text-white">#{rec.grNo}</strong>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mt-1">
                          {rec.studentName}{' '}
                          <span className="text-xs text-cyber-400 font-normal">
                            (Class {rec.grade})
                          </span>
                        </h3>
                        <div className="text-xs text-cyber-400">
                          Vision Grammar School, Block 56, D.G. Khan • {rec.termLabel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">
                        {rec.percentage}% ({rec.overallGrade})
                      </div>
                      <div className="text-xs text-cyber-300">
                        {rec.obtainedMarks} / {rec.totalMarks} Marks
                      </div>
                      {rec.positionInClass && (
                        <div className="text-[10px] font-mono text-amber-400 uppercase mt-0.5">
                          🏆 {rec.positionInClass}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isFlipped ? (
                    <>
                      {/* FRONT: Subject-wise Marks Table */}
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
                                <td className="py-2 text-cyber-200">
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
                    </>
                  ) : (
                    /* BACKSIDE (3D FLIPPED): Student Fee Challan & Dues Ledger */
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
                              {f.status !== 'Paid' && (
                                <button
                                  onClick={() => markFeePaid(f.id)}
                                  className="px-2.5 py-1 bg-emerald-500 text-black font-bold rounded-lg text-[10px]"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-cyber-950/70 border border-cyber-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-cyber-200 flex-1 min-w-[180px]">
                      <strong className="text-cyber-400">Principal Remarks: </strong>
                      {rec.aiPrincipalRemarks}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleFlipCard(rec.id)}
                        className="px-3 py-1.5 bg-cyber-500 hover:bg-cyber-400 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        ↻ {isFlipped ? 'View Exam DMC' : 'View Fee Challan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1.5 bg-cyber-800 hover:bg-cyber-700 border border-cyber-600 rounded-lg text-xs text-white flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print DMC
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STUDENT FEE LEDGER (PKR) */}
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
