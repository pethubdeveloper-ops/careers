# Handoff: Pet Hub Rewards — Loyalty Card Admin & Client Portal

## Overview
A veterinary loyalty-rewards platform for the "Pet Hub" clinic chain (8 branches in the Philippines). It has two experiences behind one login:
- **Admin Portal** — staff manage clients, pets, loyalty cards, transactions/points, branches, veterinarians, promotions, and account/card-request approvals.
- **Client Portal** — pet owners view their own profile, pets, points, and loyalty cards, upload a profile avatar + cover photo, add pets, and request ("Avail") loyalty cards.

Currency is Philippine Peso (₱). Loyalty cards expire **1 year** after issue/approval date.

## About the Design Files
The files in this bundle are **design references created in HTML/React (a single prototype file)** — they show the intended look and behavior, not production code to ship as-is. The task is to **recreate this design in the target codebase's environment** (its framework, component library, routing, auth, and data layer). If no environment exists yet, pick an appropriate stack (e.g. React + a component lib + a real backend/DB + auth) and implement there. All data in the prototype is in-memory/localStorage sample data and must be replaced by real APIs/persistence.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, glassmorphism, and interactions are all specified below and in the source. Recreate pixel-closely using the codebase's libraries, then wire to real data.

## Screens / Views

### Auth
- **Login** — split screen: left brand panel (green gradient, gold logo, headline + branch/client/pet stats), right form (email, password with show/hide, remember me). Validates against staff roster, client list, and approved registrations. Clients land in Client Portal; staff/admin land in Admin Portal.
- **Register / Request Access** — toggle from login. Fields: full name, **Account Type** (Staff/Admin or Client via segmented radio), email, branch, (staff → requested role; client → contact number), password. Submitting creates a **Pending** registration; the user cannot sign in until approved.

### Admin Portal (sidebar groups: Overview, Operations, Directory, Marketing)
- **Dashboard** — top bar (global search over clients/pets/transactions/branches; notifications bell; profile menu with logout). Content order: Page header + branch filter → KPI strip (Total Revenue, Points Issued, Points Redeemed, Upcoming Visits) → **Newly Approved Clients** (cards to prepare, with pets & issued-card count) → Revenue (last 6 months bar chart) + Revenue by branch top 5 + **Reminders & Alerts** (new account requests, expiring/expired loyalty cards, cards to print) → Loyalty Card Overview donut + stat cards (Total Pets, Total Clients, Approved Accounts, With/Without Loyalty Card [counts **pets**], Active/Inactive Clients, Near Expiring, Expired Cards — most are clickable → list modal) → post composer + feed.
- **Loyalty Scanner (Transaction)** — record a transaction for a pet: gain or redeem points, amount, receipt image/PDF upload (stored + viewable). Shows the pet's VIP loyalty card with a **Download Card** button (renders card to PNG). Per-pet transaction history.
- **Transaction History** — all transactions; **By Pet** grouped view (expandable per-pet with subtotals) and **List** view; filters: search, branch, type (Earned/Redeemed), month; KPI cards reflect filters; **Export CSV** (respects filters and view — grouped export has per-pet subtotals).
- **Card Requests** — pending loyalty-card requests (from clients availing cards); **Release Card** opens a modal with pet/owner details where admin sets Membership Number + uploads a QR code image; **Decline** removes the request. Also a **Newly Approved Clients** section. Branch filter.
- **Clients & Pets** — directory with add/edit; pets carry membership no., card status, print status.
- **Branches** — table + Leaflet map; addresses link to Google Maps; per-branch add/edit. Client view is read-only.
- **Accounts** — branch staff accounts (add/edit, Date Created). **Account Access Requests** panel (super-admin `admin@pethub.ph` only): approve → Clients go to Clients & Pets, Staff/Admin go to Accounts; deny; a "→ Clients"/"→ Accounts" tag shows destination. Each account row shows its branch's **Veterinarians** as chips.
- **Promotions** — create promos; **Send** modal with recipient selection: multi-select branch chips + per-client checkboxes + search; "Select all"/"Clear"; send-to-all or send-to-N.

### Client Portal (restricted nav: Dashboard, Branches, My Pets)
- **Dashboard** — full-bleed **cover photo** banner with overlaid avatar + welcome text (both uploadable, persisted); KPIs (My Pets, Total Points, Loyalty Cards [excludes pending], Upcoming Visits); My Details; My Pets list.
- **My Pets** — pet cards with full profile, points, and **Avail Loyalty Card** button on carded-less pets (issues a pending card request); **Add Pet** modal.
- **Branches** — read-only branches + map.

## Interactions & Behavior
- **Auth gating**: pending → "awaiting approval"; denied → "declined"; client emails route to client portal; only roster/approved staff reach admin.
- **Approvals**: client registrations → Clients & Pets; staff registrations → Accounts (and can then sign in).
- **Avail card (client) → Card Requests (admin) → Release**: sets pet `hasCard`, membership no., QR, `printStatus: Printed`.
- **Loyalty card expiry**: membershipDate + 1 year; drives Near Expiring (≤60 days), Expired, reminders, notifications.
- **Uploads**: receipts, pet photos, client avatar/cover, QR — all via FileReader → data URL, persisted to localStorage in the prototype (replace with real file storage).
- **Persistence**: prototype uses a `usePersist` localStorage hook for branches, branchVets, accounts, clients, pets, promotions, appointments, transactions, registrations, auth/user. Replace with real DB + API.
- **Animations**: stat numbers count up; page fade/slide-in; button press scale; row hover; input focus glow (see keyframes in source).

## State Management
Global data held in the root `App` and passed via a `db` prop object: `branches, branchVets, accounts, clients, pets, promotions, appointments (legacy/unused in UI), transactions, registrations, user`, each with a setter. `page` controls routing; `authed`/`user` control auth. Replace with the codebase's state/store + server data.

## Design Tokens
Theme object `T` (dark green glassmorphism):
- sidebar `#155f45`, sidebarHov `#1d7a58`
- accent `#1eb87f`, accentDark `#149a6a`, accentLite `#8ef0c8`
- bg `#2a7d5f`, surface `#328b6a`, surfaceAlt `#2e8464`
- border `#47a380`, borderMid `#5cb896`
- text `#f8fffb`, muted `#d3f0e4`, subtle `#a5d3c1`
- danger `#fca5a5`, warn `#fcd34d`, info `#93c5fd`
- Gold accents (VIP card, logo): champagne `#f4e2a1` → gold `#d4af37`
- Font: Inter. Cards: `border-radius:18px`, translucent white `rgba(255,255,255,.10)` + `backdrop-filter: blur(16px)`, `1px solid rgba(255,255,255,.22)`, layered shadow. Buttons `border-radius:8px`. Stat cards `border-top:3px solid <accent>`.
- Spacing: card padding ~20–24px; grid/flex gaps 12–16px.

## Assets
- `logo.png` — Pet Hub logo (transparent background).
- `logo-gold.png` — gold-recolored logo used in sidebars, login, map markers, and as the loyalty-card watermark.
- Leaflet (map) loaded via CDN in the prototype.

## Files
- `pethub-app.jsx` — the entire application (React, single file; classic React via `React.useState` etc., mounted by the DC host).
- `PetHub Admin.dc.html` — thin host page that mounts `pethub-app.jsx`.
- `logo.png`, `logo-gold.png` — brand assets.
- `support.js` — DC runtime (host-only; not part of the app logic).
