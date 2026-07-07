-- ============================================================
-- Migration 0008 — Record when a WhatsApp invitation was sent
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- Adds a timestamp captured the moment a guest's WhatsApp invite is sent
-- (automatic send, single send, or manual wa.me "mark as sent").

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;
