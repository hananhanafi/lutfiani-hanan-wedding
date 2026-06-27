-- ============================================================
-- Migration 0001 — Guest Groups master data
-- Run in Supabase: SQL Editor → New Query. Safe to re-run (idempotent).
-- ============================================================

-- 1) Master table for guest groups
CREATE TABLE IF NOT EXISTS guest_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  side        TEXT,                       -- optional: 'bride' | 'groom'
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Case-insensitive unique name (prevents "Keluarga" vs "keluarga" duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS guest_groups_name_lower_idx ON guest_groups (lower(name));

-- Service-role only (API uses the service key, which bypasses RLS)
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;

-- 2) Link column on guests. group_name is kept as a denormalized mirror so all
--    existing read sites (guest list, kirim, exports, RSVP view) keep working.
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES guest_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS guests_group_id_idx ON guests (group_id);

-- 3) Backfill master data from existing distinct group names (guests + RSVPs),
--    deduplicated case-insensitively.
INSERT INTO guest_groups (name)
SELECT name FROM (
  SELECT DISTINCT ON (lower(trim(group_name))) trim(group_name) AS name
  FROM (
    SELECT group_name FROM guests
    UNION ALL
    SELECT group_name FROM rsvp_submissions
  ) s
  WHERE group_name IS NOT NULL AND trim(group_name) <> ''
  ORDER BY lower(trim(group_name)), trim(group_name)
) d
ON CONFLICT (lower(name)) DO NOTHING;

-- 4) Link existing guests to the seeded groups by name match.
UPDATE guests g
SET group_id = gg.id
FROM guest_groups gg
WHERE g.group_id IS NULL
  AND g.group_name IS NOT NULL
  AND lower(trim(g.group_name)) = lower(gg.name);

-- Optional sanity check (run manually):
-- SELECT gg.name, count(g.id) AS guests
-- FROM guest_groups gg LEFT JOIN guests g ON g.group_id = gg.id
-- GROUP BY gg.name ORDER BY guests DESC;
