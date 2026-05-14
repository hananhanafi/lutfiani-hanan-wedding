-- ============================================================
-- Wedding Invitation - Database Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ── Guests / RSVPs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  attending        BOOLEAN,                          -- true = attending, false = not attending, null = pending
  plus_one_name    TEXT,
  group_name       TEXT,                             -- where are you from / group name
  side             TEXT,                             -- 'bride' or 'groom'
  message          TEXT,                             -- congratulatory message / wishes wall
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  token            UUID UNIQUE DEFAULT gen_random_uuid(), -- unique QR code token
  checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at    TIMESTAMPTZ
);

-- Migration: run this if the table already exists
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_name TEXT;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS side TEXT;

-- ── Site Configuration ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_config (
  id                   INT PRIMARY KEY DEFAULT 1,    -- single row only
  partner_one_name     TEXT NOT NULL DEFAULT 'Partner One',
  partner_two_name     TEXT NOT NULL DEFAULT 'Partner Two',
  wedding_date         DATE,
  wedding_time         TEXT,
  venue_name           TEXT,
  venue_address        TEXT,
  venue_maps_url       TEXT,
  dress_code           TEXT,
  rsvp_deadline        DATE,
  cover_photo_url      TEXT,
  -- Theme
  theme_color_primary  TEXT DEFAULT '#d4a373',
  theme_color_secondary TEXT DEFAULT '#faedcd',
  theme_font           TEXT DEFAULT 'Playfair Display',
  -- Content sections
  story_text           TEXT,
  gift_registry_url    TEXT,
  travel_info          TEXT,
  faq_json             JSONB DEFAULT '[]',           -- array of {question, answer}
  schedule_json        JSONB DEFAULT '[]',           -- array of {time, title, description}
  gallery_photos_json  JSONB DEFAULT '[]',           -- array of photo URLs
  -- Site password protection
  site_password_enabled BOOLEAN DEFAULT FALSE,
  site_password_hash    TEXT,
  -- Metadata
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ── Wishes Wall ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run these if tables already exist
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gallery_photos_json JSONB DEFAULT '[]';

-- ── Seed default site config row ────────────────────────────
INSERT INTO site_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── Row Level Security ───────────────────────────────────────
-- Guests table: public can INSERT (RSVP), only service role can SELECT/UPDATE/DELETE
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public RSVP insert"
  ON guests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Allow public token lookup (scanner)"
  ON guests FOR SELECT
  USING (TRUE);  -- API routes handle auth; adjust to restrict if needed

-- site_config: read-only for public, write only via service role
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of site config"
  ON site_config FOR SELECT
  USING (TRUE);
