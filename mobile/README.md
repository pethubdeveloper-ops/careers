# Pet Hub Rewards — mobile

The iOS and Android app, built with Expo (SDK 57) and React Native. Both
portals live behind one login, the same as on the web:

- **Clinic staff** — dashboard, loyalty scanner (with the phone camera),
  card requests, and the client directory.
- **Pet owners** — their pets, points, loyalty card QR, and availing a card.

## Running it

```bash
cd mobile
npm install
npx expo start          # then scan the QR with Expo Go, or press i / a
npx expo start --web    # runs in a browser, useful for a quick look
```

`npx expo start` needs to reach Expo's servers. In a restricted network the
export commands still work offline:

```bash
npx expo export --platform ios
npx expo export --platform android
```

## What is shared with the web app

The rules that would be expensive to get wrong are not duplicated. Metro is
pointed at the web app's `src/` (see `metro.config.js`), so both apps import
the same modules:

| Shared | Why it matters |
|---|---|
| `@/types` | One definition of a pet, client, card and transaction |
| `@/lib/loyalty` | Expiry maths, renewal, points balance, and what a QR encodes |
| `@/lib/branch` | The two branch-name shortenings |
| `@/lib/constants` | Card validity, near-expiry window, the pinned "today" |
| `@/data/seed` | Branches, accounts and admins |

A card that expires on one surface expires on the other, because it is the
same function deciding.

The UI is not shared — React Native has no DOM — so screens under `src/screens/`
are written against native primitives, using tokens ported into `src/theme.ts`.

## Storage

`src/store/persist.ts` keeps records in AsyncStorage under `pethub_mobile_*`
keys. The prefix earns its keep in the web build: that runs on the same origin
as the web portal, and unprefixed keys would have the two overwrite each
other's records — including the version marker, leaving both wiping the other's
data on every launch. They are **separate stores**: a phone and a browser do not see each other's data until a real
backend replaces `src/store/useDb.ts`. That file is the only thing that would
need to change — screens take a `Db` and never learn where records came from.

## Native capability

| Feature | Module | Notes |
|---|---|---|
| Scanning a loyalty card | `expo-camera` | Live QR scan; the first read wins so one scan isn't a dozen lookups |
| Pet photo when availing | `expo-image-picker` | Square crop, compressed — cards print small |
| Showing a card | `react-native-qrcode-svg` | Error-correction level H, for scuffed screens and bad angles |

Permission strings are in `app.json`. Both stores reject a build that asks for
the camera without explaining why.

## Building for the stores

`expo-camera` and `expo-image-picker` need a native build, so Expo Go is only
good for a look — shipping needs EAS or a local build:

```bash
npx eas build --platform ios
npx eas build --platform android
```

The iOS bundle identifier and Android package are both `ph.pethub.rewards`.
Change them in `app.json` if the Pet Hub Shop app already claims that space.

## Shareable demo

```bash
npx expo export --platform web
node scripts/build-demo.mjs dist ../pethub-mobile-demo.html
```

Folds the web export into one self-contained HTML page, framed as a phone.
Everything is inlined because the page is served under a CSP that blocks other
hosts. The entry bundle has to run first — it defines the module registry the
lazily-loaded barcode reader registers into.

## Verified

The web target was driven at phone size (390×844) through a full round trip:
staff sign in and add a client with a pet, the owner signs in and sees it,
opens the pet, and staff then find that pet on the scanner with the owner's
name attached — no console errors. Both native bundles build (≈1,180 modules).

Not verified from here: anything needing real hardware — the camera scan and
the photo picker — and how it looks on a physical device.
