import React, { useState, useEffect, useRef } from 'react';
import {
  Student,
  StudentExamRecord,
  StudentFeeRecord,
  AssistantActionCommand,
} from '../types';
import { interpretAppVoiceOrTextCommand } from '../services/tutorService';
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
  Compass,
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

const IDLE_BUBBLE_LINES = [
  'Say: "Generate exam paper of Mathematics class 8th half course from chapter 1 to 10"',
  'Teacher tip: "Help me make lesson plan for Science 8th class chapter Light"',
  'Parent check: "What is the exam result of my son Akhtar Ali student ID 56432?"',
  'Fee lookup: "What is the fees record of my daughter Maria GR No 563?"',
];

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
      label: '🗓️ Beaconhouse-Style Monthly Plan',
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
  const [activeRole, setActiveRole] = useState<'Admin' | 'Teacher' | 'Parent' | 'Student'>(initialRole);
  const [bubbleText, setBubbleText] = useState<string>(IDLE_BUBBLE_LINES[0]);
  const [showBubble, setShowBubble] = useState<boolean>(false);

  // AKGFlow Assistant Controls
  const [controlToolsEnabled, setControlToolsEnabled] = useState<boolean>(true);
  const [autoRunActions, setAutoRunActions] = useState<boolean>(true);
  const [readAloud, setReadAloud] = useState<boolean>(true);
  const [voiceLang, setVoiceLang] = useState<'en-US' | 'ur-PK'>('en-US');
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [voiceCallActive, setVoiceCallActive] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Pending Action Plan (when autoRunActions is unchecked, just like AKGFlow assistant_window.py)
  const [pendingAction, setPendingAction] = useState<AssistantActionCommand | null>(null);

  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: "Assalam-o-Alaikum! I'm your **ClassGuard Flow AI Assistant** (inspired by AKGFlow Assistant). You can control the entire app using **Voice Commands (Mic)** or **Text** for Admin, Teachers, Parents, and Students!",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Rotate idle speech bubble lines like floating_icon.py
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        const next =
          IDLE_BUBBLE_LINES[Math.floor(Math.random() * IDLE_BUBBLE_LINES.length)];
        setBubbleText(next);
        setShowBubble(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [isOpen]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingAction]);

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

  // Browser Web Speech Recognition (Dictation & Live Voice Call)
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
      } catch (e) {}
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
      {/* FLOATING SPARK MASCOT + SPEECH BUBBLE (Like AKGFlow floating_icon.py) */}
      {!isOpen && (
        <div className="copilot-launcher fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-2">
          {showBubble && (
            <div className="max-w-[275px] bg-[#192436] text-[#e7f0ff] border border-[#5c79b5] rounded-2xl p-3 shadow-2xl text-xs relative animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => setShowBubble(false)}
                className="absolute top-1.5 right-2 text-[10px] text-cyber-400 hover:text-white"
              >
                ✕
              </button>
              <div className="font-mono text-[10px] uppercase text-cyber-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Voice Copilot Ready
              </div>
              <div className="pr-3 leading-relaxed">{bubbleText}</div>
            </div>
          )}

          <button
            onClick={() => setIsOpen(true)}
            title="ClassGuard Flow Assistant · Click to control app by Voice or Chat"
            className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-cyber-500 via-blue-600 to-purple-700 p-1 shadow-[0_0_30px_rgba(56,189,248,0.5)] hover:scale-105 transition-all flex items-center justify-center"
          >
            <div className="w-full h-full rounded-full bg-[#0f172a] flex flex-col items-center justify-center relative overflow-hidden">
              {/* Animated FlowSpark Face */}
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-400 animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-cyber-400" />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase text-cyber-300 tracking-wider">
                AI Helper
              </span>
            </div>
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black font-mono font-bold text-[9px] uppercase">
              Voice
            </span>
          </button>
        </div>
      )}

      {/* DOCKED AKGFLOW-STYLE ASSISTANT WINDOW (Like assistant_window.py) */}
      {isOpen && (
        <div
          className={`copilot-panel fixed bottom-4 right-4 z-[95] bg-[#0f172a]/95 backdrop-blur-xl border-2 border-[#5c79b5] rounded-3xl shadow-[0_0_50px_rgba(15,23,42,0.9)] flex flex-col overflow-hidden transition-all ${
            isExpanded
              ? 'w-[95vw] sm:w-[680px] h-[85vh]'
              : 'w-[94vw] sm:w-[450px] h-[650px] max-h-[calc(100dvh-32px)]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-[#192436] border-b border-[#334155] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyber-400 to-purple-600 flex items-center justify-center shadow-neon">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <div className="text-sm font-bold text-white tracking-tight">
                  ClassGuard Flow Assistant
                </div>
                <div className="text-[10px] font-mono uppercase text-cyber-400 tracking-widest">
                  YOUR SMART SCHOOL SIDEKICK • AUTO-CONTROL
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title="Expand / Restore Assistant"
                className="p-1.5 rounded-lg bg-cyber-900 hover:bg-cyber-800 text-cyber-300 border border-cyber-700"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize to Floating Mascot"
                className="p-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white border border-rose-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Context & Tool Control Toggles (Matching assistant_window.py) */}
          <div className="px-3.5 py-2 bg-cyber-950/90 border-b border-cyber-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-cyber-400 font-mono">
                Current context: <strong className="text-white uppercase">{activeTab}</strong>
              </span>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-cyber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={controlToolsEnabled}
                    onChange={(e) => setControlToolsEnabled(e.target.checked)}
                    className="accent-cyber-500"
                  />
                  <span>Control tools</span>
                </label>
                <label className="flex items-center gap-1 text-cyber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRunActions}
                    onChange={(e) => setAutoRunActions(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  <span>Auto-run</span>
                </label>
              </div>
            </div>

            {/* Role Selector + One-Click Voice/Text Command Presets */}
            <div className="flex gap-1">
              {(['Admin', 'Teacher', 'Parent', 'Student'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRole(r)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all ${
                    activeRole === r
                      ? 'bg-cyber-500 text-black'
                      : 'bg-cyber-900 text-cyber-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ROLE_PRESETS[activeRole].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCommand(preset.command)}
                  className="px-2.5 py-1 rounded-lg bg-[#192436] hover:bg-cyber-800 border border-[#5c79b5]/50 text-[11px] text-cyber-200 transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Transcript Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyber-500 text-black font-medium'
                      : 'bg-[#192436] border border-[#5c79b5]/40 text-[#e7f0ff]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.actionSummary && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 flex items-center gap-1.5 text-[11px] font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Executed: {m.actionSummary}</span>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-cyber-500 font-mono mt-0.5 px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}
            {isProcessing && (
              <div className="text-xs font-mono text-cyber-400 animate-pulse">
                Flow Assistant is executing your command...
              </div>
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Action Review Panel (When autoRunActions is off, just like assistant_window.py) */}
          {pendingAction && (
            <div className="mx-3.5 mb-2 p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/50 flex items-center justify-between gap-2 text-xs">
              <div className="text-amber-200 truncate">
                <strong>Ready:</strong> {pendingAction.summaryText}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onExecuteCommand(pendingAction);
                    setPendingAction(null);
                  }}
                  className="px-2.5 py-1 rounded bg-emerald-500 text-black font-bold flex items-center gap-1"
                >
                  <Play className="w-3 h-3" /> Apply / Run
                </button>
                <button
                  onClick={() => setPendingAction(null)}
                  className="px-2 py-1 rounded bg-cyber-800 text-cyber-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Compose Area with Dictation Mic & Send Button */}
          <div className="p-3 bg-[#192436] border-t border-[#334155] space-y-2">
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
                placeholder="Speak or type command (e.g., 'Make Class 8 Math Exam Ch 1-10' or 'Result of Akhtar Ali 56432')..."
                className="flex-1 h-14 bg-[#0f172a] border border-[#5c79b5]/60 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
              />
              <button
                onClick={toggleDictation}
                title="Dictate voice command into message"
                className={`w-10 rounded-xl flex items-center justify-center border transition-all ${
                  isDictating
                    ? 'bg-red-600 border-red-400 text-white animate-pulse'
                    : 'bg-cyber-900 hover:bg-cyber-800 border-cyber-600 text-cyber-300'
                }`}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSendCommand()}
                title="Send & Auto-Execute Command"
                className="w-10 rounded-xl bg-cyber-500 hover:bg-cyber-400 text-black font-bold flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Voice Call & Language Bar (Matching assistant_window.py) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVoiceCall}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    voiceCallActive
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black'
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
                  className="bg-[#0f172a] border border-cyber-700 rounded-lg px-2 py-1 text-[11px] text-white"
                  title="Speech input and reply language: Urdu or English. Urdu never falls back to Hindi."
                >
                  <option value="en-US">English / Roman Urdu</option>
                  <option value="ur-PK">Urdu (پاکستان)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReadAloud(!readAloud)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border flex items-center gap-1 ${
                    readAloud
                      ? 'bg-cyber-500/20 border-cyber-400 text-cyber-300'
                      : 'bg-cyber-900 border-cyber-700 text-cyber-500'
                  }`}
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
                    onClick={stopSpeaking}
                    className="px-2 py-1 rounded-lg bg-rose-700 text-white text-[10px]"
                  >
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAiAssistant;
