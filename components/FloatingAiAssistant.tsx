import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import {
  Student,
  StudentExamRecord,
  StudentFeeRecord,
  AssistantActionCommand,
} from '../types';
import { interpretAppVoiceOrTextCommand } from '../services/tutorService';
import {
  loadThemeStudioConfig,
  getThemeDefinition,
  SchoolThemeDefinition,
} from '../services/themeService';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  Play,
  Sparkles,
  PhoneCall,
  PhoneOff,
  CheckCircle2,
  GripHorizontal,
  Move,
  RotateCcw,
} from 'lucide-react';

interface Props {
  initialRole?: 'Admin' | 'Teacher' | 'Parent' | 'Student';
  activeTab: string;
  students: Student[];
  examRecords: StudentExamRecord[];
  feeRecords: StudentFeeRecord[];
  onExecuteCommand: (cmd: AssistantActionCommand) => void;
}

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSummary?: string;
}

const ROLE_PRESETS: Record<
  'Admin' | 'Teacher' | 'Parent' | 'Student',
  { label: string; command: string }[]
> = {
  Admin: [
    {
      label: '📄 Class 8 Math Exam (Ch 1–10)',
      command:
        'Generate exam paper of Mathematics subject class 8th half course from chapter 1 to 10',
    },
    {
      label: '🗓️ 24-Day Monthly Syllabus Plan',
      command:
        'Generate monthly date wise day wise academic plan for Class 9th Science Chapter 1 to 3',
    },
  ],
  Teacher: [
    {
      label: '💡 Class 8 Science (Chapter Light)',
      command: 'Help me to make lesson plan for Science 8th class chapter Light',
    },
    {
      label: '📝 Weekly Test + Mawaad',
      command: 'Generate weekly test paper of English class 8th tenses and grammar',
    },
  ],
  Parent: [
    {
      label: '🎓 Akhtar Ali Result (ID 56432)',
      command:
        'Whats annual or mid terms exam result of my son name Akhtar Ali student ID 56432',
    },
    {
      label: '💳 Maria Fee Record (GR 563)',
      command: 'Whats fees record of my daughter Maria student ID or GR No 563',
    },
  ],
  Student: [
    {
      label: '🧠 Open Socratic AI Ustad',
      command: 'Open Socratic tutor to help me understand Photosynthesis in Saraiki and Urdu',
    },
    {
      label: '✏️ Open Live Whiteboard',
      command: 'Open smart whiteboard so I can practice solving quadratic equations',
    },
  ],
};

const FloatingAiAssistant: React.FC<Props> = ({
  initialRole = 'Admin',
  activeTab,
  students,
  examRecords,
  feeRecords,
  onExecuteCommand,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<'Admin' | 'Teacher' | 'Parent' | 'Student'>(
    initialRole
  );

  // Sync with current website theme (Light/Dark & 6 Pro Max palettes)
  const [activeTheme, setActiveTheme] = useState<SchoolThemeDefinition>(() =>
    getThemeDefinition(loadThemeStudioConfig().activeThemeId)
  );

  // Draggable state so user can freely move AI Helper with mouse cursor if it covers any button/text
  const [dragResetKey, setDragResetKey] = useState<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const wasDraggedRef = useRef<boolean>(false);
  const panelDragControls = useDragControls();

  // AI Helper Controls
  const [controlToolsEnabled, setControlToolsEnabled] = useState<boolean>(true);
  const [autoRunActions, setAutoRunActions] = useState<boolean>(true);
  const [readAloud, setReadAloud] = useState<boolean>(true);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ur-PK'>('en-US');
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [voiceCallActive, setVoiceCallActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [pendingAction, setPendingAction] = useState<AssistantActionCommand | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Assalam-o-Alaikum! I am your **AI Helper** for Vision Grammar School. You can drag me anywhere with your mouse if I cover any text, or control the app using **Voice (Mic)** or **Chat**!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Listen for live theme changes across the entire website
  useEffect(() => {
    const syncTheme = () => {
      const cfg = loadThemeStudioConfig();
      setActiveTheme(getThemeDefinition(cfg.activeThemeId));
    };
    window.addEventListener('vision-theme-studio-updated', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('vision-theme-studio-updated', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAction]);

  const v = activeTheme.vars;

  const speakReply = (text: string) => {
    if (!readAloud && !voiceCallActive) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\*|\#|•/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = voiceLang === 'ur-PK' ? 'ur-PK' : 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Speech synthesis error:', e);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleSendCommand = async (overrideText?: string) => {
    const query = (overrideText ?? inputText).trim();
    if (!query) return;

    if (!overrideText) setInputText('');

    const userTurn: ChatTurn = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userTurn]);
    setIsProcessing(true);

    const { assistantReply, actionCommand } = await interpretAppVoiceOrTextCommand(
      query,
      students,
      examRecords,
      feeRecords,
      voiceLang === 'ur-PK' ? 'Urdu + Roman Urdu' : 'Roman Urdu + English'
    );

    const botTurn: ChatTurn = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: assistantReply,
      timestamp: new Date().toLocaleTimeString(),
      actionSummary:
        actionCommand.actionType !== 'GENERAL_CHAT' ? actionCommand.summaryText : undefined,
    };

    setMessages((prev) => [...prev, botTurn]);
    setIsProcessing(false);
    speakReply(assistantReply);

    if (controlToolsEnabled && actionCommand.actionType !== 'GENERAL_CHAT') {
      if (autoRunActions) {
        onExecuteCommand(actionCommand);
        setPendingAction(null);
      } else {
        setPendingAction(actionCommand);
      }
    }
  };

  const startSpeechRecognition = (autoSendOnResult: boolean) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        'Voice recognition requires a Chromium browser (Chrome / Edge). You can also click any preset command or type directly.'
      );
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsDictating(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        if (autoSendOnResult) {
          handleSendCommand(transcript);
        } else {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      }
    };

    recognition.onerror = () => {
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const toggleDictation = () => {
    if (isDictating) {
      recognitionRef.current?.stop();
      setIsDictating(false);
    } else {
      startSpeechRecognition(false);
    }
  };

  const toggleVoiceCall = () => {
    if (voiceCallActive) {
      setVoiceCallActive(false);
      recognitionRef.current?.stop();
      stopSpeaking();
    } else {
      setVoiceCallActive(true);
      startSpeechRecognition(true);
    }
  };

  return (
    <>
      {/* =======================================================================
          1. COMPACT, MOUSE-DRAGGABLE, THEME-MATCHED "AI HELPER" FLOATING BUTTON
          (No intrusive announcement bubble covering the page!)
          ======================================================================= */}
      {!isOpen && (
        <motion.div
          key={`launcher-${dragResetKey}`}
          drag
          dragMomentum={false}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onPointerDown={(e) => {
            pointerStartRef.current = { x: e.clientX, y: e.clientY };
            wasDraggedRef.current = false;
          }}
          onPointerMove={(e) => {
            if (!pointerStartRef.current) return;
            const dx = Math.abs(e.clientX - pointerStartRef.current.x);
            const dy = Math.abs(e.clientY - pointerStartRef.current.y);
            if (dx > 6 || dy > 6) {
              wasDraggedRef.current = true;
            }
          }}
          onPointerUp={() => {
            pointerStartRef.current = null;
          }}
          className="copilot-launcher fixed bottom-5 right-5 z-[90] select-none cursor-grab active:cursor-grabbing"
          title="AI Helper · Click to open, or drag with mouse to move anywhere on screen"
        >
          <button
            type="button"
            onClick={() => {
              if (wasDraggedRef.current) {
                wasDraggedRef.current = false;
                return;
              }
              setIsOpen(true);
            }}
            style={{
              background: v['--btn-primary-bg'],
              boxShadow: v['--btn-primary-shadow'],
              borderColor: v['--gold'],
            }}
            className="group relative flex items-center gap-2.5 pl-2 pr-3.5 py-2 rounded-full border-2 text-white transition-all"
          >
            {/* Theme-Matched Logo: School Crest + Animated AI Spark Badge */}
            <div
              style={{
                background: v['--card'],
                borderColor: v['--gold'],
              }}
              className="relative w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-inner shrink-0 overflow-visible"
            >
              <img
                src="/vision-logo-crest.png"
                alt="AI Helper Logo"
                className="w-7 h-7 object-contain pointer-events-none"
              />
              <span
                style={{
                  background: v['--btn-accent-bg'],
                  color: v['--btn-accent-text'],
                }}
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm border border-white/60"
              >
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* Label + Subtle Drag Indicator */}
            <div className="flex flex-col items-start text-left pr-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold tracking-tight leading-none text-white">
                  AI Helper
                </span>
                <span
                  style={{
                    background: v['--btn-accent-bg'],
                    color: v['--btn-accent-text'],
                  }}
                  className="px-1.5 py-0.5 rounded-full font-mono font-extrabold text-[8px] uppercase leading-none"
                >
                  Voice
                </span>
              </div>
              <span className="text-[9px] font-medium text-white/85 flex items-center gap-1 mt-0.5">
                <Move className="w-2.5 h-2.5 opacity-80" /> Drag or Click
              </span>
            </div>
          </button>
        </motion.div>
      )}

      {/* =======================================================================
          2. THEME-SYNCED, MOUSE-DRAGGABLE "AI HELPER" POPUP WINDOW
          ======================================================================= */}
      {isOpen && (
        <motion.div
          key={`panel-${dragResetKey}`}
          drag
          dragListener={false}
          dragControls={panelDragControls}
          dragMomentum={false}
          style={{
            background: v['--card-grad'],
            borderColor: v['--card-border'],
            color: v['--ink'],
            boxShadow: `0 22px 55px rgba(15, 23, 42, 0.28), ${v['--card-glow']}`,
          }}
          className={`copilot-panel fixed bottom-4 right-4 z-[95] border-2 rounded-3xl flex flex-col overflow-hidden transition-colors ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[85vh]'
              : 'w-[94vw] sm:w-[440px] h-[630px] max-h-[calc(100dvh-32px)]'
          }`}
        >
          {/* Draggable Theme-Matched Header */}
          <div
            onPointerDown={(e) => panelDragControls.start(e)}
            style={{
              background: v['--banner-grad'],
              borderColor: v['--line'],
            }}
            className="p-3.5 border-b flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none text-white"
            title="Drag header with mouse to move AI Helper window anywhere"
          >
            <div className="flex items-center gap-3">
              {/* Theme-Matched Logo in Popup Header */}
              <div
                style={{
                  background: v['--card'],
                  borderColor: v['--gold'],
                }}
                className="relative w-11 h-11 rounded-2xl border-2 flex items-center justify-center shadow-md shrink-0"
              >
                <img
                  src="/vision-logo-crest.png"
                  alt="Vision Grammar School AI Helper"
                  className="w-8 h-8 object-contain pointer-events-none"
                />
                <span
                  style={{
                    background: v['--btn-accent-bg'],
                    color: v['--btn-accent-text'],
                  }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-white tracking-tight">
                    AI Helper
                  </span>
                  <span
                    style={{
                      background: v['--btn-accent-bg'],
                      color: v['--btn-accent-text'],
                    }}
                    className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase"
                  >
                    {activeTheme.name}
                  </span>
                </div>
                <div className="text-[10px] font-mono uppercase text-white/85 tracking-wider flex items-center gap-1 mt-0.5">
                  <GripHorizontal className="w-3.5 h-3.5" /> Drag Header to Move • Smart Voice & Chat
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-1.5"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDragResetKey((k) => k + 1)}
                title="Reset position to bottom-right corner"
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title="Expand / Restore AI Helper"
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize AI Helper"
                className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-300/60 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Context & Tool Control Toggles (Theme-Synced) */}
          <div
            style={{
              background: v['--surface-subtle'],
              borderColor: v['--line'],
            }}
            className="px-3.5 py-2.5 border-b space-y-2"
          >
            <div className="flex items-center justify-between text-[11px]">
              <span style={{ color: v['--muted'] }} className="font-mono">
                Active Screen:{' '}
                <strong style={{ color: v['--navy'] }} className="uppercase font-extrabold">
                  {activeTab}
                </strong>
              </span>
              <div className="flex items-center gap-2.5">
                <label
                  style={{ color: v['--ink'] }}
                  className="flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={controlToolsEnabled}
                    onChange={(e) => setControlToolsEnabled(e.target.checked)}
                    style={{ accentColor: v['--navy'] }}
                  />
                  <span>Control tools</span>
                </label>
                <label
                  style={{ color: v['--ink'] }}
                  className="flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <input
                    type="checkbox"
                    checked={autoRunActions}
                    onChange={(e) => setAutoRunActions(e.target.checked)}
                    style={{ accentColor: v['--teal'] }}
                  />
                  <span>Auto-run</span>
                </label>
              </div>
            </div>

            {/* Role Selector Tabs synced with Theme */}
            <div className="flex gap-1.5">
              {(['Admin', 'Teacher', 'Parent', 'Student'] as const).map((r) => {
                const isSelected = activeRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActiveRole(r)}
                    style={
                      isSelected
                        ? {
                            background: v['--btn-primary-bg'],
                            color: '#ffffff',
                            borderColor: v['--navy'],
                          }
                        : {
                            background: v['--card'],
                            color: v['--muted'],
                            borderColor: v['--line'],
                          }
                    }
                    className="flex-1 py-1.5 rounded-xl text-[10px] font-mono uppercase font-extrabold border transition-all"
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {/* One-Click Preset Command Chips synced with Theme */}
            <div className="flex flex-wrap gap-1.5">
              {ROLE_PRESETS[activeRole].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendCommand(preset.command)}
                  style={{
                    background: v['--card'],
                    borderColor: v['--card-border'],
                    color: v['--ink'],
                  }}
                  className="px-2.5 py-1 rounded-xl border text-[11px] font-semibold hover:opacity-90 transition-all text-left shadow-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Transcript Area synced with Theme */}
          <div
            style={{ background: v['--cream'] }}
            className="flex-1 overflow-y-auto p-3.5 space-y-3"
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    style={
                      isUser
                        ? {
                            background: v['--btn-primary-bg'],
                            color: '#ffffff',
                            boxShadow: v['--btn-primary-shadow'],
                          }
                        : {
                            background: v['--card'],
                            borderColor: v['--card-border'],
                            color: v['--ink'],
                          }
                    }
                    className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isUser ? 'font-semibold' : 'border shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    {m.actionSummary && (
                      <div
                        style={{
                          background: v['--gold-soft'],
                          borderColor: v['--gold'],
                          color: v['--ink'],
                        }}
                        className="mt-2 px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-[11px] font-mono font-bold"
                      >
                        <CheckCircle2
                          style={{ color: v['--teal'] }}
                          className="w-3.5 h-3.5 shrink-0"
                        />
                        <span>Executed: {m.actionSummary}</span>
                      </div>
                    )}
                  </div>
                  <span
                    style={{ color: v['--muted'] }}
                    className="text-[9px] font-mono mt-1 px-1"
                  >
                    {m.timestamp}
                  </span>
                </div>
              );
            })}
            {isProcessing && (
              <div
                style={{ color: v['--navy'] }}
                className="text-xs font-mono font-bold animate-pulse"
              >
                AI Helper is processing your request...
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Action Review Panel (When autoRunActions is off) */}
          {pendingAction && (
            <div
              style={{
                background: v['--gold-soft'],
                borderColor: v['--gold'],
                color: v['--ink'],
              }}
              className="mx-3.5 mb-2 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs"
            >
              <div className="truncate">
                <strong>Ready:</strong> {pendingAction.summaryText}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onExecuteCommand(pendingAction);
                    setPendingAction(null);
                  }}
                  style={{
                    background: v['--btn-primary-bg'],
                    color: '#ffffff',
                  }}
                  className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Apply / Run
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  style={{
                    background: v['--card'],
                    color: v['--muted'],
                    borderColor: v['--line'],
                  }}
                  className="px-2 py-1 rounded-lg border"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Compose Area with Dictation Mic & Send Button synced with Theme */}
          <div
            style={{
              background: v['--surface-subtle'],
              borderColor: v['--line'],
            }}
            className="p-3 border-t space-y-2.5"
          >
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendCommand();
                  }
                }}
                style={{
                  background: v['--card'],
                  borderColor: v['--card-border'],
                  color: v['--ink'],
                }}
                placeholder="Ask AI Helper by voice or text (e.g., 'Make Class 8 Math Exam' or 'Result of Akhtar Ali 56432')..."
                className="flex-1 h-14 border-2 rounded-xl p-2.5 text-xs outline-none resize-none font-medium"
              />
              <button
                type="button"
                onClick={toggleDictation}
                title="Dictate voice command into message"
                style={
                  isDictating
                    ? undefined
                    : {
                        background: v['--card'],
                        borderColor: v['--card-border'],
                        color: v['--navy'],
                      }
                }
                className={`w-11 rounded-xl flex items-center justify-center border-2 transition-all ${
                  isDictating ? 'bg-red-600 border-red-400 text-white animate-pulse' : ''
                }`}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleSendCommand()}
                title="Send Command to AI Helper"
                style={{
                  background: v['--btn-accent-bg'],
                  color: v['--btn-accent-text'],
                  boxShadow: v['--btn-accent-shadow'],
                }}
                className="w-11 rounded-xl font-extrabold flex items-center justify-center transition-transform active:translate-y-0.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Voice Call & Language Bar synced with Theme */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceCall}
                  style={
                    voiceCallActive
                      ? undefined
                      : {
                          background: v['--btn-primary-bg'],
                          color: '#ffffff',
                        }
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm ${
                    voiceCallActive ? 'bg-red-600 text-white animate-pulse' : ''
                  }`}
                >
                  {voiceCallActive ? (
                    <>
                      <PhoneOff className="w-3.5 h-3.5" /> End Voice Call
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-3.5 h-3.5" /> Start Voice Call
                    </>
                  )}
                </button>

                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value as 'en-US' | 'ur-PK')}
                  style={{
                    background: v['--card'],
                    borderColor: v['--card-border'],
                    color: v['--ink'],
                  }}
                  className="border rounded-xl px-2.5 py-1.5 text-[11px] font-bold"
                  title="Speech input and reply language"
                >
                  <option value="en-US">English / Roman Urdu</option>
                  <option value="ur-PK">Urdu (پاکستان)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setReadAloud(!readAloud)}
                  style={
                    readAloud
                      ? {
                          background: v['--gold-soft'],
                          borderColor: v['--gold'],
                          color: v['--ink'],
                        }
                      : {
                          background: v['--card'],
                          borderColor: v['--line'],
                          color: v['--muted'],
                        }
                  }
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1"
                >
                  {readAloud ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>Read Aloud</span>
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-bold"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default FloatingAiAssistant;
