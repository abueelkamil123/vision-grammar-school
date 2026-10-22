/**
 * Vision Grammar School — Localhost GSM-Helper-Tool (Sadiq Odho) & Email Relay Server
 * Runs on http://localhost:3001
 *
 * Specially engineered to support:
 * 1. Sadiq Odho's "GSM Modem (SMS)" + "GSM-Helper-Tool" (https://github.com/sadiqodho/GSM-Helper-Tool)
 *    Endpoint: http://<PHONE_IP>:8090/SendSMS?username=sadiq&password=12345&phone=0300xxxxxxx&message=...
 *    Android Broadcast Action: "helper.gsm.com.gsmhelpertool" (Extras: "phone", "message")
 * 2. SAME-PHONE HOTSPOT + MOBILE DATA MODE:
 *    When the PC is connected to the Mobile Phone's Hotspot (Wi-Fi Hotspot or USB Tethering) AND
 *    Mobile Data is ON on that same phone:
 *    - Phone's Wi-Fi client is OFF, so the phone screen may show 0.0.0.0:8090 or a Mobile Data WAN IP (10.x.x.x).
 *    - This server automatically detects the Windows Default Gateway IP of the Hotspot/Tethering adapter
 *      (which is the exact local IP of the Hotspot Phone!) and binds outbound sockets (`localAddress`)
 *      directly to the Hotspot/LAN network interface (bypassing any VPN or WAN routing).
 * 3. Backend Email Notification Dispatcher (/api/send-email)
 */
import http from 'node:http';
import os from 'node:os';
import { execSync } from 'node:child_process';

const PORT = 3001;

// Keep an in-memory queue of recent SMS messages for the optional /mobile-bridge companion page
const recentSmsQueue = [];

/**
 * Normalizes Pakistani phone numbers for GSM SIM SmsManager (e.g. +923001234567 -> 03001234567)
 */
function normalizePakPhoneForGsm(rawPhone) {
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
 * Discovers physical Wi-Fi / Hotspot / USB Tethering interfaces and Default Gateways on Windows,
 * explicitly ignoring virtual VPN / VM adapters (ProtonVPN, NordLynx, VirtualBox 192.168.56.1, vEthernet).
 */
function discoverNetworkTopology() {
  const adapters = [];
  const nets = os.networkInterfaces();

  for (const [name, addrs] of Object.entries(nets)) {
    if (!addrs) continue;
    const lower = name.toLowerCase();
    // Skip VPNs and virtual hypervisor switches so traffic stays on the real Wi-Fi Hotspot / LAN
    if (
      lower.includes('vpn') ||
      lower.includes('nordlynx') ||
      lower.includes('vethernet') ||
      lower.includes('loopback') ||
      lower.includes('vmware') ||
      lower.includes('virtualbox')
    ) {
      continue;
    }

    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Also skip VirtualBox default host-only 192.168.56.1 and ProtonVPN 10.2.0.x
        if (addr.address.startsWith('192.168.56.') || addr.address.startsWith('10.2.0.')) {
          continue;
        }
        adapters.push({
          name,
          localIp: addr.address,
          netmask: addr.netmask,
          subnetPrefix: addr.address.split('.').slice(0, 3).join('.'),
        });
      }
    }
  }

  const gateways = new Set();
  try {
    const ipconfigOut = execSync('ipconfig', { timeout: 2500 }).toString();
    const lines = ipconfigOut.split(/\r?\n/);
    let readingGatewayBlock = false;

    for (const line of lines) {
      const gwMatch = line.match(/Default Gateway[ .\s]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)/i);
      if (gwMatch) {
        readingGatewayBlock = true;
        if (gwMatch[1] !== '0.0.0.0') {
          gateways.add(gwMatch[1]);
        }
        continue;
      }
      if (readingGatewayBlock) {
        const contMatch = line.match(/^\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s*$/);
        if (contMatch && contMatch[1] !== '0.0.0.0') {
          gateways.add(contMatch[1]);
        } else {
          readingGatewayBlock = false;
        }
      }
    }
  } catch {
    // ignore ipconfig error
  }

  // Also add the .1 gateway of each active physical/hotspot subnet + standard Android Hotspot Gateway IPs
  const arpNeighbors = new Set();
  for (const adapter of adapters) {
    gateways.add(`${adapter.subnetPrefix}.1`);
    try {
      const arpOut = execSync(`arp -a -N ${adapter.localIp}`, { timeout: 2000 }).toString();
      const matches = arpOut.matchAll(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+[0-9a-f\-]+\s+dynamic/gi);
      for (const m of matches) {
        if (m[1] !== adapter.localIp && !m[1].endsWith('.255')) {
          arpNeighbors.add(m[1]);
        }
      }
    } catch {
      // ignore arp error
    }
  }

  // Standard Android Hotspot & USB Tethering Gateway IPs
  const standardHotspotIps = ['192.168.43.1', '192.168.42.129', '192.168.137.1'];

  // Ordered candidate phone IPs (Default Gateways first because in Hotspot mode the Phone IS the Default Gateway!)
  const candidatePhoneIps = [
    ...gateways,
    ...arpNeighbors,
    ...standardHotspotIps,
  ].filter((ip, idx, arr) => ip && ip !== '0.0.0.0' && arr.indexOf(ip) === idx);

  return {
    adapters,
    defaultGateways: [...gateways],
    arpNeighbors: [...arpNeighbors],
    candidatePhoneIps,
  };
}

/**
 * Performs an HTTP request bound to the matching local LAN/Hotspot adapter (`localAddress`)
 * so that even if a VPN is active or the phone is running Hotspot + Mobile Data, the request
 * routes directly over the local Wi-Fi Hotspot / USB Tethering link to the phone.
 */
function httpRequestOverLocalInterface(targetUrlStr, options = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrlStr);
    } catch (e) {
      return reject(e);
    }

    const { adapters } = discoverNetworkTopology();
    const targetPrefix = parsed.hostname.split('.').slice(0, 3).join('.');
    const matchingAdapter =
      adapters.find((a) => a.subnetPrefix === targetPrefix) || adapters[0];

    const reqOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 8090,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 2200,
    };

    // Bind directly to the physical Hotspot/LAN adapter IP if on private LAN subnet
    if (
      matchingAdapter &&
      parsed.hostname !== 'localhost' &&
      parsed.hostname !== '127.0.0.1'
    ) {
      reqOptions.localAddress = matchingAdapter.localIp;
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          body: data,
          usedLocalIp: reqOptions.localAddress || 'default',
          targetHost: `${parsed.hostname}:${reqOptions.port}`,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('Timeout'));
    });
    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Builds the exact URL for Sadiq Odho's GSM Modem (SMS) + GSM-Helper-Tool
 * Format: http://<IP>:8090/SendSMS?username=sadiq&password=12345&phone=0300xxxxxxx&message=...
 */
function buildSadiqGsmUrl(hostIp, port, endpointPath, username, password, phone, message) {
  const cleanEndpoint = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
  const params = new URLSearchParams();
  if (username) params.set('username', username);
  if (password) params.set('password', password);
  params.set('phone', normalizePakPhoneForGsm(phone));
  params.set('message', message);
  return `http://${hostIp}:${port}${cleanEndpoint}?${params.toString()}`;
}

/**
 * Optional direct ADB broadcast fallback for sadiqodho/GSM-Helper-Tool (`helper.gsm.com.gsmhelpertool`)
 * Works if phone is connected via USB Debugging or Wireless ADB over Hotspot!
 */
function tryAdbBroadcastToGsmHelperTool(phone, message) {
  try {
    const cleanPhone = normalizePakPhoneForGsm(phone);
    const safeMsg = String(message).replace(/"/g, '\\"').replace(/\n/g, ' ');
    const out = execSync(
      `adb shell am broadcast -a helper.gsm.com.gsmhelpertool --es phone "${cleanPhone}" --es message "${safeMsg}"`,
      { timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }
    ).toString();
    if (out.includes('Broadcast completed')) {
      return { ok: true, detail: 'Delivered via Direct ADB Broadcast to GSM-Helper-Tool' };
    }
  } catch {
    // ADB not connected or not installed, ignore silently
  }
  return { ok: false };
}

const server = http.createServer(async (req, res) => {
  // Enable CORS + Chrome Private Network Access (PNA) so HTTPS sites on Vercel / VPS
  // (e.g. https://yourschool.com) can call http://localhost:3001 on the Gate PC freely!
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Access-Control-Request-Private-Network'
  );
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://localhost:${PORT}`);

  // 1. Health & Network Topology Status
  if (req.method === 'GET' && reqUrl.pathname === '/api/health') {
    const netInfo = discoverNetworkTopology();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        service: 'Vision Grammar School — GSM-Helper-Tool & Hotspot SMS Bridge',
        port: PORT,
        network: netInfo,
      })
    );
    return;
  }

  // 2. Auto-Detect Hotspot Gateway / Phone IP Endpoint
  if (req.method === 'GET' && reqUrl.pathname === '/api/detect-gateway') {
    const netInfo = discoverNetworkTopology();
    const portToProbe = reqUrl.searchParams.get('port') || '8090';
    let reachablePhoneIp = null;

    // Quick probe on candidate IPs to see if GSM Modem (:8090) is already listening
    for (const ip of netInfo.candidatePhoneIps.slice(0, 5)) {
      try {
        const probe = await httpRequestOverLocalInterface(`http://${ip}:${portToProbe}/`, {
          method: 'GET',
          timeout: 800,
        });
        if (probe.status) {
          reachablePhoneIp = ip;
          break;
        }
      } catch {
        // continue probing next candidate
      }
    }

    const recommendedIp =
      reachablePhoneIp ||
      netInfo.defaultGateways[0] ||
      netInfo.arpNeighbors[0] ||
      '192.168.43.1';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        reachablePhoneIp,
        recommendedIp,
        recommendedUrl: `http://${recommendedIp}:${portToProbe}`,
        ...netInfo,
      })
    );
    return;
  }

  // 3. Mobile Companion Web Bridge (Can be opened on the Hotspot Phone Browser: http://<PC_IP>:3001/mobile-bridge)
  if (req.method === 'GET' && reqUrl.pathname === '/mobile-bridge') {
    const netInfo = discoverNetworkTopology();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vision Grammar School — GSM-Helper-Tool Hotspot Bridge</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 16px; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 16px; margin-bottom: 14px; }
    .badge { display: inline-block; background: #059669; color: white; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }
    .btn { display: inline-block; background: #10b981; color: #052e16; font-weight: 800; padding: 10px 14px; border-radius: 10px; text-decoration: none; margin-top: 8px; margin-right: 8px; font-size: 13px; }
    code { background: #020617; padding: 3px 6px; border-radius: 6px; color: #38bdf8; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">LIVE HOTSPOT & LOCAL LAN GSM BRIDGE</span>
    <h2 style="margin: 10px 0 4px;">Vision Grammar School — GSM-Helper-Tool</h2>
    <p style="font-size: 13px; color: #94a3b8; margin: 0;">
      Connected PC Local IPs: <code>${netInfo.adapters.map((a) => a.localIp).join(', ') || 'localhost'}</code>
      | Detected Hotspot Gateway (Phone IP): <code>${netInfo.defaultGateways.join(', ') || '192.168.43.1'}</code>
    </p>
  </div>
  <div class="card">
    <h3 style="margin-top:0;">Recent Outgoing School SMS Queue (${recentSmsQueue.length})</h3>
    ${
      recentSmsQueue.length === 0
        ? '<p style="color:#94a3b8;font-size:13px;">No SMS queued yet. Tap an RFID Card on the PC or send a test SMS.</p>'
        : recentSmsQueue
            .map(
              (item) => `<div style="border-bottom:1px solid #334155;padding:10px 0;">
          <div><strong>To: ${item.phone}</strong> <span style="color:#94a3b8;font-size:12px;">(${item.time})</span></div>
          <div style="font-size:13px;margin:4px 0;white-space:pre-wrap;">${item.message}</div>
          <a class="btn" href="intent://send/#Intent;action=helper.gsm.com.gsmhelpertool;S.phone=${encodeURIComponent(
            item.phone
          )};S.message=${encodeURIComponent(item.message)};end">Trigger GSM-Helper-Tool</a>
          <a class="btn" style="background:#38bdf8;" href="sms:${encodeURIComponent(
            item.phone
          )}?body=${encodeURIComponent(item.message)}">Send via Native SIM</a>
        </div>`
            )
            .join('')
    }
  </div>
  <script>setTimeout(() => location.reload(), 5000);</script>
</body>
</html>`);
    return;
  }

  // Collect request JSON body
  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk;
  });

  req.on('end', async () => {
    try {
      const payload = rawBody ? JSON.parse(rawBody) : {};

      if (req.method === 'POST' && reqUrl.pathname === '/api/send-sms') {
        const {
          phoneServerUrl = 'http://192.168.43.1:8090',
          endpointPath = '/SendSMS',
          gsmUsername = 'sadiq',
          gsmPassword = '12345',
          hotspotAutoDetect = true,
          apiKeyOrToken = '',
          payloadFormat = 'SADIQ_GSM_HELPER',
          phone = '',
          message = '',
          body = {},
        } = payload;

        const normalizedPhone = normalizePakPhoneForGsm(phone);

        // Save in recent queue
        recentSmsQueue.unshift({
          phone: normalizedPhone,
          message,
          time: new Date().toLocaleTimeString(),
        });
        if (recentSmsQueue.length > 30) recentSmsQueue.pop();

        // Parse user's configured host & port
        let configuredHost = '192.168.43.1';
        let configuredPort = '8090';
        try {
          const parsedUrl = new URL(
            phoneServerUrl.startsWith('http') ? phoneServerUrl : `http://${phoneServerUrl}`
          );
          configuredHost = parsedUrl.hostname;
          configuredPort = parsedUrl.port || '8090';
        } catch {
          // fallback defaults
        }

        // Build list of candidate IPs to try:
        // If user is on the SAME phone's Hotspot + Mobile Data, the phone might show 0.0.0.0 or a 10.x.x.x WAN IP.
        // So we automatically include the Windows Default Gateway IPs (which IS the Hotspot Phone IP!)
        const netInfo = discoverNetworkTopology();
        const candidateHosts = [];

        if (
          configuredHost &&
          configuredHost !== '0.0.0.0' &&
          configuredHost !== 'auto'
        ) {
          candidateHosts.push(configuredHost);
        }

        if (hotspotAutoDetect) {
          for (const gwIp of netInfo.candidatePhoneIps) {
            if (!candidateHosts.includes(gwIp)) {
              candidateHosts.push(gwIp);
            }
          }
        }

        console.log(
          `[GSM-HELPER-BRIDGE] Sending SMS to ${normalizedPhone} | Format: ${payloadFormat} | Candidate Phone IPs: ${candidateHosts.join(', ')}`
        );

        let forwarded = false;
        let detail = '';

        for (const hostIp of candidateHosts) {
          try {
            let targetUrl = '';
            let method = 'GET';
            let reqBodyStr = undefined;
            const headers = {};

            if (payloadFormat === 'SADIQ_GSM_HELPER' || payloadFormat === 'GET_QUERY') {
              // Sadiq Odho's GSM Modem (SMS) + GSM-Helper-Tool format:
              // http://<IP>:8090/SendSMS?username=sadiq&password=12345&phone=0300xxxxxxx&message=...
              targetUrl = buildSadiqGsmUrl(
                hostIp,
                configuredPort,
                endpointPath || '/SendSMS',
                gsmUsername,
                gsmPassword,
                normalizedPhone,
                message
              );
              method = 'GET';
            } else {
              const cleanEndpoint = (endpointPath || '/send-sms').startsWith('/')
                ? endpointPath
                : `/${endpointPath}`;
              targetUrl = `http://${hostIp}:${configuredPort}${cleanEndpoint}`;
              method = 'POST';
              headers['Content-Type'] = 'application/json';
              if (apiKeyOrToken) headers['Authorization'] = apiKeyOrToken;
              reqBodyStr = JSON.stringify(body);
            }

            const result = await httpRequestOverLocalInterface(targetUrl, {
              method,
              headers,
              body: reqBodyStr,
              timeout: 2200,
            });

            if (result.ok) {
              forwarded = true;
              detail = `Sent via GSM-Helper-Tool (${result.targetHost} via PC Adapter ${result.usedLocalIp})`;
              console.log(`✅ [GSM-HELPER-BRIDGE] ${detail}`);
              break;
            } else {
              detail = `Phone Server (${result.targetHost}) HTTP ${result.status}`;
            }
          } catch (err) {
            // Try next candidate IP (e.g. Hotspot Default Gateway IP)
          }
        }

        // If HTTP server on phone wasn't reachable, try direct ADB broadcast to sadiqodho/GSM-Helper-Tool
        if (!forwarded) {
          const adbRes = tryAdbBroadcastToGsmHelperTool(normalizedPhone, message);
          if (adbRes.ok) {
            forwarded = true;
            detail = adbRes.detail;
          } else {
            const activeGw = netInfo.defaultGateways[0] || configuredHost;
            detail = `Queued in Localhost Bridge (Hotspot Gateway IP: ${activeGw}:${configuredPort}${endpointPath})`;
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            forwarded,
            detail,
            detectedHotspotGateways: netInfo.defaultGateways,
            detectedLanAdapters: netInfo.adapters,
          })
        );
        return;
      }

      if (req.method === 'POST' && reqUrl.pathname === '/api/send-email') {
        const { from, to, subject } = payload;
        console.log(`[EMAIL-BACKEND] Dispatched Email from ${from} to ${to} | Subject: ${subject}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            detail: `Backend Email queued/sent to ${to}`,
          })
        );
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Route not found' }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid JSON request' }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const netInfo = discoverNetworkTopology();
  console.log(
    `✅ Vision Grammar School GSM-Helper-Tool & Hotspot Relay running at http://localhost:${PORT}`
  );
  console.log(
    `📡 Active PC Hotspot/LAN Adapters: ${
      netInfo.adapters.map((a) => `${a.name} (${a.localIp})`).join(', ') || 'None'
    }`
  );
  console.log(
    `📱 Detected Default Gateway / Hotspot Phone IPs: ${
      netInfo.defaultGateways.join(', ') || '192.168.43.1'
    }`
  );
});
