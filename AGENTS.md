# AGENTS.md — Salon Queue Management

Queue app for a salon: customers join from their phone, see wait time, get called; reception and barbers manage the queue; TV display.

## Read first
- `docs/01-brief.md` -> features + what NOT to build
- `docs/02-screens.md` -> every screen's layout and behaviour
- `docs/03-flows-rules.md` -> flows, queue rules, test checklist

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS. Run with `npm run dev:client`.
- **Backend**: Node.js 18+ (ES Modules) + Express + MongoDB + Socket.IO. Run with `npm run dev:server`.
- **Database**: MongoDB via Mongoose. Seed with `npm run seed`.
- **Tests**: Node.js native test runner. Run with `npm test`.
- **Theme**: Charcoal (`#1F2937` / `#111827`) + Gold accent (`#D4A017`); luxury rounded cards.
- **Audio Chime**: Native Web Audio API synthesis in `client/src/utils/sound.js` (no audio files).

## How to work
- **One screen or one feature per task**. Don't break or overwrite other screens.
- **Theme**: Charcoal panel (`#1F2937`) + gold (`#D4A017`) on dark background (`#0B0F17`).
- **All labels via the EN/GU language file**: In `client/src/locales/i18n.js`; no hard-coded text.
- **Queue rules live in ONE place in the code**: Pure logic in `server/services/queueRules.js`, transactional database orchestration in `server/services/queueService.js`. Reuse them everywhere.
- **Never add features from the 'Don't build' list**: No online payments, no future appointments, no SMS gateways, no loyalty schemes.
- **After each task**: Verify unit tests with `npm test`, test build with `npm run build`, and list changed files and how to test.

## Key Invariants
1. **Status transitions**: `WAITING` ➔ `CALLED` ➔ `IN_CHAIR` ➔ `DONE`. (Also `WAITING` ➔ `CANCELLED`, `CALLED` ➔ `NO_SHOW`). Never backwards.
2. **Barber preference**: A customer who requested barber X must never be given to barber Y.
3. **Single client per chair**: A barber can only serve one active customer at a time.
4. **Phone uniqueness**: Only one active token allowed per mobile number.
5. **Token format**: Always `S-` followed by zero-padded 3 digits (e.g. `S-001`), resetting daily.

## Default Demo Credentials
- **Salon Owner (Admin)**: `admin@salon.demo` / `Admin@123`
- **Front Desk (Reception)**: `reception@salon.demo` / `Reception@123`
- **Stylists (Barbers)**: `ravi@salon.demo`, `amit@salon.demo`, `imran@salon.demo` / `Barber@123`
