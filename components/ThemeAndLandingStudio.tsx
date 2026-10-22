import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Palette,
  Layout,
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  Users,
  GraduationCap,
  ArrowUpRight,
  MapPin,
  Phone,
  Search,
  Eye,
  CheckCircle2,
  Globe2,
  Sliders,
  Lock,
  KeyRound,
  X,
  FileCheck2,
  Send,
  Star,
  BellRing,
  Microscope,
  Calendar,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ThemeId,
  LandingLayoutId,
  SchoolThemeStudioConfig,
  UI_UX_PRO_MAX_THEMES,
  LANDING_PAGE_LAYOUTS,
  getThemeDefinition,
  getLandingLayoutDefinition,
  loadThemeStudioConfig,
  saveThemeStudioConfig,
  toggleBetweenAdminPair,
  applyThemeToDocument,
} from '../services/themeService';
import type { Role } from './ModernWorkspace';

/**
 * Public Sample Merit Records for the Public Online Result (DMC) Lookup
 */
const PUBLIC_SAMPLE_RESULTS: Record<
  string,
  {
    grNo: string;
    name: string;
    fatherName: string;
    grade: string;
    term: string;
    obtained: number;
    total: number;
    percentage: string;
    overallGrade: string;
    position: string;
    subjects: Array<{ name: string; marks: string; grade: string }>;
  }
> = {
  '563': {
    grNo: '563',
    name: 'Maria Bibi',
    fatherName: 'Tariq Mehmood',
    grade: 'Class 9-A (BISE Science)',
    term: 'Mid-Term Examination 2026',
    obtained: 362,
    total: 400,
    percentage: '90.5%',
    overallGrade: 'A+',
    position: '1st Position in Class 9-A',
    subjects: [
      { name: 'Biology / Science', marks: '94 / 100', grade: 'A+' },
      { name: 'Urdu', marks: '92 / 100', grade: 'A+' },
      { name: 'English', marks: '90 / 100', grade: 'A+' },
      { name: 'Mathematics', marks: '86 / 100', grade: 'A+' },
    ],
  },
  '56432': {
    grNo: '56432',
    name: 'Akhtar Ali',
    fatherName: 'Ghulam Mustafa',
    grade: 'Class 8-A (Middle Wing)',
    term: 'Annual Final Examination 2026',
    obtained: 355,
    total: 400,
    percentage: '88.8%',
    overallGrade: 'A+',
    position: '1st Position in Class 8-A',
    subjects: [
      { name: 'Mathematics', marks: '92 / 100', grade: 'A+' },
      { name: 'Urdu', marks: '91 / 100', grade: 'A+' },
      { name: 'General Science', marks: '88 / 100', grade: 'A+' },
      { name: 'English', marks: '84 / 100', grade: 'A' },
    ],
  },
  '1001': {
    grNo: '1001',
    name: 'Hamza Baloch',
    fatherName: 'Sardar Khan',
    grade: 'Class 10-A (Matric Science)',
    term: 'Send-Up Board Examination 2026',
    obtained: 344,
    total: 400,
    percentage: '86.0%',
    overallGrade: 'A+',
    position: '2nd Position in Class 10-A',
    subjects: [
      { name: 'Physics', marks: '89 / 100', grade: 'A+' },
      { name: 'Mathematics', marks: '88 / 100', grade: 'A+' },
      { name: 'Chemistry', marks: '85 / 100', grade: 'A+' },
      { name: 'English', marks: '82 / 100', grade: 'A' },
    ],
  },
};

/**
 * Hook to subscribe to live theme & landing studio config changes
 */
export function useThemeStudioConfig() {
  const [config, setConfig] = useState<SchoolThemeStudioConfig>(() =>
    loadThemeStudioConfig()
  );

  useEffect(() => {
    applyThemeToDocument(config.activeThemeId);
    const handler = (e: Event) => {
      const custom = e as CustomEvent<SchoolThemeStudioConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
      } else {
        setConfig(loadThemeStudioConfig());
      }
    };
    window.addEventListener('vision-theme-studio-updated', handler);
    return () =>
      window.removeEventListener('vision-theme-studio-updated', handler);
  }, [config.activeThemeId]);

  const updateConfig = (patch: Partial<SchoolThemeStudioConfig>) => {
    const next = saveThemeStudioConfig(patch);
    setConfig(next);
  };

  const toggleDualTheme = () => {
    const next = toggleBetweenAdminPair();
    setConfig(next);
  };

  return { config, updateConfig, toggleDualTheme };
}

/**
 * Interactive Perspective Tilt + Cursor Spotlight Card
 */
export const Interactive3DTiltCard: React.FC<{
  children: React.ReactNode;
  accent?: 'cyan' | 'gold' | 'emerald' | 'violet' | 'sky';
  className?: string;
  onClick?: () => void;
  asButton?: boolean;
  intensity?: number;
}> = ({
  children,
  accent = 'cyan',
  className = '',
  onClick,
  asButton = false,
  intensity = 8,
}) => {
  const ref = useRef<HTMLDivElement | HTMLButtonElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const rotateX = useSpring(
    useTransform(y, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 290, damping: 24 }
  );
  const rotateY = useSpring(
    useTransform(x, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 290, damping: 24 }
  );

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

  const spotlightColor =
    accent === 'gold'
      ? 'rgba(245, 176, 20, 0.22)'
      : accent === 'emerald'
      ? 'rgba(16, 185, 129, 0.22)'
      : accent === 'violet'
      ? 'rgba(139, 92, 246, 0.22)'
      : 'rgba(34, 211, 238, 0.22)';

  const spotlightBg = useTransform(
    [spotX, spotY],
    ([sx, sy]) =>
      `radial-gradient(320px circle at ${sx}% ${sy}%, ${spotlightColor}, transparent 75%)`
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
      whileHover={{ y: -6, scale: 1.018 }}
      whileTap={onClick ? { y: 2, scale: 0.985 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={`vgs-card-3d vgs-accent-${accent} tilt-3d-surface ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
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
 * Compact Day / Night Single-Button Toggle
 * One click toggles between Theme A (White/Day) and Theme B (Dark/Night) configured by Admin.
 */
export const DualThemeToggleBar: React.FC = () => {
  const { config, toggleDualTheme } = useThemeStudioConfig();
  const activeTheme = getThemeDefinition(config.activeThemeId);
  const themeA = getThemeDefinition(config.toggleThemeA);
  const themeB = getThemeDefinition(config.toggleThemeB);
  const isDarkActive = Boolean(activeTheme.isDark);
  const nextTheme =
    config.activeThemeId === themeA.id ? themeB : themeA;

  if (!config.allowVisitorToggle) return null;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleDualTheme}
      title={`Switch to ${nextTheme.name}`}
      aria-label={`Toggle theme (Current: ${activeTheme.name})`}
      className="w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all shrink-0"
      style={{
        background: isDarkActive
          ? 'linear-gradient(145deg, #1e293b, #0f172a)'
          : 'linear-gradient(145deg, #ffffff, #eef4ff)',
        borderColor: isDarkActive ? '#fbbf24' : '#cbd5e1',
        boxShadow: isDarkActive
          ? '0 4px 0 #020617, 0 8px 18px rgba(251, 191, 36, 0.25)'
          : '0 4px 0 #9eb6de, 0 8px 18px rgba(0, 35, 102, 0.12)',
      }}
    >
      {isDarkActive ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-blue-950" />
      )}
    </motion.button>
  );
};

/**
 * Full Principal & Admin Multi-Theme + Multi-Landing-Page Control Studio
 * (ONLY rendered inside the private Admin & Principal Dashboards — NEVER on the public landing page!)
 */
export const AdminPrincipalThemeStudio: React.FC<{
  role: 'Admin' | 'Principal';
  onPreviewLanding?: () => void;
}> = ({ role, onPreviewLanding }) => {
  const { config, updateConfig } = useThemeStudioConfig();
  const [savedBanner, setSavedBanner] = useState<string>('');

  const notifySaved = (msg: string) => {
    setSavedBanner(msg);
    setTimeout(() => setSavedBanner(''), 3200);
  };

  const activeTheme = getThemeDefinition(config.activeThemeId);
  const activeLayout = getLandingLayoutDefinition(config.activeLandingLayout);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="vgs-card-3d vgs-accent-gold p-6 md:p-8 space-y-7"
    >
      {/* Studio Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-b-2 pb-5"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-start gap-4">
          <div className="vgs-glyph-3d vgs-glyph-gold">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-1.5 border"
              style={{
                background: 'var(--surface-subtle)',
                borderColor: 'var(--card-border)',
                color: 'var(--navy)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> {role} Private Control Studio
            </div>
            <h2
              className="text-xl md:text-2xl font-extrabold"
              style={{ color: 'var(--ink)' }}
            >
              🎨 School Website Theme & Public Landing Page Studio ({role} Only)
            </h2>
            <p
              className="text-sm font-medium mt-1"
              style={{ color: 'var(--muted)' }}
            >
              Only <strong>Admin</strong> and <strong>Principal</strong> can see this studio. Choose which Public Landing Page design visitors see, set the active school theme, and pick the <strong>2 Toggle Themes (Day / Night)</strong> for public visitors, parents, teachers, and students.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onPreviewLanding && (
            <button
              type="button"
              onClick={onPreviewLanding}
              className="vgs-btn-3d vgs-btn-3d-primary"
            >
              <Eye className="w-4 h-4" /> View Public School Website Live
            </button>
          )}
        </div>
      </div>

      {savedBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 font-extrabold text-sm flex items-center gap-2.5"
          style={{ color: 'var(--ink)' }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{savedBanner}</span>
        </motion.div>
      )}

      {/* 1. DAY/NIGHT VISITOR / STUDENT / TEACHER / PARENT TOGGLE CONFIG */}
      <div
        className="p-5 rounded-2xl border-2 space-y-4"
        style={{
          background: 'var(--surface-subtle)',
          borderColor: 'var(--card-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3
              className="text-base md:text-lg font-extrabold flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
            >
              <Sliders className="w-5 h-5" style={{ color: 'var(--navy)' }} />
              1. Configure Day / Night Toggle Button (2 Themes for Public & Users)
            </h3>
            <p
              className="text-xs md:text-sm font-medium mt-0.5"
              style={{ color: 'var(--muted)' }}
            >
              Visitors and users click the compact ☀️/🌙 icon in the header to toggle between Theme A and Theme B.
            </p>
          </div>

          <label
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl border-2 cursor-pointer"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--card-border)',
              color: 'var(--ink)',
            }}
          >
            <input
              type="checkbox"
              checked={config.allowVisitorToggle}
              onChange={(e) => {
                updateConfig({
                  allowVisitorToggle: e.target.checked,
                  updatedByRole: role,
                });
                notifySaved(
                  e.target.checked
                    ? 'Day/Night Toggle Button Enabled!'
                    : 'Day/Night Toggle Button Hidden.'
                );
              }}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-xs md:text-sm font-extrabold">
              Show Day/Night Toggle Button
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label
              className="block text-xs font-extrabold uppercase mb-1.5"
              style={{ color: 'var(--muted)' }}
            >
              Toggle Option 1 (Day / Light Theme A)
            </label>
            <select
              value={config.toggleThemeA}
              onChange={(e) => {
                const val = e.target.value as ThemeId;
                updateConfig({
                  toggleThemeA: val,
                  activeThemeId: val,
                  updatedByRole: role,
                });
                notifySaved(
                  `Theme A set to ${getThemeDefinition(val).name}`
                );
              }}
              className="w-full border-2 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--ink)',
              }}
            >
              {UI_UX_PRO_MAX_THEMES.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  style={{ background: '#0f172a', color: '#ffffff' }}
                >
                  {t.name} ({t.urduName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs font-extrabold uppercase mb-1.5"
              style={{ color: 'var(--muted)' }}
            >
              Toggle Option 2 (Night / Dark Theme B)
            </label>
            <select
              value={config.toggleThemeB}
              onChange={(e) => {
                const val = e.target.value as ThemeId;
                updateConfig({
                  toggleThemeB: val,
                  updatedByRole: role,
                });
                notifySaved(
                  `Theme B set to ${getThemeDefinition(val).name}`
                );
              }}
              className="w-full border-2 rounded-xl px-3.5 py-2.5 text-sm font-bold outline-none"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--card-border)',
                color: 'var(--ink)',
              }}
            >
              {UI_UX_PRO_MAX_THEMES.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                  style={{ background: '#0f172a', color: '#ffffff' }}
                >
                  {t.name} ({t.urduName})
                </option>
              ))}
            </select>
          </div>

          <div
            className="p-3.5 rounded-xl border-2 flex items-center justify-between gap-3"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--card-border)',
            }}
          >
            <div>
              <span
                className="text-xs font-bold uppercase block"
                style={{ color: 'var(--muted)' }}
              >
                Compact Header Toggle
              </span>
              <span
                className="text-xs font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                Click ☀️/🌙 to test
              </span>
            </div>
            <DualThemeToggleBar />
          </div>
        </div>
      </div>

      {/* 2. 6 CURATED TACTILE & STUDIO THEMES */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3
              className="text-base md:text-lg font-extrabold"
              style={{ color: 'var(--ink)' }}
            >
              2. Select Active School Theme (4 Daylight Themes + 2 Night Studio Themes)
            </h3>
            <p
              className="text-xs md:text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Click any theme card below to apply it across the Public Website and all Portals.
            </p>
          </div>
          <span
            className="text-xs font-extrabold px-3.5 py-1.5 rounded-full border"
            style={{
              background: 'var(--surface-subtle)',
              borderColor: 'var(--card-border)',
              color: 'var(--ink)',
            }}
          >
            Active: {activeTheme.name}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {UI_UX_PRO_MAX_THEMES.map((theme, idx) => {
            const isSelected = config.activeThemeId === theme.id;
            const isToggleA = config.toggleThemeA === theme.id;
            const isToggleB = config.toggleThemeB === theme.id;
            const accents: Array<'cyan' | 'gold' | 'emerald' | 'violet' | 'sky'> = [
              'gold',
              'cyan',
              'emerald',
              'sky',
              'violet',
              'emerald',
            ];

            return (
              <Interactive3DTiltCard
                key={theme.id}
                accent={accents[idx % accents.length]}
                onClick={() => {
                  updateConfig({ activeThemeId: theme.id, updatedByRole: role });
                  notifySaved(`Activated Theme: ${theme.name}`);
                }}
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {theme.previewSwatches.map((hex, i) => (
                        <span
                          key={i}
                          className="w-6 h-6 rounded-lg border border-white/60 shadow-md"
                          style={{ background: hex }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full border"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    >
                      {theme.badge}
                    </span>
                  </div>

                  <div
                    className="font-extrabold text-base"
                    style={{ color: 'var(--ink)' }}
                  >
                    {theme.name}
                  </div>
                  <div
                    className="text-xs font-bold mt-0.5"
                    style={{ color: 'var(--gold-dark)' }}
                  >
                    {theme.urduName}
                  </div>
                  <p
                    className="text-xs mt-1.5 font-medium leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    {theme.tagline}
                  </p>
                </div>

                <div
                  className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <div className="flex items-center gap-1.5">
                    {isToggleA && (
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-400/40 text-xs font-extrabold">
                        ☀️ Toggle A
                      </span>
                    )}
                    {isToggleB && (
                      <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-400/40 text-xs font-extrabold">
                        🌙 Toggle B
                      </span>
                    )}
                  </div>

                  <span
                    className={`vgs-btn-3d ${
                      isSelected ? 'vgs-btn-3d-gold' : 'vgs-btn-3d-primary'
                    }`}
                    style={{ padding: '7px 14px', fontSize: '11.5px', borderRadius: '11px' }}
                  >
                    {isSelected ? '✓ Active Theme' : 'Apply Theme'}
                  </span>
                </div>
              </Interactive3DTiltCard>
            );
          })}
        </div>
      </div>

      {/* 3. 4 PUBLIC SCHOOL WEBSITE LANDING PAGE LAYOUTS */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3
              className="text-base md:text-lg font-extrabold flex items-center gap-2"
              style={{ color: 'var(--ink)' }}
            >
              <Layout className="w-5 h-5" style={{ color: 'var(--navy)' }} />
              3. Select Public School Website Landing Page (4 Designs)
            </h3>
            <p
              className="text-xs md:text-sm font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Choose which front website layout parents, students, and visitors see when they open Vision Grammar School.
            </p>
          </div>
          <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
            Active Public Website: {activeLayout.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {LANDING_PAGE_LAYOUTS.map((layout, idx) => {
            const isSelected = config.activeLandingLayout === layout.id;
            const accents: Array<'gold' | 'cyan' | 'emerald' | 'violet'> = [
              'gold',
              'cyan',
              'violet',
              'emerald',
            ];
            return (
              <Interactive3DTiltCard
                key={layout.id}
                accent={accents[idx % accents.length]}
                onClick={() => {
                  updateConfig({
                    activeLandingLayout: layout.id,
                    updatedByRole: role,
                  });
                  notifySaved(`Public Website Layout set to: ${layout.name}`);
                }}
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full border"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    >
                      {layout.badge}
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: 'var(--muted)' }}
                    >
                      {layout.patternType}
                    </span>
                  </div>
                  <h4
                    className="text-base md:text-lg font-extrabold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {layout.name}
                  </h4>
                  <div
                    className="text-xs font-bold mt-0.5"
                    style={{ color: 'var(--gold-dark)' }}
                  >
                    {layout.urduTitle}
                  </div>
                  <p
                    className="text-xs md:text-sm mt-2 font-medium leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    {layout.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {layout.highlights.map((h) => (
                      <span
                        key={h}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border"
                        style={{
                          background: 'var(--surface-subtle)',
                          borderColor: 'var(--card-border)',
                          color: 'var(--ink)',
                        }}
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="mt-4 pt-3 border-t flex items-center justify-between"
                  style={{ borderColor: 'var(--card-border)' }}
                >
                  <span
                    className={`vgs-btn-3d ${
                      isSelected ? 'vgs-btn-3d-gold' : 'vgs-btn-3d-primary'
                    }`}
                    style={{ padding: '8px 15px', fontSize: '12px', borderRadius: '12px' }}
                  >
                    {isSelected ? '✓ Active Public Website' : 'Activate This Website'}
                  </span>

                  {onPreviewLanding && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateConfig({
                          activeLandingLayout: layout.id,
                          updatedByRole: role,
                        });
                        onPreviewLanding();
                      }}
                      className="text-xs font-extrabold underline"
                      style={{ color: 'var(--navy)' }}
                    >
                      Preview Public Website →
                    </button>
                  )}
                </div>
              </Interactive3DTiltCard>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};

/**
 * Protected Portal Login Modal
 */
const PortalSignInModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEnterRole: (role: Role) => void;
  onOpenRfidGate?: () => void;
}> = ({ isOpen, onClose, onEnterRole, onOpenRfidGate }) => {
  const [loginTab, setLoginTab] = useState<'family' | 'staff'>('family');
  const [selectedRole, setSelectedRole] = useState<Role>('Parent');
  const [credential, setCredential] = useState<string>('56432');
  const [pinCode, setPinCode] = useState<string>('2026');

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    onEnterRole(selectedRole);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="vgs-card-3d vgs-accent-gold w-full max-w-lg p-6 md:p-8 space-y-6 relative"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="brand-logo-wrap !w-12 !h-12">
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Crest"
                  className="brand-logo-img"
                />
              </div>
              <div>
                <span className="eyebrow">SECURE PORTAL SIGN-IN</span>
                <h3
                  className="text-xl font-extrabold mt-1"
                  style={{ color: 'var(--ink)' }}
                >
                  Vision Grammar School Portal
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border hover:opacity-80"
              style={{
                background: 'var(--surface-subtle)',
                borderColor: 'var(--card-border)',
                color: 'var(--ink)',
              }}
              aria-label="Close login modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Family vs Staff Tabs */}
          <div
            className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl border-2"
            style={{
              background: 'var(--surface-subtle)',
              borderColor: 'var(--card-border)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setLoginTab('family');
                setSelectedRole('Parent');
                setCredential('56432');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                loginTab === 'family' ? 'vgs-btn-3d-primary' : ''
              }`}
              style={
                loginTab !== 'family'
                  ? { color: 'var(--ink)', background: 'transparent' }
                  : undefined
              }
            >
              👨‍👩‍👧 Parent & Student Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab('staff');
                setSelectedRole('Teacher');
                setCredential('STF-104');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                loginTab === 'staff' ? 'vgs-btn-3d-primary' : ''
              }`}
              style={
                loginTab !== 'staff'
                  ? { color: 'var(--ink)', background: 'transparent' }
                  : undefined
              }
            >
              🏛️ Staff, Teacher & Admin
            </button>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {loginTab === 'family' ? (
              <>
                <div>
                  <label
                    className="block text-xs font-extrabold uppercase mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    Select Portal Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Parent', 'Student'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center gap-2.5 ${
                          selectedRole === r ? 'border-amber-500' : ''
                        }`}
                        style={{
                          background:
                            selectedRole === r
                              ? 'var(--gold-soft)'
                              : 'var(--surface-subtle)',
                          borderColor:
                            selectedRole === r
                              ? 'var(--gold)'
                              : 'var(--card-border)',
                          color: 'var(--ink)',
                        }}
                      >
                        {r === 'Parent' ? (
                          <Users className="w-5 h-5 text-amber-500 shrink-0" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-sky-500 shrink-0" />
                        )}
                        <div>
                          <div className="text-sm font-extrabold">{r} Portal</div>
                          <div
                            className="text-[11px] font-medium"
                            style={{ color: 'var(--muted)' }}
                          >
                            {r === 'Parent'
                              ? 'Attendance, DMC & Fee'
                              : 'AI Tutor, Quiz & Notes'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-extrabold uppercase mb-1.5"
                    style={{ color: 'var(--muted)' }}
                  >
                    Student GR No / Roll Number
                  </label>
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="e.g. 56432 (Akhtar Ali) or 563 (Maria Bibi)"
                    className="w-full px-4 py-3 rounded-xl border-2 text-sm font-bold outline-none"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--ink)',
                    }}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    className="block text-xs font-extrabold uppercase mb-2"
                    style={{ color: 'var(--muted)' }}
                  >
                    Select Staff / Management Role
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['Teacher', 'Principal', 'Admin'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className="p-3 rounded-2xl border-2 text-center transition-all"
                        style={{
                          background:
                            selectedRole === r
                              ? 'var(--gold-soft)'
                              : 'var(--surface-subtle)',
                          borderColor:
                            selectedRole === r
                              ? 'var(--gold)'
                              : 'var(--card-border)',
                          color: 'var(--ink)',
                        }}
                      >
                        <div className="text-xs font-extrabold">{r}</div>
                        <div
                          className="text-[10px] font-semibold mt-0.5"
                          style={{ color: 'var(--muted)' }}
                        >
                          {r === 'Teacher'
                            ? 'Classroom'
                            : r === 'Principal'
                            ? 'Audit & Themes'
                            : 'System Control'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      Staff ID / Username
                    </label>
                    <input
                      type="text"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      Security PIN
                    </label>
                    <input
                      type="password"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                className="vgs-btn-3d vgs-btn-3d-gold w-full justify-center"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In to {selectedRole} Portal →</span>
              </button>

              {loginTab === 'staff' && onOpenRfidGate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRfidGate();
                  }}
                  className="vgs-btn-3d vgs-btn-3d-emerald w-full justify-center"
                >
                  <span>Open Gate RFID Attendance Terminal (Staff Kiosk)</span>
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

/**
 * Full-Screen Public School Website Landing Page
 * Features:
 * 1. Single-row compact header with `/vision-logo-crest.png`, 3-color educational brand typography, address-only subtitle, and right-aligned actions + compact Day/Night icon button.
 * 2. Full-screen width (`w-full`) layout.
 */
export const DynamicMultiLandingPage: React.FC<{
  onEnter: (role: Role) => void;
  onOpenRfidGate?: () => void;
  defaultHeroScene?: React.ReactNode;
}> = ({ onEnter, onOpenRfidGate, defaultHeroScene }) => {
  const { config } = useThemeStudioConfig();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [rollSearch, setRollSearch] = useState('563');
  const [admissionSubmitted, setAdmissionSubmitted] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    studentName: '',
    fatherName: '',
    targetClass: 'Class 9 (BISE Science)',
    phone: '',
  });

  const activeTheme = getThemeDefinition(config.activeThemeId);
  const matchedResult =
    PUBLIC_SAMPLE_RESULTS[rollSearch.trim()] || PUBLIC_SAMPLE_RESULTS['563'];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const academicPrograms = [
    {
      badge: '🌱 Ages 3–5 · Montessori',
      title: 'Early Years & Playgroup',
      desc: 'Activity-based phonics, foundational numeracy, moral tarbiyah, and joyful classroom discovery.',
      accent: 'emerald' as const,
      glyph: 'vgs-glyph-emerald',
      icon: Sparkles,
    },
    {
      badge: '📘 Class 1 to 5',
      title: 'Primary Foundation Wing',
      desc: 'Strong English, Urdu & Mathematics conceptual base with daily guided reading and handwriting mastery.',
      accent: 'cyan' as const,
      glyph: 'vgs-glyph-cyan',
      icon: BookOpen,
    },
    {
      badge: '🔬 Class 6 to 8 · Pre-Board',
      title: 'Middle Wing & Science Labs',
      desc: 'Hands-on General Science & Computer practicals, structured 24-day monthly syllabus, and weekly tests.',
      accent: 'violet' as const,
      glyph: 'vgs-glyph-violet',
      icon: Microscope,
    },
    {
      badge: '🏆 Class 9 & 10 · BISE D.G. Khan',
      title: 'Matriculation Board Excellence',
      desc: 'Rigorous BISE D.G. Khan exam preparation, board-pattern test series, and 90%+ A+ merit coaching.',
      accent: 'gold' as const,
      glyph: 'vgs-glyph-gold',
      icon: GraduationCap,
    },
  ];

  return (
    <div
      className="min-h-screen w-full transition-colors duration-300 flex flex-col justify-between"
      style={{
        backgroundColor: activeTheme.vars['--canvas'],
        color: activeTheme.vars['--ink'],
      }}
    >
      {/* COMPACT SINGLE-LINE FULL-WIDTH PUBLIC HEADER */}
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-xl border-b-2 px-4 sm:px-8 lg:px-12 py-2.5"
        style={{
          background: activeTheme.vars['--header-bg'],
          borderColor: activeTheme.vars['--card-border'],
          boxShadow: '0 6px 24px var(--card-glow)',
        }}
      >
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left: Official Crest Logo + 3-Color Educational Title + Address Only */}
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="brand-logo-wrap !w-12 !h-12 !rounded-2xl">
              <img
                src="/vision-logo-crest.png"
                alt="Vision Grammar School Crest"
                className="brand-logo-img"
              />
            </div>
            <div>
              <div
                className="text-lg sm:text-xl md:text-2xl font-black tracking-tight leading-none flex items-center gap-1.5"
                style={{
                  fontFamily: "'Georgia', 'Plus Jakarta Sans', serif",
                  letterSpacing: '0.3px',
                }}
              >
                <span style={{ color: 'var(--navy)' }}>VISION</span>
                <span style={{ color: 'var(--gold-dark)' }}>GRAMMAR</span>
                <span style={{ color: 'var(--teal)' }}>SCHOOL</span>
              </div>
              <div
                className="text-xs font-bold flex items-center gap-1 mt-1"
                style={{ color: 'var(--muted)' }}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Block 56, Dera Ghazi Khan</span>
              </div>
            </div>
          </div>

          {/* Center/Right Navigation Links (Hidden on small mobile, shown inline on desktop) */}
          <nav
            aria-label="Public school sections"
            className="hidden xl:flex items-center gap-6 text-xs font-extrabold uppercase tracking-wider"
          >
            <button
              type="button"
              onClick={() => scrollToSection('public-programs')}
              className="hover:opacity-75 transition-opacity bg-transparent border-0"
              style={{ color: 'var(--ink)' }}
            >
              Programs
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('public-result-check')}
              className="hover:opacity-75 transition-opacity bg-transparent border-0"
              style={{ color: 'var(--ink)' }}
            >
              Online Result (DMC)
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('public-merit')}
              className="hover:opacity-75 transition-opacity bg-transparent border-0"
              style={{ color: 'var(--ink)' }}
            >
              Why Vision
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('public-admissions')}
              className="hover:opacity-75 transition-opacity bg-transparent border-0"
              style={{ color: 'var(--ink)' }}
            >
              Admissions
            </button>
          </nav>

          {/* Right (Same Line as Logo!): Admission Button + Portal Login + Compact Day/Night Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('public-admissions')}
              className="vgs-btn-3d vgs-btn-3d-gold hidden sm:inline-flex"
              style={{ padding: '9px 15px', fontSize: '12px', borderRadius: '13px' }}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Apply for Admission</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="vgs-btn-3d vgs-btn-3d-primary"
              style={{ padding: '9px 16px', fontSize: '12px', borderRadius: '13px' }}
            >
              <Lock className="w-4 h-4" />
              <span>Portal Login</span>
            </button>

            <DualThemeToggleBar />
          </div>
        </div>
      </header>

      {/* FULL-SCREEN MAIN PUBLIC SCHOOL WEBSITE CONTENT */}
      <main className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-6 md:py-8 space-y-14">
        {/* ===============================================================
            HERO SECTION (Full-Screen Width & Viewport Stage)
            =============================================================== */}
        {config.activeLandingLayout === 'hero-campus' && (
          <div className="vgs-card-3d vgs-accent-gold w-full p-6 sm:p-10 lg:p-14 min-h-[calc(100vh-110px)] flex items-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="eyebrow">
                    <span className="status-dot" />
                    ADMISSIONS OPEN 2026–27 · PLAYGROUP TO MATRIC
                  </span>
                </div>

                <h1
                  className="text-3xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight"
                  style={{ color: 'var(--ink)' }}
                >
                  Nurturing Character,{' '}
                  <span style={{ color: 'var(--gold)' }}>Board Merit</span> &
                  Future Leaders
                </h1>

                <p
                  className="text-base sm:text-lg font-medium leading-relaxed max-w-3xl"
                  style={{ color: 'var(--muted)' }}
                >
                  Welcome to <strong>Vision Grammar School (Block 56, Dera Ghazi Khan)</strong> — where disciplined classroom teaching, BISE board exam preparation, modern science & AI learning labs, and instant parent attendance alerts come together for your child’s success.
                </p>

                <div className="flex flex-wrap gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => scrollToSection('public-admissions')}
                    className="vgs-btn-3d vgs-btn-3d-gold"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span>Apply for Admission 2026–27</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('public-result-check')}
                    className="vgs-btn-3d vgs-btn-3d-primary"
                  >
                    <FileCheck2 className="w-5 h-5" />
                    <span>Check Online Result (DMC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLoginModalOpen(true)}
                    className="vgs-btn-3d vgs-btn-3d-surface"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Parent / Student / Staff Login</span>
                  </button>
                </div>

                {/* Key School Trust Stats for Parents */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div
                      className="text-2xl md:text-3xl font-extrabold"
                      style={{ color: 'var(--gold)' }}
                    >
                      90.5%
                    </div>
                    <div
                      className="text-xs font-bold mt-0.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      Top BISE Pattern Merit
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div
                      className="text-2xl md:text-3xl font-extrabold"
                      style={{ color: 'var(--navy)' }}
                    >
                      100%
                    </div>
                    <div
                      className="text-xs font-bold mt-0.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      Safe Gate Parent SMS
                    </div>
                  </div>
                  <div
                    className="p-4 rounded-2xl border"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                    }}
                  >
                    <div className="text-2xl md:text-3xl font-extrabold text-emerald-500">
                      PG – 10th
                    </div>
                    <div
                      className="text-xs font-bold mt-0.5"
                      style={{ color: 'var(--muted)' }}
                    >
                      Playgroup to Matric
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Isometric School Campus Model */}
              <div className="lg:col-span-5">{defaultHeroScene}</div>
            </div>
          </div>
        )}

        {config.activeLandingLayout === 'bento-grid' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
            <div className="lg:col-span-8 vgs-hero-stage-3d p-8 md:p-12 flex flex-col justify-between">
              <div className="space-y-5 max-w-3xl">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/30 text-xs font-extrabold uppercase tracking-wider">
                  🏫 VISION GRAMMAR SCHOOL · BLOCK 56, D.G. KHAN
                </span>
                <h1 className="text-3xl sm:text-5xl xl:text-6xl font-extrabold leading-tight text-white">
                  Where Academic Tradition Meets Modern Smart Education
                </h1>
                <p className="text-base md:text-lg text-white/90 font-medium leading-relaxed">
                  From Playgroup to BISE D.G. Khan Matriculation — give your child structured monthly syllabus coverage, safe campus gate alerts, and personal AI-assisted study coaching.
                </p>
              </div>
              <div className="flex flex-wrap gap-3.5 pt-7">
                <button
                  type="button"
                  onClick={() => scrollToSection('public-admissions')}
                  className="vgs-btn-3d vgs-btn-3d-gold"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Apply for Admission 2026–27</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('public-result-check')}
                  className="vgs-btn-3d vgs-btn-3d-emerald"
                >
                  <FileCheck2 className="w-5 h-5" />
                  <span>Verify Student Result (DMC)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="vgs-btn-3d vgs-btn-3d-primary"
                >
                  <Lock className="w-4 h-4" />
                  <span>Portal Sign-In</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <Interactive3DTiltCard
                accent="gold"
                className="p-6 flex-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 text-xs font-extrabold">
                    🏆 BOARD MERIT RECORD
                  </span>
                  <div className="vgs-glyph-3d vgs-glyph-gold !w-10 !h-10">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3 space-y-2 text-xs">
                  <div
                    className="p-2.5 rounded-xl border flex justify-between font-extrabold"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--ink)',
                    }}
                  >
                    <span>Maria Bibi (Class 9-A)</span>
                    <span className="text-emerald-500">90.5% (A+ · 1st)</span>
                  </div>
                  <div
                    className="p-2.5 rounded-xl border flex justify-between font-extrabold"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--ink)',
                    }}
                  >
                    <span>Akhtar Ali (Class 8-A)</span>
                    <span style={{ color: 'var(--gold)' }}>88.8% (A+ · 1st)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection('public-result-check')}
                  className="vgs-btn-3d vgs-btn-3d-surface w-full"
                >
                  <span>Check Any Roll Number →</span>
                </button>
              </Interactive3DTiltCard>

              <Interactive3DTiltCard
                accent="emerald"
                className="p-6 flex-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-500 text-xs font-extrabold">
                    🛡️ CHILD CAMPUS SAFETY
                  </span>
                  <div className="vgs-glyph-3d vgs-glyph-emerald !w-10 !h-10">
                    <BellRing className="w-5 h-5" />
                  </div>
                </div>
                <div className="my-3">
                  <h3
                    className="text-lg font-extrabold"
                    style={{ color: 'var(--ink)' }}
                  >
                    Instant Parent Entry & Exit SMS
                  </h3>
                  <p
                    className="text-xs font-medium mt-1 leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    Every student carries a smart ID card. As soon as your child enters or leaves the school gate, an instant SMS is sent to your mobile phone.
                  </p>
                </div>
              </Interactive3DTiltCard>
            </div>
          </div>
        )}

        {config.activeLandingLayout === 'editorial-academic' && (
          <div className="vgs-card-3d vgs-accent-gold w-full p-8 md:p-14 text-center space-y-6 min-h-[calc(100vh-120px)] flex flex-col justify-center">
            <div className="flex justify-center">
              <motion.div
                whileHover={{ y: -6, scale: 1.06 }}
                className="brand-logo-wrap !w-24 !h-24 !rounded-3xl"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School Crest"
                  className="w-20 h-20 object-contain"
                />
              </motion.div>
            </div>

            <div>
              <span className="eyebrow">
                🏆 BISE D.G. KHAN AFFILIATED STANDARD · BLOCK 56 CAMPUS
              </span>
            </div>

            <h1
              className="text-3xl sm:text-5xl xl:text-6xl font-extrabold max-w-4xl mx-auto leading-tight"
              style={{ color: 'var(--ink)' }}
            >
              A Tradition of Academic Distinction & Moral Character
            </h1>

            <p
              className="text-base md:text-lg max-w-2xl mx-auto font-medium"
              style={{ color: 'var(--muted)' }}
            >
              Empowering the youth of Dera Ghazi Khan with disciplined daily lessons, complete syllabus coverage, and outstanding board examination results.
            </p>

            <div className="flex flex-wrap justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('public-admissions')}
                className="vgs-btn-3d vgs-btn-3d-gold"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Apply for Admission 2026–27</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('public-result-check')}
                className="vgs-btn-3d vgs-btn-3d-primary"
              >
                <FileCheck2 className="w-5 h-5" />
                <span>Online Result Verification</span>
              </button>
            </div>
          </div>
        )}

        {config.activeLandingLayout === 'minimal-portal' && (
          <div className="vgs-card-3d vgs-accent-cyan w-full p-8 md:p-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <span className="eyebrow">
                  ⚡ PARENT & STUDENT DIGITAL SERVICE HUB
                </span>
                <h1
                  className="text-2xl sm:text-4xl font-extrabold"
                  style={{ color: 'var(--ink)' }}
                >
                  Vision Grammar School — Online Result, Admissions & Portal
                </h1>
                <p
                  className="text-sm md:text-base font-medium"
                  style={{ color: 'var(--muted)' }}
                >
                  Check student examination DMC cards by Roll Number, submit admission inquiries for 2026–27, or sign in to your school portal.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => scrollToSection('public-result-check')}
                  className="vgs-btn-3d vgs-btn-3d-emerald"
                >
                  <Search className="w-4 h-4" />
                  <span>Check Result by Roll No</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="vgs-btn-3d vgs-btn-3d-primary"
                >
                  <Lock className="w-4 h-4" />
                  <span>Portal Sign-In</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===============================================================
            SECTION 2: ACADEMIC PROGRAMS (PLAYGROUP TO MATRIC)
            =============================================================== */}
        <section id="public-programs" className="w-full space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="eyebrow">ACADEMIC WINGS & CURRICULUM</span>
              <h2
                className="text-2xl md:text-3xl font-extrabold mt-2"
                style={{ color: 'var(--ink)' }}
              >
                Comprehensive Education from Playgroup to Matric
              </h2>
            </div>
            <p
              className="text-xs md:text-sm font-bold"
              style={{ color: 'var(--muted)' }}
            >
              English & Urdu Medium · Science & Computer Labs · Daily Parent Diary
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {academicPrograms.map((prog) => (
              <Interactive3DTiltCard
                key={prog.title}
                accent={prog.accent}
                className="p-6 flex flex-col justify-between min-h-[240px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`vgs-glyph-3d ${prog.glyph}`}>
                      <prog.icon className="w-6 h-6" />
                    </span>
                    <span
                      className="text-[11px] font-extrabold px-2.5 py-1 rounded-full border"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    >
                      {prog.badge}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-extrabold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {prog.title}
                  </h3>
                  <p
                    className="text-xs md:text-sm font-medium mt-2 leading-relaxed"
                    style={{ color: 'var(--muted)' }}
                  >
                    {prog.desc}
                  </p>
                </div>

                <div
                  className="mt-5 pt-3 border-t flex items-center justify-between text-xs font-extrabold"
                  style={{
                    borderColor: 'var(--card-border)',
                    color: 'var(--navy)',
                  }}
                >
                  <span>Admissions Open 2026</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </Interactive3DTiltCard>
            ))}
          </div>
        </section>

        {/* ===============================================================
            SECTION 3: PUBLIC ONLINE RESULT (DMC) VERIFICATION BY ROLL NO
            =============================================================== */}
        <section id="public-result-check" className="w-full space-y-5">
          <div className="vgs-card-3d vgs-accent-cyan p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Search Roll Number */}
              <div className="lg:col-span-5 space-y-4">
                <span className="eyebrow">
                  <FileCheck2 className="w-3.5 h-3.5" /> PUBLIC ONLINE RESULT & DMC PORTAL
                </span>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ color: 'var(--ink)' }}
                >
                  Check Student Result Card by Roll / GR No.
                </h2>
                <p
                  className="text-sm font-medium leading-relaxed"
                  style={{ color: 'var(--muted)' }}
                >
                  Parents and students can verify official Mid-Term and Annual Detailed Marks Certificates (DMC) online. Try sample Roll Numbers below:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rollSearch}
                    onChange={(e) => setRollSearch(e.target.value)}
                    placeholder="Enter Roll / GR No (e.g. 563, 56432, 1001)"
                    className="flex-1 px-4 py-3 rounded-2xl border-2 text-sm font-extrabold outline-none"
                    style={{
                      background: 'var(--surface-subtle)',
                      borderColor: 'var(--card-border)',
                      color: 'var(--ink)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setRollSearch(rollSearch.trim() || '563')}
                    className="vgs-btn-3d vgs-btn-3d-primary"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'var(--muted)' }}
                  >
                    Quick Demo Roll Nos:
                  </span>
                  {[
                    { gr: '563', label: 'Maria Bibi (#563 · 9-A)' },
                    { gr: '56432', label: 'Akhtar Ali (#56432 · 8-A)' },
                    { gr: '1001', label: 'Hamza Baloch (#1001 · 10-A)' },
                  ].map((item) => (
                    <button
                      key={item.gr}
                      type="button"
                      onClick={() => setRollSearch(item.gr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                        rollSearch === item.gr
                          ? 'bg-amber-400 text-slate-950 border-amber-500'
                          : ''
                      }`}
                      style={
                        rollSearch !== item.gr
                          ? {
                              background: 'var(--surface-subtle)',
                              borderColor: 'var(--card-border)',
                              color: 'var(--ink)',
                            }
                          : undefined
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Live Official DMC Card Preview */}
              <div className="lg:col-span-7">
                <Interactive3DTiltCard accent="gold" className="p-6 space-y-4">
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 border-b pb-4"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="/vision-logo-crest.png"
                        alt="Vision Grammar School Crest"
                        className="w-12 h-12 rounded-2xl border-2 border-amber-400 p-0.5 bg-white object-contain"
                      />
                      <div>
                        <div
                          className="text-xs font-extrabold uppercase"
                          style={{ color: 'var(--gold-dark)' }}
                        >
                          OFFICIAL DETAILED MARKS CERTIFICATE (DMC)
                        </div>
                        <h3
                          className="text-lg font-extrabold"
                          style={{ color: 'var(--ink)' }}
                        >
                          {matchedResult.name} ·{' '}
                          <span style={{ color: 'var(--navy)' }}>
                            GR #{matchedResult.grNo}
                          </span>
                        </h3>
                        <div
                          className="text-xs font-bold"
                          style={{ color: 'var(--muted)' }}
                        >
                          Father: {matchedResult.fatherName} · {matchedResult.grade}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 text-xs font-extrabold">
                        🏆 {matchedResult.position}
                      </span>
                      <div
                        className="text-xs font-bold mt-1"
                        style={{ color: 'var(--muted)' }}
                      >
                        {matchedResult.term}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {matchedResult.subjects.map((sub) => (
                      <div
                        key={sub.name}
                        className="p-3 rounded-xl border"
                        style={{
                          background: 'var(--surface-subtle)',
                          borderColor: 'var(--card-border)',
                        }}
                      >
                        <div
                          className="text-[11px] font-bold truncate"
                          style={{ color: 'var(--muted)' }}
                        >
                          {sub.name}
                        </div>
                        <div
                          className="text-sm font-extrabold mt-0.5"
                          style={{ color: 'var(--ink)' }}
                        >
                          {sub.marks}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-extrabold">
                          Grade {sub.grade}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t"
                    style={{ borderColor: 'var(--card-border)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <span
                          className="text-xs font-bold block"
                          style={{ color: 'var(--muted)' }}
                        >
                          Total Marks
                        </span>
                        <strong
                          className="text-base font-extrabold"
                          style={{ color: 'var(--ink)' }}
                        >
                          {matchedResult.obtained} / {matchedResult.total}
                        </strong>
                      </div>
                      <div>
                        <span
                          className="text-xs font-bold block"
                          style={{ color: 'var(--muted)' }}
                        >
                          Percentage & Grade
                        </span>
                        <strong className="text-base font-extrabold text-emerald-500">
                          {matchedResult.percentage} ({matchedResult.overallGrade})
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setLoginModalOpen(true)}
                      className="vgs-btn-3d vgs-btn-3d-gold"
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <span>Open Full Parent Portal →</span>
                    </button>
                  </div>
                </Interactive3DTiltCard>
              </div>
            </div>
          </div>
        </section>

        {/* ===============================================================
            SECTION 4: TOP MERIT ROLL OF HONOR & WHY PARENTS CHOOSE US
            =============================================================== */}
        <section id="public-merit" className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <Interactive3DTiltCard accent="emerald" className="p-6 space-y-3">
            <div className="vgs-glyph-3d vgs-glyph-emerald">
              <BellRing className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
              Safe Gate Entry/Exit Parent SMS Alerts
            </h3>
            <p
              className="text-xs md:text-sm font-medium leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Peace of mind for every parent in D.G. Khan: our automated smart card gate system notifies parents on their mobile phone the moment their child checks IN or OUT.
            </p>
          </Interactive3DTiltCard>

          <Interactive3DTiltCard accent="gold" className="p-6 space-y-3">
            <div className="vgs-glyph-3d vgs-glyph-gold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
              Disciplined 24-Day Monthly Syllabus Plan
            </h3>
            <p
              className="text-xs md:text-sm font-medium leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Every subject follows a structured 24-day monthly teaching calendar audited directly by the Principal, ensuring 100% timely course completion and regular test revision.
            </p>
          </Interactive3DTiltCard>

          <Interactive3DTiltCard accent="cyan" className="p-6 space-y-3">
            <div className="vgs-glyph-3d vgs-glyph-cyan">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold" style={{ color: 'var(--ink)' }}>
              24/7 AI Study Coach (English, Urdu & Saraiki)
            </h3>
            <p
              className="text-xs md:text-sm font-medium leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Every enrolled student gets access to our interactive study portal with BISE D.G. Khan MCQ practice, flashcards, and guided explanations in English, Urdu, and Saraiki.
            </p>
          </Interactive3DTiltCard>
        </section>

        {/* ===============================================================
            SECTION 5: ONLINE ADMISSION INQUIRY 2026–27 & CONTACT
            =============================================================== */}
        <section id="public-admissions" className="w-full vgs-card-3d vgs-accent-gold p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="eyebrow">
                <Star className="w-3.5 h-3.5" /> ADMISSIONS OPEN 2026–27
              </span>
              <h2
                className="text-2xl md:text-4xl font-extrabold"
                style={{ color: 'var(--ink)' }}
              >
                Enroll Your Child at Vision Grammar School
              </h2>
              <p
                className="text-sm md:text-base font-medium leading-relaxed"
                style={{ color: 'var(--muted)' }}
              >
                Submit an online admission inquiry below or visit our campus at{' '}
                <strong>Block 56, Dera Ghazi Khan</strong> between 8:00 AM and 2:00 PM (Monday–Saturday).
              </p>

              <div className="space-y-2.5 pt-2 text-xs md:text-sm font-bold">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Main Campus: Block 56, Dera Ghazi Khan, Punjab</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Admissions Desk & Parent Helpline: +92 (064) 246-5600</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              {admissionSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h3
                    className="text-lg font-extrabold"
                    style={{ color: 'var(--ink)' }}
                  >
                    Admission Inquiry Registered!
                  </h3>
                  <p
                    className="text-xs md:text-sm font-medium"
                    style={{ color: 'var(--muted)' }}
                  >
                    Thank you, <strong>{admissionForm.fatherName}</strong>. Our Admissions Office at Block 56, D.G. Khan will contact you at{' '}
                    <strong>{admissionForm.phone}</strong> regarding{' '}
                    <strong>{admissionForm.studentName}</strong> ({admissionForm.targetClass}).
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdmissionSubmitted(false)}
                    className="vgs-btn-3d vgs-btn-3d-primary"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAdmissionSubmitted(true);
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={admissionForm.studentName}
                      onChange={(e) =>
                        setAdmissionForm({
                          ...admissionForm,
                          studentName: e.target.value,
                        })
                      }
                      placeholder="e.g. Zainab Fatima"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      Father / Guardian Name
                    </label>
                    <input
                      type="text"
                      required
                      value={admissionForm.fatherName}
                      onChange={(e) =>
                        setAdmissionForm({
                          ...admissionForm,
                          fatherName: e.target.value,
                        })
                      }
                      placeholder="e.g. Muhammad Tariq"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      Applying for Class
                    </label>
                    <select
                      value={admissionForm.targetClass}
                      onChange={(e) =>
                        setAdmissionForm({
                          ...admissionForm,
                          targetClass: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    >
                      <option style={{ background: '#0f172a', color: '#fff' }}>
                        Playgroup / Montessori
                      </option>
                      <option style={{ background: '#0f172a', color: '#fff' }}>
                        Primary Wing (Class 1 – 5)
                      </option>
                      <option style={{ background: '#0f172a', color: '#fff' }}>
                        Middle Wing (Class 6 – 8)
                      </option>
                      <option style={{ background: '#0f172a', color: '#fff' }}>
                        Class 9 (BISE Science)
                      </option>
                      <option style={{ background: '#0f172a', color: '#fff' }}>
                        Class 10 (Matriculation)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-xs font-extrabold uppercase mb-1"
                      style={{ color: 'var(--muted)' }}
                    >
                      Parent Mobile / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={admissionForm.phone}
                      onChange={(e) =>
                        setAdmissionForm({
                          ...admissionForm,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+92 300 1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 text-sm font-bold outline-none"
                      style={{
                        background: 'var(--surface-subtle)',
                        borderColor: 'var(--card-border)',
                        color: 'var(--ink)',
                      }}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <button
                      type="submit"
                      className="vgs-btn-3d vgs-btn-3d-gold w-full justify-center"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Online Admission Inquiry</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* OFFICIAL VISION GRAMMAR SCHOOL PUBLIC FOOTER */}
      <footer className="vision-footer w-full">
        <div className="w-full px-4 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/15">
          <div className="vision-footer-brand">
            <div className="vision-footer-logos">
              <img
                src="/vision-logo-crest.png"
                alt="Vision Grammar School Crest"
                className="footer-crest-logo"
              />
            </div>
            <div>
              <h4>VISION GRAMMAR SCHOOL</h4>
              <p className="footer-location">
                <MapPin size={14} /> Block 56, Dera Ghazi Khan, Punjab, Pakistan
              </p>
            </div>
          </div>

          <div className="vision-footer-badges">
            <span className="footer-pill">🎓 Playgroup to Matric</span>
            <span className="footer-pill">🏆 BISE D.G. Khan Standard</span>
            <span className="footer-pill">🛡️ Safe Campus Parent SMS</span>
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="footer-pill cursor-pointer hover:opacity-90"
            >
              🔐 Staff & Portal Login
            </button>
          </div>
        </div>
      </footer>

      {/* Protected Portal Sign-In Modal */}
      <PortalSignInModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onEnterRole={onEnter}
        onOpenRfidGate={onOpenRfidGate}
      />
    </div>
  );
};
