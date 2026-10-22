# ClassGuard UI redesign — 21 October 2026

## Interface
- New welcome page with a CSS 3D school scene, raised controls, and five role entry cards.
- Teal/navy/ivory workspace with sidebar navigation, mobile drawer, role selector, data cards, attendance area chart, exam bar chart, and existing feature links.
- Admin, Principal, Teacher, Parent, and Student preview experiences. Family previews show selected-student read-only results and fee summaries; staff modules remain available to staff previews.
- Framer Motion 12.38.0 provides entrance and interaction animation. CSS and MotionConfig respect reduced-motion preferences.
- Existing attendance, roster, examinations, fee ledger, reports, D.G. Khan learning tools, monthly planner, teacher mawaad, and voice assistant retained.
- School settings supports Escape, focus containment, labeled controls, holiday management, and CSV export.

## Data and permissions
These are local UI role previews, not authenticated accounts or server-enforced authorization. Parent/student selection is explicitly a preview selector. Charts aggregate the actual saved browser records, which initially include demo exams and fees. Empty attendance displays an empty state rather than invented figures. Secure role permissions and user-to-student account linking remain backend work.

## Main files
- components/ModernWorkspace.tsx: welcome page, workspace shell, role dashboards, charts.
- index.css: shared theme, 3D scene, responsive layouts, legacy module styling, motion preferences.
- App.tsx: role/navigation integration and settings.
- components/FloatingAiAssistant.tsx: initial role synchronization and responsive panel sizing.
- components/TutorModule.tsx: explicit DailyRecord type for catch-up detection.
- tsconfig.json: excludes generated dist and screenshot artifacts from type checks.

## References
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill — read SKILL.md and professional UI guidance; uses clear navigation, accessible focus states, consistent Lucide icons, responsive layout, and reduced-motion principles.
- https://npmx.dev/package-code/framer-motion/v/12.38.0 — supplied package browser returned 403; exact package version installed from npm successfully.

## Local use
Run `npm run dev`, then open http://localhost:3000. Choose a role from the welcome page; use Preview as in the header to switch roles. Production build: `npm run build`. Type check: `npx tsc --noEmit`.

## Scope
AI generation requires the existing Gemini configuration; voice dictation requires browser support and microphone permission. AI generation logic remains unchanged. A browser guard in services/geminiService.ts prevents the existing process-is-not-defined crash when opening the AI studio without a custom key. Legacy modules now share the light palette but retain their existing form layouts and business behavior.

## Verification
- TypeScript (`tsc --noEmit`) passes after excluding generated output and correcting the catch-up record type.
- Production Vite build passes; existing large JavaScript bundle warning remains (approximately 1.33 MB before gzip).
- Browser checks exercised all five role previews, parent student filtering, attendance/roster/records/reports navigation, and the repaired AI studio navigation.
- Final navigation/settings/mobile browser run reported zero uncaught page errors.
- 390px viewport checks: no horizontal overflow on landing or dashboard; mobile navigation and settings accessible. Reduced-motion mode exercised.
- Screenshots saved in artifacts/ui-review: landing-desktop.png, dashboard-desktop.png, landing-mobile.png, dashboard-mobile.png, tutor-desktop.png.
- Live Gemini generation and microphone calls were not exercised; they require configured credentials and browser permissions.
