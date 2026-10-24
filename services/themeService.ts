export type ThemeId =
  | 'royal-navy'
  | 'emerald-academy'
  | 'bento-sky'
  | 'oxford-crimson'
  | 'soft-ivory'
  | 'midnight-slate';

export type LandingLayoutId =
  | 'hero-campus'
  | 'bento-grid'
  | 'editorial-academic'
  | 'minimal-portal';

export interface SchoolThemeDefinition {
  id: ThemeId;
  name: string;
  urduName: string;
  styleFamily: string;
  tagline: string;
  badge: string;
  isDark?: boolean;
  previewSwatches: [string, string, string, string];
  vars: {
    '--canvas': string;
    '--cream': string;
    '--cream-2': string;
    '--card': string;
    '--card-grad': string;
    '--card-border': string;
    '--card-lip': string;
    '--card-glow': string;
    '--surface-subtle': string;
    '--header-bg': string;
    '--ink': string;
    '--muted': string;
    '--navy': string;
    '--navy-dark': string;
    '--navy-light': string;
    '--gold': string;
    '--gold-dark': string;
    '--gold-soft': string;
    '--teal': string;
    '--line': string;
    '--banner-grad': string;
    '--btn-primary-bg': string;
    '--btn-primary-shadow': string;
    '--btn-accent-bg': string;
    '--btn-accent-shadow': string;
    '--btn-accent-text': string;
    '--btn-surface-bg': string;
    '--btn-surface-shadow': string;
    '--btn-surface-text': string;
  };
}

export interface LandingLayoutDefinition {
  id: LandingLayoutId;
  name: string;
  urduTitle: string;
  patternType: string;
  description: string;
  highlights: string[];
  badge: string;
}

export interface LandingPromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  active: boolean;
}

export interface LandingRecentUpdate {
  id: string;
  date: string;
  title: string;
  summary: string;
}

export interface LandingUpcomingEvent {
  id: string;
  date: string;
  title: string;
  venue: string;
}

export interface SchoolThemeStudioConfig {
  activeThemeId: ThemeId;
  toggleThemeA: ThemeId;
  toggleThemeB: ThemeId;
  allowVisitorToggle: boolean;
  activeLandingLayout: LandingLayoutId;
  promoBanners: LandingPromoBanner[];
  scrollingNews: string[];
  recentUpdates: LandingRecentUpdate[];
  upcomingEvents: LandingUpcomingEvent[];
  updatedByRole: 'Admin' | 'Principal';
  updatedAt: string;
}

export const UI_UX_PRO_MAX_THEMES: SchoolThemeDefinition[] = [
  {
    id: 'royal-navy',
    name: 'Royal Daylight (White & Navy)',
    urduName: 'رائل ڈے لائٹ (وائٹ اینڈ نیوی)',
    styleFamily: 'Clean Academic Prestige (Day Mode)',
    tagline: 'Crisp porcelain-white cards with Royal Navy, Gold & Emerald accents',
    badge: '☀️ Default Day',
    isDark: false,
    previewSwatches: ['#f1f5f9', '#ffffff', '#002366', '#f5b014'],
    vars: {
      '--canvas': '#f1f5f9',
      '--cream': '#f1f5f9',
      '--cream-2': '#e2e8f0',
      '--card': '#ffffff',
      '--card-grad': 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
      '--card-border': '#cbd5e1',
      '--card-lip': '#cbd9f0',
      '--card-glow': 'rgba(0, 35, 102, 0.08)',
      '--surface-subtle': '#f8fafc',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
      '--ink': '#0f172a',
      '--muted': '#334155',
      '--navy': '#002366',
      '--navy-dark': '#00143d',
      '--navy-light': '#1d4ed8',
      '--gold': '#f5b014',
      '--gold-dark': '#b45309',
      '--gold-soft': '#fffbeb',
      '--teal': '#047857',
      '--line': '#cbd5e1',
      '--banner-grad': 'linear-gradient(135deg, #002366 0%, #0b3b99 55%, #1e3a8a 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #0b358a 0%, #002366 60%, #001847 100%)',
      '--btn-primary-shadow': '#001233',
      '--btn-accent-bg': 'linear-gradient(145deg, #ffd25a 0%, #f5b014 60%, #e09600 100%)',
      '--btn-accent-shadow': '#9e6b00',
      '--btn-accent-text': '#0f172a',
      '--btn-surface-bg': 'linear-gradient(180deg, #ffffff 0%, #f0f5ff 100%)',
      '--btn-surface-shadow': '#b8cae8',
      '--btn-surface-text': '#002366',
    },
  },
  {
    id: 'midnight-slate',
    name: 'Sapphire Night (Dark Mode)',
    urduName: 'سیفائر نائٹ (ڈارک تھیم)',
    styleFamily: 'Raised Dark Studio (Night Mode)',
    tagline: 'Deep obsidian-sapphire night mode with glowing Cyan, Gold & Emerald bevels',
    badge: '🌙 Default Night',
    isDark: true,
    previewSwatches: ['#090e1a', '#131d33', '#38bdf8', '#fbbf24'],
    vars: {
      '--canvas': '#090e1a',
      '--cream': '#090e1a',
      '--cream-2': '#10182b',
      '--card': '#131d33',
      '--card-grad': 'linear-gradient(145deg, #182542 0%, #10192e 100%)',
      '--card-border': '#283a5e',
      '--card-lip': '#050811',
      '--card-glow': 'rgba(34, 211, 238, 0.20)',
      '--surface-subtle': '#192745',
      '--header-bg': 'rgba(13, 20, 36, 0.94)',
      '--ink': '#f8fafc',
      '--muted': '#cbd5e1',
      '--navy': '#38bdf8',
      '--navy-dark': '#0284c7',
      '--navy-light': '#7dd3fc',
      '--gold': '#fbbf24',
      '--gold-dark': '#fbbf24',
      '--gold-soft': 'rgba(251, 191, 36, 0.16)',
      '--teal': '#34d399',
      '--line': '#263859',
      '--banner-grad': 'linear-gradient(135deg, #0b1528 0%, #13284c 52%, #0e3a5c 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #0ea5e9 0%, #0284c7 60%, #0369a1 100%)',
      '--btn-primary-shadow': '#082f49',
      '--btn-accent-bg': 'linear-gradient(145deg, #fde047 0%, #fbbf24 60%, #d97706 100%)',
      '--btn-accent-shadow': '#78350f',
      '--btn-accent-text': '#090e1a',
      '--btn-surface-bg': 'linear-gradient(180deg, #1e2d4d 0%, #152038 100%)',
      '--btn-surface-shadow': '#060a14',
      '--btn-surface-text': '#f8fafc',
    },
  },
  {
    id: 'emerald-academy',
    name: 'Emerald Scholar & Gold',
    urduName: 'ایمرلڈ اسکالر (گرین اینڈ گولڈ)',
    styleFamily: 'Pakistani Academic & Heritage',
    tagline: 'Bright mint-white cards with deep Emerald Green & warm Amber highlights',
    badge: '🌿 Campus Favorite',
    isDark: false,
    previewSwatches: ['#f0fdf4', '#ffffff', '#065f46', '#f59e0b'],
    vars: {
      '--canvas': '#f0fdf4',
      '--cream': '#f0fdf4',
      '--cream-2': '#dcfce7',
      '--card': '#ffffff',
      '--card-grad': 'linear-gradient(180deg, #ffffff 0%, #f4fdf8 100%)',
      '--card-border': '#bbf7d0',
      '--card-lip': '#86efac',
      '--card-glow': 'rgba(6, 95, 70, 0.08)',
      '--surface-subtle': '#f0fdf4',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
      '--ink': '#052e16',
      '--muted': '#166534',
      '--navy': '#065f46',
      '--navy-dark': '#064e3b',
      '--navy-light': '#059669',
      '--gold': '#f59e0b',
      '--gold-dark': '#92400e',
      '--gold-soft': '#fef3c7',
      '--teal': '#0d9488',
      '--line': '#bbf7d0',
      '--banner-grad': 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #059669 0%, #065f46 60%, #064e3b 100%)',
      '--btn-primary-shadow': '#022c22',
      '--btn-accent-bg': 'linear-gradient(145deg, #fcd34d 0%, #f59e0b 60%, #d97706 100%)',
      '--btn-accent-shadow': '#92400e',
      '--btn-accent-text': '#052e16',
      '--btn-surface-bg': 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
      '--btn-surface-shadow': '#86efac',
      '--btn-surface-text': '#065f46',
    },
  },
  {
    id: 'bento-sky',
    name: 'Modern Bento Sky & Cobalt',
    urduName: 'ماڈرن بینٹو اسکائی بلیو',
    styleFamily: 'Clean Bento Daylight UI',
    tagline: 'Airy sky-white surfaces with vibrant Cobalt Blue & Golden Amber clarity',
    badge: '💎 Sky Daylight',
    isDark: false,
    previewSwatches: ['#f0f9ff', '#ffffff', '#0369a1', '#eab308'],
    vars: {
      '--canvas': '#f0f9ff',
      '--cream': '#f0f9ff',
      '--cream-2': '#e0f2fe',
      '--card': '#ffffff',
      '--card-grad': 'linear-gradient(180deg, #ffffff 0%, #f5fbff 100%)',
      '--card-border': '#bae6fd',
      '--card-lip': '#7dd3fc',
      '--card-glow': 'rgba(3, 105, 161, 0.08)',
      '--surface-subtle': '#f0f9ff',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
      '--ink': '#0c4a6e',
      '--muted': '#0369a1',
      '--navy': '#0369a1',
      '--navy-dark': '#075985',
      '--navy-light': '#0284c7',
      '--gold': '#eab308',
      '--gold-dark': '#a16207',
      '--gold-soft': '#fef9c3',
      '--teal': '#0284c7',
      '--line': '#bae6fd',
      '--banner-grad': 'linear-gradient(135deg, #075985 0%, #0369a1 55%, #0284c7 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #0284c7 0%, #0369a1 60%, #075985 100%)',
      '--btn-primary-shadow': '#082f49',
      '--btn-accent-bg': 'linear-gradient(145deg, #fde047 0%, #facc15 60%, #eab308 100%)',
      '--btn-accent-shadow': '#854d0e',
      '--btn-accent-text': '#0c4a6e',
      '--btn-surface-bg': 'linear-gradient(180deg, #ffffff 0%, #e0f2fe 100%)',
      '--btn-surface-shadow': '#7dd3fc',
      '--btn-surface-text': '#0369a1',
    },
  },
  {
    id: 'oxford-crimson',
    name: 'Oxford Heritage Crimson',
    urduName: 'آکسفورڈ کریمسن اور گولڈ',
    styleFamily: 'Ivy League Executive Prestige',
    tagline: 'Warm alabaster-white surfaces with prestigious Oxford Burgundy & Gold',
    badge: '🏛️ Heritage',
    isDark: false,
    previewSwatches: ['#fafaf9', '#ffffff', '#881337', '#d97706'],
    vars: {
      '--canvas': '#fafaf9',
      '--cream': '#fafaf9',
      '--cream-2': '#f5f5f4',
      '--card': '#ffffff',
      '--card-grad': 'linear-gradient(180deg, #ffffff 0%, #fffafa 100%)',
      '--card-border': '#e7e5e4',
      '--card-lip': '#fda4af',
      '--card-glow': 'rgba(136, 19, 55, 0.08)',
      '--surface-subtle': '#fafaf9',
      '--header-bg': 'rgba(255, 255, 255, 0.95)',
      '--ink': '#1c1917',
      '--muted': '#44403c',
      '--navy': '#881337',
      '--navy-dark': '#4c0519',
      '--navy-light': '#9f1239',
      '--gold': '#d97706',
      '--gold-dark': '#92400e',
      '--gold-soft': '#fef3c7',
      '--teal': '#047857',
      '--line': '#e7e5e4',
      '--banner-grad': 'linear-gradient(135deg, #4c0519 0%, #881337 55%, #9f1239 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #9f1239 0%, #881337 60%, #4c0519 100%)',
      '--btn-primary-shadow': '#2e020f',
      '--btn-accent-bg': 'linear-gradient(145deg, #fcd34d 0%, #f59e0b 60%, #d97706 100%)',
      '--btn-accent-shadow': '#92400e',
      '--btn-accent-text': '#1c1917',
      '--btn-surface-bg': 'linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)',
      '--btn-surface-shadow': '#fda4af',
      '--btn-surface-text': '#881337',
    },
  },
  {
    id: 'soft-ivory',
    name: 'Emerald Night Studio (Dark)',
    urduName: 'ایمرلڈ نائٹ اسٹوڈیو (ڈارک)',
    styleFamily: 'Bio-Tech Raised Dark Studio',
    tagline: 'Deep forest-obsidian surfaces with luminous Mint-Emerald & Gold bevel highlights',
    badge: '⚡ Emerald Night',
    isDark: true,
    previewSwatches: ['#071310', '#0f231e', '#10b981', '#fbbf24'],
    vars: {
      '--canvas': '#071310',
      '--cream': '#071310',
      '--cream-2': '#0c1f1a',
      '--card': '#0f231e',
      '--card-grad': 'linear-gradient(145deg, #142e27 0%, #0c1d18 100%)',
      '--card-border': '#1f4a3e',
      '--card-lip': '#030907',
      '--card-glow': 'rgba(16, 185, 129, 0.24)',
      '--surface-subtle': '#16332b',
      '--header-bg': 'rgba(9, 22, 18, 0.94)',
      '--ink': '#ecfdf5',
      '--muted': '#a7f3d0',
      '--navy': '#34d399',
      '--navy-dark': '#059669',
      '--navy-light': '#6ee7b7',
      '--gold': '#fbbf24',
      '--gold-dark': '#fbbf24',
      '--gold-soft': 'rgba(251, 191, 36, 0.16)',
      '--teal': '#10b981',
      '--line': '#1f4a3e',
      '--banner-grad': 'linear-gradient(135deg, #061c16 0%, #064e3b 52%, #047857 100%)',
      '--btn-primary-bg': 'linear-gradient(145deg, #10b981 0%, #059669 60%, #047857 100%)',
      '--btn-primary-shadow': '#022c22',
      '--btn-accent-bg': 'linear-gradient(145deg, #fde047 0%, #fbbf24 60%, #d97706 100%)',
      '--btn-accent-shadow': '#78350f',
      '--btn-accent-text': '#052e16',
      '--btn-surface-bg': 'linear-gradient(180deg, #18382f 0%, #102620 100%)',
      '--btn-surface-shadow': '#040b09',
      '--btn-surface-text': '#ecfdf5',
    },
  },
];

export const LANDING_PAGE_LAYOUTS: LandingLayoutDefinition[] = [
  {
    id: 'hero-campus',
    name: 'Official Campus Showcase & Admissions',
    urduTitle: 'آفیشل اسکول ویب سائٹ، داخلے اور آن لائن رزلٹ',
    patternType: 'Flagship Public School Website',
    description:
      'Complete public school website with Interactive Campus Model, Academic Programs (Playgroup–Matric), Live DMC Result Verification, Top Merit Scholars, and Online Admission Inquiry.',
    highlights: ['Interactive Campus Hero', 'Public Roll No / DMC Checker', 'Admissions & Programs Showcase'],
    badge: '🏫 Official Public Site',
  },
  {
    id: 'bento-grid',
    name: 'Modern Smart School Bento Experience',
    urduTitle: 'ماڈرن اسمارٹ اسکول بینٹو ویب سائٹ',
    patternType: 'Interactive Bento Grid Public Showcase',
    description:
      'Contemporary Bento grid website highlighting Vision Grammar School’s Board Merit Record, Safe Gate Parent Alerts, Science & Computer Labs, and Online Result Lookup.',
    highlights: ['Smart Campus Bento Grid', 'Parent Safety & Merit Cards', 'Instant Result Verification'],
    badge: '🔥 Modern Bento',
  },
  {
    id: 'editorial-academic',
    name: 'Academic Prestige & BISE Roll of Honor',
    urduTitle: 'اعلیٰ تعلیمی معیار، پرنسپل پیغام اور میرٹ رول آف آنر',
    patternType: 'Heritage Grammar School Showcase',
    description:
      'Prestigious academic layout spotlighting BISE D.G. Khan 90%+ Position Holders, Principal’s Message, Faculty Excellence, and Admissions.',
    highlights: ['BISE D.G. Khan Merit Podium', 'Principal Welcome & Vision', 'Online Admission Desk'],
    badge: '🏆 Academic Prestige',
  },
  {
    id: 'minimal-portal',
    name: 'Parent & Student Digital Service Hub',
    urduTitle: 'والدین اور طلبہ سروس حب (رزلٹ، فیس اور داخلہ)',
    patternType: 'Fast Public Service & Result Portal',
    description:
      'Streamlined public service hub focused on instant DMC Result lookup, Fee Challan verification, Admission registration, and Portal Sign-In.',
    highlights: ['Fast Roll No Result Search', 'Admission Registration', 'Clean Portal Sign-In'],
    badge: '⚡ Parent Service Hub',
  },
];

const STORAGE_KEY = 'vision_theme_studio_config_v4';

const DEFAULT_STUDIO_CONFIG: SchoolThemeStudioConfig = {
  activeThemeId: 'royal-navy',
  toggleThemeA: 'royal-navy',
  toggleThemeB: 'midnight-slate',
  allowVisitorToggle: true,
  activeLandingLayout: 'hero-campus',
  promoBanners: [
    {
      id: 'promo-1',
      badge: 'ADMISSIONS OPEN 2026–27',
      title: '100% Merit Scholarship for 90%+ Board Scorers',
      subtitle: 'Playgroup, KG, Primary, Middle & Matric (Science / Computer) admissions now open at Block 56, D.G. Khan.',
      ctaText: 'Apply for Admission',
      active: true,
    },
    {
      id: 'promo-2',
      badge: 'SMART AI & RFID CAMPUS',
      title: 'Instant Gate RFID Alerts & AI Reading Tutor',
      subtitle: 'Real-time parent SMS/WhatsApp gate notifications and AI-assisted classroom learning.',
      ctaText: 'Explore Campus',
      active: true,
    },
  ],
  scrollingNews: [
    '📢 Admissions Open for Session 2026–27 (Playgroup to Matric Science & Computer) — Visit Campus Office in Block 56, D.G. Khan.',
    '🏆 Congratulations! Vision Grammar School students achieved 98.4% pass rate in BISE D.G. Khan Board Examinations.',
    '🪪 Live RFID Gate Attendance & Parent GSM SMS Alerts are active across all classes.',
    '📅 Annual Science, Robotics & Qiraat Exhibition scheduled for next Saturday at 09:00 AM.',
  ],
  recentUpdates: [
    {
      id: 'upd-1',
      date: '2026-03-22',
      title: 'Mid-Term Official Result Cards (DMCs) Published Online',
      summary: 'Parents and students can now verify subject-wise marks, class position, and overall school position online.',
    },
    {
      id: 'upd-2',
      date: '2026-03-18',
      title: 'Google Drive Digital Learning Library (KG to Grade 10) Launched',
      summary: 'Video lectures, structured lesson plans, and printable PDF worksheets added for all classes.',
    },
    {
      id: 'upd-3',
      date: '2026-03-12',
      title: 'Upgraded AI Reading & Pronunciation Assessment Studio',
      summary: 'Individual student reading fluency and book OCR assessments introduced in classrooms.',
    },
  ],
  upcomingEvents: [
    {
      id: 'evt-1',
      date: '2026-04-05',
      title: 'Parent-Teacher Meeting (PTM) & Result Card Distribution',
      venue: 'Main Auditorium, Vision Grammar School Block 56',
    },
    {
      id: 'evt-2',
      date: '2026-04-14',
      title: 'Annual Science, Computer & Art Exhibition 2026',
      venue: 'STEM Innovation Hall, Block 56 Campus',
    },
    {
      id: 'evt-3',
      date: '2026-04-22',
      title: 'Inter-House Qiraat, Naat & English Speech Competition',
      venue: 'Assembly Courtyard, Vision Grammar School',
    },
  ],
  updatedByRole: 'Admin',
  updatedAt: new Date().toLocaleTimeString(),
};

export function getThemeDefinition(id: ThemeId): SchoolThemeDefinition {
  return (
    UI_UX_PRO_MAX_THEMES.find((t) => t.id === id) || UI_UX_PRO_MAX_THEMES[0]
  );
}

export function getLandingLayoutDefinition(id: LandingLayoutId): LandingLayoutDefinition {
  return (
    LANDING_PAGE_LAYOUTS.find((l) => l.id === id) || LANDING_PAGE_LAYOUTS[0]
  );
}

export function loadThemeStudioConfig(): SchoolThemeStudioConfig {
  if (typeof window === 'undefined') return DEFAULT_STUDIO_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STUDIO_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STUDIO_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_STUDIO_CONFIG;
  }
}

export function applyThemeToDocument(themeId: ThemeId): void {
  if (typeof document === 'undefined') return;
  const theme = getThemeDefinition(themeId);
  const root = document.documentElement;
  root.setAttribute('data-vision-theme', theme.id);
  root.setAttribute('data-vision-mode', theme.isDark ? 'dark' : 'light');
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  if (document.body) {
    document.body.style.backgroundColor = theme.vars['--canvas'];
    document.body.style.color = theme.vars['--ink'];
  }
}

export function saveThemeStudioConfig(
  next: Partial<SchoolThemeStudioConfig>
): SchoolThemeStudioConfig {
  const current = loadThemeStudioConfig();
  const merged: SchoolThemeStudioConfig = {
    ...current,
    ...next,
    updatedAt: new Date().toLocaleTimeString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    applyThemeToDocument(merged.activeThemeId);
    window.dispatchEvent(
      new CustomEvent('vision-theme-studio-updated', { detail: merged })
    );
  }
  return merged;
}

export function toggleBetweenAdminPair(): SchoolThemeStudioConfig {
  const current = loadThemeStudioConfig();
  const nextThemeId: ThemeId =
    current.activeThemeId === current.toggleThemeA
      ? current.toggleThemeB
      : current.toggleThemeA;
  return saveThemeStudioConfig({ activeThemeId: nextThemeId });
}
