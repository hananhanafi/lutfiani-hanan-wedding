-- ============================================================
-- Migration 0007 — Persist WhatsApp OTP verification state
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- The OTP verify-state used to live in an in-memory Map, which does not
-- survive serverless cold starts / instance switches — so senders were
-- re-prompted for OTP on nearly every send. Persisting it here makes the
-- 1-day verification window actually stick.

CREATE TABLE IF NOT EXISTS wa_otp_state (
  session_id       TEXT PRIMARY KEY,
  phone            TEXT NOT NULL,          -- sender phone; verification is bound to this
  code             TEXT,                   -- pending one-time code (cleared once verified)
  code_expires_at  TIMESTAMPTZ,            -- code validity (10 min)
  verified_until   TIMESTAMPTZ,            -- verified-state expiry (1 day)
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Service-role only (server routes use the service key, which bypasses RLS)
ALTER TABLE wa_otp_state ENABLE ROW LEVEL SECURITY;
