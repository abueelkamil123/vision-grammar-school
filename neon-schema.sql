-- =====================================================================
-- VISION GRAMMAR SCHOOL (BLOCK 56, D.G. KHAN) — NEON POSTGRES SCHEMA
-- Compatible with Neon Serverless Postgres (Always-Free Tier) + Vercel
-- Note: /api/db.js and /api/sms-queue.js also run CREATE TABLE IF NOT EXISTS
-- automatically on the first request!
-- =====================================================================

CREATE TABLE IF NOT EXISTS vgs_app_state (
  state_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_vgs_sms_queue_status
  ON vgs_sms_queue (status, created_at);
