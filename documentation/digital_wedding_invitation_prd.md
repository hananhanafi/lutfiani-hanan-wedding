# Product Requirements Document (PRD)
## My Digital Wedding Invitation Website

**Version:** 1.3  
**Date:** May 16, 2026  
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
- Accesses a private admin panel to manage the invitation, guest list, and RSVPs.
- There is only **one admin account** — no multi-user or planner roles needed.

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
| F-08 | Photo Gallery | A grid or carousel of couple photos | Should Have |
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
| F-23 | Secure Login | Single admin login (username + password) via NextAuth | Must Have |
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
| F-34 | Check-in Dashboard | View real-time check-in status for all guests on the wedding day | Must Have |
| F-35 | Photo & File Upload | Upload cover photo and gallery images directly to Supabase Storage (max 10 MB, JPG/PNG/WebP/GIF) | Must Have |
| F-36 | QR PDF Export | Generate a printable A4 HTML page with individual QR entry-pass cards (3-column grid, dashed borders, ornament + guest name + pass QR); supports exporting all guests or a selected subset via `?ids=` param | Should Have |

### 5.4 Guest Check-in (Scanner)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-37 | Scanner Page | A dedicated mobile-friendly page for the welcomer to scan guest QR codes | Must Have |
| F-38 | QR Verification | Scan a guest's QR code and instantly show: guest name, plus-one, and attendance confirmation | Must Have |
| F-39 | Confirmation Step | Preview the guest details before marking check-in — prevents accidental check-ins | Must Have |
| F-40 | Check-in Status | Mark a guest as "Checked In" upon confirmation; prevent duplicate check-ins | Must Have |
| F-41 | Invalid QR Handling | Show a clear error if the QR code is invalid, already used, or not found | Must Have |
| F-42 | Scanner Access Control | Scanner page is protected by a separate simple PIN (different from admin panel) so the welcomer doesn't have full admin access | Must Have |
| F-43 | Manual Name Lookup | If QR scan is not possible, welcomer can search by guest name to find and manually check in a guest | Should Have |
| F-44 | Walk-in Registration | Welcomer can add a brand-new guest (name, optional plus-one, group, side) directly from the scanner page and immediately mark them as checked in — no admin access needed | Must Have |

### 5.5 Design & Customization

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
    ├── Edit Content
    ├── Guest List & RSVP Tracker
    │   ├── Add Guest (manual)
    │   ├── Edit Guest
    │   ├── Delete Guest
    │   ├── Send Pass Email
    │   ├── WhatsApp Pass Link
│   │   ├── Checkbox Selection (multi-select guests)
│   │   ├── Export CSV (all or selected)
│   │   └── Export QR PDF (all or selected — printable card sheet)
    ├── Check-in Dashboard
    └── Wishes Moderation
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
| File Storage | Supabase Storage (public buckets: `covers`, `gallery`) |
| Email | Nodemailer via Gmail SMTP (App Password) |
| QR Code Generation | `qrcode` npm package (shared server-side helper in `src/lib/qrcode.ts`) |
| QR Code Scanning | `html5-qrcode` (browser-based camera scan) |
| Maps | Google Maps Embed (via venue URL in site config) |
| Authentication | NextAuth.js v4 (credentials, JWT) for admin; HMAC-signed cookie for site lock; PIN for scanner |
| Hosting | Vercel (free tier) |

### Key Technical Notes
- No complex microservices — simple and maintainable.
- No multi-tenancy, no user accounts for guests.
- **Database: Supabase** — PostgreSQL hosted on Supabase free tier.
- **Email: Nodemailer + Gmail SMTP** — QR code delivery (as embedded image attachment) and RSVP notifications to the couple. Requires a Gmail App Password (`GMAIL_APP_PASSWORD` env var).
- **Admin content editing** — All editable content (couple names, dates, schedule, story, gallery, bank info, Spotify, etc.) is stored in a single `site_config` row in the database and edited via the admin panel.
- **Site password gate** — Middleware enforces an HMAC-signed cookie (`site_unlocked`) on all non-exempt routes. Guests visit `/enter` to unlock.
- **QR tokens** — Each guest has a unique UUID `token` stored in the DB, encoded into their pass URL (`/pass?token=…`). The scanner validates this token and marks check-in.
- **Admin guest management** — Admin can add guests manually (name + phone required), edit any field via `PATCH /api/admin/guests/[id]`, or delete via `DELETE`.
- **Selective export** — Guest table supports multi-checkbox selection; the unified "Ekspor" dropdown exports only selected guests as CSV or a printable QR PDF card sheet. The button is disabled when nothing is selected.
- **QR PDF export** — `GET /api/admin/export-qr[?ids=…]` returns a self-contained printable HTML page with 3-column A4 QR cards (ornament, guest name, plus-one, group/side, 52 mm QR image). Supports full list or selected subset.
- **Walk-in registration** — `POST /api/scanner/walkin` (PIN-protected) adds a new guest and immediately sets `attending:true, checked_in:true`.
- **Localization** — All admin, scanner, entry, and pass pages are in Bahasa Indonesia.
- **Input validation** — All public-facing text inputs are validated server-side for length limits.
- The scanner page works entirely in the browser using the device camera — no special hardware needed.

### Data Model

**guests**
- `id`, `name`, `email` *(optional)*, `phone_number` *(optional for public RSVP; required for admin-added guests)*, `attending`, `plus_one_name`, `group_name`, `side`, `message`, `submitted_at`, `token` *(unique UUID for QR code)*, `checked_in`, `checked_in_at`

**site_config** *(single row, id = 1)*
- Couple names, wedding date/time, venue, address, maps URL, dress code, RSVP deadline, cover photo URL
- Theme: primary color, secondary color, font
- Content: story text, gift registry URL, gift QR URL, bank name/account, travel info, FAQ (JSONB), schedule (JSONB), gallery photos (JSONB)
- Spotify playlist URL
- Site password: enabled flag, hashed password (SHA-256)

**wishes**
- `id`, `name`, `message`, `created_at`, `reactions` (JSONB — emoji → count map)

### Required Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth JWT signing |
| `NEXTAUTH_URL` | Full production URL (e.g. `https://your-domain.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Same as above — used in QR code URLs |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `SCANNER_PIN` | Numeric PIN for the scanner/door staff page |
| `GMAIL_USER` | Gmail address for outbound email |
| `GMAIL_APP_PASSWORD` | Gmail App Password (16-char, not account password) |

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
| 11 | Feature & UX pass — Walk-in scanner registration, QR PDF export for print, selective guest CSV/QR export, unified export dropdown, mobile-friendly checkbox selection, Bahasa Indonesia localization, WelcomeModal entry/exit animations | ✅ Done |

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

---

*Owner: The Couple*  
*Last Updated: May 16, 2026 — v1.3*
