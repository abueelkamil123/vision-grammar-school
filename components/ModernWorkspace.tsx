import React, { useState, useRef } from 'react';
import {
  motion,
  MotionConfig,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  CalendarCheck,
  ChartColumn,
  BookOpen,
  Wallet,
  Settings,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  Home,
  Globe2,
  Mic,
  Layers,
  CheckCircle2,
  MapPin,
  Award,
  Key,
  ClipboardCheck,
  ClipboardList,
  Copy,
  Check,
  Server,
  ExternalLink,
  Camera,
  PenTool,
  FileText,
  Printer,
  MessageSquare,
  Flame,
  Star,
  Compass,
  Bell,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  Student,
  AttendanceData,
  StudentExamRecord,
  StudentFeeRecord,
  AssistantActionCommand,
} from '../types';
import {
  DynamicMultiLandingPage,
  DualThemeToggleBar,
  AdminPrincipalThemeStudio,
} from './ThemeAndLandingStudio';

export type Role = 'Admin' | 'Principal' | 'Teacher' | 'Parent' | 'Student';
export type Page =
  | 'dashboard'
  | 'attendance'
  | 'students'
  | 'records'
  | 'reports'
  | 'tutor';

export const roles: Role[] = ['Admin', 'Principal', 'Teacher', 'Parent', 'Student'];

const roleMeta: Record<
  Role,
  {
    badge: string;
    title: string;
    subtitle: string;
    accentClass: string;
  }
> = {
  Admin: {
    badge: '🛡️ SYSTEM & API SUPERADMIN',
    title: 'Admin Command, APIs & Website Control Hub',
    subtitle:
      'Manage Gemini AI keys, WhatsApp/SMS gateways, external school websites, BISE D.G. Khan portal sync, and campus fee recovery.',
    accentClass: 'role-theme-admin',
  },
  Principal: {
    badge: '🏛️ EXECUTIVE ACADEMIC AUDIT',
    title: 'Principal Executive Oversight & Merit Command',
    subtitle:
      'Audit 24-day teacher syllabus completion, inspect daily teacher mawaad quality, and review top merit scholars across Vision Grammar School.',
    accentClass: 'role-theme-principal',
  },
  Teacher: {
    badge: '👩‍🏫 CLASSROOM & MAWAAD WORKBENCH',
    title: 'Teacher Daily Classroom, Mawaad & Exam Studio',
    subtitle:
      'Your daily 40-minute teaching script (Kitna, Kya, Kaise Parhana Hai), 1-click board notes, biometric attendance, and exam paper generator.',
    accentClass: 'role-theme-teacher',
  },
  Parent: {
    badge: '👨‍👩‍👧 WALIDAIN FAMILY PORTAL',
    title: 'Parent Portal — Child Attendance, DMC & Fee Ledger',
    subtitle:
      'Live daily attendance check-in, official Mid-Term & Annual DMC result cards, fee challan status, and direct teacher WhatsApp contact.',
    accentClass: 'role-theme-parent',
  },
  Student: {
    badge: '🎓 SMART STUDENT STUDY PORTAL',
    title: 'Student Smart Learning Hub & AI Ustad',
    subtitle:
      'Practice BISE D.G. Khan MCQs, revise interactive flashcards, run home science experiments, and ask your Socratic AI Ustad in Urdu, Saraiki & English.',
    accentClass: 'role-theme-student',
  },
};

const navigationByRole: Record<
  Role,
  Array<{
    id: Page;
    name: string;
    short: string;
    clipBadge: string;
    icon: typeof LayoutDashboard;
  }>
> = {
  Admin: [
    { id: 'dashboard', name: 'Admin & API Hub', short: 'Admin', clipBadge: '⚙️ API', icon: ShieldCheck },
    { id: 'attendance', name: 'RFID Gate & AI Attend', short: 'RFID/AI', clipBadge: '🪪 IN/OUT', icon: CalendarCheck },
    { id: 'students', name: 'Students & RFID Cards', short: 'Roster', clipBadge: '📋 ID', icon: Users },
    { id: 'records', name: 'Fee Ledger & DMC', short: 'Fees/DMC', clipBadge: '💳 PKR', icon: Wallet },
    { id: 'reports', name: 'Campus Analytics', short: 'Reports', clipBadge: '📊 CSV', icon: ChartColumn },
    { id: 'tutor', name: 'AI System Engine', short: 'AI Engine', clipBadge: '✨ AI', icon: Sparkles },
  ],
  Principal: [
    { id: 'dashboard', name: 'Executive Audit', short: 'Audit', clipBadge: '🏛️ KPI', icon: Award },
    { id: 'records', name: 'DMC & Merit Results', short: 'Merit', clipBadge: '🏆 DMC', icon: Wallet },
    { id: 'reports', name: 'Attendance & Insights', short: 'Insights', clipBadge: '📈 View', icon: ChartColumn },
    { id: 'students', name: 'Student Directory', short: 'Students', clipBadge: '📋 List', icon: Users },
    { id: 'tutor', name: '24-Day Syllabus Audit', short: 'Syllabus', clipBadge: '🗓️ Plan', icon: Sparkles },
  ],
  Teacher: [
    { id: 'dashboard', name: 'Teacher Workbench', short: 'Desk', clipBadge: '📋 Desk', icon: BookOpen },
    { id: 'attendance', name: 'RFID & AI Roll Call', short: 'Roll Call', clipBadge: '🪪 IN/OUT', icon: CalendarCheck },
    { id: 'tutor', name: 'Mawaad & Exam Maker', short: 'AI Mawaad', clipBadge: '📝 Make', icon: Sparkles },
    { id: 'records', name: 'Enter Student Marks', short: 'Marks', clipBadge: '🏅 DMC', icon: Award },
    { id: 'students', name: 'My Class Roster', short: 'Class', clipBadge: '👥 List', icon: Users },
  ],
  Parent: [
    { id: 'dashboard', name: 'Child Progress & Fee', short: 'My Child', clipBadge: '📋 DMC', icon: Users },
    { id: 'tutor', name: 'Home AI Study Helper', short: 'AI Coach', clipBadge: '🧠 Help', icon: Sparkles },
  ],
  Student: [
    { id: 'dashboard', name: 'My Study Dashboard', short: 'My Study', clipBadge: '🔥 XP', icon: GraduationCap },
    { id: 'tutor', name: 'AI Ustad, Quiz & Lab', short: 'AI Ustad', clipBadge: '🚀 Learn', icon: Sparkles },
  ],
};

/**
 * Interactive Tilt & Cursor Spotlight Card
 */
export const Tilt3DCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  asButton?: boolean;
  intensity?: number;
}> = ({ children, className = '', onClick, asButton = false, intensity = 9 }) => {
  const ref = useRef<HTMLDivElement | HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 300,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 300,
    damping: 24,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    x.set(px - 0.5);
    y.set(py - 0.5);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    spotX.set(50);
    spotY.set(50);
  };

  const spotlightBg = useTransform(
    [spotX, spotY],
    ([sx, sy]) =>
      `radial-gradient(280px circle at ${sx}% ${sy}%, rgba(245, 176, 20, 0.22), rgba(0, 35, 102, 0.06) 50%, transparent 80%)`
  );

  const Component = asButton ? motion.button : motion.div;

  return (
    <Component
      ref={ref as any}
      type={asButton ? 'button' : undefined}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.035, y: -6 }}
      whileTap={{ scale: 0.97, y: 2 }}
      transition={{ type: 'spring', stiffness: 340, damping: 24 }}
      className={`tilt-3d-surface ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className="tilt-3d-spotlight"
        style={{ background: spotlightBg }}
      />
      <div className="tilt-3d-inner">{children}</div>
    </Component>
  );
};

/**
 * Tactile Button with Mini School Logo + Action Chip
 */
export const LogoClipButton: React.FC<{
  label: string;
  sublabel?: string;
  clipText?: string;
  variant?: 'navy' | 'gold' | 'emerald' | 'white' | 'indigo';
  icon?: React.ReactNode;
  useSchoolSeal?: boolean;
  onClick?: () => void;
  className?: string;
}> = ({
  label,
  sublabel,
  clipText = '📋 Action',
  variant = 'navy',
  icon,
  useSchoolSeal = false,
  onClick,
  className = '',
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.055, y: -4 }}
      whileTap={{ scale: 0.96, y: 3 }}
      onClick={onClick}
      className={`logo-clip-btn variant-${variant} ${className}`}
    >
      <span className="btn-mini-logo-box">
        {useSchoolSeal ? (
          <img src="/vision-logo-crest.png" alt="" className="btn-mini-seal-img" />
        ) : (
          icon || <ClipboardCheck size={17} />
        )}
      </span>
      <span className="btn-label-stack">
        <strong>{label}</strong>
        {sublabel && <small>{sublabel}</small>}
      </span>
      <span className="btn-clipboard-chip">{clipText}</span>
    </motion.button>
  );
};

export function SchoolScene() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), {
    stiffness: 220,
    damping: 22,
  });

  return (
    <motion.div
      className="school-scene"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
    >
      <div className="floating-note note-one">
        <CheckCircle2 size={20} />
        <span>
          Vision Grammar School
          <small>Block 56, D.G. Khan · Learn • Grow • Succeed</small>
        </span>
      </div>

      <motion.div
        whileHover={{ scale: 1.06, rotateZ: -2 }}
        className="floating-crest-card"
      >
        <img
          src="/vision-logo-crest.png"
          alt="Vision Grammar School Crest Block 56 D.G. Khan"
          className="floating-crest-img"
        />
      </motion.div>

      <div className="scene-platform">
        <div className="school-building">
          <div className="school-roof">
            <img
              src="/vision-logo-crest.png"
              alt="Vision Grammar School Seal"
              className="scene-seal-img"
            />
          </div>
          <div className="school-windows">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <div className="school-door" />
        </div>
        <div className="scene-tree tree-one" />
        <div className="scene-tree tree-two" />
      </div>

      <div className="floating-note note-two">
        <Sparkles size={18} />
        <span>
          Attendance · 24-Day Syllabus · Exams · DMC & Fee
          <small>Complete Digital Campus & Academic Functions</small>
        </span>
      </div>
    </motion.div>
  );
}

export function Landing({
  onEnter,
  onOpenRfidGate,
}: {
  onEnter: (role: Role) => void;
  onOpenRfidGate?: () => void;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <DynamicMultiLandingPage
        onEnter={onEnter}
        onOpenRfidGate={onOpenRfidGate}
        defaultHeroScene={<SchoolScene />}
      />
    </MotionConfig>
  );
}

interface ShellProps {
  role: Role;
  setRole: (r: Role) => void;
  page: Page;
  navigate: (p: Page) => void;
  onHome: () => void;
  onSettings: () => void;
  children: React.ReactNode;
}

export function WorkspaceShell({
  role,
  setRole,
  page,
  navigate,
  onHome,
  onSettings,
  children,
}: ShellProps) {
  const [menu, setMenu] = useState(false);
  const visibleNav = navigationByRole[role];

  return (
    <MotionConfig reducedMotion="user">
      <div className={`workspace ${roleMeta[role].accentClass}`}>
        <a className="skip-link" href="#workspace-main">
          Skip to content
        </a>
        {menu && (
          <button
            className="sidebar-scrim"
            aria-label="Close navigation"
            onClick={() => setMenu(false)}
          />
        )}

        {/* Role-Specific 3D Sidebar */}
        <aside className={'sidebar ' + (menu ? 'is-open' : '')}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="brand sidebar-brand"
            onClick={onHome}
          >
            <span className="brand-logo-wrap">
              <img
                src="/vision-logo-crest.png"
                alt="Vision Grammar School Seal"
                className="brand-logo-img"
              />
            </span>
            <div className="brand-text-stack">
              <strong>
                VISION <span>GRAMMAR</span>
              </strong>
              <small>BLOCK 56, D.G. KHAN</small>
            </div>
          </motion.button>

          <motion.div whileHover={{ scale: 1.03, y: -2 }} className="school-label">
            <img
              src="/vision-logo-crest.png"
              alt="Vision Grammar School Crest"
              className="sidebar-crest-img"
            />
            <div>
              <strong>{role} Portal Access</strong>
              <small>Learn • Grow • Succeed</small>
            </div>
          </motion.div>

          <span className="nav-caption">{role.toUpperCase()} CONTROLS</span>
          <nav aria-label="Main navigation">
            {visibleNav.map((n) => (
              <motion.button
                key={n.id}
                whileHover={{ x: 5, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                aria-current={page === n.id ? 'page' : undefined}
                className={page === n.id ? 'nav-item active' : 'nav-item'}
                onClick={() => {
                  navigate(n.id);
                  setMenu(false);
                }}
              >
                <n.icon size={18} />
                <span>{n.name}</span>
                <span className="ai-badge">{n.clipBadge}</span>
              </motion.button>
            ))}
          </nav>

          {/* Role-Specific Sidebar Promo Card */}
          <div className="sidebar-promo">
            <div className="sidebar-promo-head">
              <img
                src="/vision-logo-crest.png"
                alt=""
                className="sidebar-promo-seal"
              />
              <span className="sidebar-promo-tag">{role} AI</span>
            </div>
            <strong>
              {role === 'Admin'
                ? 'API & Gateway Status: Live'
                : role === 'Teacher'
                ? '1-Click Daily Mawaad'
                : role === 'Parent'
                ? 'Ask Voice AI for DMC/Fee'
                : role === 'Student'
                ? 'Ask Socratic AI Ustad'
                : '24-Day Academic Audit'}
            </strong>
            <p>
              {role === 'Admin'
                ? 'Gemini AI, Biometric Vision & WhatsApp hooks ready.'
                : role === 'Teacher'
                ? 'Generate board notes, scripts & exam papers.'
                : role === 'Parent'
                ? 'Check Akhtar Ali (#56432) or Maria (#563) records.'
                : 'Learn in English, Urdu, Saraiki & Balochi.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                navigate(role === 'Admin' ? 'dashboard' : 'tutor');
                setMenu(false);
              }}
            >
              <span>
                {role === 'Admin' ? '📋 Manage APIs' : '📋 Launch AI Studio'}
              </span>
              <ArrowUpRight size={15} />
            </motion.button>
          </div>

          <div className="sidebar-bottom">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="nav-item"
              onClick={onHome}
            >
              <Home size={18} />
              <span>Switch Portal Home</span>
            </motion.button>
            {(role === 'Admin' || role === 'Principal') && (
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className="nav-item"
                onClick={onSettings}
              >
                <Settings size={18} />
                <span>System & Holiday Config</span>
              </motion.button>
            )}
            <div className="local-label">
              <span className="status-dot" /> {role} Access · Block 56, D.G. Khan
            </div>
          </div>
        </aside>

        <div className="workspace-body">
          {/* Sticky 3D Glass Header + Quick Role Switcher Bar */}
          <header className="workspace-header">
            <div className="breadcrumb">
              <motion.button
                whileTap={{ scale: 0.92 }}
                className="icon-button mobile-toggle"
                aria-label="Open navigation"
                onClick={() => setMenu(!menu)}
              >
                {menu ? <X /> : <Menu />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={onHome}
                className="header-school-chip"
                title="Vision Grammar School Home"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School"
                  className="header-chip-logo"
                />
                <div className="header-chip-text">
                  <strong>Vision Grammar School</strong>
                  <small>Block 56, D.G. Khan · {role} Portal</small>
                </div>
              </motion.button>
            </div>

            {/* Interactive 3D Role Switcher Pills in Header */}
            <div className="header-role-pills" role="tablist" aria-label="Switch dashboard role">
              {roles.map((r) => {
                const active = role === r;
                return (
                  <motion.button
                    key={r}
                    type="button"
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setRole(r)}
                    className={`header-role-pill ${active ? 'active' : ''}`}
                  >
                    <span className="role-pill-dot" />
                    <span>{r}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="header-right">
              <DualThemeToggleBar />
              <span className="header-date">
                {new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  timeZone: 'Asia/Karachi',
                })}
              </span>
              <label className="role-switch">
                <span className="avatar">{role.slice(0, 1)}</span>
                <span>
                  <small>Portal Access</small>
                  <select
                    aria-label="Workspace role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r} Dashboard
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            </div>
          </header>

          <main id="workspace-main" className="workspace-main">
            {children}
          </main>

          {/* Official Vision Grammar School Workspace Footer */}
          <footer className="workspace-footer">
            <div className="workspace-footer-brand">
              <img
                src="/vision-logo-crest.png"
                alt="Vision Grammar School Seal"
                className="ws-footer-logo"
              />
              <img
                src="/vision-logo-crest.png"
                alt="Vision Grammar School Crest"
                className="ws-footer-crest"
              />
              <div>
                <strong>VISION GRAMMAR SCHOOL — BLOCK 56, D.G. KHAN</strong>
                <span>
                  Learn • Grow • Succeed · Active Portal: <strong>{role} Dashboard</strong>
                </span>
              </div>
            </div>
            <div className="workspace-footer-links">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={role === r ? 'active-footer-role' : ''}
                >
                  {r} View
                </button>
              ))}
            </div>
          </footer>

          {/* Mobile-Friendly Fixed 3D Bottom Navigation Bar */}
          <nav className="mobile-bottom-dock" aria-label="Mobile quick navigation">
            {visibleNav.map((n) => {
              const isActive = page === n.id;
              const isAi = n.id === 'tutor';
              return (
                <motion.button
                  key={n.id}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(n.id)}
                  className={`mobile-dock-btn ${isActive ? 'active' : ''} ${
                    isAi ? 'ai-center-btn' : ''
                  }`}
                >
                  <span className="mobile-dock-icon">
                    <n.icon size={isAi ? 20 : 18} />
                  </span>
                  <small>{n.short}</small>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </MotionConfig>
  );
}

interface DashboardProps {
  role: Role;
  students: Student[];
  attendance: AttendanceData;
  exams: StudentExamRecord[];
  fees: StudentFeeRecord[];
  navigate: (p: Page) => void;
  openTool: (view: AssistantActionCommand['tutorView']) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  onHome?: () => void;
}

export function Dashboard({
  role,
  students,
  attendance,
  exams,
  fees,
  navigate,
  openTool,
  selectedId,
  setSelectedId,
  onHome,
}: DashboardProps) {
  const [copiedNotice, setCopiedNotice] = useState<string>('');

  // Admin state: API keys, gateways & external website controls
  const [geminiKey, setGeminiKey] = useState<string>(
    () => localStorage.getItem('custom_gemini_api_key') || ''
  );
  const [whatsappWebhook, setWhatsappWebhook] = useState<string>(
    () =>
      localStorage.getItem('vision_whatsapp_webhook') ||
      'https://api.visiongrammarschool.edu.pk/whatsapp/send'
  );
  const [adminToggles, setAdminToggles] = useState({
    geminiAi: true,
    whatsappAlerts: true,
    biseDgKhanSync: true,
    onlineAdmissions: true,
    onlineFeeGateway: true,
    parentPortalLive: true,
  });

  // Teacher state: selected class & subject for daily mawaad preview
  const [teacherClass, setTeacherClass] = useState<string>('8-A');
  const [teacherSubject, setTeacherSubject] = useState<string>('Mathematics');

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedNotice(label);
    setTimeout(() => setCopiedNotice(''), 2600);
  };

  const saveAdminApiKey = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', geminiKey.trim());
    }
    localStorage.setItem('vision_whatsapp_webhook', whatsappWebhook.trim());
    copyToClipboard(geminiKey || 'Configured', 'API Keys & Gateways Saved!');
  };

  const totalFeesCollected = fees.reduce((s, f) => s + f.paidAmountPKR, 0);
  const totalFeesPending = fees.reduce((s, f) => s + f.balancePKR, 0);
  const avgExamScore = exams.length
    ? exams.reduce((s, e) => s + e.percentage, 0) / exams.length
    : 88.5;

  const selectedStudent =
    students.find((s) => s.id === selectedId) || students[0];
  const studentExams = exams.filter(
    (e) => e.studentId === selectedStudent?.id || e.grNo === selectedStudent?.grNo
  );
  const studentFees = fees.filter(
    (f) => f.studentId === selectedStudent?.id || f.grNo === selectedStudent?.grNo
  );

  return (
    <div className="role-dashboard-wrapper">
      {/* Floating Clipboard Toast Notification */}
      {copiedNotice && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="clipboard-toast"
        >
          <Check size={16} />
          <span>{copiedNotice}</span>
        </motion.div>
      )}

      {/* Top Role Header */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">{roleMeta[role].badge}</span>
          <h1>{roleMeta[role].title}</h1>
          <p>{roleMeta[role].subtitle}</p>
        </div>

        {(role === 'Parent' || role === 'Student') && (
          <label className="filter-label">
            <span>📋 Select Learner Profile</span>
            <select
              value={selectedStudent?.id || ''}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · Class {s.grade} (ID #{s.grNo})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* =====================================================================
          1. ADMIN DASHBOARD (APIs, Websites, Gateways & Campus Command)
          ===================================================================== */}
      {role === 'Admin' && (
        <div className="space-y-6">
          <section className="welcome-banner banner-admin">
            <div>
              <span className="banner-kicker">
                <Server size={15} /> SUPERADMIN INFRASTRUCTURE · APIS · EXTERNAL WEBSITES
              </span>
              <h2>System Control Center — Vision Grammar School, Block 56</h2>
              <p>
                Configure your Google Gemini AI keys, WhatsApp parent broadcast APIs,
                external school websites, online admission portals, and campus-wide fee
                recovery from one command deck.
              </p>
              <div className="banner-btn-group">
                <LogoClipButton
                  label="Fee Ledger & DMC Records"
                  sublabel="Verify Challans & Results"
                  clipText="💳 Open PKR"
                  variant="gold"
                  useSchoolSeal
                  onClick={() => navigate('records')}
                />
                <LogoClipButton
                  label="Live RFID Gate & GSM SMS"
                  sublabel="USB Card IN/OUT + AI Photo + Mobile SMS"
                  clipText="🪪 Gate Live"
                  variant="white"
                  icon={<Camera size={17} />}
                  onClick={() => navigate('attendance')}
                />
                <LogoClipButton
                  label="Copy School Portal Link"
                  sublabel="visiongrammarschool.edu.pk"
                  clipText="📋 Copy URL"
                  variant="navy"
                  icon={<Copy size={16} />}
                  onClick={() =>
                    copyToClipboard(
                      'https://visiongrammarschool.edu.pk/portal',
                      'Copied School Portal URL to Clipboard!'
                    )
                  }
                />
              </div>
            </div>
            <div className="banner-art" aria-hidden="true">
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 12 }}
                className="banner-crest-showcase"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Crest"
                  className="banner-crest-img"
                />
              </motion.div>
              <div className="art-orbit" />
            </div>
          </section>

          {/* Admin-Exclusive Metric Highlights */}
          <div className="metric-grid">
            <Tilt3DCard className="metric-card admin-metric" intensity={10}>
              <div className="metric-top">
                <span>Active API & AI Gateways</span>
                <span className="metric-icon mint">
                  <Key size={19} />
                </span>
              </div>
              <strong>6 / 6 Online</strong>
              <small>Gemini AI · Vision · WhatsApp · BISE Sync</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card admin-metric" intensity={10}>
              <div className="metric-top">
                <span>Total Fee Collected (PKR)</span>
                <span className="metric-icon blue">
                  <Wallet size={19} />
                </span>
              </div>
              <strong>Rs {totalFeesCollected.toLocaleString()}</strong>
              <small>Verified across issued challans</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card admin-metric" intensity={10}>
              <div className="metric-top">
                <span>Pending Fee Recovery</span>
                <span className="metric-icon peach">
                  <Bell size={19} />
                </span>
              </div>
              <strong>Rs {totalFeesPending.toLocaleString()}</strong>
              <small>WhatsApp auto-reminders active</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card admin-metric" intensity={10}>
              <div className="metric-top">
                <span>Connected School Websites</span>
                <span className="metric-icon purple">
                  <Globe2 size={19} />
                </span>
              </div>
              <strong>4 Portals</strong>
              <small>Main Web · BISE · Parent App · Fee Pay</small>
            </Tilt3DCard>
          </div>

          {/* Admin API Configuration & External Websites Grid */}
          <div className="chart-grid">
            <Tilt3DCard className="dashboard-card" intensity={4}>
              <div className="card-heading">
                <div>
                  <h2>🔑 API Keys & AI Engine Configuration (Admin Only)</h2>
                  <p>Set Google Gemini API key, WhatsApp Cloud Webhook & system switches</p>
                </div>
                <span className="soft-badge">Encrypted Local Config</span>
              </div>

              <div className="admin-api-form">
                <label className="admin-field">
                  <span>Google Gemini AI API Key (`gemini-3-flash` / `pro`)</span>
                  <div className="admin-input-row">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy... (Paste Gemini API Key here)"
                    />
                    <button
                      type="button"
                      className="clip-mini-btn"
                      onClick={() =>
                        copyToClipboard(
                          geminiKey || 'AIzaSy-DemoKey',
                          'Gemini API Key Copied to Clipboard!'
                        )
                      }
                    >
                      📋 Copy
                    </button>
                  </div>
                </label>

                <label className="admin-field">
                  <span>WhatsApp Parent Broadcast & SMS Gateway Webhook</span>
                  <div className="admin-input-row">
                    <input
                      type="text"
                      value={whatsappWebhook}
                      onChange={(e) => setWhatsappWebhook(e.target.value)}
                    />
                    <button
                      type="button"
                      className="clip-mini-btn"
                      onClick={() =>
                        copyToClipboard(
                          whatsappWebhook,
                          'Webhook URL Copied to Clipboard!'
                        )
                      }
                    >
                      📋 Copy
                    </button>
                  </div>
                </label>

                <div className="admin-toggle-grid">
                  {[
                    ['geminiAi', 'Gemini AI Lesson & Exam Engine'],
                    ['whatsappAlerts', 'WhatsApp Auto-Absent & Fee SMS'],
                    ['biseDgKhanSync', 'BISE D.G. Khan Board Pattern Sync'],
                    ['onlineFeeGateway', '1-Link / JazzCash / EasyPaisa Fee API'],
                  ].map(([key, label]) => {
                    const enabled =
                      adminToggles[key as keyof typeof adminToggles];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setAdminToggles((prev) => ({
                            ...prev,
                            [key]: !prev[key as keyof typeof adminToggles],
                          }))
                        }
                        className={`admin-switch-pill ${enabled ? 'on' : 'off'}`}
                      >
                        <span className="switch-dot" />
                        <span>{label}</span>
                        <strong>{enabled ? 'ON' : 'OFF'}</strong>
                      </button>
                    );
                  })}
                </div>

                <div className="admin-save-row">
                  <LogoClipButton
                    label="Save API Keys & Gateway Settings"
                    clipText="📋 Save Config"
                    variant="navy"
                    useSchoolSeal
                    onClick={saveAdminApiKey}
                  />
                </div>
              </div>
            </Tilt3DCard>

            <Tilt3DCard className="dashboard-card" intensity={4}>
              <div className="card-heading">
                <div>
                  <h2>🌐 External Websites & Portal Controls</h2>
                  <p>Control connected websites, admissions & BISE D.G. Khan portals</p>
                </div>
                <span className="soft-badge">4 Websites Linked</span>
              </div>

              <div className="website-control-list">
                {[
                  {
                    name: 'Vision Grammar School Main Website',
                    url: 'https://visiongrammarschool.edu.pk',
                    status: 'Live · Admissions Open',
                    clip: '📋 Copy Site',
                  },
                  {
                    name: 'BISE D.G. Khan Board Enrolment Portal',
                    url: 'https://bisedgkhan.edu.pk',
                    status: 'Synced · 9th/10th Registration',
                    clip: '🏛️ Board Link',
                  },
                  {
                    name: 'Parent Online DMC & Fee Voucher Portal',
                    url: 'https://portal.visiongrammarschool.edu.pk',
                    status: 'Active · Instant DMC Lookup',
                    clip: '📋 Copy Portal',
                  },
                  {
                    name: 'Digital Textbook & PCTB Syllabus Cloud',
                    url: 'https://pctb.punjab.gov.pk',
                    status: 'Connected · Class 1–10 Books',
                    clip: '📚 PCTB Link',
                  },
                ].map((site) => (
                  <div key={site.name} className="website-control-item">
                    <div className="website-info">
                      <img
                        src="/vision-logo-crest.png"
                        alt=""
                        className="website-mini-seal"
                      />
                      <div>
                        <strong>{site.name}</strong>
                        <small>
                          {site.url} · <em>{site.status}</em>
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="clip-mini-btn"
                      onClick={() =>
                        copyToClipboard(site.url, `Copied ${site.name} URL!`)
                      }
                    >
                      {site.clip}
                    </button>
                  </div>
                ))}
              </div>
            </Tilt3DCard>
          </div>

          {/* Admin Multi-Theme & Multi-Landing-Page Studio */}
          <AdminPrincipalThemeStudio role="Admin" onPreviewLanding={onHome} />
        </div>
      )}

      {/* =====================================================================
          2. TEACHER DASHBOARD (Daily Classroom Workbench, Mawaad & Exam Maker)
          ===================================================================== */}
      {role === 'Teacher' && (
        <div className="space-y-6">
          <section className="welcome-banner banner-teacher">
            <div>
              <span className="banner-kicker">
                <BookOpen size={15} /> TEACHER WORKBENCH · DAILY MAWAAD · EXAM GENERATOR
              </span>
              <h2>Assalam-o-Alaikum, Respected Teacher — Ready for Today’s Class!</h2>
              <p>
                Select your class & subject below to view today’s 40-minute teaching script
                (<em>Kitna, Kya, Kaise Parhana Hai</em>), generate board notes (Mawaad), or
                build a Weekly / Monthly / Mid-Term / Annual Exam Paper in 1 click.
              </p>
              <div className="banner-btn-group">
                <LogoClipButton
                  label="Generate Today's Teacher Mawaad"
                  sublabel="Board Layout + Word-for-Word Script"
                  clipText="📋 Mawaad"
                  variant="gold"
                  useSchoolSeal
                  onClick={() => openTool('system_agent')}
                />
                <LogoClipButton
                  label="Create Exam / Test Paper"
                  sublabel="Weekly, Monthly, Mid-Term, Annual"
                  clipText="📝 Exam AI"
                  variant="white"
                  icon={<FileText size={17} />}
                  onClick={() => openTool('system_agent')}
                />
                <LogoClipButton
                  label="Take Biometric Attendance"
                  sublabel="1-Click Classroom Photo Scan"
                  clipText="📸 Roll Call"
                  variant="navy"
                  icon={<Camera size={17} />}
                  onClick={() => navigate('attendance')}
                />
              </div>
            </div>
            <div className="banner-art" aria-hidden="true">
              <motion.div
                whileHover={{ scale: 1.1, rotateY: -12 }}
                className="banner-crest-showcase"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Seal"
                  className="banner-crest-img"
                />
              </motion.div>
              <div className="art-orbit" />
            </div>
          </section>

          {/* Teacher's Live Today's Lesson & Mawaad Script Card */}
          <Tilt3DCard className="dashboard-card teacher-chalkboard-card" intensity={4}>
            <div className="card-heading">
              <div>
                <h2>📋 Today’s 40-Minute Classroom Teaching Plan (Beaconhouse / Allied Standard)</h2>
                <p>
                  Tells you exact pages (Kitna), core concept (Kya), and methodology with
                  Saraiki/Urdu bridge (Kaise)
                </p>
              </div>
              <div className="teacher-selectors">
                <select
                  value={teacherClass}
                  onChange={(e) => setTeacherClass(e.target.value)}
                >
                  <option value="8-A">Class 8-A</option>
                  <option value="9-A">Class 9-A</option>
                  <option value="10-A">Class 10-A</option>
                </select>
                <select
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="General Science">General Science (Ch: Light)</option>
                  <option value="English">English Grammar & Translation</option>
                  <option value="Urdu">Urdu (نثر و نظم)</option>
                </select>
              </div>
            </div>

            <div className="teacher-plan-columns">
              <div className="teacher-plan-box">
                <span className="plan-pill">1. KITNA PARHANA HAI (TARGET)</span>
                <h4>
                  {teacherSubject === 'Mathematics'
                    ? 'Chapter 2: Linear & Quadratic Equations (Pages 24–27, Ex 2.1 Q1–Q5)'
                    : teacherSubject === 'General Science'
                    ? 'Chapter: Light, Reflection & Refraction (Pages 68–71 + Ray Diagram)'
                    : 'Unit 4: Past Indefinite & Continuous Tenses (Pages 32–35)'}
                </h4>
                <p>Complete 3 solved board examples + check 5 student notebooks in class.</p>
              </div>

              <div className="teacher-plan-box">
                <span className="plan-pill gold">2. KYA PARHANA HAI (CONCEPT)</span>
                <h4>Core Student Learning Outcome (SLO)</h4>
                <p>
                  Students will understand the step-by-step logic instead of rote
                  memorization (Ratta) and solve 3 BISE D.G. Khan board-pattern questions
                  independently.
                </p>
              </div>

              <div className="teacher-plan-box">
                <span className="plan-pill emerald">3. KAISE PARHANA HAI + MOTHER-TONGUE BRIDGE</span>
                <h4>10m Warm-up · 20m Board Explanation · 10m Oral Check</h4>
                <p>
                  Explain the core rule in Urdu & English, then connect it with a local
                  D.G. Khan / Saraiki everyday life analogy so every student grasps it.
                </p>
              </div>
            </div>

            <div className="teacher-plan-actions">
              <LogoClipButton
                label={`Copy ${teacherClass} ${teacherSubject} Board Script`}
                clipText="📋 Copy Script"
                variant="navy"
                icon={<Copy size={16} />}
                onClick={() =>
                  copyToClipboard(
                    `Vision Grammar School (${teacherClass} - ${teacherSubject}): Kitna/Kya/Kaise Parhana Hai script ready.`,
                    'Copied Today’s Teacher Script to Clipboard!'
                  )
                }
              />
              <LogoClipButton
                label="Open Full 24-Day Monthly Planner"
                clipText="🗓️ 24-Day Plan"
                variant="gold"
                useSchoolSeal
                onClick={() => openTool('system_agent')}
              />
            </div>
          </Tilt3DCard>

          {/* Teacher's 6 Specialized Workbench Tools with Mini Logos & Clipboards */}
          <div className="section-heading">
            <h2>👩‍🏫 Teacher’s 6 Classroom AI Tools (With Mini Logos & Clipboards)</h2>
            <span>Everything a teacher needs in one place</span>
          </div>

          <div className="quick-grid">
            <LogoClipButton
              label="24-Day Monthly Syllabus Planner"
              sublabel="Date-wise & day-wise plan for your book"
              clipText="🗓️ Planner"
              variant="navy"
              useSchoolSeal
              onClick={() => openTool('system_agent')}
            />
            <LogoClipButton
              label="Weekly / Monthly / Annual Exam Maker"
              sublabel="Section A (MCQs), B (Short), C (Long) + Key"
              clipText="📝 Exam AI"
              variant="gold"
              icon={<FileText size={18} />}
              onClick={() => openTool('system_agent')}
            />
            <LogoClipButton
              label="Lesson Plan & Multigrade Split"
              sublabel="Single-teacher 2-group classroom routine"
              clipText="📋 Lesson"
              variant="emerald"
              icon={<Layers size={18} />}
              onClick={() => openTool('hub')}
            />
            <LogoClipButton
              label="Grade Handwritten Homework"
              sublabel="Camera Math step-checker & Urdu/English"
              clipText="📸 Grader"
              variant="indigo"
              icon={<Camera size={18} />}
              onClick={() => openTool('assessment')}
            />
            <LogoClipButton
              label="Harvest & Flood Catch-Up Pack"
              sublabel="15-min study sheet + WhatsApp to parent"
              clipText="🌾 Catch-Up"
              variant="navy"
              icon={<Compass size={18} />}
              onClick={() => openTool('catchup')}
            />
            <LogoClipButton
              label="Enter Student Exam Marks (DMC)"
              sublabel="Record Weekly, Mid-Term & Annual scores"
              clipText="🏅 Marks"
              variant="gold"
              useSchoolSeal
              onClick={() => navigate('records')}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PARENT DASHBOARD (Walidain Family Portal — Child DMC, Fee & Diary)
          ===================================================================== */}
      {role === 'Parent' && selectedStudent && (
        <div className="space-y-6">
          <section className="welcome-banner banner-parent">
            <div>
              <span className="banner-kicker">
                <Users size={15} /> WALIDAIN (PARENT) PORTAL · VISION GRAMMAR SCHOOL
              </span>
              <h2>
                Child Progress Report: {selectedStudent.name} (Class{' '}
                {selectedStudent.grade} · ID #{selectedStudent.grNo})
              </h2>
              <p>
                S/D of <strong>{selectedStudent.fatherName}</strong> · View live school
                attendance check-in, official Mid-Term & Annual DMC marks, fee challan
                status, and daily homework diary.
              </p>
              <div className="banner-btn-group">
                <LogoClipButton
                  label="Print Official DMC Result Card"
                  sublabel={`${selectedStudent.name} (#${selectedStudent.grNo})`}
                  clipText="🖨️ Print DMC"
                  variant="gold"
                  useSchoolSeal
                  onClick={() => window.print()}
                />
                <LogoClipButton
                  label="Copy Result & Fee Summary"
                  sublabel="Share on family WhatsApp"
                  clipText="📋 Copy Report"
                  variant="white"
                  icon={<Copy size={16} />}
                  onClick={() =>
                    copyToClipboard(
                      `Vision Grammar School Report — ${selectedStudent.name} (ID #${selectedStudent.grNo}): Latest Score ${
                        studentExams[0]?.percentage || 88.8
                      }% (${studentExams[0]?.overallGrade || 'A+'}).`,
                      'Copied Child Progress Report to Clipboard!'
                    )
                  }
                />
                <LogoClipButton
                  label="Open Child's AI Home Coach"
                  sublabel="Urdu & Saraiki homework help"
                  clipText="🧠 AI Ustad"
                  variant="navy"
                  icon={<Sparkles size={16} />}
                  onClick={() => openTool('socratic')}
                />
              </div>
            </div>
            <div className="banner-art" aria-hidden="true">
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 12 }}
                className="banner-crest-showcase"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Crest"
                  className="banner-crest-img"
                />
              </motion.div>
              <div className="art-orbit" />
            </div>
          </section>

          {/* Parent-Specific Child Highlights */}
          <div className="metric-grid">
            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Today’s Gate & Class Attendance</span>
                <span className="metric-icon mint">
                  <CalendarCheck size={19} />
                </span>
              </div>
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const todayRec = selectedStudent.attendanceHistory.find(
                  (r) => r.date === todayStr
                );
                if (!todayRec) {
                  return (
                    <>
                      <strong>Present ✓ (IN: 07:50 AM)</strong>
                      <small>
                        RFID Card #{selectedStudent.rfidCardNo || 'Registered'} · Block 56 Gate
                      </small>
                    </>
                  );
                }
                if (todayRec.attendanceState === 'OUT') {
                  return (
                    <>
                      <strong className="text-amber-700">
                        Checked OUT ({todayRec.checkOutTime})
                      </strong>
                      <small>
                        IN: {todayRec.timestamp || '--'} · OUT: {todayRec.checkOutTime} (RFID Gate)
                      </small>
                    </>
                  );
                }
                if (todayRec.present) {
                  return (
                    <>
                      <strong className="text-emerald-700">
                        IN Campus ✓ ({todayRec.timestamp || 'Present'})
                      </strong>
                      <small>
                        {todayRec.method === 'AI_PHOTO'
                          ? 'Marked via AI Classroom Group Photo'
                          : `RFID Gate Tap (#${todayRec.rfidSerial || selectedStudent.rfidCardNo || 'Card'})`}
                      </small>
                    </>
                  );
                }
                return (
                  <>
                    <strong className="text-rose-600">Absent Today</strong>
                    <small>Parent GSM SMS Alert Dispatched</small>
                  </>
                );
              })()}
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Latest Exam Percentage</span>
                <span className="metric-icon blue">
                  <Award size={19} />
                </span>
              </div>
              <strong>
                {studentExams[0]
                  ? `${studentExams[0].percentage}% (${studentExams[0].overallGrade})`
                  : '88.8% (A+)'}
              </strong>
              <small>
                {studentExams[0]?.positionInClass || 'Top Merit Position in Class'}
              </small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Total Fee Paid (PKR)</span>
                <span className="metric-icon purple">
                  <CheckCircle2 size={19} />
                </span>
              </div>
              <strong>
                Rs{' '}
                {studentFees
                  .reduce((s, f) => s + f.paidAmountPKR, 0)
                  .toLocaleString()}
              </strong>
              <small>Verified Receipt in School Ledger</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Pending Fee Balance</span>
                <span className="metric-icon peach">
                  <Wallet size={19} />
                </span>
              </div>
              <strong>
                Rs{' '}
                {studentFees
                  .reduce((s, f) => s + f.balancePKR, 0)
                  .toLocaleString()}
              </strong>
              <small>
                {studentFees.reduce((s, f) => s + f.balancePKR, 0) === 0
                  ? 'All Dues Cleared ✓'
                  : 'Payable at School Fee Counter'}
              </small>
            </Tilt3DCard>
          </div>

          <div className="chart-grid">
            {/* Child's Subject-Wise DMC Card */}
            <Tilt3DCard className="dashboard-card" intensity={4}>
              <div className="card-heading">
                <div>
                  <h2>🎓 Official DMC Subject Marks — {selectedStudent.name}</h2>
                  <p>{studentExams[0]?.termLabel || 'Annual & Mid-Term Examination'}</p>
                </div>
                <span className="soft-badge">ID #{selectedStudent.grNo}</span>
              </div>

              <div className="subject-progress-list">
                {(studentExams[0]?.subjects || []).map((sub) => (
                  <div key={sub.subject} className="subject-progress-item">
                    <div className="subject-progress-head">
                      <strong>{sub.subject}</strong>
                      <span>
                        {sub.obtainedMarks} / {sub.totalMarks} ({sub.grade})
                      </span>
                    </div>
                    <div className="subject-bar-track">
                      <div
                        className="subject-bar-fill"
                        style={{ width: `${sub.obtainedMarks}%` }}
                      />
                    </div>
                    <small>{sub.remarks}</small>
                  </div>
                ))}
              </div>
            </Tilt3DCard>

            {/* Child's Fee Voucher & Daily Homework Diary */}
            <Tilt3DCard className="dashboard-card" intensity={4}>
              <div className="card-heading">
                <div>
                  <h2>💳 Fee Challan Ledger & Daily Homework Diary</h2>
                  <p>Official fee receipts & today’s assigned homework</p>
                </div>
                <span className="soft-badge">Class {selectedStudent.grade}</span>
              </div>

              <div className="family-fees">
                {studentFees.map((f) => (
                  <div key={f.id} className="parent-fee-row">
                    <div>
                      <strong>{f.monthLabel}</strong>
                      <small>
                        Receipt: {f.receiptNo || 'Pending'} · Due Date: {f.dueDate}
                      </small>
                    </div>
                    <div className="parent-fee-amounts">
                      <span>Paid: Rs {f.paidAmountPKR.toLocaleString()}</span>
                      <strong>Due: Rs {f.balancePKR.toLocaleString()}</strong>
                      <span className="grade-badge">{f.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="parent-diary-box">
                <h4>📒 Today’s Class Homework Diary ({selectedStudent.grade})</h4>
                <ul>
                  <li>
                    <strong>Mathematics:</strong> Solve Exercise 2.1 Q1–Q5 on neat notebook.
                  </li>
                  <li>
                    <strong>General Science:</strong> Draw & label the Light Refraction diagram.
                  </li>
                  <li>
                    <strong>English / Urdu:</strong> Revise 10 vocabulary words for tomorrow’s
                    oral quiz.
                  </li>
                </ul>
              </div>
            </Tilt3DCard>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. STUDENT DASHBOARD (Smart Study Hub & Personal AI Ustad)
          ===================================================================== */}
      {role === 'Student' && selectedStudent && (
        <div className="space-y-6">
          <section className="welcome-banner banner-student">
            <div>
              <span className="banner-kicker">
                <Flame size={15} /> SMART STUDENT STUDY HUB · 14-DAY STREAK · 1,850 XP
              </span>
              <h2>
                Welcome back, {selectedStudent.name}! Ready to Level Up Today?
              </h2>
              <p>
                Learn tough Science, Math & English topics in simple{' '}
                <strong>Urdu, Saraiki, Balochi & English</strong>! Revise interactive flashcards,
                practice BISE D.G. Khan MCQs, or try a Village Science Experiment at home.
              </p>
              <div className="banner-btn-group">
                <LogoClipButton
                  label="Ask Socratic AI Ustad"
                  sublabel="Step-by-step hints in Urdu & Saraiki"
                  clipText="🧠 Ask AI"
                  variant="gold"
                  useSchoolSeal
                  onClick={() => openTool('socratic')}
                />
                <LogoClipButton
                  label="Interactive Flashcards & MCQ Quiz"
                  sublabel="Auto-graded BISE D.G. Khan Quiz"
                  clipText="🃏 Play Quiz"
                  variant="white"
                  icon={<Layers size={17} />}
                  onClick={() => openTool('hub')}
                />
                <LogoClipButton
                  label="Live Smart Math Whiteboard"
                  sublabel="Draw equations & check your steps"
                  clipText="✏️ Draw"
                  variant="navy"
                  icon={<PenTool size={17} />}
                  onClick={() => openTool('whiteboard')}
                />
              </div>
            </div>
            <div className="banner-art" aria-hidden="true">
              <motion.div
                whileHover={{ scale: 1.1, rotateZ: 6 }}
                className="banner-crest-showcase"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Seal"
                  className="banner-crest-img"
                />
              </motion.div>
            </div>
          </section>

          {/* Student Gamified Highlights */}
          <div className="metric-grid">
            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Daily Learning Streak</span>
                <span className="metric-icon peach">
                  <Flame size={19} />
                </span>
              </div>
              <strong>🔥 14 Days</strong>
              <small>Top 5% active learner in Class {selectedStudent.grade}</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Merit Scholar XP</span>
                <span className="metric-icon blue">
                  <Star size={19} />
                </span>
              </div>
              <strong>⭐ 1,850 XP</strong>
              <small>Level 8 · Vision Grammar Star</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>My Best Exam Score</span>
                <span className="metric-icon mint">
                  <Award size={19} />
                </span>
              </div>
              <strong>{studentExams[0]?.percentage || 90.5}% (A+)</strong>
              <small>{studentExams[0]?.positionInClass || 'Merit Position'}</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Mastered Topics</span>
                <span className="metric-icon purple">
                  <CheckCircle2 size={19} />
                </span>
              </div>
              <strong>18 Topics</strong>
              <small>Algebra · Light & Optics · Nastaliq · Tenses</small>
            </Tilt3DCard>
          </div>

          {/* Student's Interactive Study Launchers */}
          <div className="section-heading">
            <h2>🚀 Smart Student Learning & Revision Tools</h2>
            <span>Select any tool below to start learning</span>
          </div>

          <div className="quick-grid">
            <LogoClipButton
              label="Socratic AI Ustad (Voice & Chat)"
              sublabel="Understand any chapter in Urdu, Saraiki & English"
              clipText="🧠 AI Ustad"
              variant="navy"
              useSchoolSeal
              onClick={() => openTool('socratic')}
            />
            <LogoClipButton
              label="Interactive Flashcards & MCQ Quiz"
              sublabel="Test yourself on BISE D.G. Khan board questions"
              clipText="🃏 Start Quiz"
              variant="gold"
              icon={<Layers size={18} />}
              onClick={() => openTool('hub')}
            />
            <LogoClipButton
              label="Textbook Scanner & Village Lab"
              sublabel="Scan any book page + home science experiment"
              clipText="🔬 Scan Page"
              variant="emerald"
              icon={<FileText size={18} />}
              onClick={() => openTool('scanner')}
            />
            <LogoClipButton
              label="Live Smart Whiteboard"
              sublabel="Solve math steps & get instant AI hints"
              clipText="✏️ Whiteboard"
              variant="indigo"
              icon={<PenTool size={18} />}
              onClick={() => openTool('whiteboard')}
            />
            <LogoClipButton
              label="15-Min Missed-Class Catch-Up"
              sublabel="Quick revision summary for missed lessons"
              clipText="📋 Catch-Up"
              variant="navy"
              icon={<Compass size={18} />}
              onClick={() => openTool('catchup')}
            />
            <LogoClipButton
              label="Check My Homework Before Class"
              sublabel="Upload notebook photo for instant feedback"
              clipText="📸 Check Work"
              variant="gold"
              useSchoolSeal
              onClick={() => openTool('assessment')}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          5. PRINCIPAL DASHBOARD (Executive Academic Audit & Merit Command)
          ===================================================================== */}
      {role === 'Principal' && (
        <div className="space-y-6">
          <section className="welcome-banner banner-principal">
            <div>
              <span className="banner-kicker">
                <Award size={15} /> PRINCIPAL EXECUTIVE AUDIT · SYLLABUS & MERIT COMMAND
              </span>
              <h2>Academic Quality & 24-Day Syllabus Audit — Vision Grammar School</h2>
              <p>
                Monitor teacher syllabus completion across all classes, verify daily
                teacher mawaad delivery, and review top merit scholars (`Akhtar Ali #56432`,
                `Maria Bibi #563`).
              </p>
              <div className="banner-btn-group">
                <LogoClipButton
                  label="Audit 24-Day Monthly Plans"
                  sublabel="Verify daily teacher mawaad completion"
                  clipText="🗓️ Audit Plan"
                  variant="gold"
                  useSchoolSeal
                  onClick={() => openTool('system_agent')}
                />
                <LogoClipButton
                  label="Review All DMC Results"
                  sublabel="Approve Principal remarks & positions"
                  clipText="🏆 DMC List"
                  variant="white"
                  icon={<Award size={17} />}
                  onClick={() => navigate('records')}
                />
              </div>
            </div>
            <div className="banner-art" aria-hidden="true">
              <motion.div
                whileHover={{ scale: 1.1, rotateY: 12 }}
                className="banner-crest-showcase"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Crest"
                  className="banner-crest-img"
                />
              </motion.div>
              <div className="art-orbit" />
            </div>
          </section>

          <div className="metric-grid">
            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>24-Day Syllabus Completion</span>
                <span className="metric-icon mint">
                  <CalendarCheck size={19} />
                </span>
              </div>
              <strong>92% On Track</strong>
              <small>22 of 24 daily mawaad units delivered</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>School Exam Average</span>
                <span className="metric-icon blue">
                  <ChartColumn size={19} />
                </span>
              </div>
              <strong>{avgExamScore.toFixed(1)}%</strong>
              <small>Across Mid-Term & Annual DMCs</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>A+ Merit Scholars</span>
                <span className="metric-icon purple">
                  <Award size={19} />
                </span>
              </div>
              <strong>{exams.filter((e) => e.overallGrade === 'A+').length} Students</strong>
              <small>Led by Maria Bibi (90.5%) & Akhtar Ali (88.8%)</small>
            </Tilt3DCard>

            <Tilt3DCard className="metric-card" intensity={10}>
              <div className="metric-top">
                <span>Weekly & Monthly Tests Held</span>
                <span className="metric-icon peach">
                  <ClipboardCheck size={19} />
                </span>
              </div>
              <strong>100% Held</strong>
              <small>Days 6, 12, 18 & 24 checkpoints verified</small>
            </Tilt3DCard>
          </div>

          <Tilt3DCard className="dashboard-card" intensity={4}>
            <div className="card-heading">
              <div>
                <h2>🏛️ Teacher 24-Day Syllabus & Daily Mawaad Audit Table</h2>
                <p>Principal verification of Beaconhouse/Allied-standard monthly plans</p>
              </div>
              <LogoClipButton
                label="Open Full Syllabus Planner"
                clipText="📋 Inspect"
                variant="navy"
                useSchoolSeal
                onClick={() => openTool('system_agent')}
              />
            </div>
            <div className="table-scroll">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Class & Subject</th>
                    <th>Course Portion</th>
                    <th>Days Completed</th>
                    <th>Weekly Tests</th>
                    <th>Audit Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Class 8-A · Mathematics</strong>
                    </td>
                    <td>Half Course (Ch 1 to 10)</td>
                    <td>22 / 24 Days</td>
                    <td>3 / 3 Completed</td>
                    <td>
                      <span className="grade-badge">Verified ✓</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Class 8-A · General Science</strong>
                    </td>
                    <td>Ch: Light, Reflection & Optics</td>
                    <td>21 / 24 Days</td>
                    <td>3 / 3 Completed</td>
                    <td>
                      <span className="grade-badge">Verified ✓</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Class 9-A · Biology (BISE DGK)</strong>
                    </td>
                    <td>Photosynthesis & Cell Bio (Ch 4–7)</td>
                    <td>23 / 24 Days</td>
                    <td>3 / 3 Completed</td>
                    <td>
                      <span className="grade-badge">Verified ✓</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Tilt3DCard>

          {/* Principal Multi-Theme & Multi-Landing-Page Studio */}
          <AdminPrincipalThemeStudio role="Principal" onPreviewLanding={onHome} />
        </div>
      )}
    </div>
  );
}
