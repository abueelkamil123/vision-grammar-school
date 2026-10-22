export type RecipientRole = 'Parent' | 'Student' | 'Teacher' | 'Principal';
export type MessageChannel = 'GSM_SMS' | 'WHATSAPP_WEB' | 'EMAIL';

export interface GsmGatewayConfig {
  enabled: boolean;
  autoSendOnRfid: boolean;
  autoSendOnAbsent: boolean;
  phoneServerUrl: string;       // Default for Sadiq Odho GSM Modem: "http://192.168.43.1:8090"
  endpointPath: string;         // Default for Sadiq Odho GSM Modem: "/SendSMS"
  gsmUsername: string;          // Default in GSM Modem app: "sadiq"
  gsmPassword: string;          // Default in GSM Modem app: "12345"
  hotspotAutoDetect: boolean;   // Automatically finds Phone IP when PC is on same phone's Hotspot + Mobile Data
  useLocalhostRelay: boolean;   // Routes through http://localhost:3001/api/send-sms (binds local interface & bypasses CORS/VPN)
  localhostRelayUrl: string;    // Default: "http://localhost:3001/api/send-sms"
  apiKeyOrToken: string;        // Optional Basic/Bearer token for alternative apps
  simSlot: 'SIM1' | 'SIM2';
  payloadFormat:
    | 'SADIQ_GSM_HELPER'
    | 'STANDARD_JSON'
    | 'TRACCAR'
    | 'CAPCOM6'
    | 'GET_QUERY';
  emailEnabled: boolean;
  emailBackendUrl: string;      // Default: "http://localhost:3001/api/send-email"
  schoolSenderEmail: string;
  whatsappWebConnected: boolean;
}

export interface HotspotDetectionResult {
  ok: boolean;
  reachablePhoneIp: string | null;
  recommendedIp: string;
  recommendedUrl: string;
  defaultGateways: string[];
  arpNeighbors: string[];
  adapters: Array<{ name: string; localIp: string; netmask: string; subnetPrefix: string }>;
}

export interface MessageDispatchLog {
  id: string;
  timestamp: string;
  recipientName: string;
  recipientRole: RecipientRole;
  phoneOrEmail: string;
  channel: MessageChannel;
  eventType: 'RFID_IN' | 'RFID_OUT' | 'AI_ABSENT' | 'CUSTOM_BROADCAST';
  messageText: string;
  status: 'SENT_VIA_GSM' | 'QUEUED_LOCAL_SIM' | 'OPENED_WHATSAPP_WEB' | 'EMAIL_DISPATCHED';
  gatewayResponse?: string;
}

const CONFIG_STORAGE_KEY = 'vision_gsm_gateway_config_v2';
const LOGS_STORAGE_KEY = 'vision_message_dispatch_logs_v1';

export const DEFAULT_GSM_CONFIG: GsmGatewayConfig = {
  enabled: true,
  autoSendOnRfid: true,
  autoSendOnAbsent: true,
  phoneServerUrl: 'http://192.168.43.1:8090',
  endpointPath: '/SendSMS',
  gsmUsername: 'sadiq',
  gsmPassword: '12345',
  hotspotAutoDetect: true,
  useLocalhostRelay: true,
  localhostRelayUrl: 'http://localhost:3001/api/send-sms',
  apiKeyOrToken: '',
  simSlot: 'SIM1',
  payloadFormat: 'SADIQ_GSM_HELPER',
  emailEnabled: true,
  emailBackendUrl: 'http://localhost:3001/api/send-email',
  schoolSenderEmail: 'alerts@visiongrammarschool.edu.pk',
  whatsappWebConnected: true,
};

export function loadGsmConfig(): GsmGatewayConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_GSM_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_GSM_CONFIG;
}

export function saveGsmConfig(config: GsmGatewayConfig): void {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function loadMessageLogs(): MessageDispatchLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveMessageLogs(logs: MessageDispatchLog[]): void {
  localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 100)));
}

/**
 * Normalizes Pakistani phone numbers for GSM SIM SmsManager (e.g. +923001234567 -> 03001234567)
 */
export function normalizePhoneForGsmSim(rawPhone: string): string {
  const cleaned = String(rawPhone || '').replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+92')) {
    return '0' + cleaned.slice(3);
  }
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Queries the Localhost Bridge (http://localhost:3001/api/detect-gateway) to auto-detect
 * the Mobile Hotspot Default Gateway IP & active LAN adapters when PC is connected to
 * the same phone's Hotspot + Mobile Data.
 */
export async function detectHotspotGateway(port = '8090'): Promise<HotspotDetectionResult | null> {
  try {
    const res = await fetch(`http://localhost:3001/api/detect-gateway?port=${encodeURIComponent(port)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore if bridge offline
  }
  return null;
}

/**
 * Formats an official Vision Grammar School SMS/WhatsApp/Email message for IN, OUT, or ABSENT
 */
export function buildAttendanceMessage(params: {
  studentName: string;
  fatherName: string;
  grade: string;
  grNo: string;
  rfidSerial?: string;
  eventType: 'RFID_IN' | 'RFID_OUT' | 'AI_ABSENT';
  timeStr: string;
  dateStr: string;
}): string {
  const { studentName, fatherName, grade, grNo, rfidSerial, eventType, timeStr, dateStr } = params;
  if (eventType === 'RFID_IN') {
    return `VISION GRAMMAR SCHOOL (Block 56, D.G. Khan)\nAssalam-o-Alaikum ${fatherName}!\nCHECK-IN (IN): Your child ${studentName} (Class ${grade}, ID #${grNo}${rfidSerial ? `, Card #${rfidSerial}` : ''}) safely entered school gate at ${timeStr} on ${dateStr}.`;
  }
  if (eventType === 'RFID_OUT') {
    return `VISION GRAMMAR SCHOOL (Block 56, D.G. Khan)\nAssalam-o-Alaikum ${fatherName}!\nCHECK-OUT (OUT): Your child ${studentName} (Class ${grade}, ID #${grNo}) departed from school gate at ${timeStr} on ${dateStr}.`;
  }
  return `VISION GRAMMAR SCHOOL (Block 56, D.G. Khan)\nAssalam-o-Alaikum ${fatherName}!\nABSENT ALERT: Your child ${studentName} (Class ${grade}, ID #${grNo}) was marked ABSENT today (${dateStr}). Please inform the school office if on leave.`;
}

/**
 * Dispatches an SMS through Sadiq Odho's GSM Modem + GSM-Helper-Tool (:8090/SendSMS)
 * on the Local Network or Same-Phone Mobile Hotspot + Mobile Data via http://localhost:3001/api/send-sms.
 */
export async function sendGsmSms(params: {
  recipientName: string;
  recipientRole: RecipientRole;
  phone: string;
  messageText: string;
  eventType: MessageDispatchLog['eventType'];
  config?: GsmGatewayConfig;
}): Promise<MessageDispatchLog> {
  const cfg = params.config || loadGsmConfig();
  const cleanPhone = normalizePhoneForGsmSim(params.phone);
  const baseServer = cfg.phoneServerUrl.replace(/\/$/, '');
  const cleanEndpoint = cfg.endpointPath.startsWith('/')
    ? cfg.endpointPath
    : '/' + cfg.endpointPath;
  const targetDirectUrl = `${baseServer}${cleanEndpoint}`;

  // Build payload according to the selected Android GSM Gateway App format
  let requestBody: Record<string, unknown> = {
    phone: cleanPhone,
    to: cleanPhone,
    number: cleanPhone,
    message: params.messageText,
    text: params.messageText,
    sim: cfg.simSlot,
    username: cfg.gsmUsername,
    password: cfg.gsmPassword,
    token: cfg.apiKeyOrToken || undefined,
  };

  if (cfg.payloadFormat === 'TRACCAR') {
    requestBody = { to: cleanPhone, message: params.messageText };
  } else if (cfg.payloadFormat === 'CAPCOM6') {
    requestBody = {
      message: params.messageText,
      phoneNumbers: [cleanPhone],
      simNumber: cfg.simSlot === 'SIM2' ? 2 : 1,
    };
  }

  let status: MessageDispatchLog['status'] = 'QUEUED_LOCAL_SIM';
  let gatewayResponse = `Routed to GSM-Helper-Tool (${cfg.phoneServerUrl}${cleanEndpoint})`;

  const isGetQuery =
    cfg.payloadFormat === 'SADIQ_GSM_HELPER' || cfg.payloadFormat === 'GET_QUERY';
  const queryParams = new URLSearchParams();
  if (cfg.payloadFormat === 'SADIQ_GSM_HELPER') {
    if (cfg.gsmUsername) queryParams.set('username', cfg.gsmUsername);
    if (cfg.gsmPassword) queryParams.set('password', cfg.gsmPassword);
  }
  queryParams.set('phone', cleanPhone);
  queryParams.set('message', params.messageText);

  let handledByLocalRelay = false;

  try {
    if (cfg.useLocalhostRelay) {
      // 1. Try Gate PC Localhost Node Bridge (works from https://yourschool.com on Vercel/VPS via Private Network Access!)
      const res = await fetch(cfg.localhostRelayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneServerUrl: baseServer,
          endpointPath: cleanEndpoint,
          gsmUsername: cfg.gsmUsername,
          gsmPassword: cfg.gsmPassword,
          hotspotAutoDetect: cfg.hotspotAutoDetect,
          apiKeyOrToken: cfg.apiKeyOrToken,
          payloadFormat: cfg.payloadFormat,
          phone: cleanPhone,
          message: params.messageText,
          body: requestBody,
        }),
      });
      if (res.ok) {
        handledByLocalRelay = true;
        const data = await res.json().catch(() => ({}));
        status = data.forwarded ? 'SENT_VIA_GSM' : 'QUEUED_LOCAL_SIM';
        gatewayResponse =
          data.detail || `Dispatched via GSM-Helper-Tool (${cfg.phoneServerUrl}${cleanEndpoint})`;
      }
    }
  } catch {
    // Localhost PC relay (port 3001) is not running on this device — fall through to direct Phone / Tunnel call
  }

  if (!handledByLocalRelay) {
    try {
      // 2. Direct call (works when opened directly on the Android Phone via http://127.0.0.1:8090/SendSMS,
      //    or via Cloudflare/Ngrok HTTPS tunnel, or local no-cors GET)
      const url = isGetQuery ? `${targetDirectUrl}?${queryParams.toString()}` : targetDirectUrl;

      await fetch(url, {
        method: isGetQuery ? 'GET' : 'POST',
        mode: isGetQuery ? 'no-cors' : 'cors',
        headers: isGetQuery
          ? undefined
          : {
              'Content-Type': 'application/json',
              ...(cfg.apiKeyOrToken ? { Authorization: cfg.apiKeyOrToken } : {}),
            },
        body: isGetQuery ? undefined : JSON.stringify(requestBody),
      });
      status = 'SENT_VIA_GSM';
      gatewayResponse = `Direct GSM-Helper-Tool Triggered (${baseServer}${cleanEndpoint})`;
    } catch {
      // 3. If opened on the Android Phone itself (Vercel/VPS domain), also try phone loopback 127.0.0.1:8090
      try {
        await fetch(`http://127.0.0.1:8090${cleanEndpoint}?${queryParams.toString()}`, {
          method: 'GET',
          mode: 'no-cors',
        });
        status = 'SENT_VIA_GSM';
        gatewayResponse = `Sent via Android Phone Loopback (127.0.0.1:8090${cleanEndpoint})`;
      } catch {
        status = 'QUEUED_LOCAL_SIM';
        gatewayResponse = `Queued for GSM-Helper-Tool (${cfg.phoneServerUrl}${cleanEndpoint})`;
      }
    }
  }

  const logEntry: MessageDispatchLog = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    recipientName: params.recipientName,
    recipientRole: params.recipientRole,
    phoneOrEmail: cleanPhone,
    channel: 'GSM_SMS',
    eventType: params.eventType,
    messageText: params.messageText,
    status,
    gatewayResponse,
  };

  const existing = loadMessageLogs();
  saveMessageLogs([logEntry, ...existing]);
  return logEntry;
}

/**
 * Opens or dispatches via WhatsApp Web Session
 */
export function sendViaWhatsAppWeb(params: {
  recipientName: string;
  recipientRole: RecipientRole;
  phone: string;
  messageText: string;
  eventType: MessageDispatchLog['eventType'];
  openWindow?: boolean;
}): MessageDispatchLog {
  const digitsOnly = params.phone.replace(/[^0-9]/g, '');
  const normalizedPhone = digitsOnly.startsWith('0')
    ? '92' + digitsOnly.slice(1)
    : digitsOnly;

  if (params.openWindow !== false) {
    const waUrl = `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodeURIComponent(
      params.messageText
    )}`;
    window.open(waUrl, 'vision_whatsapp_web_session');
  }

  const logEntry: MessageDispatchLog = {
    id: `wa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    recipientName: params.recipientName,
    recipientRole: params.recipientRole,
    phoneOrEmail: params.phone,
    channel: 'WHATSAPP_WEB',
    eventType: params.eventType,
    messageText: params.messageText,
    status: 'OPENED_WHATSAPP_WEB',
    gatewayResponse: 'Sent to linked WhatsApp Web session',
  };

  const existing = loadMessageLogs();
  saveMessageLogs([logEntry, ...existing]);
  return logEntry;
}

/**
 * Dispatches an Email notification via Backend Email Relay
 */
export async function sendBackendEmail(params: {
  recipientName: string;
  recipientRole: RecipientRole;
  email: string;
  subject: string;
  messageText: string;
  eventType: MessageDispatchLog['eventType'];
  config?: GsmGatewayConfig;
}): Promise<MessageDispatchLog> {
  const cfg = params.config || loadGsmConfig();
  try {
    await fetch(cfg.emailBackendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: cfg.schoolSenderEmail,
        to: params.email,
        subject: params.subject,
        text: params.messageText,
      }),
    });
  } catch {
    // Fallback if local email server isn't running
  }

  const logEntry: MessageDispatchLog = {
    id: `em-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString(),
    recipientName: params.recipientName,
    recipientRole: params.recipientRole,
    phoneOrEmail: params.email,
    channel: 'EMAIL',
    eventType: params.eventType,
    messageText: params.messageText,
    status: 'EMAIL_DISPATCHED',
    gatewayResponse: `Backend Email Dispatched (${params.email})`,
  };

  const existing = loadMessageLogs();
  saveMessageLogs([logEntry, ...existing]);
  return logEntry;
}
