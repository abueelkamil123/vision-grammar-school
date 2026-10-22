# Project Handoff: ClassGuard AI — School Management & Smart Learning Ecosystem

**Date:** October 21, 2026  
**Document:** System Architecture & Smart AI Learning Handoff  
**Target Platform:** Web Application (React 19 + TypeScript + Vite + Google Gemini API + Flask Backend)  
**Supported Languages:** Multilingual (English, Urdu اردو, Sindhi سنڌي)

---

## 1. Executive Summary & Purpose

**ClassGuard AI** is a unified **Biometric Attendance & Smart AI Personal Tutoring System** designed for K–12 schools. Rather than treating classroom attendance and student learning as disconnected silos, ClassGuard AI links daily attendance records, curriculum management, multimodal homework assessments, and personalized AI study tools into a single closed-loop educational platform.

### Core Capabilities
1. **Biometric Classroom Attendance (`AttendanceTaker.tsx`, `geminiService.ts`):**
   - Uses Gemini Vision (`gemini-3-flash-preview`) to match faces in a single classroom photo against the student reference roster.
   - Tracks `Present`, `Absent`, `On Leave`, and `Holiday` states with CSV exports and automated parent SMS summaries.
2. **Multimodal Homework & Oral Assessment (`TutorModule.tsx`, `tutorService.ts`):**
   - **Writing & Script Analysis:** Grades handwritten English, Urdu (Nastaliq/Nuqta accuracy), and Sindhi (52-letter script formation) assignments against reference texts/images.
   - **Step-by-Step Math Logic Grader:** Traces handwritten math solutions line-by-line to pinpoint the exact step where a calculation or conceptual error occurred.
   - **Reading Fluency & Pronunciation Coach:** Evaluates student audio recordings against target passages for pronunciation, fluency, and skipped words.
3. **Adaptive Student Learning Profiles (`StudentLearningProfile`):**
   - Automatically extracts `strengths` and `weaknesses` tags from every assessment and interactive quiz.
   - Removes a weakness tag automatically once the student demonstrates mastery in subsequent assessments.

---

## 2. Smart AI Learning Suite (New & Expanded Tools)

To help students learn in a truly smart, active way powered by Google Gemini API keys, the **AI Tutor Module** includes six specialized AI tools:

| Tool | Pedagogical Goal | Gemini Capability Used |
| :--- | :--- | :--- |
| **1. AI Lesson Plan, Flashcard & MCQ Quiz Creator** | Generates structured Lesson Plans, interactive flip-card Flashcards, and auto-graded Multiple-Choice Quizzes (MCQs) tailored to each student's recorded weaknesses. | Structured JSON Schema (`responseSchema`) with `gemini-3-flash-preview` |
| **2. Interactive Socratic Doubt-Solver (Chat & Voice)** | Guides students to discover answers themselves through step-by-step hints and guiding questions in English, Urdu, or Sindhi instead of just giving away answers. | Multi-turn Socratic System Prompt + Web Speech TTS/Mic |
| **3. Textbook Scanner & Smart Summary / Mind-Map** | Turns a photo of any textbook page or board notes into "Explain Like I'm 10" summaries, key vocabulary tables (with Urdu/Sindhi translations), and concept maps. | Multimodal Vision + Structured JSON extraction |
| **4. On-Screen Smart Whiteboard & Scratchpad** | Built-in HTML5 drawing canvas where students practice Urdu/Sindhi handwriting strokes or solve math problems and request live AI "Check My Step" hints without leaving the app. | Canvas-to-Base64 PNG + Vision Step Hinting (`gemini-3-pro-preview`) |
| **5. Attendance-Linked "Missed Class Catch-Up"** | Automatically detects students marked `Absent` or `On Leave` in the Attendance module and generates a 15-minute self-study Catch-Up Pack + parent WhatsApp share link. | Cross-module state (`AttendanceData` + `CurriculumTopic`) |
| **6. Dynamic Gemini API Key Manager** | Allows teachers/admins to configure their Gemini API Key directly in the UI (`localStorage` fallback + `.env.local` support) so all AI tools work seamlessly. | Dynamic client initialization in `tutorService.ts` & `geminiService.ts` |

---

## 2.1 Regional Problem-to-Solution Matrix (Dera Ghazi Khan & South Punjab Context)

Research into schools across **Dera Ghazi Khan, Taunsa Sharif, Rajanpur, Muzaffargarh, Layyah, and Koh-e-Suleman** identified five systemic barriers to student learning, each directly addressed in ClassGuard AI:

| Regional Problem in D.G. Khan & South Punjab | Root Cause on the Ground | How ClassGuard AI Solves It |
| :--- | :--- | :--- |
| **1. Mother-Tongue Disconnect & Rote Learning (*Ratta*)** | Over 80% of rural students speak **Saraiki** or **Balochi** at home, while PCTB textbooks and BISE DG Khan exams are in **Urdu** and **English**. Students memorize without comprehension. | Added **Saraiki (سرائیکی)** & **Balochi (بلوچی)** support alongside Urdu/English/Sindhi. Every Lesson Plan, Textbook Scan, and Socratic Coach session includes a **Mother-Tongue Concept Bridge**. |
| **2. Single-Teacher / Multigrade Classrooms** | Hundreds of rural primary/middle schools have 1 or 2 teachers managing up to 5 grades simultaneously in one room. | **Single-Teacher Multigrade Mode** in the AI Lesson Planner creates split-classroom routines (teacher-led instruction for one grade while other grades run self-directed flashcards/peer quizzes). |
| **3. Seasonal Absenteeism (Wheat/Cotton Harvest & Rod-Kohi Floods)** | Students miss weeks during spring wheat harvesting, autumn cotton picking, or hill-torrent (*Rod-Kohi*) monsoon floods and drop out because they cannot catch up. | **Attendance-Linked Catch-Up Generator** reads `AttendanceData` for absent students, builds a **15-Minute Rapid Home Catch-Up Sheet**, and creates a 1-click **WhatsApp message for parents**. |
| **4. Missing Science Labs & Reference Books ("Four-Wall" Schools)** | Rural schools often lack laboratory apparatus, chemicals, or supplementary study guides. | **Textbook Page Scanner & Virtual Village Lab** turns a smartphone photo of any PCTB page into an ELI10 summary, Mind-Map, Trilingual Vocabulary list, and a **Zero-Equipment Village Science Experiment** using household items. |
| **5. High BISE DG Khan Matric Failures in English, Math & Science** | Lack of step-by-step problem-solving feedback and board-pattern MCQ practice. | **Auto-Graded BISE DG Khan MCQ Quiz Creator** + **Live On-Screen Smart Whiteboard** where Gemini inspects student math steps and handwriting strokes in real time. |

---

## 2.2 Customer Voice Note Requirements (200% Implementation) & Floating Voice AI Copilot

Based on the school principal's WhatsApp voice note (`customer requirements whatsapp voice .ogg`) and the user's requirement for an AKGFlow-style Floating Voice & Text Assistant:

| Feature Module | Customer / User Requirement | 200% Implementation in ClassGuard AI |
| :--- | :--- | :--- |
| **1. Whole-Month Date-Wise & Day-Wise Syllabus Planner** | *"Pooray mahinay ka date-wise, day-wise plan har subject ka, jis tarah Beaconhouse, City School, Allied School ka hota hai, hamaray apnay course ke mutabiq: kitna parhana hai, kya parhana hai, kaise parhana hai."* | **`generateMonthlyAcademicPlanner` (`TutorModule.tsx` -> System School AI Agent)**: Generates a full 24-Working-Day Month Plan (4 Weeks × 6 Days) for any school textbook/syllabus with exact daily page targets (*Kitna Parhana Hai*), core concepts (*Kya Parhana Hai*), methodology (*Kaise Parhana Hai*), CW/HW Diary, and scheduled Weekly/Monthly test checkpoints. |
| **2. 1-Click Daily Teacher "Mawaad" (Ready-to-Teach Material)** | *"Teachers ko parhane ka mawaad (material) dena sab se bara masla hai."* | **`generateDailyTeacherMawaad`**: Clicking **"Generate Teacher Mawaad"** on any day in the monthly calendar generates a word-for-word Teacher Script, exact Blackboard Layout, Solved Textbook Exercises, 3 Quick Oral Check Questions, and a **Principal Day-Completion Audit Toggle**. |
| **3. Automated Weekly, Monthly, Mid-Term & Annual Exam Paper Generator** | *"Weekly test, Monthly test, Term exam, aur Annual exam banana bohat mushkil kaam hai."* | **`generateExamPaper`**: Generates board-standard (BISE DG Khan / Beaconhouse style) **Section A (MCQs), Section B (Short Questions), and Section C (Long Questions)** for any chapter range (e.g., *"Class 8 Mathematics Half Course Ch 1 to 10"*), plus a toggleable **Teacher Answer Key & Marking Rubric** and **1-Click Print Exam Paper**. |
| **4. Student Exam Results & Fee Ledger (`ExamAndFeeManager.tsx`)** | Instant lookup and management of student exam marks (Weekly, Monthly, Mid-Term, Annual DMC) and fee records (Monthly fee, paid, pending dues, challan status) by Student ID or GR No. | **`ExamAndFeeManager.tsx`**: Complete Exam DMC & Fee Ledger tab pre-seeded with demo records including **Akhtar Ali (`ID: 56432`, Class 8-A)** and **Maria Bibi (`GR No: 563`, Class 9-A)**, with search by Name/ID/GR No, 1-click Fee Payment collection, and new Exam/Fee record entry. |
| **5. AKGFlow-Style Floating Voice & Text AI Copilot (`FloatingAiAssistant.tsx`)** | Floating assistant icon & docked voice/chat panel modeled on `akgflow-native` (`floating_icon.py` & `assistant_window.py`) so Admin, Teachers, Parents, and Students can control the whole app by Voice or Text. | **`FloatingAiAssistant.tsx` + `interpretAppVoiceOrTextCommand`**: Features the animated **FlowSpark Mascot**, rotating status bubble, `Control tools` & `Auto-run` toggles, Role Selector (`Admin`, `Teacher`, `Parent`, `Student`), Web Speech Mic Dictation (`en-US` & `ur-PK`), **Live Voice Call Mode**, and instant execution of exam generation, lesson planning, and student result/fee queries. |

---

## 3. Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 ClassGuard AI Frontend                                   │
│                                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐  ┌────────────────────────┐  │
│  │   Protocol   │  │   Roster &   │  │  Exams & Fee       │  │  AI Smart Tutor &      │  │
│  │ (Camera Face │  │  Analytics   │  │  Ledger            │  │  System School Agent   │  │
│  │  Attendance) │  │              │  │ (ExamAndFeeManager)│  │  (TutorModule)         │  │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘  └───────────┬────────────┘  │
│         └─────────────────┴────────────────────┼─────────────────────────┘               │
│                                                ▲                                         │
│                                                │ Auto-Navigation & Tool Execution        │
│                          ┌─────────────────────┴─────────────────────┐                   │
│                          │   Floating Voice & Text AI Copilot        │                   │
│                          │   (FloatingAiAssistant.tsx - AKGFlow UI)  │                   │
│                          └─────────────────────┬─────────────────────┘                   │
└────────────────────────────────────────────────┼─────────────────────────────────────────┘
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI & Pedagogical Service Layer                              │
│  - services/geminiService.ts (Biometric Vision + Parent SMS Reports)                     │
│  - services/tutorService.ts  (Monthly Planner, Daily Teacher Mawaad, Exam Generator,     │
│    Voice/Text Command Router, Assessments, MCQ/Flashcards, Socratic, Scanner, Catch-Up)  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Files & Responsibilities

- [`App.tsx`](file:///e:/Projects/school%20managment%20soft/App.tsx): Main layout, navigation tabs (`Protocol`, `Roster`, `Exams & Fees`, `Analytics`, `AI Tutor`), pre-seeded student/exam/fee database (`Akhtar Ali #56432`, `Maria Bibi #563`), and global mounting of `FloatingAiAssistant`.
- [`types.ts`](file:///e:/Projects/school%20managment%20soft/types.ts): TypeScript interfaces for `Student`, `AttendanceData`, `CurriculumTopic`, `AssessmentRecord`, `StudentLearningProfile`, `DailyTeachingPlan`, `MonthlyAcademicPlan`, `ExamPaperResult`, `StudentExamRecord`, `StudentFeeRecord`, and `AssistantActionCommand`.
- [`components/FloatingAiAssistant.tsx`](file:///e:/Projects/school%20managment%20soft/components/FloatingAiAssistant.tsx): AKGFlow-inspired floating mascot & docked Voice/Text AI Copilot with `en-US` / `ur-PK` speech recognition, Live Voice Call mode, TTS read-aloud, role quick-prompts, and automated app control.
- [`components/ExamAndFeeManager.tsx`](file:///e:/Projects/school%20managment%20soft/components/ExamAndFeeManager.tsx): Comprehensive Student Exam Results (Weekly, Monthly, Mid-Term, Annual DMC) & Fee Ledger manager with search by Name, Student ID, or GR No.
- [`services/geminiService.ts`](file:///e:/Projects/school%20managment%20soft/services/geminiService.ts): Classroom face recognition and parent attendance report generator.
- [`services/tutorService.ts`](file:///e:/Projects/school%20managment%20soft/services/tutorService.ts): Core AI engine powering the System School Monthly Planner, Daily Teacher Mawaad generator, Weekly/Monthly/Term/Annual Exam Paper generator, Floating Copilot intent router, and smart learning tools.
- [`components/TutorModule.tsx`](file:///e:/Projects/school%20managment%20soft/components/TutorModule.tsx): Unified UI for teachers and students featuring the **System School AI Agent** (`view === 'system_agent'`), AI Creator Studio, Socratic Coach, Textbook Scanner, Live Whiteboard, Assessment Console, and Missed-Class Catch-Up Hub.
- [`SESSION_CHAT_HISTORY.md`](file:///e:/Projects/school%20managment%20soft/SESSION_CHAT_HISTORY.md): Complete chronological chat log, research notes, customer voice note transcript, and implementation details for Codex continuation.

---

## 5. Codex Continuation Guide & Quick Start

> **Note for Codex / Next AI Agent:** Read both this file (`HANDOFF.md`) and [`SESSION_CHAT_HISTORY.md`](file:///e:/Projects/school%20managment%20soft/SESSION_CHAT_HISTORY.md) first to understand the full context of what has already been built and verified.

### 5.1 Development & Build Commands
```powershell
# Run Vite development server
npm run dev

# Verify production TypeScript + Vite bundle (currently passes with 0 errors)
npm run build
```

### 5.2 Gemini API Key Configuration
- Users can set their Gemini API key either in `.env.local` (`GEMINI_API_KEY=...`) **or** directly in the app header via the **"AI Key Ready / Set Gemini Key"** button (stored in `localStorage` under `custom_gemini_api_key` and read dynamically via `getActiveApiKey()` in `services/geminiService.ts`).

### 5.3 Pre-Seeded Test Students & Voice/Text Copilot Commands
The Floating AI Copilot (`FloatingAiAssistant.tsx`) can be tested immediately with these voice or text prompts:
1. **Generate Exam Paper:**  
   `"generate exam paper of mathematics subject class 8th half course from chapter 1 to 10"`
2. **Generate Lesson Plan:**  
   `"help me to make lesson plan for science 8th class chapter light"`
3. **Generate Beaconhouse/City/Allied Monthly Date-Wise Plan:**  
   `"make monthly date-wise plan for Class 8 Science Chapters 1 to 3"`
4. **Parent Exam Result Lookup (Akhtar Ali — ID `56432`):**  
   `"whats annual or mid terms exam result of my son name akhtar ali student id 56432"`
5. **Parent Fee Record Lookup (Maria Bibi — GR No `563`):**  
   `"whats fees record of my daughter maria student id or GR no 563"`

### 5.4 Potential Next Steps for Codex
- **Backend Persistence (SQLite / PostgreSQL via `app.py`):** Currently, `students`, `attendance`, `examRecords`, `feeRecords`, `monthlyPlan`, and `profiles` are persisted in browser `localStorage`. Connecting them to the Flask backend (`app.py`) or SQLite database will enable multi-device sync across the school.
- **PDF & Bilingual Urdu Nastaliq Print Styling:** Enhance the print stylesheets for Exam Papers, Monthly Planners, and Fee Challans with school logo headers and Urdu Nastaliq font embedding.
- **WhatsApp Business API Webhook:** Automate sending absent catch-up packs, fee reminders, and DMC result cards directly via WhatsApp Business API.

## UI continuation — 21 October 2026
A modern landing page and role-preview workspace were added. See UI_REDESIGN.md for architecture, local preview instructions, references, and permission boundaries. Main new files: components/ModernWorkspace.tsx and index.css. Existing school tools remain connected through App.tsx; role previews are not secure authentication. Framer Motion 12.38.0 is installed. Dashboard charts use browser records and explicitly handle missing attendance.
