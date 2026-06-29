-- ============================================================
-- Wedding Invitation - Database Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- ── Guests / RSVPs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  phone_number     TEXT,
  attending        BOOLEAN,                          -- true = attending, false = not attending, null = pending
  plus_one_name    TEXT,
  group_name       TEXT,                             -- denormalized mirror of guest_groups.name
  group_id         UUID,                             -- FK → guest_groups(id); added below once guest_groups exists
  side             TEXT,                             -- 'bride' or 'groom'
  message          TEXT,                             -- congratulatory message / wishes wall
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  token            UUID UNIQUE DEFAULT gen_random_uuid(), -- unique QR code token
  checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at    TIMESTAMPTZ,
  email_sent           BOOLEAN NOT NULL DEFAULT FALSE,
  whatsapp_status        TEXT,                           -- null, 'sent', 'delivered', 'read', 'failed'
  whatsapp_message_id    TEXT,                           -- WA Cloud API message ID for webhook correlation
  whatsapp_sent_by       UUID REFERENCES staff(id) ON DELETE SET NULL, -- staff who sent the WA invitation
  whatsapp_sender_number TEXT,                           -- WA session/phone number used to send
  is_vip                 BOOLEAN NOT NULL DEFAULT FALSE, -- VIP guest flag
  created_by             UUID REFERENCES staff(id) ON DELETE SET NULL, -- staff member who added this guest
  rsvp_submitted_at      TIMESTAMPTZ,                    -- when the guest self-submitted via RSVP form
  rsvp_submission_id     UUID REFERENCES rsvp_submissions(id) ON DELETE SET NULL -- linked RSVP submission
);

-- Migration: run this if the table already exists
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_name TEXT;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS side TEXT;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_sent_by UUID REFERENCES staff(id) ON DELETE SET NULL;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_sender_number TEXT;
-- CREATE UNIQUE INDEX IF NOT EXISTS guests_email_unique ON guests (email) WHERE email IS NOT NULL;
-- CREATE UNIQUE INDEX IF NOT EXISTS guests_phone_unique ON guests (phone_number) WHERE phone_number IS NOT NULL;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_submitted_at TIMESTAMPTZ;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS rsvp_submission_id UUID REFERENCES rsvp_submissions(id) ON DELETE SET NULL;

-- ── Guest Groups (master data) ───────────────────────────────
CREATE TABLE IF NOT EXISTS guest_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  side        TEXT,                       -- optional: 'bride' | 'groom'
  notes       TEXT,
  position    INT NOT NULL DEFAULT 0,     -- manual sort order (see migrations/0002)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS guest_groups_name_lower_idx ON guest_groups (lower(name));
CREATE INDEX IF NOT EXISTS guest_groups_position_idx ON guest_groups (position);
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;

-- guests.group_id links to this master table; group_name is kept as a denormalized mirror.
-- The FK is added here (after guest_groups exists, since guests is created first above).
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES guest_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS guests_group_id_idx ON guests (group_id);
-- See migrations/0001_guest_groups.sql for the backfill that seeds groups from existing data.

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
  story_text_en        TEXT,
  gift_registry_url    TEXT,
  gift_qr_url          TEXT,
  bank_name            TEXT,
  bank_account_number  TEXT,
  bank_account_name    TEXT,
  bank_accounts_json   JSONB DEFAULT '[]',           -- array of {bank_name, account_number, account_name}
  travel_info          TEXT,
  travel_info_en       TEXT,
  spotify_playlist_url TEXT,
  faq_json             JSONB DEFAULT '[]',           -- array of {question, answer}
  schedule_json        JSONB DEFAULT '[]',           -- array of {time, title, description}
  gallery_photos_json  JSONB DEFAULT '[]',           -- array of photo URLs
  -- Site password protection
  cover_video_url       TEXT,
  partner_one_photo_url TEXT,
  partner_two_photo_url TEXT,
  partner_one_full_name TEXT,
  partner_two_full_name TEXT,
  partner_one_parents TEXT,
  partner_two_parents TEXT,
  background_music_url TEXT,
  background_music_youtube_url TEXT,
  site_password_enabled BOOLEAN DEFAULT FALSE,
  site_password_hash    TEXT,
  -- Metadata
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- ── RSVP Submissions (public form) ────────────────────────────
CREATE TABLE IF NOT EXISTS rsvp_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT,
  phone_number     TEXT,
  attending        BOOLEAN NOT NULL DEFAULT TRUE,
  plus_one_name    TEXT,
  group_name       TEXT,
  side             TEXT,
  message          TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT NOW(),
  token            UUID UNIQUE DEFAULT gen_random_uuid(),
  checked_in       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_in_at    TIMESTAMPTZ
);

-- ── Rate Limits ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip         TEXT NOT NULL,
  action     TEXT NOT NULL,              -- e.g. 'rsvp', 'wishes'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS rate_limits_ip_action_idx ON rate_limits (ip, action, created_at);

-- ── Wishes Wall ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  message     TEXT NOT NULL,
  reactions   JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Staff accounts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  username      TEXT UNIQUE,                          -- optional login alias; if set, can login with this instead of email
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'sender' CHECK (role IN ('admin', 'sender')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run if staff table already exists
-- ALTER TABLE staff ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
-- ── WhatsApp session ownership ───────────────────────────────
-- Tracks which staff member created each WA session (sessionId from the WA microservice)
CREATE TABLE IF NOT EXISTS whatsapp_session_owners (
  session_id  TEXT PRIMARY KEY,
  staff_id    UUID REFERENCES staff(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Binds a session to the browser that connected it (see migrations/0003).
-- Restricts contact fetch/sync to that browser via the "wa_connector" cookie.
CREATE TABLE IF NOT EXISTS whatsapp_session_connectors (
  session_id   TEXT PRIMARY KEY,
  connector_id TEXT NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE whatsapp_session_connectors ENABLE ROW LEVEL SECURITY;
-- Migration: run if guests table already exists
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES staff(id) ON DELETE SET NULL;

-- Migration: run these if tables already exist
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS phone_number TEXT;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS email_sent BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE guests DROP COLUMN IF EXISTS whatsapp_sent;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_status TEXT;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gallery_photos_json JSONB DEFAULT '[]';
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS story_text_en TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS travel_info_en TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gift_qr_url TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS bank_name TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS spotify_playlist_url TEXT;
-- ALTER TABLE site_config ADD COLUMN IF NOT EXISTS bank_accounts_json JSONB DEFAULT '[]';
-- ALTER TABLE wishes ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- ── Seed default site config row ────────────────────────────
INSERT INTO site_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── Row Level Security ───────────────────────────────────────
-- Guests table: admin-managed only
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public token lookup (scanner)"
  ON guests FOR SELECT
  USING (TRUE);  -- API routes handle auth; adjust to restrict if needed

-- rsvp_submissions: public can insert, service role manages the rest
ALTER TABLE rsvp_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public RSVP insert"
  ON rsvp_submissions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Allow public rsvp token lookup"
  ON rsvp_submissions FOR SELECT
  USING (TRUE);

-- site_config: read-only for public, write only via service role
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read of site config"
  ON site_config FOR SELECT
  USING (TRUE);
