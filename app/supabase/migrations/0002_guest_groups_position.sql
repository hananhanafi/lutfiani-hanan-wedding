-- ============================================================
-- Migration 0002 — Guest Groups manual ordering
-- Run in Supabase: SQL Editor → New Query. Safe to re-run (idempotent).
-- ============================================================

-- Ordering column for the master group list
ALTER TABLE guest_groups ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS guest_groups_position_idx ON guest_groups (position);

-- Backfill an initial order by name — but ONLY if no custom order exists yet
-- (i.e. all rows still share the default position). This keeps re-runs safe:
-- once an admin has reordered, this block becomes a no-op.
DO $$
BEGIN
  IF (SELECT count(DISTINCT position) FROM guest_groups) <= 1 THEN
    WITH ordered AS (
      SELECT id, (row_number() OVER (ORDER BY name) - 1) AS rn
      FROM guest_groups
    )
    UPDATE guest_groups g
    SET position = o.rn
    FROM ordered o
    WHERE g.id = o.id;
  END IF;
END $$;
