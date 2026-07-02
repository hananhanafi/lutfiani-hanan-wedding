-- ============================================================
-- Migration 0006 — Persist WhatsApp (Baileys) auth state
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- Keeps the paired-device credentials off the microservice's ephemeral disk
-- so the WhatsApp connection survives restarts/redeploys (no daily re-pairing).

CREATE TABLE IF NOT EXISTS wa_auth_state (
  session_id  TEXT NOT NULL,
  key         TEXT NOT NULL,          -- "creds" or "<type>-<id>" signal keys
  value       TEXT NOT NULL,          -- JSON (Baileys BufferJSON) as text
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, key)
);

-- Service-role only (the microservice uses the service key, which bypasses RLS)
ALTER TABLE wa_auth_state ENABLE ROW LEVEL SECURITY;
