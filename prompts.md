# Vibe Coding Lab — Prompts Log

Every prompt used in order while building the Aurelia Salon Queue Management System.

---

### Step 1 — Project Brief & Scoping
> **Prompt**: Read `docs/01-brief.md`. Explain what the salon queue application does, its users, and what NOT to build. Keep it focused on the 6 must-have features.

### Step 2 — Architecture & Empty Screen Setup
> **Prompt**: Set up React + Vite + Tailwind for the app in `docs/01-brief.md`. Create empty pages for all screens and a dark charcoal + gold theme (`#1F2937`, `#D4A017`, `#0B0F17`). Add a simple English / Gujarati language toggle.

### Step 3 — Home Screen & Virtual Queue Join
> **Prompt**: Build Screen 1 (Home) and Screen 2 (Join Queue) from `docs/02-screens.md` with services and 3 barbers (Ravi, Amit, Imran). The live summary must update as services are selected (max 3). Validate phone numbers. Mobile-first, charcoal + gold theme.

### Step 4 — My Status & Token Tracker
> **Prompt**: After Confirm on `/join`, issue a daily sequential token (S-001, S-002...) and redirect to My Status. Show queue position and estimated wait using the rule in `docs/03-flows-rules.md`. Add the 'Start coming' alert when 2nd in line, and flashing gold 'It's your turn!' alert when called, accompanied by an audio chime.

### Step 5 — Reception Desk Dashboard
> **Prompt**: Build the Reception Dashboard (Screen 4). Customers who join from a phone must appear automatically via Socket.IO. Add quick walk-in modal. Stylist cards must show live duty (Available vs Busy) and Call Next button must respect barber-preference rules.

### Step 6 — Barber View & Waiting Area TV
> **Prompt**: Build Barber View (Screen 5) and the Waiting Area TV (Screen 6). Start / Done and On Break must update Reception, TV, and customer's phone in real time. Newly-called token on TV flashes gold with a chime.

### Step 7 — Owner Settings & Analytics
> **Prompt**: Build Screen 7 (Owner Settings / Admin). Add Recharts for 7-day revenue and status distribution. Services menu with English & Gujarati names, prices, and durations. Online queue cutoff toggle and operating hours.

### Step 8 — Queue Rules, Edge Cases & Verification
> **Prompt**: Implement and verify the no-show, cancel, and barber-on-break rules from `docs/03-flows-rules.md`. Go through the 10-item test checklist in `docs/03-flows-rules.md` and verify all tests pass.
