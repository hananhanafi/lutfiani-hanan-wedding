-- ============================================================
-- Migration 0004 — Group-level invitation/QR + pax headcount
-- Run in Supabase: SQL Editor → New Query. Safe to re-run.
-- ============================================================

-- Group invitation token (drives /pass?token=<group token>) + headcount fields
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS token UUID UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS expected_pax INT;                       -- null = auto (members + plus-ones)
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS arrived_pax INT NOT NULL DEFAULT 0;     -- running total from scans
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS first_arrived_at TIMESTAMPTZ;
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS last_arrived_at TIMESTAMPTZ;

-- Ensure existing rows have a token (the volatile default fills new rows; this covers older ones)
UPDATE guest_groups SET token = gen_random_uuid() WHERE token IS NULL;

-- Per-scan audit log (incremental check-in, allows correction/undo)
CREATE TABLE IF NOT EXISTS group_checkin_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES guest_groups(id) ON DELETE CASCADE,
  pax         INT NOT NULL,
  scanned_by  TEXT,                       -- scanner is PIN-only; null unless a staff label is known
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS group_checkin_events_group_idx ON group_checkin_events (group_id, created_at);
ALTER TABLE group_checkin_events ENABLE ROW LEVEL SECURITY;
