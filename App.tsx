import React, { useState, useEffect } from 'react';
import { Landing, WorkspaceShell, Dashboard, Role, Page } from './components/ModernWorkspace';
import {
  Student,
  AttendanceData,
  DailyRecord,
  Holiday,
  StudentExamRecord,
  StudentFeeRecord,
  AssistantActionCommand,
} from './types';
import StudentManager from './components/StudentManager';
import AttendanceTaker from './components/AttendanceTaker';
import Reports from './components/Reports';
import TutorModule from './components/TutorModule';
import ExamAndFeeManager from './components/ExamAndFeeManager';
import FloatingAiAssistant from './components/FloatingAiAssistant';
import { fetchFromNeonDb, saveKeyToNeonDb } from './services/neonDbService';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  X,
  Plus,
  Brain,
  Download,
  Award,
} from 'lucide-react';

const createStudentAvatar = (initials: string, bgHex: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" rx="28" fill="${bgHex}"/>
      <circle cx="80" cy="58" r="28" fill="rgba(255,255,255,0.22)"/>
      <path d="M32 142c8-28 28-42 48-42s40 14 48 42" fill="rgba(255,255,255,0.22)"/>
      <text x="80" y="92" font-family="Arial, sans-serif" font-size="38" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
    </svg>`
  )}`;

const INITIAL_STUDENTS: Student[] = [
  {
    id: '56432',
    grNo: '56432',
    rfidCardNo: '0005643210',
    name: 'Akhtar Ali',
    fatherName: 'Ghulam Mustafa',
    parentPhone: '+923001234567',
    parentEmail: 'ghulam.mustafa@example.com',
    gender: 'Male',
    dob: '2012-03-14',
    grade: '8-A',
    photoUrl: createStudentAvatar('AA', '#002366'),
  },
  {
    id: '563',
    grNo: '563',
    rfidCardNo: '0000563102',
    name: 'Maria Bibi',
    fatherName: 'Tariq Mehmood',
    parentPhone: '+923017654321',
    parentEmail: 'tariq.mehmood@example.com',
    gender: 'Female',
    dob: '2011-07-22',
    grade: '9-A',
    photoUrl: createStudentAvatar('MB', '#0f766e'),
  },
  {
    id: '1001',
    grNo: '1001',
    rfidCardNo: '0010018842',
    name: 'Hamza Baloch',
    fatherName: 'Sardar Khan',
    parentPhone: '+923335550101',
    parentEmail: 'sardar.khan@example.com',
    gender: 'Male',
    dob: '2010-05-15',
    grade: '10-A',
    photoUrl: createStudentAvatar('HB', '#1e3a8a'),
  },
  {
    id: '1002',
    grNo: '1002',
    rfidCardNo: '0010029915',
    name: 'Ayesha Laghari',
    fatherName: 'Farooq Ahmed',
    parentPhone: '+923215550102',
    parentEmail: 'farooq.ahmed@example.com',
    gender: 'Female',
    dob: '2010-08-20',
    grade: '10-A',
    photoUrl: createStudentAvatar('AL', '#6d28d9'),
  },
];

const INITIAL_EXAM_RECORDS: StudentExamRecord[] = [
  {
    id: 'ex-56432-annual',
    studentId: '56432',
    grNo: '56432',
    studentName: 'Akhtar Ali',
    grade: '8-A',
    examType: 'Annual',
    termLabel: 'Annual Final Examination 2026',
    date: '2026-10-15',
    subjects: [
      {
        subject: 'Mathematics',
        totalMarks: 100,
        obtainedMarks: 92,
        grade: 'A+',
        remarks: 'Outstanding algebra & geometry steps',
      },
      {
        subject: 'General Science (Ch: Light & Optics)',
        totalMarks: 100,
        obtainedMarks: 88,
        grade: 'A+',
        remarks: 'Clear diagram & conceptual clarity',
      },
      {
        subject: 'English',
        totalMarks: 100,
        obtainedMarks: 84,
        grade: 'A',
        remarks: 'Strong tenses and translation',
      },
      {
        subject: 'Urdu',
        totalMarks: 100,
        obtainedMarks: 91,
        grade: 'A+',
        remarks: 'Excellent Nastaliq handwriting',
      },
    ],
    totalMarks: 400,
    obtainedMarks: 355,
    percentage: 88.8,
    overallGrade: 'A+',
    positionInClass: '1st Position in Class 8-A',
    aiPrincipalRemarks:
      'MashaAllah! Akhtar Ali (ID: 56432) secured 1st Position in Annual Exam with 88.8% (A+) and excelled in Mathematics & Science.',
  },
  {
    id: 'ex-56432-mid',
    studentId: '56432',
    grNo: '56432',
    studentName: 'Akhtar Ali',
    grade: '8-A',
    examType: 'MidTerm',
    termLabel: 'Mid-Term (Half Course Ch 1–10) Exam 2026',
    date: '2026-06-10',
    subjects: [
      {
        subject: 'Mathematics (Ch 1–10)',
        totalMarks: 100,
        obtainedMarks: 89,
        grade: 'A+',
        remarks: 'Very strong in Fractions & Equations',
      },
      {
        subject: 'General Science',
        totalMarks: 100,
        obtainedMarks: 85,
        grade: 'A+',
        remarks: 'Well-prepared lab concepts',
      },
      {
        subject: 'English',
        totalMarks: 100,
        obtainedMarks: 80,
        grade: 'A',
        remarks: 'Good comprehension',
      },
      {
        subject: 'Urdu',
        totalMarks: 100,
        obtainedMarks: 88,
        grade: 'A+',
        remarks: 'Neat presentation',
      },
    ],
    totalMarks: 400,
    obtainedMarks: 342,
    percentage: 85.5,
    overallGrade: 'A+',
    positionInClass: '2nd Position in Class 8-A',
    aiPrincipalRemarks:
      'Consistent A+ performance in Mid-Term Exam. Improved further in the Annual Exam!',
  },
  {
    id: 'ex-563-mid',
    studentId: '563',
    grNo: '563',
    studentName: 'Maria Bibi',
    grade: '9-A',
    examType: 'MidTerm',
    termLabel: 'Mid-Term BISE DG Khan Pattern Exam 2026',
    date: '2026-09-20',
    subjects: [
      {
        subject: 'Biology / Science',
        totalMarks: 100,
        obtainedMarks: 94,
        grade: 'A+',
        remarks: 'Top score in Photosynthesis & Cell Biology',
      },
      {
        subject: 'Mathematics',
        totalMarks: 100,
        obtainedMarks: 86,
        grade: 'A+',
        remarks: 'Accurate quadratic formula steps',
      },
      {
        subject: 'English',
        totalMarks: 100,
        obtainedMarks: 90,
        grade: 'A+',
        remarks: 'Excellent grammar & essay writing',
      },
      {
        subject: 'Urdu',
        totalMarks: 100,
        obtainedMarks: 92,
        grade: 'A+',
        remarks: 'Exemplary Tashreeh',
      },
    ],
    totalMarks: 400,
    obtainedMarks: 362,
    percentage: 90.5,
    overallGrade: 'A+',
    positionInClass: '1st Position in Class 9-A',
    aiPrincipalRemarks:
      'Maria Bibi (GR No: 563) is an exceptional student with 90.5% overall in Class 9-A.',
  },
];

const INITIAL_FEE_RECORDS: StudentFeeRecord[] = [
  {
    id: 'fee-563-oct',
    studentId: '563',
    grNo: '563',
    studentName: 'Maria Bibi',
    fatherName: 'Tariq Mehmood',
    grade: '9-A',
    monthLabel: 'October 2026',
    tuitionFeePKR: 3500,
    examFeePKR: 500,
    totalDuePKR: 4000,
    paidAmountPKR: 4000,
    balancePKR: 0,
    status: 'Paid',
    dueDate: '2026-10-10',
    lastPaymentDate: '2026-10-05',
    receiptNo: 'RCP-88563',
  },
  {
    id: 'fee-563-nov',
    studentId: '563',
    grNo: '563',
    studentName: 'Maria Bibi',
    fatherName: 'Tariq Mehmood',
    grade: '9-A',
    monthLabel: 'November 2026',
    tuitionFeePKR: 3500,
    examFeePKR: 0,
    totalDuePKR: 3500,
    paidAmountPKR: 2000,
    balancePKR: 1500,
    status: 'Partial',
    dueDate: '2026-11-10',
    lastPaymentDate: '2026-10-20',
    receiptNo: 'RCP-89563',
  },
  {
    id: 'fee-56432-oct',
    studentId: '56432',
    grNo: '56432',
    studentName: 'Akhtar Ali',
    fatherName: 'Ghulam Mustafa',
    grade: '8-A',
    monthLabel: 'October 2026',
    tuitionFeePKR: 3000,
    examFeePKR: 500,
    totalDuePKR: 3500,
    paidAmountPKR: 3500,
    balancePKR: 0,
    status: 'Paid',
    dueDate: '2026-10-10',
    lastPaymentDate: '2026-10-04',
    receiptNo: 'RCP-56432',
  },
  {
    id: 'fee-1001-oct',
    studentId: '1001',
    grNo: '1001',
    studentName: 'Hamza Baloch',
    fatherName: 'Sardar Khan',
    grade: '10-A',
    monthLabel: 'October 2026',
    tuitionFeePKR: 4000,
    examFeePKR: 500,
    totalDuePKR: 4500,
    paidAmountPKR: 0,
    balancePKR: 4500,
    status: 'Pending',
    dueDate: '2026-10-10',
  },
];

const App: React.FC = () => {
  const isRfidDirectLink =
    typeof window !== 'undefined' &&
    window.location.search.toLowerCase().includes('rfid');
  const [currentUser, setCurrentUser] = useState<Role>('Admin');
  const [showLanding, setShowLanding] = useState(!isRfidDirectLink);
  const [selectedStudentId, setSelectedStudentId] = useState('56432');
  const familyView = currentUser === 'Parent' || currentUser === 'Student';

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students_v2');
    if (saved) {
      const parsed: Student[] = JSON.parse(saved).map((s: Student) => {
        const defaultMatch = INITIAL_STUDENTS.find(
          (d) => d.grNo === s.grNo || d.id === s.id
        );
        return {
          ...s,
          rfidCardNo: s.rfidCardNo || defaultMatch?.rfidCardNo || `000${s.grNo}`,
          parentEmail: s.parentEmail || defaultMatch?.parentEmail,
          photoUrl: s.photoUrl || defaultMatch?.photoUrl,
        };
      });
      const existingIds = new Set(parsed.map((s) => s.grNo));
      const missingDefaults = INITIAL_STUDENTS.filter((d) => !existingIds.has(d.grNo));
      return [...missingDefaults, ...parsed];
    }
    return INITIAL_STUDENTS;
  });

  const [attendanceData, setAttendanceData] = useState<AttendanceData>(() => {
    const saved = localStorage.getItem('attendanceData');
    return saved ? JSON.parse(saved) : {};
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('holidays');
    return saved ? JSON.parse(saved) : [];
  });

  const [examRecords, setExamRecords] = useState<StudentExamRecord[]>(() => {
    const saved = localStorage.getItem('school_exam_records');
    return saved ? JSON.parse(saved) : INITIAL_EXAM_RECORDS;
  });

  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>(() => {
    const saved = localStorage.getItem('school_fee_records');
    return saved ? JSON.parse(saved) : INITIAL_FEE_RECORDS;
  });

  const [activeTab, setActiveTab] = useState<Page>(
    isRfidDirectLink ? 'attendance' : 'dashboard'
  );
  const [recordsSearchQuery, setRecordsSearchQuery] = useState<string>('');
  const [recordsSubMode, setRecordsSubMode] = useState<'exams' | 'fees'>('exams');
  const [pendingTutorCommand, setPendingTutorCommand] =
    useState<AssistantActionCommand | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  // Hydrate from Neon Serverless Postgres (/api/db) when hosted on Vercel
  useEffect(() => {
    let mounted = true;
    fetchFromNeonDb().then(({ connected, data }) => {
      if (!mounted || !connected) return;
      if (Array.isArray(data.students) && data.students.length > 0) {
        setStudents(data.students);
      }
      if (data.attendanceData && typeof data.attendanceData === 'object') {
        setAttendanceData(data.attendanceData);
      }
      if (Array.isArray(data.examRecords) && data.examRecords.length > 0) {
        setExamRecords(data.examRecords);
      }
      if (Array.isArray(data.feeRecords) && data.feeRecords.length > 0) {
        setFeeRecords(data.feeRecords);
      }
      if (Array.isArray(data.holidays)) {
        setHolidays(data.holidays);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('students_v2', JSON.stringify(students));
    saveKeyToNeonDb('students', students);
  }, [students]);
  useEffect(() => {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    saveKeyToNeonDb('attendanceData', attendanceData);
  }, [attendanceData]);
  useEffect(() => {
    localStorage.setItem('holidays', JSON.stringify(holidays));
    saveKeyToNeonDb('holidays', holidays);
  }, [holidays]);
  useEffect(() => {
    localStorage.setItem('school_exam_records', JSON.stringify(examRecords));
    saveKeyToNeonDb('examRecords', examRecords);
  }, [examRecords]);
  useEffect(() => {
    localStorage.setItem('school_fee_records', JSON.stringify(feeRecords));
    saveKeyToNeonDb('feeRecords', feeRecords);
  }, [feeRecords]);

  // Execute commands dispatched by FloatingAiAssistant
  const handleExecuteAssistantCommand = (cmd: AssistantActionCommand) => {
    if (cmd.studentQuery) {
      const q = cmd.studentQuery.toLowerCase().trim();
      const matched = students.find(
        (s) =>
          s.id.toLowerCase() === q ||
          s.grNo.toLowerCase() === q ||
          s.name.toLowerCase().includes(q)
      );
      if (matched) {
        setSelectedStudentId(matched.id);
      }
    }

    if (cmd.actionType === 'LOOKUP_EXAM_RESULT') {
      if (familyView) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('records');
        setRecordsSubMode('exams');
        setRecordsSearchQuery(cmd.studentQuery || '');
      }
      return;
    }
    if (cmd.actionType === 'LOOKUP_FEE_RECORD') {
      if (familyView) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('records');
        setRecordsSubMode('fees');
        setRecordsSearchQuery(cmd.studentQuery || '');
      }
      return;
    }
    if (
      cmd.actionType === 'GENERATE_EXAM_PAPER' ||
      cmd.actionType === 'GENERATE_MONTHLY_PLAN' ||
      cmd.actionType === 'GENERATE_LESSON_PLAN'
    ) {
      setActiveTab('tutor');
      setPendingTutorCommand({ ...cmd });
      return;
    }
    if (cmd.targetTab) {
      if (familyView && cmd.targetTab !== 'tutor' && cmd.targetTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }
      setActiveTab(cmd.targetTab);
      if (cmd.targetTab === 'tutor' && cmd.tutorView) {
        setPendingTutorCommand({ ...cmd });
      }
    }
  };

  const addHoliday = () => {
    if (newHolidayDate && newHolidayName) {
      setHolidays([...holidays, { date: newHolidayDate, name: newHolidayName }]);
      setNewHolidayDate('');
      setNewHolidayName('');
    }
  };

  const removeHoliday = (date: string) => {
    setHolidays(holidays.filter((h) => h.date !== date));
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'GR No',
      'RFID Serial',
      'Class',
      'Student Name',
      'Status',
      'Gate State',
      'Check-in Time (IN)',
      'Check-out Time (OUT)',
      'Method',
    ];
    const rows: string[] = [];
    students.forEach((s) => {
      const records = attendanceData[s.id] || {};
      Object.entries(records).forEach(([date, r]) => {
        const record = r as DailyRecord;
        rows.push(
          `${date},${s.grNo},${s.rfidCardNo || '-'},${s.grade},"${s.name}",${record.status},${
            record.attendanceState || '-'
          },${record.checkInTime || '-'},${record.checkOutTime || '-'},${
            record.method || '-'
          }`
        );
      });
    });
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `vision_grammar_school_export_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openTool = (view: AssistantActionCommand['tutorView']) => {
    setPendingTutorCommand({
      id: crypto.randomUUID(),
      actionType: 'NAVIGATE_TAB',
      targetTab: 'tutor',
      tutorView: view,
      summaryText: 'Open learning tool',
    });
    setActiveTab('tutor');
  };
  const changeRole = (role: Role) => {
    setCurrentUser(role);
    setActiveTab('dashboard');
    setPendingTutorCommand(null);
  };
  if (showLanding)
    return (
      <Landing
        onEnter={(role) => {
          changeRole(role);
          setShowLanding(false);
        }}
        onOpenRfidGate={() => {
          setCurrentUser('Admin');
          setActiveTab('attendance');
          setShowLanding(false);
        }}
      />
    );
  return (
    <div className="classguard-app">
      <WorkspaceShell
        role={currentUser}
        setRole={changeRole}
        page={activeTab}
        navigate={(page) => {
          setPendingTutorCommand(null);
          setActiveTab(page);
        }}
        onHome={() => setShowLanding(true)}
        onSettings={() => setShowSettings(true)}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            role={currentUser}
            students={students}
            attendance={attendanceData}
            exams={examRecords}
            fees={feeRecords}
            navigate={setActiveTab}
            openTool={openTool}
            selectedId={selectedStudentId}
            setSelectedId={setSelectedStudentId}
            onHome={() => setShowLanding(true)}
          />
        )}
        <div className="legacy-module">
          {!familyView && activeTab === 'attendance' && (
            <AttendanceTaker
              students={students}
              setStudents={setStudents}
              attendanceData={attendanceData}
              setAttendanceData={setAttendanceData}
              holidays={holidays}
            />
          )}
          {!familyView && activeTab === 'students' && (
            <StudentManager students={students} setStudents={setStudents} />
          )}
          {!familyView && activeTab === 'records' && (
            <ExamAndFeeManager
              students={students}
              examRecords={examRecords}
              setExamRecords={setExamRecords}
              feeRecords={feeRecords}
              setFeeRecords={setFeeRecords}
              externalSearchQuery={recordsSearchQuery}
              externalMode={recordsSubMode}
            />
          )}
          {!familyView && activeTab === 'reports' && (
            <Reports students={students} attendanceData={attendanceData} />
          )}
          {activeTab === 'tutor' && (
            <TutorModule
              students={
                familyView ? students.filter((s) => s.id === selectedStudentId) : students
              }
              attendanceData={attendanceData}
              externalCommand={pendingTutorCommand}
            />
          )}
        </div>
      </WorkspaceShell>

      {/* AKGFlow-Style Floating Voice & Text AI Assistant */}
      {!showSettings && (
        <FloatingAiAssistant
          key={currentUser}
          initialRole={currentUser === 'Principal' ? 'Admin' : currentUser}
          activeTab={activeTab}
          students={students}
          examRecords={examRecords}
          feeRecords={feeRecords}
          onExecuteCommand={handleExecuteAssistantCommand}
        />
      )}

      {showSettings && (
        <div role="dialog" aria-modal="true" aria-label="School settings" onKeyDown={e => {
          if (e.key === 'Escape') setShowSettings(false);
          if (e.key === 'Tab') {
            const items = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not([disabled]), input, select, textarea, a[href]'));
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
          }
        }} className="legacy-module fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in">
          <div className="bg-cyber-900 border border-cyber-600 rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-cyber-800 flex justify-between items-center bg-cyber-900/50">
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-widest">
                System Configuration
              </h2>
              <button
                aria-label="Close school settings"
                autoFocus
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-cyber-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-cyber-500" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto">
              <div>
                <h3 className="text-xs font-mono text-cyber-400 uppercase mb-4 tracking-widest border-l-2 border-cyber-500 pl-3">
                  Data Operations
                </h3>
                <button
                  onClick={exportToCSV}
                  className="w-full py-4 bg-cyber-800 hover:bg-cyber-700 border border-cyber-700 rounded-xl text-white text-sm font-bold font-mono uppercase flex items-center justify-center gap-3 transition-all"
                >
                  <Download className="w-4 h-4 text-cyber-500" /> Export Attendance Database (CSV)
                </button>
              </div>

              <div>
                <h3 className="text-xs font-mono text-cyber-400 uppercase mb-4 tracking-widest border-l-2 border-cyber-500 pl-3">
                  Academic Calendar
                </h3>
                <div className="flex gap-2 mb-4">
                  <input
                    aria-label="Holiday date"
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="bg-cyber-950 border border-cyber-700 rounded-xl px-4 py-3 text-white text-xs font-mono flex-[2] focus:border-cyber-500 outline-none"
                  />
                  <input
                    type="text"
                    aria-label="Holiday name"
                    placeholder="Holiday Name"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="bg-cyber-950 border border-cyber-700 rounded-xl px-4 py-3 text-white text-xs flex-[3] focus:border-cyber-500 outline-none"
                  />
                  <button
                    aria-label="Add holiday"
                    onClick={addHoliday}
                    className="bg-cyber-500 px-4 rounded-xl text-black hover:bg-cyber-400 transition-colors shadow-neon"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-cyber-950/50 rounded-xl border border-cyber-800 max-h-48 overflow-y-auto divide-y divide-cyber-900">
                  {holidays.length === 0 ? (
                    <div className="p-8 text-center text-xs text-cyber-600 font-mono italic">
                      No custom holidays configured.
                    </div>
                  ) : (
                    holidays.map((h, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 hover:bg-cyber-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Calendar className="w-4 h-4 text-cyber-500" />
                          <div>
                            <div className="text-sm text-white font-mono">{h.date}</div>
                            <div className="text-[10px] text-cyber-500 uppercase">
                              {h.name}
                            </div>
                          </div>
                        </div>
                        <button
                          aria-label={`Remove ${h.name}`}
                          onClick={() => removeHoliday(h.date)}
                          className="p-2 text-cyber-700 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[9px] text-cyber-600 mt-3 font-mono text-center uppercase tracking-widest">
                  * Sundays are system-locked as holidays.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
