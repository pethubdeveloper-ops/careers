# Pet Hub Rewards

Loyalty-rewards platform for the Pet Hub veterinary clinic chain (8 branches in
the Philippines). Two experiences behind one login:

- **Admin Portal** — staff manage clients, pets, loyalty cards, transactions and
  points, branches, veterinarians, promotions, and account/card-request approvals.
- **Client Portal** — pet owners view their profile, pets, points and loyalty
  cards, upload an avatar and cover photo, add pets, and request ("Avail") cards.

Currency is Philippine peso (₱). Loyalty cards expire **one year** after their
issue/approval date.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production bundle
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (typescript-eslint + react-hooks)
```

Sign in with **`admin@pethub.ph`** and any password to reach the admin portal, or
with any seeded client email (e.g. `janjan00x@gmail.com`) to reach the client
portal.

## Stack

| Concern | Choice |
|---|---|
| Build | Vite 5 |
| UI | React 18 + TypeScript (strict) |
| Styling | Design tokens + inline styles (`src/theme.ts`) |
| Maps | `leaflet` + OpenStreetMap tiles |
| QR codes | `qrcode` (real, scannable) |
| Persistence | `localStorage` behind a swappable adapter |

## Layout

```
src/
  theme.ts          Design tokens (T), base stylesheet, shared style presets
  types.ts          Domain models — the contract for both the local store and a future API
  nav.ts            Admin sidebar structure
  App.tsx           Shell: sidebar, top bar, global search, notifications, routing, auth
  api/
    persist.ts      usePersist hook + StorageAdapter (the backend seam)
    useDb.ts        Assembles the shared `db` bag from persisted collections
  data/seed.ts      Seed records lifted from the design prototype
  lib/              constants, loyalty-expiry math, branch labels, file/format helpers
  components/       Icon, Field, Modal, Badge, Toast, DataTable, charts, PetQRCode, StatCard
  pages/            Dashboard, TransactionScanner, TransactionHistory, CardRequests,
                    Clients (+ PetDetailsModal), Branches, Accounts, Promotions,
                    LoginScreen, ClientPortal
design/reference/   The original Claude Design handoff (prototype + spec + assets)
```

## Replacing the mock data layer

Everything reads and writes through `src/api/`. There is no `localStorage` call
anywhere else in the app.

1. Implement `StorageAdapter` (`read`/`write`) against your API, or replace
   `usePersist` with your data-fetching library of choice.
2. Point `useDb` at it — page components take a `Db` prop and never learn where
   the data came from.
3. Delete `src/data/seed.ts`.

Other seams worth knowing about when a backend lands:

- **Uploads** — receipts, pet photos, client avatar/cover and release QR images
  all go through `fileToDataUrl` in `src/lib/files.ts` and are stored as data
  URLs. Swap that for an upload to object storage; call sites only need the URL.
- **"Today"** — `TODAY` in `src/lib/constants.ts` is pinned to `2026-07-01` so the
  seeded expiries and reminders look realistic. Swap for `new Date()`.
- **Auth** — `LoginScreen` validates against the staff roster, client list and
  approved registrations in memory. Replace with real authentication; `AuthUser`
  already carries the `isClient` flag the router keys off.
- **Promotion sending** — `confirmSend` in `PromotionsPage` simulates delivery with
  a timeout. Replace with the email API call.

## Key flows

- **Auth gating** — pending registrations see "awaiting approval", denied ones see
  "declined"; client emails route to the client portal, staff to the admin portal.
- **Approvals** — client registrations land in Clients & Pets, staff registrations
  in Accounts (and can then sign in). Only `admin@pethub.ph` reviews requests.
- **Avail → release** — a client avails a card (`printStatus: Pending`), an admin
  releases it from Card Requests by setting a membership number and uploading a
  QR image (`printStatus: Printed`).
- **Card expiry** — membership date + 1 year drives Near Expiring (≤ 60 days),
  Expired, dashboard reminders and the notification bell.
- **Points** — ₱300 spent earns 1 point; redemption is blocked above the pet's
  balance.

## Design source

`design/reference/` holds the original handoff this app was built from — the
prototype (`pethub-app.jsx`), its spec (`README.md`), the host page, and the
brand assets. It is reference material, not part of the build.
