-- ============================================================
-- Migration 0003 — Bind a WhatsApp session to the browser that connected it
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- Used to restrict contact fetch/sync to the same browser that linked the
-- WhatsApp session. connector_id matches an httpOnly "wa_connector" cookie.

CREATE TABLE IF NOT EXISTS whatsapp_session_connectors (
  session_id   TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Service-role only (API uses the service key, which bypasses RLS)
ALTER TABLE whatsapp_session_connectors ENABLE ROW LEVEL SECURITY;
