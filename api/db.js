import { neon } from '@neondatabase/serverless';

const getDbUrl = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  '';

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS vgs_app_state (
      state_key TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
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
  if (!dbUrl) {
    return res.status(200).json({
      ok: true,
      connected: false,
      provider: 'local_fallback',
      message:
        'DATABASE_URL not configured yet. Using browser localStorage fallback. Add Neon DATABASE_URL in Vercel Environment Variables to enable cloud persistence.',
      data: {},
    });
  }

  try {
    const sql = neon(dbUrl);
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const rows = await sql`SELECT state_key, payload, updated_at FROM vgs_app_state`;
      const data = {};
      for (const row of rows) {
        data[row.state_key] = row.payload;
      }
      return res.status(200).json({
        ok: true,
        connected: true,
        provider: 'neon_postgres',
        data,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { key, value, bulk } = body;

      if (bulk && typeof bulk === 'object') {
        const entries = Object.entries(bulk);
        for (const [k, v] of entries) {
          await sql`
            INSERT INTO vgs_app_state (state_key, payload, updated_at)
            VALUES (${k}, ${JSON.stringify(v)}::jsonb, NOW())
            ON CONFLICT (state_key)
            DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();
          `;
        }
        return res.status(200).json({
          ok: true,
          connected: true,
          savedKeys: entries.map(([k]) => k),
        });
      }

      if (!key) {
        return res.status(400).json({ ok: false, error: 'Missing key or bulk object' });
      }

      await sql`
        INSERT INTO vgs_app_state (state_key, payload, updated_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, NOW())
        ON CONFLICT (state_key)
        DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();
      `;

      return res.status(200).json({
        ok: true,
        connected: true,
        savedKey: key,
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      connected: false,
      error: err instanceof Error ? err.message : 'Neon DB error',
    });
  }
}
