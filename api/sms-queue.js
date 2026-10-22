import { neon } from '@neondatabase/serverless';

const memoryQueue = [];

const getDbUrl = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

async function ensureSmsTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS vgs_sms_queue (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      message TEXT NOT NULL,
      recipient_name TEXT,
      event_type TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      sent_at TIMESTAMPTZ
    );
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbUrl = getDbUrl();

  try {
    if (dbUrl) {
      const sql = neon(dbUrl);
      await ensureSmsTable(sql);

      if (req.method === 'GET') {
        const pending = await sql`
          SELECT id, phone, message, recipient_name, event_type, status, created_at
          FROM vgs_sms_queue
          WHERE status = 'PENDING'
          ORDER BY created_at ASC
          LIMIT 25
        `;
        return res.status(200).json({
          ok: true,
          storage: 'neon_postgres',
          pendingCount: pending.length,
          messages: pending,
        });
      }

      if (req.method === 'POST') {
        const body =
          typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

        if (body.action === 'ACK' && body.id) {
          await sql`
            UPDATE vgs_sms_queue
            SET status = ${body.status || 'SENT'}, sent_at = NOW()
            WHERE id = ${body.id}
          `;
          return res.status(200).json({ ok: true, updatedId: body.id });
        }

        const id = body.id || `sms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const phone = String(body.phone || body.number || '').trim();
        const message = String(body.message || body.text || '').trim();

        if (!phone || !message) {
          return res.status(400).json({ ok: false, error: 'Missing phone or message' });
        }

        await sql`
          INSERT INTO vgs_sms_queue (id, phone, message, recipient_name, event_type, status)
          VALUES (${id}, ${phone}, ${message}, ${body.recipientName || ''}, ${body.eventType || 'GATE'}, 'PENDING')
        `;

        return res.status(200).json({
          ok: true,
          queued: true,
          storage: 'neon_postgres',
          id,
        });
      }
    }

    // Fallback in-memory queue if DATABASE_URL is not configured yet
    if (req.method === 'GET') {
      const pending = memoryQueue.filter((m) => m.status === 'PENDING');
      return res.status(200).json({
        ok: true,
        storage: 'memory_fallback',
        pendingCount: pending.length,
        messages: pending,
      });
    }

    if (req.method === 'POST') {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

      if (body.action === 'ACK' && body.id) {
        const item = memoryQueue.find((m) => m.id === body.id);
        if (item) item.status = body.status || 'SENT';
        return res.status(200).json({ ok: true, updatedId: body.id });
      }

      const id = body.id || `sms_${Date.now()}`;
      const item = {
        id,
        phone: String(body.phone || body.number || ''),
        message: String(body.message || body.text || ''),
        recipient_name: body.recipientName || '',
        event_type: body.eventType || 'GATE',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      };
      memoryQueue.push(item);
      return res.status(200).json({
        ok: true,
        queued: true,
        storage: 'memory_fallback',
        id,
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'SMS Queue Error',
    });
  }
}
