import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Send,
  Calendar,
  Unlock,
  Lock,
  Users,
  Volume2,
  StopCircle,
  CheckCircle2,
  Circle,
  CreditCard,
  Smartphone,
  Mail,
  MessageSquare,
  Wifi,
  LogIn,
  LogOut,
  Sparkles,
  Check,
  RefreshCw,
  ExternalLink,
  Bell,
} from 'lucide-react';
import {
  Student,
  AttendanceData,
  AttendanceStatus,
  DailyRecord,
  Holiday,
} from '../types';
import { analyzeClassroomImage } from '../services/geminiService';
import {
  GsmGatewayConfig,
  HotspotDetectionResult,
  MessageDispatchLog,
  RecipientRole,
  loadGsmConfig,
  saveGsmConfig,
  loadMessageLogs,
  detectHotspotGateway,
  buildAttendanceMessage,
  sendGsmSms,
  sendViaWhatsAppWeb,
  sendBackendEmail,
} from '../services/messagingService';

interface Props {
  students: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  attendanceData: AttendanceData;
  setAttendanceData: React.Dispatch<React.SetStateAction<AttendanceData>>;
  holidays: Holiday[];
}

interface RfidTapDisplay {
  student: Student;
  serialTyped: string;
  gateAction: 'IN' | 'OUT';
  checkInTime: string;
  checkOutTime?: string;
  dateStr: string;
  smsStatusText: string;
}

const STAFF_CONTACTS: Array<{
  id: string;
  name: string;
  role: RecipientRole;
  phone: string;
  email: string;
}> = [
  {
    id: 'stf-principal',
    name: 'Principal — Vision Grammar School',
    role: 'Principal',
    phone: '+923009990001',
    email: 'principal@visiongrammarschool.edu.pk',
  },
  {
    id: 'stf-teacher-math',
    name: 'Ustad Ahmed Raza (Class 8-A Math)',
    role: 'Teacher',
    phone: '+923009990002',
    email: 'ahmed.raza@visiongrammarschool.edu.pk',
  },
  {
    id: 'stf-teacher-sci',
    name: 'Ustani Sana Fatima (Class 9-A Science)',
    role: 'Teacher',
    phone: '+923009990003',
    email: 'sana.fatima@visiongrammarschool.edu.pk',
  },
];

const AttendanceTaker: React.FC<Props> = ({
  students,
  setStudents,
  attendanceData,
  setAttendanceData,
  holidays,
}) => {
  // Top-level Attendance Mode:
  // 1) 'rfid_gate' -> Live USB RFID Card Gate Terminal (1st Tap = IN, 2nd Tap = OUT, Blinking Cursor)
  // 2) 'ai_photo'  -> AI Classroom Group Photo Attendance (Present / Absent)
  // 3) 'messaging' -> GSM Mobile SIM Virtual Server + WhatsApp Web + Backend Email Hub
  const [activeMode, setActiveMode] = useState<'rfid_gate' | 'ai_photo' | 'messaging'>(
    'rfid_gate'
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>('All');

  // --- LIVE USB RFID GATE TERMINAL STATE ---
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [rfidInput, setRfidInput] = useState<string>('');
  const [keepCursorLocked, setKeepCursorLocked] = useState<boolean>(true);
  const [voiceAnnounceTap, setVoiceAnnounceTap] = useState<boolean>(true);
  const [lastTappedCard, setLastTappedCard] = useState<RfidTapDisplay | null>(null);
  const [unknownCardSerial, setUnknownCardSerial] = useState<string | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<string>(students[0]?.id || '');

  // --- GSM MOBILE SIM + WHATSAPP WEB + EMAIL GATEWAY STATE ---
  const [gsmConfig, setGsmConfig] = useState<GsmGatewayConfig>(() => loadGsmConfig());
  const [messageLogs, setMessageLogs] = useState<MessageDispatchLog[]>(() =>
    loadMessageLogs()
  );
  const [configSavedToast, setConfigSavedToast] = useState<string>('');
  const [hotspotInfo, setHotspotInfo] = useState<HotspotDetectionResult | null>(null);
  const [isDetectingHotspot, setIsDetectingHotspot] = useState<boolean>(false);

  // Custom Broadcast Composer State (Parents, Students, Teachers, Principal)
  const [broadcastRole, setBroadcastRole] = useState<RecipientRole>('Parent');
  const [broadcastRecipientId, setBroadcastRecipientId] = useState<string>(
    students[0]?.id || ''
  );
  const [broadcastCustomPhone, setBroadcastCustomPhone] = useState<string>('');
  const [broadcastText, setBroadcastText] = useState<string>(
    'VISION GRAMMAR SCHOOL (Block 56, D.G. Khan): Assalam-o-Alaikum! Monthly PTM & Result Day will be held this Saturday at 09:00 AM.'
  );
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);

  // --- AI CLASSROOM PHOTO STATE ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [headcount, setHeadcount] = useState<string>('');
  const [processResult, setProcessResult] = useState<{
    description: string;
    totalFacesDetected: number;
    tempStatus: Record<string, AttendanceStatus>;
  } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const uniqueClasses = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students]
  );

  const targetStudents = useMemo(() => {
    return selectedClass === 'All'
      ? students
      : students.filter((s) => s.grade === selectedClass);
  }, [students, selectedClass]);

  const dateInfo = useMemo(() => {
    const d = new Date(selectedDate);
    const isSunday = d.getDay() === 0;
    const holiday = holidays.find((h) => h.date === selectedDate);
    return { isSunday, holiday };
  }, [selectedDate, holidays]);

  const isHoliday = dateInfo.isSunday || !!dateInfo.holiday;
  const holidayReason = dateInfo.isSunday
    ? 'Sunday - Weekly Holiday'
    : dateInfo.holiday?.name;

  // Keep the RFID typing cursor blinking continuously in 'rfid_gate' mode
  useEffect(() => {
    if (activeMode !== 'rfid_gate' || !keepCursorLocked) return;

    // Focus immediately
    rfidInputRef.current?.focus();

    const interval = setInterval(() => {
      const activeEl = document.activeElement;
      const isOtherInput =
        activeEl &&
        activeEl !== rfidInputRef.current &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.tagName === 'TEXTAREA');

      if (!isOtherInput && rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }, 900);

    return () => clearInterval(interval);
  }, [activeMode, keepCursorLocked]);

  // Play a pleasant gate terminal beep using Web Audio API
  const playGateBeep = (type: 'IN' | 'OUT' | 'ERROR') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'IN') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.09);
      } else if (type === 'OUT') {
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.setValueAtTime(587, ctx.currentTime + 0.09);
      } else {
        osc.frequency.setValueAtTime(280, ctx.currentTime);
      }

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio errors
    }
  };

  // Announce student arrival/departure via SpeechSynthesis
  const announceGateEvent = (studentName: string, gateAction: 'IN' | 'OUT') => {
    if (!voiceAnnounceTap || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const msg =
        gateAction === 'IN'
          ? `${studentName}, Checked In. Welcome to Vision Grammar School.`
          : `${studentName}, Checked Out. Khuda Hafiz.`;
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore
    }
  };

  /**
   * Core handler when the USB RFID Reader types a Card Serial Number and presses Enter
   */
  const handleRfidCardTap = async (rawSerialInput: string) => {
    const cleanSerial = rawSerialInput.trim();
    // Always clear the input immediately and keep cursor blinking for the next student
    setRfidInput('');
    setTimeout(() => {
      rfidInputRef.current?.focus();
    }, 10);

    if (!cleanSerial) return;

    // Match student by rfidCardNo, grNo, or id (also stripping leading zeros for flexible Chinese 10-digit readers)
    const strippedSerial = cleanSerial.replace(/^0+/, '');
    const matchedStudent = students.find((s) => {
      const card = (s.rfidCardNo || '').trim();
      const strippedCard = card.replace(/^0+/, '');
      return (
        card.toLowerCase() === cleanSerial.toLowerCase() ||
        (strippedCard && strippedCard === strippedSerial) ||
        s.grNo.toLowerCase() === cleanSerial.toLowerCase() ||
        s.grNo === strippedSerial ||
        s.id.toLowerCase() === cleanSerial.toLowerCase()
      );
    });

    if (!matchedStudent) {
      playGateBeep('ERROR');
      setUnknownCardSerial(cleanSerial);
      if (students.length > 0 && !assignStudentId) {
        setAssignStudentId(students[0].id);
      }
      return;
    }

    setUnknownCardSerial(null);

    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const existingToday = attendanceData[matchedStudent.id]?.[selectedDate];

    // 1st Tap = IN (Check-in), 2nd Tap = OUT (Check-out)
    let nextGateAction: 'IN' | 'OUT' = 'IN';
    let checkInTime = nowTime;
    let checkOutTime: string | undefined = undefined;

    if (
      existingToday &&
      existingToday.status === AttendanceStatus.PRESENT &&
      existingToday.attendanceState === 'IN'
    ) {
      // Student is already IN -> This 2nd tap marks them OUT!
      nextGateAction = 'OUT';
      checkInTime = existingToday.checkInTime || nowTime;
      checkOutTime = nowTime;
    } else if (existingToday && existingToday.attendanceState === 'OUT') {
      // If tapped again after OUT, toggle back to IN (re-entry) or update
      nextGateAction = 'IN';
      checkInTime = nowTime;
      checkOutTime = undefined;
    }

    const updatedRecord: DailyRecord = {
      date: selectedDate,
      status: AttendanceStatus.PRESENT,
      checkInTime,
      checkOutTime,
      attendanceState: nextGateAction,
      method: 'RFID_CARD',
      rfidSerial: matchedStudent.rfidCardNo || cleanSerial,
      smsNotified: gsmConfig.autoSendOnRfid,
    };

    setAttendanceData((prev) => ({
      ...prev,
      [matchedStudent.id]: {
        ...(prev[matchedStudent.id] || {}),
        [selectedDate]: updatedRecord,
      },
    }));

    playGateBeep(nextGateAction);
    announceGateEvent(matchedStudent.name, nextGateAction);

    const eventType = nextGateAction === 'IN' ? 'RFID_IN' : 'RFID_OUT';
    const smsText = buildAttendanceMessage({
      studentName: matchedStudent.name,
      fatherName: matchedStudent.fatherName,
      grade: matchedStudent.grade,
      grNo: matchedStudent.grNo,
      rfidSerial: matchedStudent.rfidCardNo || cleanSerial,
      eventType,
      timeStr: nowTime,
      dateStr: selectedDate,
    });

    setLastTappedCard({
      student: matchedStudent,
      serialTyped: matchedStudent.rfidCardNo || cleanSerial,
      gateAction: nextGateAction,
      checkInTime,
      checkOutTime,
      dateStr: selectedDate,
      smsStatusText: gsmConfig.autoSendOnRfid
        ? `Sending GSM SIM SMS to ${matchedStudent.parentPhone}...`
        : 'Auto-SMS paused (enable in Gateway settings)',
    });

    // Automatically dispatch GSM SIM SMS & Backend Email if enabled
    if (gsmConfig.enabled && gsmConfig.autoSendOnRfid && matchedStudent.parentPhone) {
      const log = await sendGsmSms({
        recipientName: `${matchedStudent.fatherName} (F/O ${matchedStudent.name})`,
        recipientRole: 'Parent',
        phone: matchedStudent.parentPhone,
        messageText: smsText,
        eventType,
        config: gsmConfig,
      });

      if (gsmConfig.emailEnabled && matchedStudent.parentEmail) {
        await sendBackendEmail({
          recipientName: matchedStudent.fatherName,
          recipientRole: 'Parent',
          email: matchedStudent.parentEmail,
          subject: `Vision Grammar School Gate ${nextGateAction}: ${matchedStudent.name} (#${matchedStudent.grNo})`,
          messageText: smsText,
          eventType,
          config: gsmConfig,
        });
      }

      setMessageLogs(loadMessageLogs());
      setLastTappedCard((prev) =>
        prev && prev.student.id === matchedStudent.id
          ? {
              ...prev,
              smsStatusText: `✓ GSM SIM SMS (${gsmConfig.simSlot}) -> ${matchedStudent.parentPhone} (${log.status})`,
            }
          : prev
      );
    }
  };

  // Link a brand-new physical Chinese RFID card serial number to a student & mark IN immediately
  const handleLinkUnknownCardToStudent = () => {
    if (!unknownCardSerial || !assignStudentId) return;
    const target = students.find((s) => s.id === assignStudentId);
    if (!target) return;

    if (setStudents) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === assignStudentId ? { ...s, rfidCardNo: unknownCardSerial } : s
        )
      );
    }
    const serialToScan = unknownCardSerial;
    setUnknownCardSerial(null);
    setTimeout(() => {
      handleRfidCardTap(serialToScan);
    }, 50);
  };

  // --- AI CLASSROOM PHOTO HANDLERS ---
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file?: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setProcessResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!previewUrl || targetStudents.length === 0) return;
    if (!headcount) {
      alert('Please enter the total headcount present before processing.');
      return;
    }

    setIsProcessing(true);
    try {
      const { presentStudentIds, totalFacesDetected, description } =
        await analyzeClassroomImage(previewUrl, targetStudents);
      const newTempStatus: Record<string, AttendanceStatus> = {};

      targetStudents.forEach((student) => {
        newTempStatus[student.id] = presentStudentIds.includes(student.id)
          ? AttendanceStatus.PRESENT
          : AttendanceStatus.ABSENT;
      });

      setProcessResult({
        description,
        totalFacesDetected,
        tempStatus: newTempStatus,
      });
    } catch {
      alert('AI Analysis failed. Please check your network or try manual mode.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startManualMode = () => {
    if (isHoliday) return;
    const manualStatus: Record<string, AttendanceStatus> = {};
    targetStudents.forEach((student) => {
      const existingRecord = attendanceData[student.id]?.[selectedDate];
      manualStatus[student.id] = existingRecord
        ? existingRecord.status
        : AttendanceStatus.PRESENT;
    });

    setProcessResult({
      description: 'Manual Mode: Direct Roster Entry',
      totalFacesDetected: 0,
      tempStatus: manualStatus,
    });
    setHeadcount(targetStudents.length.toString());
  };

  const markAll = (status: AttendanceStatus) => {
    if (!processResult) return;
    const newStatus = { ...processResult.tempStatus };
    targetStudents.forEach((s) => (newStatus[s.id] = status));
    setProcessResult({ ...processResult, tempStatus: newStatus });
  };

  const finalizeAttendance = async () => {
    if (!processResult) return;
    const newData = { ...attendanceData };
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const absentStudents: Student[] = [];

    targetStudents.forEach((student) => {
      const status =
        processResult.tempStatus[student.id] || AttendanceStatus.ABSENT;
      if (!newData[student.id]) newData[student.id] = {};
      newData[student.id][selectedDate] = {
        date: selectedDate,
        status,
        checkInTime: status === AttendanceStatus.PRESENT ? nowTime : undefined,
        attendanceState:
          status === AttendanceStatus.PRESENT
            ? 'IN'
            : status === AttendanceStatus.ABSENT
            ? 'ABSENT'
            : 'LEAVE',
        method: 'AI_PHOTO',
      };
      if (status === AttendanceStatus.ABSENT) {
        absentStudents.push(student);
      }
    });

    setAttendanceData(newData);
    setProcessResult(null);
    setPreviewUrl(null);
    setHeadcount('');
    setShowConfirmation(false);

    // Auto-dispatch GSM SMS to parents of absent students
    if (gsmConfig.enabled && gsmConfig.autoSendOnAbsent && absentStudents.length > 0) {
      for (const st of absentStudents) {
        const msg = buildAttendanceMessage({
          studentName: st.name,
          fatherName: st.fatherName,
          grade: st.grade,
          grNo: st.grNo,
          eventType: 'AI_ABSENT',
          timeStr: nowTime,
          dateStr: selectedDate,
        });
        await sendGsmSms({
          recipientName: `${st.fatherName} (F/O ${st.name})`,
          recipientRole: 'Parent',
          phone: st.parentPhone,
          messageText: msg,
          eventType: 'AI_ABSENT',
          config: gsmConfig,
        });
      }
      setMessageLogs(loadMessageLogs());
    }
  };

  const toggleStatus = (studentId: string) => {
    if (!processResult) return;
    const current = processResult.tempStatus[studentId];
    const next =
      current === AttendanceStatus.PRESENT
        ? AttendanceStatus.ABSENT
        : current === AttendanceStatus.ABSENT
        ? AttendanceStatus.ON_LEAVE
        : AttendanceStatus.PRESENT;

    setProcessResult({
      ...processResult,
      tempStatus: { ...processResult.tempStatus, [studentId]: next },
    });
  };

  const summaryStats = useMemo(() => {
    if (!processResult)
      return { present: 0, absent: 0, leave: 0, unrecognized: 0 };
    const stats = targetStudents.reduce(
      (acc, s) => {
        const status = processResult.tempStatus[s.id];
        if (status === AttendanceStatus.PRESENT) acc.present++;
        else if (status === AttendanceStatus.ABSENT) acc.absent++;
        else if (status === AttendanceStatus.ON_LEAVE) acc.leave++;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );

    const manualCount = parseInt(headcount) || 0;
    const unrecognized = Math.max(0, manualCount - stats.present);
    return { ...stats, unrecognized };
  }, [processResult, targetStudents, headcount]);

  const speakNames = (statusType: AttendanceStatus) => {
    if (!processResult) return;
    const names = targetStudents
      .filter((s) => processResult.tempStatus[s.id] === statusType)
      .map((s) => s.name);
    if (names.length === 0)
      return alert(`No students marked as ${statusType}.`);
    const text = `The following students are marked ${statusType}: ${names.join(', ')}`;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-detect Hotspot Gateway IP & LAN adapters when PC is connected to Phone's Hotspot + Mobile Data
  const handleAutoDetectHotspot = async (applyToInput = true) => {
    setIsDetectingHotspot(true);
    const info = await detectHotspotGateway('8090');
    setIsDetectingHotspot(false);
    if (info) {
      setHotspotInfo(info);
      if (applyToInput && info.recommendedUrl) {
        const updated: GsmGatewayConfig = {
          ...gsmConfig,
          phoneServerUrl: info.recommendedUrl,
          endpointPath: '/SendSMS',
          payloadFormat: 'SADIQ_GSM_HELPER',
          hotspotAutoDetect: true,
        };
        setGsmConfig(updated);
        saveGsmConfig(updated);
        setConfigSavedToast(
          `Hotspot/Phone Gateway Detected: ${info.recommendedUrl}/SendSMS (Same-Phone Hotspot + Mobile Data Ready!)`
        );
        setTimeout(() => setConfigSavedToast(''), 4500);
      }
    }
  };

  useEffect(() => {
    if (activeMode === 'messaging' && !hotspotInfo) {
      handleAutoDetectHotspot(false);
    }
  }, [activeMode]);

  // Save GSM Mobile SIM Gateway settings
  const handleSaveGatewayConfig = () => {
    saveGsmConfig(gsmConfig);
    setConfigSavedToast(
      `Saved! GSM-Helper-Tool Server (${gsmConfig.phoneServerUrl}${gsmConfig.endpointPath}) & Hotspot Auto-Routing Active.`
    );
    setTimeout(() => setConfigSavedToast(''), 3500);
  };

  // Send Custom Broadcast via GSM SIM SMS, WhatsApp Web, or Email
  const handleSendBroadcast = async (
    channel: 'GSM_SMS' | 'WHATSAPP_WEB' | 'EMAIL'
  ) => {
    setIsSendingBroadcast(true);
    let recipientName = 'Recipient';
    let phone = broadcastCustomPhone.trim();
    let email = 'parent@example.com';

    if (broadcastRole === 'Parent' || broadcastRole === 'Student') {
      const st =
        students.find((s) => s.id === broadcastRecipientId) || students[0];
      if (st) {
        recipientName =
          broadcastRole === 'Parent'
            ? `${st.fatherName} (Parent of ${st.name})`
            : `${st.name} (Class ${st.grade})`;
        if (!phone) phone = st.parentPhone;
        email = st.parentEmail || `${st.grNo}@visiongrammarschool.edu.pk`;
      }
    } else {
      const staff =
        STAFF_CONTACTS.find((c) => c.role === broadcastRole) ||
        STAFF_CONTACTS[0];
      recipientName = staff.name;
      if (!phone) phone = staff.phone;
      email = staff.email;
    }

    if (channel === 'GSM_SMS') {
      await sendGsmSms({
        recipientName,
        recipientRole: broadcastRole,
        phone,
        messageText: broadcastText,
        eventType: 'CUSTOM_BROADCAST',
        config: gsmConfig,
      });
    } else if (channel === 'WHATSAPP_WEB') {
      sendViaWhatsAppWeb({
        recipientName,
        recipientRole: broadcastRole,
        phone,
        messageText: broadcastText,
        eventType: 'CUSTOM_BROADCAST',
        openWindow: true,
      });
    } else {
      await sendBackendEmail({
        recipientName,
        recipientRole: broadcastRole,
        email,
        subject: `Vision Grammar School Notice (${broadcastRole})`,
        messageText: broadcastText,
        eventType: 'CUSTOM_BROADCAST',
        config: gsmConfig,
      });
    }

    setMessageLogs(loadMessageLogs());
    setIsSendingBroadcast(false);
  };

  // Today's Gate IN / OUT stats
  const gateStats = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    let absent = 0;
    targetStudents.forEach((s) => {
      const rec = attendanceData[s.id]?.[selectedDate];
      if (rec?.attendanceState === 'IN') checkedIn++;
      else if (rec?.attendanceState === 'OUT') checkedOut++;
      else if (rec?.status === AttendanceStatus.ABSENT) absent++;
    });
    return { checkedIn, checkedOut, absent };
  }, [targetStudents, attendanceData, selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-slate-900">
      {/* Top Mode Switcher: 1. Live RFID Card Gate Terminal | 2. AI Classroom Photo | 3. GSM SIM / WhatsApp / Email */}
      <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-lg space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-4">
            <img
              src="/vision-logo-crest.png"
              alt="Vision Grammar School"
              className="w-16 h-16 object-contain drop-shadow-sm shrink-0"
            />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold uppercase mb-1">
                Vision Grammar School · Block 56, D.G. Khan
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Live RFID Gate Terminal, AI Classroom & GSM SMS Hub
              </h2>
              <p className="text-sm text-slate-700 mt-0.5">
                Two Attendance Systems: <strong>1) USB RFID Card Gate Reader (IN / OUT)</strong> &{' '}
                <strong>2) AI Classroom Photo Attendance</strong> — connected to{' '}
                <strong>Local Mobile GSM SIM SMS, WhatsApp Web & Email</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center px-3.5 py-2">
              <span className="text-slate-700 text-xs uppercase font-extrabold mr-2">
                Class:
              </span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setProcessResult(null);
                }}
                className="bg-transparent text-slate-900 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="All">ALL CLASSES</option>
                {uniqueClasses.map((c) => (
                  <option key={c} value={c}>
                    CLASS {c}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setProcessResult(null);
              }}
              className="bg-slate-50 border-2 border-slate-300 text-slate-900 px-3.5 py-2 rounded-xl text-sm font-bold outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* 3 Mode Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => setActiveMode('rfid_gate')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3.5 ${
              activeMode === 'rfid_gate'
                ? 'bg-blue-50 border-blue-600 text-slate-900 shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-400'
            }`}
          >
            <div className="p-3 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900">
                1. 🪪 Live RFID Card Gate (IN / OUT)
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                Blinking Cursor USB Reader • 1st Tap = IN, 2nd Tap = OUT
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('ai_photo')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3.5 ${
              activeMode === 'ai_photo'
                ? 'bg-emerald-50 border-emerald-600 text-slate-900 shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-emerald-400'
            }`}
          >
            <div className="p-3 rounded-xl bg-emerald-600 text-white font-bold shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900">
                2. 📸 AI Classroom Group Photo
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                Snap Classroom Photo • Seated = Present, Others = Absent
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('messaging')}
            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-3.5 ${
              activeMode === 'messaging'
                ? 'bg-indigo-50 border-indigo-600 text-slate-900 shadow-md'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-400'
            }`}
          >
            <div className="p-3 rounded-xl bg-indigo-600 text-white font-bold shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900">
                3. 📱 Mobile GSM SMS, WhatsApp & Email
              </div>
              <div className="text-xs font-medium text-slate-600 mt-0.5">
                Hotspot Virtual SMS Server • WhatsApp Web Login • Email
              </div>
            </div>
          </button>
        </div>

        {/* ===================================================================
            MODE 1: LIVE USB RFID CARD GATE TERMINAL (BLINKING CURSOR, IN / OUT)
            =================================================================== */}
        {activeMode === 'rfid_gate' && (
          <div className="space-y-6">
            {/* Always-Active Blinking Cursor RFID Input Box */}
            <div className="bg-slate-50 border-2 border-blue-600 rounded-2xl p-6 shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <span className="relative flex h-4 w-4 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600"></span>
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      USB RFID Reader Active — Cursor Blinking & Ready for Card Tap
                    </h3>
                    <p className="text-sm text-slate-700 mt-0.5">
                      Plug in your USB RFID Reader. When a student taps their card, the reader types the serial number below and presses{' '}
                      <code className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">Enter</code> automatically.{' '}
                      <strong className="text-emerald-800">1st Tap = IN (Arrival)</strong> •{' '}
                      <strong className="text-amber-800">2nd Tap = OUT (Departure)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setKeepCursorLocked(!keepCursorLocked)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      keepCursorLocked
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 hover:bg-emerald-100'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {keepCursorLocked
                      ? '🔒 Auto-Keep Cursor Blinking: ON'
                      : '🔓 Auto-Keep Cursor: OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setVoiceAnnounceTap(!voiceAnnounceTap)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      voiceAnnounceTap
                        ? 'bg-blue-50 border-blue-600 text-blue-900 hover:bg-blue-100'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    🔊 Voice Readout: {voiceAnnounceTap ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* The Blinking Cursor Input Box where the USB RFID Reader types the Serial Number + Enter */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRfidCardTap(rfidInput);
                }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <div className="relative flex-1">
                  <CreditCard className="w-6 h-6 text-blue-700 absolute left-4 top-4" />
                  <input
                    ref={rfidInputRef}
                    type="text"
                    autoFocus
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRfidCardTap(rfidInput);
                      }
                    }}
                    placeholder="┃ Blinking Cursor Ready — Tap RFID Card on Reader (Types Serial No + Presses Enter)..."
                    className="w-full bg-white border-2 border-blue-600 focus:border-emerald-600 rounded-xl pl-12 pr-40 py-3.5 text-lg font-mono font-bold text-slate-900 placeholder:text-slate-500 outline-none shadow-sm"
                  />
                  <span className="absolute right-3 top-3 px-3 py-1 rounded-lg bg-emerald-100 border border-emerald-500 text-emerald-900 text-xs font-bold uppercase">
                    ● Cursor Active
                  </span>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-extrabold uppercase rounded-xl text-sm shadow-md shrink-0"
                >
                  Process Card Enter ↵
                </button>
              </form>

              {/* Quick Demo / Test Simulator Bar so User can test 1st Tap (IN) and 2nd Tap (OUT) with 1 click */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                <span className="text-sm font-extrabold text-slate-800">
                  ⚡ Test Card Tap (Click any student below to simulate tapping their RFID Card):
                </span>
                {students.map((st) => {
                  const todayRec = attendanceData[st.id]?.[selectedDate];
                  const isAlreadyIn = todayRec?.attendanceState === 'IN';
                  const nextTapLabel = isAlreadyIn ? 'Tap 2nd Time (OUT)' : 'Tap 1st Time (IN)';
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleRfidCardTap(st.rfidCardNo || st.grNo)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center gap-2 ${
                        isAlreadyIn
                          ? 'bg-amber-50 hover:bg-amber-100 border-amber-500 text-slate-900'
                          : 'bg-white hover:bg-blue-50 border-blue-400 text-slate-900'
                      }`}
                    >
                      <span className="font-extrabold text-slate-900">🪪 {st.name}</span>
                      <span className="text-xs font-mono text-slate-600">
                        (#{st.rfidCardNo || st.grNo})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          isAlreadyIn
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        → {nextTapLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If an unknown physical RFID card is tapped, allow 1-click linking to any student */}
            {unknownCardSerial && (
              <div className="bg-amber-50 border-2 border-amber-500 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in">
                <div>
                  <div className="text-sm font-extrabold uppercase text-amber-900">
                    🆕 Unregistered Physical RFID Card Detected!
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">
                    Card Serial Number Typed:{' '}
                    <span className="font-mono text-blue-900 bg-white border border-amber-400 px-3 py-0.5 rounded-lg">
                      {unknownCardSerial}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1">
                    Assign this physical RFID card to a student below so every future tap automatically opens their profile:
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <select
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    className="bg-white border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Class {s.grade} · GR #{s.grNo})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleLinkUnknownCardToStudent}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm uppercase"
                  >
                    ✓ Link Card & Mark IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnknownCardSerial(null)}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* LIVE GATE MONITOR SCREEN: Displays Student Photo, Name, Serial No, IN/OUT Status + Today's Gate Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Huge Gate Monitor Display for the Currently Tapped Student */}
              <div className="lg:col-span-7">
                {lastTappedCard ? (
                  <div
                    className={`rounded-3xl border-2 p-6 shadow-lg bg-white transition-all ${
                      lastTappedCard.gateAction === 'IN'
                        ? 'border-emerald-600'
                        : 'border-amber-500'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
                      <div className="flex items-center gap-3">
                        <img
                          src="/vision-logo-crest.png"
                          alt="Vision Grammar School"
                          className="w-11 h-11 object-contain"
                        />
                        <div>
                          <div className="text-xs font-extrabold uppercase text-blue-900">
                            VISION GRAMMAR SCHOOL · GATE MONITOR LIVE DISPLAY
                          </div>
                          <div className="text-sm text-slate-600 font-medium">
                            Block 56, D.G. Khan · Automatic RFID Verification
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-4 py-2 rounded-full text-sm font-extrabold uppercase flex items-center gap-2 shadow-sm ${
                          lastTappedCard.gateAction === 'IN'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {lastTappedCard.gateAction === 'IN' ? (
                          <>
                            <LogIn className="w-4 h-4" /> CHECKED IN (آمد / حاضری لگ گئی)
                          </>
                        ) : (
                          <>
                            <LogOut className="w-4 h-4" /> CHECKED OUT (چھٹی / واپسی)
                          </>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Large Student Photo on Gate Monitor */}
                      <div className="w-36 h-36 rounded-3xl overflow-hidden border-4 border-blue-700 shadow-md bg-blue-900 shrink-0">
                        {lastTappedCard.student.photoUrl ? (
                          <img
                            src={lastTappedCard.student.photoUrl}
                            alt={lastTappedCard.student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white">
                            {lastTappedCard.student.name.slice(0, 2)}
                          </div>
                        )}
                      </div>

                      {/* Student Profile & Serial Number Details */}
                      <div className="flex-1 text-center sm:text-left space-y-2.5">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-sm font-mono font-bold text-blue-900">
                          🪪 RFID Serial No: <strong>{lastTappedCard.serialTyped}</strong>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                          {lastTappedCard.student.name}
                        </h3>
                        <p className="text-base text-slate-700">
                          S/D of <strong className="text-slate-900">{lastTappedCard.student.fatherName}</strong> · Parent Mobile:{' '}
                          <span className="font-mono font-bold text-blue-800">
                            {lastTappedCard.student.parentPhone}
                          </span>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-xs font-bold uppercase text-slate-600">
                              Class / Section
                            </div>
                            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                              Class {lastTappedCard.student.grade}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="text-xs font-bold uppercase text-slate-600">
                              Roll / GR No.
                            </div>
                            <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">
                              #{lastTappedCard.student.grNo}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                            <div className="text-xs font-bold uppercase text-slate-600">
                              Gate Timestamps
                            </div>
                            <div className="text-sm font-mono text-emerald-700 font-extrabold mt-0.5">
                              IN: {lastTappedCard.checkInTime}
                            </div>
                            {lastTappedCard.checkOutTime && (
                              <div className="text-sm font-mono text-amber-700 font-extrabold">
                                OUT: {lastTappedCard.checkOutTime}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parent GSM SMS & WhatsApp Status Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        <span>{lastTappedCard.smsStatusText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const msg = buildAttendanceMessage({
                              studentName: lastTappedCard.student.name,
                              fatherName: lastTappedCard.student.fatherName,
                              grade: lastTappedCard.student.grade,
                              grNo: lastTappedCard.student.grNo,
                              rfidSerial: lastTappedCard.serialTyped,
                              eventType:
                                lastTappedCard.gateAction === 'IN'
                                  ? 'RFID_IN'
                                  : 'RFID_OUT',
                              timeStr:
                                lastTappedCard.checkOutTime ||
                                lastTappedCard.checkInTime,
                              dateStr: lastTappedCard.dateStr,
                            });
                            sendViaWhatsAppWeb({
                              recipientName: lastTappedCard.student.fatherName,
                              recipientRole: 'Parent',
                              phone: lastTappedCard.student.parentPhone,
                              messageText: msg,
                              eventType:
                                lastTappedCard.gateAction === 'IN'
                                  ? 'RFID_IN'
                                  : 'RFID_OUT',
                            });
                            setMessageLogs(loadMessageLogs());
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 text-sm shadow-sm"
                        >
                          <MessageSquare className="w-4 h-4" /> WhatsApp Parent
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[310px] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
                    <CreditCard className="w-16 h-16 text-blue-700 mb-3 animate-bounce" />
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Gate Monitor Ready — Waiting for First Student Card Tap
                    </h3>
                    <p className="text-sm text-slate-700 max-w-md mt-2 leading-relaxed">
                      Tap any RFID card on your USB Reader (or click one of the student test buttons above). The student&apos;s{' '}
                      <strong>Photo, Name, Father Name, Class, Serial Number, and IN/OUT status</strong> will immediately display here!
                    </p>
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Live Gate Summary & Student IN / OUT Status List */}
              <div className="lg:col-span-5 bg-white border-2 border-slate-200 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-md">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900 uppercase">
                        Today&apos;s Live Gate Roster ({selectedDate})
                      </h4>
                      <p className="text-xs font-semibold text-slate-600">
                        1st Tap = IN • 2nd Tap = OUT
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs font-mono">
                      <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-400 text-emerald-800 font-extrabold">
                        IN: {gateStats.checkedIn}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-400 text-amber-900 font-extrabold">
                        OUT: {gateStats.checkedOut}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {targetStudents.map((st) => {
                      const rec = attendanceData[st.id]?.[selectedDate];
                      const state = rec?.attendanceState;
                      return (
                        <div
                          key={st.id}
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={st.photoUrl}
                              alt={st.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-300 shrink-0"
                            />
                            <div className="truncate">
                              <div className="text-base font-extrabold text-slate-900 truncate">
                                {st.name}{' '}
                                <span className="text-xs font-bold text-slate-600">
                                  ({st.grade})
                                </span>
                              </div>
                              <div className="text-xs font-mono font-bold text-blue-800">
                                🪪 Card: #{st.rfidCardNo || st.grNo}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {state === 'IN' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white block">
                                ✓ IN ({rec?.checkInTime})
                              </span>
                            ) : state === 'OUT' ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 block">
                                🏠 OUT ({rec?.checkOutTime})
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 block">
                                Waiting Tap
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-medium">
                    GSM SMS Gateway: <strong className="text-slate-900 font-mono">{gsmConfig.phoneServerUrl}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveMode('messaging')}
                    className="text-blue-700 hover:text-blue-900 hover:underline font-bold"
                  >
                    Configure GSM / WhatsApp →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODE 2: AI CLASSROOM GROUP PHOTO ATTENDANCE (PRESENT / ABSENT)
            =================================================================== */}
        {activeMode === 'ai_photo' && (
          <div>
            {isHoliday ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-12 text-center">
                <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-red-900 uppercase tracking-wider">
                  {holidayReason}
                </h3>
                <p className="text-red-700 mt-3 font-semibold text-base">
                  System restricted: Academic Calendar Holiday
                </p>
              </div>
            ) : !previewUrl && !processResult ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-200">
                    <Users className="w-8 h-8 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                      1. Classroom Headcount Tally
                    </h3>
                    <p className="text-sm text-slate-700 mb-6 font-medium">
                      Enter the number of students seated in the classroom photo. Seated students will be marked{' '}
                      <strong className="text-emerald-700">Present</strong> and remaining students <strong className="text-red-700">Absent</strong> (with auto GSM SMS alert).
                    </p>
                    <div className="relative inline-block">
                      <input
                        type="number"
                        value={headcount}
                        onChange={(e) => setHeadcount(e.target.value)}
                        placeholder="0"
                        className="w-36 bg-slate-50 border-2 border-slate-300 text-slate-900 text-center text-4xl font-extrabold font-mono py-4 rounded-2xl focus:border-blue-600 outline-none transition-all"
                      />
                      <div className="mt-2 bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Seated Count
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    processFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => {
                    if (!headcount)
                      return alert('Please enter the headcount first.');
                    fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative overflow-hidden bg-white shadow-sm ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-500 hover:bg-slate-50'
                  } ${!headcount ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl mb-4">
                    <Upload className="w-8 h-8 text-blue-700" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    2. Upload Classroom Photo
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 font-medium">
                    Upload or capture a photo of the whole classroom for AI attendance
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    disabled={!headcount}
                  />

                  <div className="mt-8 pt-6 border-t border-slate-200 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startManualMode();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-sm text-amber-950 font-bold border border-amber-300 transition-colors inline-flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" /> Open Manual Roll Call List
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {previewUrl && (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video border-2 border-slate-300 shadow-lg max-h-[400px]">
                    <img
                      src={previewUrl}
                      alt="Classroom"
                      className="w-full h-full object-contain"
                    />
                    {!processResult && (
                      <button
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                )}

                {!processResult ? (
                  <div className="flex justify-center">
                    <button
                      onClick={processImage}
                      disabled={isProcessing}
                      className={`flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-base shadow-md transition-all ${
                        isProcessing
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-blue-700 hover:bg-blue-800'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" /> ANALYZING CLASSROOM...
                        </>
                      ) : (
                        <>
                          <Camera className="w-6 h-6" /> DETECT SEATED STUDENTS (AI)
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: 'Seated Tally',
                          value: headcount,
                          color: 'text-blue-800',
                          desc: 'Physical Count',
                        },
                        {
                          label: 'AI Detected',
                          value: processResult.totalFacesDetected || '-',
                          color: 'text-amber-700',
                          desc: 'Camera Faces',
                        },
                        {
                          label: 'Present (IN)',
                          value: summaryStats.present,
                          color: 'text-emerald-700',
                          desc: 'Seated in Class',
                        },
                        {
                          label: 'Absent',
                          value: summaryStats.absent,
                          color: 'text-red-700',
                          desc: 'Auto GSM SMS Ready',
                        },
                      ].map((stat, i) => (
                        <div
                          key={i}
                          className="bg-white border-2 border-slate-200 p-4 rounded-2xl text-center shadow-sm"
                        >
                          <div className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">
                            {stat.label}
                          </div>
                          <div className={`text-3xl font-extrabold font-mono ${stat.color}`}>
                            {stat.value}
                          </div>
                          <div className="text-xs text-slate-500 font-semibold mt-1">
                            {stat.desc}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-5 h-5 text-blue-700" />
                        <span className="text-sm font-bold text-slate-900">
                          Audio Roll-Call Readout
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isSpeaking ? (
                          <button
                            onClick={() => window.speechSynthesis.cancel()}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase"
                          >
                            <StopCircle className="w-4 h-4 mr-1 inline" /> Stop
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => speakNames(AttendanceStatus.PRESENT)}
                              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold"
                            >
                              Read Present
                            </button>
                            <button
                              onClick={() => speakNames(AttendanceStatus.ABSENT)}
                              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 rounded-xl text-xs font-bold"
                            >
                              Read Absent
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => markAll(AttendanceStatus.PRESENT)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          All Present
                        </button>
                        <button
                          onClick={() => markAll(AttendanceStatus.ABSENT)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                        >
                          All Absent
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-2">
                      {targetStudents.map((student) => {
                        const status = processResult.tempStatus[student.id];
                        return (
                          <div
                            key={student.id}
                            onClick={() => toggleStatus(student.id)}
                            className={`cursor-pointer p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between select-none ${
                              status === AttendanceStatus.PRESENT
                                ? 'bg-emerald-50 border-emerald-400'
                                : status === AttendanceStatus.ON_LEAVE
                                ? 'bg-amber-50 border-amber-400'
                                : 'bg-red-50 border-red-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <img
                                src={student.photoUrl}
                                alt={student.name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-300"
                              />
                              <div className="truncate">
                                <div className="font-extrabold text-sm text-slate-900 truncate">
                                  {student.name}
                                </div>
                                <div className="text-xs text-slate-600 font-mono font-semibold">
                                  GR: #{student.grNo} · {student.grade}
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {status === AttendanceStatus.PRESENT ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                              ) : status === AttendanceStatus.ABSENT ? (
                                <XCircle className="w-6 h-6 text-red-600" />
                              ) : (
                                <Circle className="w-6 h-6 text-amber-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => {
                          setProcessResult(null);
                          setPreviewUrl(null);
                        }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowConfirmation(true)}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md"
                      >
                        <Send className="w-4 h-4" /> Save Classroom Attendance & Alert Absent Parents
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            MODE 3: PARENT & STAFF MESSAGING HUB (MOBILE GSM SIM + WHATSAPP WEB + EMAIL)
            =================================================================== */}
        {activeMode === 'messaging' && (
          <div className="space-y-6">
            {configSavedToast && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-bold text-sm flex items-center gap-2 shadow-sm">
                <Check className="w-5 h-5 text-emerald-700" />
                <span>{configSavedToast}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 Cols: Sadiq Odho GSM-Helper-Tool & Same-Phone Hotspot + Mobile Data Configuration */}
              <div className="lg:col-span-6 bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                      <Wifi className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        📱 GSM-Helper-Tool (Sadiq Odho) & Hotspot Bridge
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Works on Local Wi-Fi AND when PC is connected to the SAME Phone’s Hotspot + Mobile Data
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoDetectHotspot(true)}
                    disabled={isDetectingHotspot}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 font-bold text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isDetectingHotspot ? 'animate-spin' : ''}`}
                    />
                    {isDetectingHotspot ? 'Scanning Hotspot...' : '🔍 Auto-Detect Hotspot IP'}
                  </button>
                </div>

                {/* Live Detected Hotspot / Network Topology Banner */}
                {hotspotInfo && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-blue-950 font-bold">
                      <span>
                        📡 Detected Hotspot Gateway (Phone IP):{' '}
                        <code className="px-1.5 py-0.5 rounded bg-white border border-blue-300 text-blue-900 font-mono">
                          {hotspotInfo.defaultGateways.join(', ') || '192.168.43.1'}
                        </code>
                      </span>
                      <span className="text-emerald-800 font-mono">
                        PC Adapter:{' '}
                        {hotspotInfo.adapters.map((a) => a.localIp).join(', ') || 'Local'}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium">
                      💡 Even if your Phone’s Mobile Data + Hotspot are ON at the same time (and the phone app shows{' '}
                      <code className="font-mono font-bold text-slate-900">0.0.0.0</code> or <code className="font-mono font-bold text-slate-900">10.x.x.x</code>), our Localhost Bridge automatically routes SMS to the Hotspot Gateway IP above!
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Phone GSM Modem IP:Port (Hotspot / Wi-Fi)
                    </label>
                    <input
                      type="text"
                      value={gsmConfig.phoneServerUrl}
                      onChange={(e) =>
                        setGsmConfig({ ...gsmConfig, phoneServerUrl: e.target.value })
                      }
                      placeholder="http://192.168.43.1:8090"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Endpoint Path & SIM Slot
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={gsmConfig.endpointPath}
                        onChange={(e) =>
                          setGsmConfig({ ...gsmConfig, endpointPath: e.target.value })
                        }
                        placeholder="/SendSMS"
                        className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-blue-600"
                      />
                      <select
                        value={gsmConfig.simSlot}
                        onChange={(e) =>
                          setGsmConfig({
                            ...gsmConfig,
                            simSlot: e.target.value as 'SIM1' | 'SIM2',
                          })
                        }
                        className="bg-slate-50 border-2 border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-bold"
                      >
                        <option value="SIM1">SIM 1</option>
                        <option value="SIM2">SIM 2</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      GSM Modem Username (Default: sadiq)
                    </label>
                    <input
                      type="text"
                      value={gsmConfig.gsmUsername}
                      onChange={(e) =>
                        setGsmConfig({ ...gsmConfig, gsmUsername: e.target.value })
                      }
                      placeholder="sadiq"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      GSM Modem Password (Default: 12345)
                    </label>
                    <input
                      type="text"
                      value={gsmConfig.gsmPassword}
                      onChange={(e) =>
                        setGsmConfig({ ...gsmConfig, gsmPassword: e.target.value })
                      }
                      placeholder="12345"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Android Bridge Protocol
                    </label>
                    <select
                      value={gsmConfig.payloadFormat}
                      onChange={(e) =>
                        setGsmConfig({
                          ...gsmConfig,
                          payloadFormat: e.target.value as GsmGatewayConfig['payloadFormat'],
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
                    >
                      <option value="SADIQ_GSM_HELPER">
                        Sadiq Odho GSM Modem + GSM-Helper-Tool (:8090/SendSMS)
                      </option>
                      <option value="GET_QUERY">
                        HTTP GET Query (?phone=...&message=...)
                      </option>
                      <option value="STANDARD_JSON">
                        Universal JSON (phone, message, sim)
                      </option>
                      <option value="CAPCOM6">
                        Android SMS Gateway (phoneNumbers[], message)
                      </option>
                      <option value="TRACCAR">
                        Traccar SMS Gateway (to, message)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Localhost Relay Server (Port 3001)
                    </label>
                    <input
                      type="text"
                      value={gsmConfig.localhostRelayUrl}
                      onChange={(e) =>
                        setGsmConfig({
                          ...gsmConfig,
                          localhostRelayUrl: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-emerald-800 font-mono font-bold outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Same-Phone Hotspot + Auto-Send Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <label className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between cursor-pointer">
                    <span className="text-amber-950 font-bold">
                      Same-Phone Hotspot + Data Auto-Route
                    </span>
                    <input
                      type="checkbox"
                      checked={gsmConfig.hotspotAutoDetect}
                      onChange={(e) =>
                        setGsmConfig({
                          ...gsmConfig,
                          hotspotAutoDetect: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-amber-600"
                    />
                  </label>
                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between cursor-pointer">
                    <span className="text-slate-800 font-bold">
                      Auto SMS on RFID (IN & OUT)
                    </span>
                    <input
                      type="checkbox"
                      checked={gsmConfig.autoSendOnRfid}
                      onChange={(e) =>
                        setGsmConfig({
                          ...gsmConfig,
                          autoSendOnRfid: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                  </label>
                  <label className="p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between cursor-pointer">
                    <span className="text-slate-800 font-bold">
                      Auto SMS on Classroom Absent
                    </span>
                    <input
                      type="checkbox"
                      checked={gsmConfig.autoSendOnAbsent}
                      onChange={(e) =>
                        setGsmConfig({
                          ...gsmConfig,
                          autoSendOnAbsent: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                  </label>
                </div>

                {/* WhatsApp Web Extension Login + Mobile Companion Bridge Row */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-emerald-950">
                      💬 WhatsApp Web & Mobile Hotspot Companion
                    </div>
                    <div className="text-xs text-emerald-800 font-medium">
                      Link WhatsApp Web or open the Mobile Bridge page directly on your Hotspot Phone
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          'http://localhost:3001/mobile-bridge',
                          '_blank'
                        )
                      }
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Smartphone className="w-4 h-4 text-blue-700" /> Mobile Bridge Page
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          'https://web.whatsapp.com',
                          'vision_whatsapp_web_session'
                        )
                      }
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> Login WhatsApp Web
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveGatewayConfig}
                  className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  ✓ Save GSM-Helper-Tool, Hotspot Auto-Route & Email Settings
                </button>
              </div>

              {/* Right 6 Cols: Send GSM SMS / WhatsApp / Email to Parents, Students, Teachers, or Principal */}
              <div className="lg:col-span-6 bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900">
                    📨 Send Message (Parents · Students · Teachers · Principal)
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    SMS goes through Mobile GSM SIM • Emails go via Backend • WhatsApp goes via WhatsApp Web
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(['Parent', 'Student', 'Teacher', 'Principal'] as RecipientRole[]).map(
                    (r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setBroadcastRole(r)}
                        className={`py-2.5 rounded-xl text-xs font-extrabold uppercase border-2 transition-all ${
                          broadcastRole === r
                            ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    )
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {(broadcastRole === 'Parent' || broadcastRole === 'Student') && (
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5">
                        Select {broadcastRole}
                      </label>
                      <select
                        value={broadcastRecipientId}
                        onChange={(e) => setBroadcastRecipientId(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.grade}) — F/O {s.fatherName} ({s.parentPhone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div
                    className={
                      broadcastRole === 'Teacher' || broadcastRole === 'Principal'
                        ? 'sm:col-span-2'
                        : ''
                    }
                  >
                    <label className="block text-slate-800 font-bold mb-1.5">
                      Mobile Number Override (Optional)
                    </label>
                    <input
                      type="text"
                      value={broadcastCustomPhone}
                      onChange={(e) => setBroadcastCustomPhone(e.target.value)}
                      placeholder="+923001234567 (Leave blank to use profile number)"
                      className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-800 font-bold mb-1.5">
                    Message Text (SMS / WhatsApp / Email)
                  </label>
                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 font-medium outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={isSendingBroadcast}
                    onClick={() => handleSendBroadcast('GSM_SMS')}
                    className="py-3 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" /> Send via GSM SIM
                  </button>
                  <button
                    type="button"
                    disabled={isSendingBroadcast}
                    onClick={() => handleSendBroadcast('WHATSAPP_WEB')}
                    className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4" /> Send WhatsApp Web
                  </button>
                  <button
                    type="button"
                    disabled={isSendingBroadcast}
                    onClick={() => handleSendBroadcast('EMAIL')}
                    className="py-3 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> Send Backend Email
                  </button>
                </div>

                {/* Live Dispatch Log */}
                <div className="pt-2">
                  <div className="text-xs font-extrabold uppercase text-slate-700 mb-2">
                    Recent GSM SIM SMS, WhatsApp & Email Logs ({messageLogs.length})
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {messageLogs.length === 0 ? (
                      <div className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-slate-200">
                        No messages dispatched yet. Tap an RFID card or click Send above!
                      </div>
                    ) : (
                      messageLogs.slice(0, 12).map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900">
                              [{log.channel}] {log.recipientName}{' '}
                              <span className="text-blue-800 font-mono">
                                ({log.phoneOrEmail})
                              </span>
                            </div>
                            <div className="text-xs text-slate-700 mt-0.5 line-clamp-1">
                              {log.messageText}
                            </div>
                            <div className="text-xs text-emerald-700 font-mono font-semibold mt-0.5">
                              {log.gatewayResponse}
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-500 shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for AI Classroom Photo Attendance */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-200 text-center">
              <h3 className="text-xl font-extrabold text-slate-900 uppercase mb-1">
                Confirm Classroom Attendance
              </h3>
              <p className="text-sm text-slate-600 font-semibold">
                {selectedDate} • Class {selectedClass}
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Present',
                    val: summaryStats.present,
                    color: 'text-emerald-700',
                  },
                  {
                    label: 'Absent',
                    val: summaryStats.absent,
                    color: 'text-red-700',
                  },
                  {
                    label: 'Leave',
                    val: summaryStats.leave,
                    color: 'text-amber-700',
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center"
                  >
                    <div className={`text-2xl font-extrabold font-mono mb-1 ${s.color}`}>
                      {s.val}
                    </div>
                    <div className="text-xs text-slate-600 font-bold uppercase">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm text-slate-800">
                ✓ Seated students will be marked <strong>Present</strong> and{' '}
                <strong>{summaryStats.absent} absent student(s)</strong> will automatically receive a parent GSM SIM SMS alert.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-sm"
              >
                Back
              </button>
              <button
                onClick={finalizeAttendance}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm"
              >
                Commit & Send SMS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTaker;
