-- ============================================================
-- Migration 0009 — Allow a guest's QR to be scanned more than once
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================
-- When true, the scanner accepts repeated check-ins for this guest instead of
-- showing "already checked in" after the first scan (useful for shared passes).

ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS allow_multi_checkin BOOLEAN DEFAULT false;
