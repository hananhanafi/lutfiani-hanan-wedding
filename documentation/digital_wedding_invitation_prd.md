# Product Requirements Document (PRD)
## My Digital Wedding Invitation Website

**Version:** 2.2  
**Date:** June 15, 2026  
**Status:** Live in Production  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals](#2-goals)
3. [Users](#3-users)
4. [User Stories](#4-user-stories)
5. [Features & Requirements](#5-features--requirements)
6. [Information Architecture](#6-information-architecture)
7. [UX/UI Requirements](#7-uxui-requirements)
8. [Technical Requirements](#8-technical-requirements)
9. [Hosting & Deployment](#9-hosting--deployment)
10. [Milestones & Timeline](#10-milestones--timeline)
11. [Open Questions](#11-open-questions)

---

## 1. Overview

This is a **personal wedding invitation website** built for a single wedding event. The site will be shared with invited guests to provide all the event information they need, collect RSVPs, and keep everyone informed — replacing paper invitations entirely.

There is **one couple** (the owner) who manages the site, and **guests** who visit and interact with it.

---

## 2. Goals

- Create a beautiful, personal wedding invitation website to share with guests.
- Collect and track RSVPs without using spreadsheets or WhatsApp messages.
- Keep guests informed about event details, schedule, and venue.
- Make it easy for guests to respond without needing to sign up or install anything.
- Have the site ready well before the wedding date.

---

## 3. Users

### The Couple (Owner/Admin)
- Accesses a private admin panel to manage the invitation, guest list, RSVPs, and WhatsApp delivery.
- The **primary admin** account is configured via environment variables.
- Additional **staff accounts** can be created from the admin panel.

### Staff (Sender Role)
- Limited-access accounts created by the admin.
- Can only access the **WhatsApp Connection** and **Kirim Undangan** pages.
- Can only see and manage guests **they personally added**.
- Can only use WhatsApp sessions **they personally created**.

### The Guests
- Visit the invitation website via a shared link (WhatsApp, email, etc.).
- View event details and RSVP without creating an account.
- Should work seamlessly on mobile phones.

---

## 4. User Stories

### Couple (Admin)
| ID | User Story | Priority |
|---|---|---|
| US-01 | As the couple, I want to set up the invitation page with our names, wedding date, and a cover photo. | Must Have |
| US-02 | As the couple, I want to customize the design (colors, fonts, theme) to match our wedding style. | Must Have |
| US-03 | As the couple, I want to add event details: date, time, venue name, and address. | Must Have |
| US-04 | As the couple, I want to add a schedule for the ceremony, dinner, and after-party. | Must Have |
| US-05 | As the couple, I want to manage our guest list and see who has RSVPed. | Must Have |
| US-06 | As the couple, I want to collect plus-one details and a personal message via the RSVP form. | Must Have |
| US-07 | As the couple, I want to share the invitation as a link (via WhatsApp, social, or email). | Must Have |
| US-08 | As the couple, I want to set an RSVP deadline. | Must Have |
| US-09 | As the couple, I want to export the RSVP list as a spreadsheet (including phone numbers). | Must Have |
| US-10 | As the couple, I want to share our love story on the website. | Should Have |
| US-11 | As the couple, I want to add a photo gallery section. | Should Have |
| US-12 | As the couple, I want to add a gift registry link. | Should Have |
| US-13 | As the couple, I want to password-protect the site so only invited guests can view it. | Should Have |
| US-14 | As the couple, I want to see a simple summary of RSVPs (how many attending, pending, declined). | Must Have |
| US-15 | As the couple, I want each confirmed guest to receive a unique QR code after RSVPing. | Must Have |
| US-16 | As the couple, I want to give the welcomer/door staff a scanner page to verify guests at the entrance. | Must Have |
| US-17 | As the couple, I want to see who has been checked in on the day of the wedding. | Must Have |
| US-18 | As the couple, I want to manually add guests to the list directly from the admin dashboard. | Must Have |
| US-19 | As the couple, I want to select specific guests and export only their data as CSV or QR cards. | Must Have |
| US-20 | As the couple, I want to print physical QR card sheets (PDF-ready) for guests who need a physical invitation card. | Should Have |
| US-21 | As the door staff, I want to register a walk-in guest on the spot and immediately mark them as checked in. | Must Have |
| US-29 | As the couple, I want to send WhatsApp invitations directly from the admin panel to selected guests. | Must Have |
| US-30 | As the couple, I want to connect a WhatsApp account via QR code or phone pairing to use as the sender. | Must Have |
| US-31 | As the couple, I want to bulk-import guests from a CSV file. | Must Have |
| US-32 | As the couple, I want to create staff accounts with limited access (WhatsApp + Kirim page only). | Must Have |
| US-33 | As the couple, I want staff to only see and manage their own guests and their own WhatsApp sessions. | Must Have |
| US-34 | As staff, I want to be able to log in using either my email address or a shorter username. | Must Have |
| US-35 | As the couple, I want to see which staff member sent each WhatsApp invitation and which phone number was used. | Must Have |

### Guests
| ID | User Story | Priority |
|---|---|---|
| US-22 | As a guest, I want to view the invitation without signing up. | Must Have |
| US-23 | As a guest, I want to RSVP easily (attending / not attending). | Must Have |
| US-24 | As a guest, I want to receive a unique QR code after RSVPing as my entry pass. | Must Have |
| US-25 | As a guest, I want to add the event to my calendar (Google / Apple). | Must Have |
| US-26 | As a guest, I want to get directions to the venue via an embedded map. | Must Have |
| US-27 | As a guest, I want to view the event schedule. | Must Have |
| US-28 | As a guest, I want to leave a congratulatory message for the couple. | Could Have |

---

## 5. Features & Requirements

### 5.1 Invitation Page (Public)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-01 | Hero Section | Couple names, wedding date, cover photo/background | Must Have |
| F-02 | Countdown Timer | Live countdown to the wedding day | Should Have |
| F-03 | Event Details | Date, time, venue name, full address, dress code | Must Have |
| F-04 | Event Schedule | Timeline of the day: ceremony, cocktail, dinner, party | Must Have |
| F-05 | Interactive Map | Embedded Google Maps with venue location | Must Have |
| F-06 | Calendar Button | One-click "Add to Calendar" (Google, Apple, Outlook) | Must Have |
| F-07 | Our Story | A section with the couple's love story (text + photos) | Should Have |
| F-08 | Photo Gallery | A grid or carousel of couple photos with loading indicators and lightbox | Should Have |
| F-09 | Gift Registry Link | Link to an external registry or wish list page | Should Have |
| F-10 | Travel & Stay Info | Nearby hotel recommendations and travel tips | Could Have |
| F-11 | FAQ Section | Short Q&A for common guest questions | Could Have |
| F-12 | Wishes Wall | Guests can post a short congratulatory message; public to all guests; couple can delete messages from admin panel | Could Have |

### 5.2 RSVP Form

| # | Feature | Description | Priority |
|---|---|---|---|
| F-13 | Guest Name Input | Guest enters their name to RSVP | Must Have |
| F-14 | Attendance Choice | Attending / Not Attending | Must Have |
| F-15 | Plus-One | Option to bring a plus-one (with their name) | Must Have |
| F-16 | Phone Number | Guest's phone number (used for WhatsApp pass delivery) | Must Have |
| F-17 | Personal Message | Optional congratulatory message from the guest | Could Have |
| F-18 | RSVP Deadline Display | Show the RSVP deadline on the form | Must Have |
| F-19 | Confirmation Message | Show a thank-you message after RSVP is submitted | Must Have |
| F-20 | QR Code Generation | Automatically generate a unique QR code for each confirmed guest after RSVP | Must Have |
| F-21 | QR Code Delivery | Display QR code on the confirmation screen (save/screenshot) AND send via email. A **"Share via WhatsApp"** button is also shown, using a `wa.me` deep link pre-filled with the guest's QR pass URL — the guest taps it to save to their own WhatsApp (Saved Messages) or forward to a family member. No WhatsApp API needed. | Must Have |
| F-22 | Input Validation | All text inputs have server-side length limits (name ≤100, email ≤254, phone ≤30, message ≤500 chars) | Must Have |

### 5.3 Admin Panel (Private)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-23 | Secure Login | Primary admin via env-var credentials (NextAuth). Staff accounts via email OR username + bcrypt-hashed password stored in DB. | Must Have |
| F-24 | Edit Invitation Content | Update all sections: details, schedule, story, gallery, theme, bank/gift info, Spotify playlist | Must Have |
| F-25 | Guest List View | See all guests, their RSVP status, phone, plus-one, group, side | Must Have |
| F-26 | Add Guest Manually | Admin can add a new guest directly from the dashboard (name and phone required); guest receives a QR pass token automatically | Must Have |
| F-27 | Edit Guest | Admin can update any guest field (name, email, phone, attendance, plus-one, group, side, message, check-in status) via inline editing | Must Have |
| F-28 | Delete Guest | Admin can remove a guest from the list with a confirmation step | Must Have |
| F-29 | RSVP Summary | Count of attending / not attending / pending | Must Have |
| F-30 | Export RSVP Data | Download full guest list as CSV (includes name, email, phone, attendance, plus-one, group, side, message, check-in); supports **selective export** — admin can tick individual guests and export only those rows | Must Have |
| F-31 | Resend Pass Email | Admin can resend the QR entry pass email to any attending guest who has an email address | Must Have |
| F-32 | WhatsApp Pass Link | Admin can open a WhatsApp deep-link to send the pass URL to any attending guest who has a phone number | Must Have |
| F-33 | Password Protection Toggle | Enable/disable a site password for guests; set/change the password | Must Have |
| F-34 | Check-in Dashboard | View real-time check-in status merged into the main Dasbor page (stats cards + attending guest list with check-in timestamps) | Must Have |
| F-35 | Photo & File Upload | Upload cover photo, gallery images, video, and audio to Cloudflare R2 (max 50 MB for video/audio, 10 MB for images); falls back to Supabase Storage if R2 not configured | Must Have |
| F-76 | Gallery Reorder | Admin can drag-and-drop gallery photos to reorder them; position badges shown on each thumbnail | Should Have |
| F-77 | Background Music | Autoplay music on envelope open — supports MP3 upload or YouTube URL; floating music toggle button (bottom-right); auto-pauses on tab switch | Should Have |
| F-78 | Parents Names | Admin can set parents names for each partner; displayed in couple profile section | Should Have |
| F-79 | Phone Number Normalization | On guest add, phone numbers are normalized (strip +, spaces, dashes; convert leading 0 to country code 62) to prevent duplicates | Must Have |
| F-80 | Scanner Accepts All Guests | QR scanner allows check-in for all guests regardless of RSVP status (unconfirmed, not attending, or attending) | Must Have |
| F-36 | QR PDF Export | Generate a printable A4 HTML page with individual QR entry-pass cards (3-column grid, dashed borders, ornament + guest name + pass QR); supports exporting all guests or a selected subset via `?ids=` param | Should Have |
| F-52 | Bulk CSV Import | Admin can upload a CSV file to import guests in bulk. Flexible column detection (English/Indonesian aliases), duplicate phone detection, per-row error reporting, dry-run preview before commit. | Must Have |
| F-53 | VIP Guest Flag | Admin can mark any guest as VIP; VIP badge displayed on guest card and guest list | Should Have |
| F-54 | RSVP Submissions View | Separate page listing public RSVP form submissions (distinct from admin-added guests), with search, attendance filter, and delete capability | Must Have |

### 5.4 WhatsApp Invitation Delivery (Admin)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-55 | WhatsApp Session Management | Admin can create, connect, reconnect, and delete WhatsApp sessions via a management page (`/admin/whatsapp`) | Must Have |
| F-56 | QR Code Pairing | Connect a WhatsApp account by scanning a QR code displayed in the admin panel (60-second countdown with refresh) | Must Have |
| F-57 | Phone Number Pairing | Connect a WhatsApp account by entering a phone number and entering the 8-character pairing code displayed in WhatsApp | Must Have |
| F-58 | Session Status Polling | Admin panel polls the WA microservice for session status updates (connected / connecting / disconnected) | Must Have |
| F-59 | Kirim Undangan Page | Dedicated mobile-first page (`/admin/kirim`) to select guests and send WhatsApp invitations in batch | Must Have |
| F-60 | Sender Selection | User selects a WhatsApp sender session at the top of the Kirim page before selecting guests. Amber banner + redirect if no session connected. | Must Have |
| F-61 | Guest Selection & Filtering | Tabs: All / Belum Terkirim / Terkirim. Checkbox-select individual guests or all filtered. Per-guest WA status badge. | Must Have |
| F-62 | Add/Edit Guest from Kirim | Add new guest (with VIP flag) and edit existing guests directly from the Kirim page | Must Have |
| F-63 | OTP Authorization | Before sending, an OTP is sent to the sender's WhatsApp number to authorize the send. OTP is valid for 10 minutes; verification window persists for 1 hour. | Must Have |
| F-64 | Batch Send Progress | Live progress bar and per-guest success/failure log during batch send | Must Have |
| F-65 | WA Status Tracking | After send, guest `whatsapp_status` is updated to `sent`; displayed as badge on guest cards | Must Have |
| F-66 | Single Guest Send | Each guest row in the full guest list has a "Kirim WA" button with sender-picker, OTP auth, and success/error modal | Must Have |
| F-74 | WA Sent-By Tracking | After a successful send, `whatsapp_sent_by` (FK → staff) and `whatsapp_sender_number` (real phone number resolved from WA session status) are saved to the guest record. Displayed in the guest list as "WA Oleh" column and in KirimPage status badges. Client-side state is updated immediately without a page refresh. | Must Have |

### 5.5 Staff Management (Admin)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-67 | Staff Account Creation | Admin can create staff accounts with name, email, optional username, password (min 8 chars), and role (Admin or Pengirim) | Must Have |
| F-68 | Staff Roles | **Admin** — full panel access. **Pengirim (Sender)** — restricted to WhatsApp Connection and Kirim Undangan pages only. | Must Have |
| F-69 | Activate / Deactivate Staff | Admin can enable or disable a staff account without deleting it | Must Have |
| F-70 | Delete Staff | Admin can permanently remove a staff account | Must Have |
| F-71 | Guest Scoping for Senders | Sender-role staff can only view and edit guests they personally added (`created_by` field) | Must Have |
| F-72 | Session Scoping for Senders | Sender-role staff can only view, use, and manage WhatsApp sessions they personally created (`whatsapp_session_owners` table) | Must Have |
| F-73 | Role Badge | The admin panel header shows a "Pengirim" badge for sender-role staff; sidebar navigation only shows permitted pages | Must Have |
| F-75 | Username Login | Staff can log in with either their email address or an optional username (set by admin at account creation or any time). Username is unique per account. | Must Have |

### 5.6 Guest Check-in (Scanner)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-37 | Scanner Page | A dedicated mobile-friendly page for the welcomer to scan guest QR codes | Must Have |
| F-38 | QR Verification | Scan a guest's QR code and instantly show: guest name, plus-one — accepts all RSVP statuses (attending, not attending, unconfirmed) | Must Have |
| F-39 | Confirmation Step | Preview the guest details before marking check-in — prevents accidental check-ins | Must Have |
| F-40 | Check-in Status | Mark a guest as "Checked In" upon confirmation; prevent duplicate check-ins | Must Have |
| F-41 | Invalid QR Handling | Show a clear error if the QR code is invalid, already used, or not found | Must Have |
| F-42 | Scanner Access Control | Scanner page is protected by a separate simple PIN (different from admin panel) so the welcomer doesn't have full admin access | Must Have |
| F-43 | Manual Name Lookup | If QR scan is not possible, welcomer can search by guest name to find and manually check in a guest | Should Have |
| F-44 | Walk-in Registration | Welcomer can add a brand-new guest (name, optional plus-one, group, side) directly from the scanner page and immediately mark them as checked in — no admin access needed | Must Have |

### 5.7 Design & Customization

| # | Feature | Description | Priority |
|---|---|---|---|
| F-45 | Theme / Color Scheme | Choose a color palette matching the wedding theme | Must Have |
| F-46 | Font Selection | Select from a curated set of elegant fonts | Must Have |
| F-47 | Cover Photo Upload | Upload the main hero/background photo | Must Have |
| F-48 | Gallery Upload | Upload multiple couple photos | Should Have |
| F-49 | Mobile Responsive | All pages look great on mobile, tablet, and desktop | Must Have |
| F-50 | Localization | All non-invitation pages (admin panel, scanner, entry, guest pass) use Bahasa Indonesia; the public invitation page is in Indonesian by default | Must Have |
| F-51 | Welcome Modal Animations | First-visit welcome modal features Ken Burns background zoom, staggered content fade-in, button pulse/shine, and a radial gold-burst exit animation | Should Have |

---

## 6. Information Architecture

```
Website
├── Invitation Page (Public, site-password gated)
│   ├── Hero (Names + Date + Cover Photo)
│   ├── Countdown Timer
│   ├── Event Details & Venue
│   ├── Schedule
│   ├── Map & Directions
│   ├── RSVP Form
│   │   └── Confirmation Screen + QR Code
│   ├── Our Story
│   ├── Photo Gallery
│   ├── Gift Registry & Bank Info
│   ├── Travel & Stay
│   ├── FAQ
│   ├── Wishes Wall
│   └── Spotify Player
├── Entry Page (/enter — site password unlock)
├── Guest Pass (/pass?token=… — public, exempt from site lock)
├── Scanner Page (Welcomer — PIN protected)
│   ├── QR Code Scanner
│   ├── Guest Preview (name, plus-one)
│   ├── Confirm Check-in
│   ├── Check-in Confirmation / Error Screen
│   ├── Manual Name Lookup
│   └── Walk-in Registration (add new guest + immediate check-in)
└── Admin Panel (Private — NextAuth protected)
    ├── Login
    ├── Dasbor (RSVP stats + real-time check-in list)
    ├── Tamu (Guest List)
    │   ├── Add Guest (manual, with VIP flag)
    │   ├── Edit Guest
    │   ├── Delete Guest
    │   ├── Bulk Import (CSV upload)
    │   ├── Send Pass Email
    │   ├── WhatsApp Pass Link (single guest)
    │   ├── Batch WhatsApp Send (via GuestTable)
    │   ├── Checkbox Selection (multi-select guests)
    │   ├── Export CSV (all or selected)
    │   └── Export QR PDF (all or selected — printable card sheet)
    ├── RSVP (public form submissions view + delete)
    ├── WhatsApp (/admin/whatsapp — session management)
    │   ├── Create Session (wizard: name → method → QR or phone pairing → success)
    │   ├── Reconnect Session
    │   ├── Disconnect / Delete Session
    │   └── Session Status Polling
    ├── Kirim Undangan (/admin/kirim — WhatsApp invitation delivery)
    │   ├── Sender Picker (select WA session first)
    │   ├── Guest List (tabs: All / Belum / Terkirim + search)
    │   ├── Add Guest (quick-add with VIP flag)
    │   ├── Edit Guest (inline edit)
    │   ├── Batch Select & Send
    │   └── OTP Authorization Modal → Sending Progress → Done
    ├── Konten (Edit Invitation Content)
    ├── Harapan (Wishes Moderation)
    └── Staf (/admin/staff — admin only)
        ├── Staff List (name, email, username, role, active status)
        ├── Add Staff (name, email, optional username, password, role)
        ├── Activate / Deactivate
        └── Delete Staff
```

---

## 7. UX/UI Requirements

### Design Principles
- **Mobile-First:** Most guests will open the link on their phone.
- **Simple & Elegant:** The design should feel personal, warm, and beautiful — not corporate.
- **No Sign-Up for Guests:** Guests must be able to RSVP with zero friction.
- **Fast Load:** Page should load in under 2 seconds, even on mobile data.

### Key UX Notes
- The admin panel doesn't need to be fancy — functional and simple is fine.
- Guest-facing pages should feel polished and match the wedding aesthetic.
- Show a friendly confirmation screen after RSVP submission.
- All text should be easy to read on any background.

---

## 8. Technical Requirements

### Actual Stack (Implemented)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL, free tier) |
| File Storage | **Cloudflare R2** (primary — custom domain `wedding-media.hananhanafi.com`) with Supabase Storage fallback |
| Email | Nodemailer via Gmail SMTP (App Password) |
| QR Code Generation | `qrcode` npm package (shared server-side helper in `src/lib/qrcode.ts`) |
| QR Code Scanning | `html5-qrcode` (browser-based camera scan) |
| Maps | Google Maps Embed (via venue URL in site config) |
| Authentication | NextAuth.js v4 (credentials, JWT) — env-var admin + DB-backed staff with bcrypt; HMAC-signed cookie for site lock; PIN for scanner |
| Password Hashing | `bcryptjs` (staff account passwords, cost factor 12) |
| WhatsApp | Self-hosted **Baileys microservice** (`whatsapp-service/`) — supports multi-session, QR pairing, phone pairing, send text/image |
| Hosting | Vercel (Next.js app) + separate Node.js server for WhatsApp microservice |

### Key Technical Notes
- No complex microservices beyond the WhatsApp Baileys service.
- No multi-tenancy, no user accounts for guests.
- **Database: Supabase** — PostgreSQL hosted on Supabase free tier.
- **Email: Nodemailer + Gmail SMTP** — QR code delivery (as embedded image attachment) and RSVP notifications to the couple. Requires a Gmail App Password (`GMAIL_APP_PASSWORD` env var).
- **Admin content editing** — All editable content is stored in a single `site_config` row and edited via the admin panel.
- **Site password gate** — Middleware enforces an HMAC-signed cookie (`site_unlocked`) on all non-exempt routes. Guests visit `/enter` to unlock.
- **QR tokens** — Each guest has a unique UUID `token` stored in the DB, encoded into their pass URL (`/pass?token=…`). The scanner validates this token and marks check-in.
- **Admin guest management** — Admin can add guests manually, edit any field via `PATCH /api/admin/guests/[id]`, or delete via `DELETE`.
- **Bulk CSV import** — `POST /api/admin/guests/import` accepts multipart CSV upload with flexible header detection (English + Indonesian aliases), duplicate-phone reporting, and per-row error detail.
- **Selective export** — Guest table supports multi-checkbox selection; the unified "Ekspor" dropdown exports only selected guests as CSV or a printable QR PDF card sheet. The button is disabled when nothing is selected.
- **QR PDF export** — `GET /api/admin/export-qr[?ids=…]` returns a self-contained printable HTML page with 3-column A4 QR cards.
- **Walk-in registration** — `POST /api/scanner/walkin` (PIN-protected) adds a new guest and immediately sets `attending:true, checked_in:true`.
- **WhatsApp microservice** — A standalone Node.js/Express service (`whatsapp-service/`) using the Baileys library. Proxied via Next.js API routes. Supports: create session, connect (QR), connect (phone pairing code), disconnect, delete, status, send text, send image. API key protected.
- **Multi-session WhatsApp** — Multiple WA sessions can be created and managed. Each session connects one WhatsApp account. Sessions persist across restarts via local auth state files.
- **OTP authorization for WA send** — Before batch-sending, an OTP is sent to the sender's own WhatsApp number. Valid 10 min; verification window persists 1 hour (bound to session + phone pair).
- **Staff role system** — Two roles: `admin` (full access) and `sender` (WhatsApp + Kirim pages only). Enforced in both middleware (route redirect) and API layer (403 responses). Staff passwords are bcrypt-hashed at cost 12.
- **Username login for staff** — Staff accounts have an optional `username` field (unique). Login accepts either `email` or `username` via Supabase `.or()` query. Admin can set/change usernames from the Staff management page.
- **Guest scoping for senders** — `guests.created_by` (UUID FK → staff) records who added each guest. Sender-role users see only their own guests.
- **WA sent-by tracking** — On a successful WhatsApp send, `whatsapp_sent_by` (UUID FK → staff, nullable) and `whatsapp_sender_number` (TEXT — real phone number resolved from WA session status, falls back to session ID) are written to the guest record. The send API calls `getWhatsAppStatus(sessionId)` once per batch to resolve the real number. A DB-update retry path saves without the FK field if a constraint error occurs. All client-side state updates immediately reflect both fields so the UI shows the correct sender number before the next page refresh.
- **Session scoping for senders** — `whatsapp_session_owners` table maps `session_id → staff_id`. Sender-role users can only view/use/delete their own sessions. All WA-related API routes enforce this.
- **Localization** — All admin, scanner, entry, and pass pages are in Bahasa Indonesia.
- **Input validation** — All public-facing text inputs are validated server-side for length limits.
- **Phone normalization** — On guest add/import, phone numbers are sanitized: all non-digit characters stripped, leading `0` converted to `62` (Indonesian country code). Prevents duplicates like `+62 857-1648-1111` vs `08571648111`.
- **Cloudflare R2 media storage** — All media uploads (images, video, audio) go to Cloudflare R2 via `@aws-sdk/client-s3`. Served via custom domain (`wedding-media.hananhanafi.com`). Falls back to Supabase Storage if R2 env vars are not configured.
- **Background music** — Autoplay background music via floating button (bottom-right corner). Supports MP3 file upload to R2 or YouTube IFrame API. Triggers on envelope open event (`wedding:open`). Auto-pauses when tab loses focus.
- **Gallery drag-and-drop reorder** — Admin can reorder gallery photos via HTML5 Drag and Drop API. Position badges and visual feedback during drag.
- **Photo loading indicators** — Gallery grid and lightbox show animated spinners until images finish loading.
- **Scanner accepts all RSVP statuses** — QR scanner allows check-in for any guest regardless of attendance status (attending, not attending, or unconfirmed).
- The scanner page works entirely in the browser using the device camera — no special hardware needed.

### Data Model

**guests**
- `id`, `name`, `email`, `phone_number`, `attending`, `plus_one_name`, `group_name`, `side`, `message`, `submitted_at`, `token` *(unique UUID for QR code)*, `checked_in`, `checked_in_at`, `email_sent`, `whatsapp_status`, `whatsapp_message_id`, `whatsapp_sent_by` *(FK → staff.id, nullable — who sent the WA invitation)*, `whatsapp_sender_number` *(TEXT — phone number of the WA session used to send)*, `is_vip`, `created_by` *(FK → staff.id, nullable — null = env-admin or public RSVP)*

**site_config** *(single row, id = 1)*
- Couple names, wedding date/time, venue, address, maps URL, dress code, RSVP deadline, cover photo URL
- Theme: primary color, secondary color, font
- Content: story text (ID + EN), gift registry URL, gift QR URL, bank name/account, travel info (ID + EN), FAQ (JSONB), schedule (JSONB), gallery photos (JSONB)
- Partner parents names (`partner_one_parents`, `partner_two_parents`)
- Background music: `background_music_url` (MP3), `background_music_youtube_url` (YouTube)
- Spotify playlist URL, cover/partner photos, site password settings

**wishes**
- `id`, `name`, `message`, `created_at`, `reactions` (JSONB — emoji → count map)

**rsvp_submissions**
- `id`, `name`, `email`, `phone_number`, `attending`, `plus_one_name`, `group_name`, `side`, `message`, `submitted_at`, `token`, `checked_in`, `checked_in_at`

**staff**
- `id`, `name`, `username` *(optional, unique — login alias)*, `email` *(unique — primary login identifier)*, `password_hash` *(bcrypt, cost 12)*, `role` *(admin | sender)*, `is_active`, `created_at`

**whatsapp_session_owners**
- `session_id` *(PK, TEXT — WA microservice session ID)*, `staff_id` *(FK → staff.id, CASCADE DELETE)*, `created_at`
- Sessions with no record here were created by the env-admin and are unrestricted (admin-only use).

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | Full production URL (e.g. `https://your-domain.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Same as above — used in QR code URLs |
| `ADMIN_USERNAME` | Primary admin login username |
| `ADMIN_PASSWORD` | Primary admin login password |
| `SCANNER_PIN` | Numeric PIN for the scanner/door staff page |
| `GMAIL_USER` | Gmail address for outbound email |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16-char, not account password) |
| `WA_SERVICE_URL` | Base URL of the WhatsApp Baileys microservice |
| `WA_SERVICE_API_KEY` | API key for the WhatsApp microservice |
| `WA_IMAGE_URL` | *(Optional)* URL of image to attach to WA invitations |
| `NEXT_PUBLIC_COUPLE_NAME` | Couple name string used in WA message templates |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare account ID for R2 storage |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 API token access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 API token secret key |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name (e.g. `mywedding`) |
| `CLOUDFLARE_R2_PUBLIC_URL` | Public URL for R2 bucket (custom domain, e.g. `https://wedding-media.hananhanafi.com`) |

| Concern | Decision |
|---|---|
| Hosting | Vercel (free tier) — **deployed** |
| Domain | Custom domain or Vercel subdomain |
| SSL | Automatic via Vercel |
| Cost | ~$10–15/year for domain only; everything else free |
| Deployment | Push to GitHub → auto-deploy on Vercel |
| Database | Supabase (free tier) — **provisioned** |

---

## 10. Milestones & Timeline

| # | Milestone | Status |
|---|---|---|
| 1 | Project setup — Next.js, Tailwind, Supabase, deployed to Vercel | ✅ Done |
| 2 | Invitation page — Hero, event details, schedule, map, calendar button | ✅ Done |
| 3 | RSVP form — Form + database + confirmation message | ✅ Done |
| 4 | QR Code system — Generate unique QR per guest, display on confirmation, send via email | ✅ Done |
| 5 | Scanner page — Camera QR scan, preview, confirm check-in, manual name lookup | ✅ Done |
| 6 | Admin panel — Login, guest list, RSVP summary, check-in dashboard, CSV export, add/edit/delete guests | ✅ Done |
| 7 | Design polish — Theme, fonts, cover photo, mobile tweaks, floating petals, scroll animations | ✅ Done |
| 8 | Extra sections — Our Story, gallery, gift registry, bank info, FAQ, Wishes Wall, Spotify player | ✅ Done |
| 9 | Security & quality fixes — Input validation, shared QR helper, TLS fix, removed unused packages | ✅ Done |
| 10 | Go live — Deployed to Vercel, environment variables configured | ✅ Done |
| 11 | Feature & UX pass — Walk-in scanner registration, QR PDF export, selective export, mobile checkbox selection, Bahasa Indonesia, WelcomeModal animations | ✅ Done |
| 12 | WhatsApp delivery system — Baileys microservice, session management wizard (QR + phone pairing), Kirim Undangan page, OTP authorization, batch send with live progress | ✅ Done |
| 13 | Bulk CSV import — Flexible header detection, duplicate checking, per-row errors | ✅ Done |
| 14 | VIP guest flag — Mark and display VIP guests across admin and Kirim pages | ✅ Done |
| 15 | Staff management — Role-based accounts (Admin / Pengirim), guest scoping, session scoping | ✅ Done |
| 16 | Username login for staff — Optional username field; login accepts email or username | ✅ Done |
| 17 | WA sent-by tracking — `whatsapp_sent_by` (FK) and `whatsapp_sender_number` (real phone) saved on send; "WA Oleh" column in guest list; instant client-side update | ✅ Done |

---

## 11. Open Questions

1. ~~What is the wedding date and venue?~~ **Configured in admin panel.**
2. How many guests are expected? *(Supabase free tier supports up to 50,000 rows — sufficient for any wedding)*
3. ~~Do we want a password so only invited guests can view the site?~~ **Decided: Yes — implemented (F-33). Enabled via admin panel.**
4. ~~Should guests be able to edit their RSVP after submitting?~~ **Decided: Yes — guests can re-submit with the same email; the old QR token is invalidated and a new one generated and re-sent.**
5. ~~Do we want email notifications when a guest RSVPs?~~ **Decided: Yes — the couple receives an email notification via Gmail on each new RSVP.**
6. ~~Should the QR code be delivered via email, shown on screen only, or both?~~ **Decided: Both — displayed on the confirmation screen AND sent via email.**
7. How many welcomers/door staff will there be? *(each needs the scanner PIN — currently one shared PIN)*
8. ~~What languages should the site support?~~ **Decided: Bahasa Indonesia — all admin, scanner, entry, and pass pages are fully localized in Indonesian.**
9. ~~Should the Wishes Wall be public or private?~~ **Decided: Public — visible to all guests; couple can delete messages from admin panel.**
10. Should the WhatsApp microservice be deployed to the same server as the Next.js app or a dedicated machine? *(Currently runs as a separate Node.js process; must remain reachable via `WA_SERVICE_URL`)*
11. Should staff (Pengirim) be able to see the RSVP summary / Dasbor page? *(Currently restricted to admin only)*
12. Should there be a per-sender send quota or rate limiting?

---

*Owner: The Couple*  
*Last Updated: June 1, 2026 — v2.1*
