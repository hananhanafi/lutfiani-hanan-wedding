# Product Requirements Document (PRD)
## My Digital Wedding Invitation Website

**Version:** 1.1  
**Date:** May 11, 2026  
**Status:** Ready for Development  

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
| US-06 | As the couple, I want to collect dietary preferences and plus-one details via the RSVP form. | Must Have |
| US-07 | As the couple, I want to share the invitation as a link (via WhatsApp, social, or email). | Must Have |
| US-08 | As the couple, I want to set an RSVP deadline. | Must Have |
| US-09 | As the couple, I want to export the RSVP list as a spreadsheet. | Must Have |
| US-10 | As the couple, I want to share our love story on the website. | Should Have |
| US-11 | As the couple, I want to add a photo gallery section. | Should Have |
| US-12 | As the couple, I want to add a gift registry link. | Should Have |
| US-13 | As the couple, I want to password-protect the site so only invited guests can view it. | Should Have |
| US-14 | As the couple, I want to see a simple summary of RSVPs (how many attending, pending, declined). | Must Have |
| US-15 | As the couple, I want each confirmed guest to receive a unique QR code after RSVPing. | Must Have |
| US-16 | As the couple, I want to give the welcomer/door staff a scanner page to verify guests at the entrance. | Must Have |
| US-17 | As the couple, I want to see who has been checked in on the day of the wedding. | Must Have |

### Guests
| ID | User Story | Priority |
|---|---|---|
| US-18 | As a guest, I want to view the invitation without signing up. | Must Have |
| US-19 | As a guest, I want to RSVP easily (attending / not attending). | Must Have |
| US-20 | As a guest, I want to receive a unique QR code after RSVPing as my entry pass. | Must Have |
| US-21 | As a guest, I want to add the event to my calendar (Google / Apple). | Must Have |
| US-22 | As a guest, I want to get directions to the venue via an embedded map. | Must Have |
| US-23 | As a guest, I want to view the event schedule. | Must Have |
| US-24 | As a guest, I want to leave a congratulatory message for the couple. | Could Have |

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
| F-16 | Dietary Preference | Dropdown or text field for dietary restrictions | Must Have |
| F-17 | Custom Question | One optional extra question (e.g., song request) | Could Have |
| F-18 | RSVP Deadline Display | Show the RSVP deadline on the form | Must Have |
| F-19 | Confirmation Message | Show a thank-you message after RSVP is submitted | Must Have |
| F-20 | QR Code Generation | Automatically generate a unique QR code for each confirmed guest after RSVP | Must Have |
| F-21 | QR Code Delivery | Display QR code on the confirmation screen (save/screenshot) AND send via email. A **"Share via WhatsApp"** button is also shown, using a `wa.me` deep link pre-filled with the guest's QR pass URL — the guest taps it to save to their own WhatsApp (Saved Messages) or forward to a family member. No WhatsApp API needed. | Must Have |

### 5.3 Admin Panel (Private)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-22 | Secure Login | Single admin login (username + password) | Must Have |
| F-23 | Edit Invitation Content | Update all sections: details, schedule, story, gallery | Must Have |
| F-24 | Guest List View | See all guests, their RSVP status, dietary info, plus-one | Must Have |
| F-25 | RSVP Summary | Count of attending / not attending / pending | Must Have |
| F-26 | Export RSVP Data | Download guest list as CSV or Excel | Must Have |
| F-27 | Password Protection Toggle | Enable/disable a site password for guests | Must Have |
| F-28 | Check-in Dashboard | View real-time check-in status for all guests on the wedding day | Must Have |

### 5.4 Guest Check-in (Scanner)

| # | Feature | Description | Priority |
|---|---|---|---|
| F-29 | Scanner Page | A dedicated mobile-friendly page for the welcomer to scan guest QR codes | Must Have |
| F-30 | QR Verification | Scan a guest's QR code and instantly show: guest name, plus-one, dietary info, and attendance confirmation | Must Have |
| F-31 | Check-in Status | Mark a guest as "Checked In" upon successful scan; prevent duplicate check-ins | Must Have |
| F-32 | Invalid QR Handling | Show a clear error if the QR code is invalid, already used, or not found | Must Have |
| F-33 | Scanner Access Control | Scanner page is protected by a separate simple PIN (different from admin panel) so the welcomer doesn't have full admin access | Must Have |
| F-34 | Offline Fallback | If internet is spotty at the venue, allow manual name lookup as a backup | Should Have |

### 5.5 Design & Customization

| # | Feature | Description | Priority |
|---|---|---|---|
| F-35 | Theme / Color Scheme | Choose a color palette matching the wedding theme | Must Have |
| F-36 | Font Selection | Select from a curated set of elegant fonts | Must Have |
| F-37 | Cover Photo Upload | Upload the main hero/background photo | Must Have |
| F-38 | Gallery Upload | Upload multiple couple photos | Should Have |
| F-39 | Mobile Responsive | All pages look great on mobile, tablet, and desktop | Must Have |

---

## 6. Information Architecture

```
Website
├── Invitation Page (Public)
│   ├── Hero (Names + Date + Cover Photo)
│   ├── Countdown Timer
│   ├── Event Details & Venue
│   ├── Schedule
│   ├── Map & Directions
│   ├── RSVP Form
│   │   └── Confirmation Screen + QR Code
│   ├── Our Story
│   ├── Photo Gallery
│   ├── Gift Registry
│   ├── Travel & Stay
│   ├── FAQ
│   └── Wishes Wall
├── Scanner Page (Welcomer — PIN protected)
│   ├── QR Code Scanner
│   ├── Guest Info Display (name, plus-one, dietary)
│   └── Check-in Confirmation / Error Screen
└── Admin Panel (Private)
    ├── Login
    ├── Edit Content
    ├── Guest List & RSVP Tracker
    ├── Check-in Dashboard
    └── Export Data
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

### Recommended Stack (Simple & Low-Cost)

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) + TailwindCSS |
| Backend / API | Next.js API Routes (no separate backend needed) |
| Database | Supabase (free tier — PostgreSQL, works on Vercel) |
| File Storage | Cloudinary (free tier) |
| Email Notifications | Resend (simple API, no SMTP server needed, Vercel-compatible) |
| QR Code Generation | `qrcode` npm package (server-side, free) |
| QR Code Scanning | `html5-qrcode` or `@zxing/browser` (browser-based camera scan, free) |
| Maps | Google Maps Embed API (free) |
| Authentication | NextAuth with credentials (admin panel) + PIN for scanner page |
| Hosting | Vercel (free tier) |

### Key Technical Notes
- No complex microservices — keep it simple and maintainable.
- No multi-tenancy, no user accounts for guests.
- **Database: Supabase** — PostgreSQL hosted on Supabase free tier. SQLite is excluded as it does not work reliably on Vercel's ephemeral filesystem.
- **Email: Resend** — Used for QR code delivery and RSVP notifications. No SMTP server required.
- **Admin content editing** — All editable content (couple names, dates, schedule, story, etc.) is managed through simple form fields in the admin panel, stored in the database. No rich text editor needed.
- Data can be stored in a single database table for guests/RSVPs.
- Content (text, dates, schedule) can be stored in a config file or the database.
- The admin panel is a protected route, not a separate app.
- Each guest gets a **unique UUID token** stored in the DB, encoded into their QR code URL (e.g., `/checkin?token=abc123`).
- The scanner page calls an API route that validates the token, returns guest info, and marks them as checked in.
- The scanner page works entirely in the browser using the device camera — no special hardware needed.
- The welcomer only needs a smartphone with a browser to scan.

### Data Model

**Guest / RSVP**
- `id`, `name`, `email` *(optional)*, `attending`, `plus_one_name`, `dietary`, `message`, `submitted_at`, `token` *(unique UUID for QR code)*, `checked_in`, `checked_in_at`

**Site Config** *(stored in a config file or DB)*
- Couple names, wedding date, venue, address, RSVP deadline, theme colors, content sections

---

## 9. Hosting & Deployment

| Concern | Decision |
|---|---|
| Hosting | Vercel (free, easy deploys from GitHub) |
| Domain | Custom domain (e.g., `our-wedding.com`) or Vercel subdomain |
| SSL | Automatic via Vercel |
| Cost | ~$10–15/year for domain only; everything else free |
| Deployment | Push to GitHub → auto-deploy on Vercel |

---

## 10. Milestones & Timeline

| # | Milestone | Goal |
|---|---|---|
| 1 | Project setup | Next.js app, TailwindCSS, Supabase project created, Resend account set up, deployed to Vercel |
| 2 | Invitation page | Hero, event details, schedule, map, calendar button |
| 3 | RSVP form | Form + database + confirmation message |
| 4 | QR Code system | Generate unique QR per guest, display on confirmation screen, send via email |
| 5 | Scanner page | Welcomer scanner page with camera QR scan, guest info display, check-in marking |
| 6 | Admin panel | Login, guest list view, RSVP summary, check-in dashboard, CSV export |
| 7 | Design polish | Final theme, fonts, cover photo, mobile tweaks |
| 8 | Extra sections | Our Story, gallery, gift registry, FAQ |
| 9 | Testing | Test QR flow end-to-end, test scanner on multiple phones, test on multiple browsers |
| 10 | Go live | Share the link with all guests 🎉 |

---

## 11. Open Questions

1. What is the wedding date and venue? *(needed to finalize content)*
2. How many guests are expected? *(to ensure the free DB tier is sufficient)*
3. ~~Do we want a password so only invited guests can view the site?~~ **Decided: Yes — site password protection will be implemented (F-27). Priority upgraded to Must Have.**
4. ~~Should guests be able to edit their RSVP after submitting?~~ **Decided: Yes — guests can edit their RSVP once. The old QR token will be invalidated and a new one generated and re-sent.**
5. ~~Do we want email notifications when a guest RSVPs?~~ **Decided: Yes — the couple will receive an email notification via Resend on each new RSVP.**
6. ~~Should the QR code be delivered via email, shown on screen only, or both?~~ **Decided: Both — displayed on the confirmation screen (save/screenshot) AND sent via email for reliability.**
7. How many welcomers/door staff will there be? *(each needs the scanner PIN)*
8. What languages should the site support? *(one language or bilingual?)*
9. ~~Should the Wishes Wall be public or private?~~ **Decided: Public — visible to all guests, but the couple can delete messages from the admin panel.**

---

*Owner: The Couple*  
*Last Updated: May 11, 2026*
