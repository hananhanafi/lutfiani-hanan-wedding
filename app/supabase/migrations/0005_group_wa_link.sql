-- ============================================================
-- Migration 0005 — Link a guest group to a WhatsApp group chat (Phase 2)
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- Stores the WhatsApp group the invitation + QR is sent to.

ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS wa_group_jid  TEXT;  -- e.g. "1203...@g.us"
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS wa_group_name TEXT;  -- cached subject for display
