import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

/**
 * Vision Grammar School - Subscription CLI & Anti-API Bridge
 * Reference Architecture: E:/AKGFlow/src/lib/admin/cli-agents.ts
 * Supports:
 *  - codex-cli (ChatGPT Plus/Pro/Team subscription via `codex exec - --json`)
 *  - claude-cli (Claude Pro/Max subscription via `claude -p <prompt> --output-format json`)
 *  - gemini-cli (Antigravity / Gemini CLI via `agy -p <prompt>`)
 *  - anti-api (Antigravity Subscription OpenAI/Anthropic compatible proxy at http://127.0.0.1:8080/v1)
 */

async function probeCli(binary, args = ['--version']) {
  const isWin = process.platform === 'win32';
  const candidates = isWin ? [`${binary}.cmd`, `${binary}.exe`, binary] : [binary];
  for (const cmd of candidates) {
    try {
      const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: 6000, windowsHide: true });
      return { installed: true, binaryPath: cmd, output: (stdout || stderr || '').trim() };
    } catch {
      // try next candidate
    }
  }
  return { installed: false, binaryPath: null, output: '' };
}

async function checkAntiApiProxy(endpoint = 'http://127.0.0.1:8080/v1') {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${endpoint.replace(/\/$/, '')}/models`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { active: true, endpoint, models: data?.data || [] };
    }
    return { active: false, endpoint, status: res.status };
  } catch {
    return { active: false, endpoint };
  }
}

async function getAllSubscriptionStatuses(antiApiEndpoint = 'http://127.0.0.1:8080/v1') {
  const [codexVer, claudeVer, agyVer, antiApi] = await Promise.all([
    probeCli('codex', ['--version']),
    probeCli('claude', ['--version']),
    probeCli('agy', ['--version']),
    checkAntiApiProxy(antiApiEndpoint),
  ]);

  let codexAuthed = false;
  let codexDetail = codexVer.output || 'Not detected on server host';
  if (codexVer.installed && codexVer.binaryPath) {
    try {
      const { stdout, stderr } = await execFileAsync(codexVer.binaryPath, ['login', 'status'], { timeout: 5000 });
      const combined = `${stdout}\n${stderr}`;
      codexAuthed = combined.toLowerCase().includes('logged in');
      codexDetail = combined.trim() || codexVer.output;
    } catch {
      codexAuthed = false;
    }
  }

  let claudeAuthed = false;
  let claudeDetail = claudeVer.output || 'Not detected on server host';
  if (claudeVer.installed && claudeVer.binaryPath) {
    try {
      const { stdout } = await execFileAsync(claudeVer.binaryPath, ['auth', 'status', '--json'], { timeout: 5000 });
      const parsed = JSON.parse(stdout);
      claudeAuthed = Boolean(parsed?.loggedIn);
      claudeDetail = parsed?.email ? `Logged in (${parsed.email})` : claudeVer.output;
    } catch {
      claudeAuthed = false;
    }
  }

  const agyTokenPath = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'antigravity-oauth-token');
  const agyAuthed = fs.existsSync(agyTokenPath);

  return {
    'codex-cli': {
      installed: codexVer.installed,
      authenticated: codexAuthed,
      version: codexVer.output,
      detail: codexDetail,
      loginCommand: 'codex login --device-auth',
    },
    'claude-cli': {
      installed: claudeVer.installed,
      authenticated: claudeAuthed,
      version: claudeVer.output,
      detail: claudeDetail,
      loginCommand: 'claude setup-token',
    },
    'gemini-cli': {
      installed: agyVer.installed,
      authenticated: agyAuthed,
      version: agyVer.output,
      detail: agyAuthed ? 'Antigravity OAuth token active' : 'Run agy login',
      loginCommand: 'agy login',
    },
    'anti-api': {
      installed: true,
      authenticated: antiApi.active,
      version: antiApi.active ? 'Connected (anti-api proxy)' : 'Offline (start anti-api on port 8080)',
      detail: antiApi.endpoint,
      loginCommand: 'npx anti-api start --port 8080',
    },
  };
}

function runCodexCli(prompt, model = 'gpt-5.4', effort = 'high') {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32';
    const bin = isWin ? 'codex.cmd' : 'codex';
    const args = [
      'exec',
      '-',
      '--json',
      '--sandbox',
      'read-only',
      '--skip-git-repo-check',
      '-m',
      model,
      '-c',
      `model_reasoning_effort="${effort === 'max' || effort === 'xhigh' ? 'high' : effort}"`,
    ];
    const child = spawn(bin, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(stderr || `Codex CLI exited with code ${code}`));
      }
      const messages = [];
      for (const line of stdout.split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === 'item.completed' && ev.item?.type === 'agent_message' && ev.item?.text) {
            messages.push(ev.item.text);
          }
        } catch {
          // ignore non-json lines
        }
      }
      resolve(messages.join('\n').trim() || stdout.trim());
    });
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const endpoint = req.query?.antiApiEndpoint || 'http://127.0.0.1:8080/v1';
      const statuses = await getAllSubscriptionStatuses(endpoint);
      return res.status(200).json({ ok: true, statuses });
    }

    if (req.method === 'POST') {
      const { provider, model, effort = 'high', prompt, antiApiEndpoint = 'http://127.0.0.1:8080/v1' } = req.body || {};
      if (!prompt) {
        return res.status(400).json({ ok: false, error: 'Prompt is required' });
      }

      if (provider === 'anti-api') {
        const baseUrl = antiApiEndpoint.replace(/\/$/, '');
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer anti-api-local' },
          body: JSON.stringify({
            model: model || 'claude-sonnet-4-6',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
          }),
        });
        if (!resp.ok) {
          throw new Error(`anti-api proxy returned HTTP ${resp.status}`);
        }
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content || '';
        return res.status(200).json({ ok: true, provider: 'anti-api', text });
      }

      if (provider === 'codex-cli') {
        const text = await runCodexCli(prompt, model || 'gpt-5.4', effort);
        return res.status(200).json({ ok: true, provider: 'codex-cli', text });
      }

      if (provider === 'claude-cli') {
        const isWin = process.platform === 'win32';
        const bin = isWin ? 'claude.cmd' : 'claude';
        const { stdout } = await execFileAsync(
          bin,
          ['-p', prompt, '--model', model || 'claude-sonnet-4-6', '--output-format', 'json'],
          { timeout: 60000, windowsHide: true }
        );
        let text = stdout;
        try {
          const parsed = JSON.parse(stdout);
          text = parsed.result || parsed.text || stdout;
        } catch {
          // keep raw stdout
        }
        return res.status(200).json({ ok: true, provider: 'claude-cli', text });
      }

      if (provider === 'gemini-cli') {
        const isWin = process.platform === 'win32';
        const bin = isWin ? 'agy.cmd' : 'agy';
        const { stdout } = await execFileAsync(bin, ['-p', prompt], { timeout: 60000, windowsHide: true });
        return res.status(200).json({ ok: true, provider: 'gemini-cli', text: stdout.trim() });
      }

      return res.status(400).json({ ok: false, error: `Unsupported CLI provider: ${provider}` });
    }

    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (error) {
    return res.status(200).json({
      ok: false,
      fallbackRequired: true,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
