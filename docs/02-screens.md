# Screens & Features

Every screen in the Aurelia Salon Queue app: who uses it, what is on it, what each button does, and responsive behavior.

---

## Screen 1: Home (`/`)
- **Who uses it**: Customers arriving on the website from a mobile phone or QR code.
- **Header**: Salon name + scissors logo, 'Open · Closes 9 PM' live badge, English / Gujarati (`EN` / `ગુજ`) language switcher.
- **Live card**: 'X people waiting · about Y min' wait estimate.
- **Barber chips with live status**:
  - Ravi (busy · in chair)
  - Amit (busy · in chair)
  - Imran (free · available)
- **Primary CTA**: Big gold button `[ Join Queue ]` leading to `/join`.
- **Secondary CTA**: `[ Track Token ]` and `[ Live TV Display ]`.
- **Services preview**: List of available services with duration (mins) and price (₹).
- **Empty state**: If salon is closed, badge shows 'Salon Closed' and online joining is disabled.

---

## Screen 2: Join Queue (`/join`)
- **Who uses it**: Remote customers booking their virtual token from their phone.
- **Inputs**:
  - Name: text input (2 to 50 characters).
  - Phone: 10 digits numeric, validated (`/^\d{10}$/`).
- **Service cards (multi-select, max 3)**:
  - Haircut 30 min ₹150
  - Beard trim 15 min ₹80
  - Hair spa 45 min ₹400
  - Hair wash 15 min ₹100
  - Facial 45 min ₹500
  - Hair coloring 60 min ₹800
  - Head massage 20 min ₹200
  - Styling 20 min ₹150
  - Displays selection tally: `X/3 Selected`.
- **Barber picker**:
  - 'Any barber (fastest)' — assigned to next available chair.
  - Or a barber's card showing live availability (`Available now`, `In chair (S-011)`, or `On break`).
- **Live summary card**:
  - 'Total X min · ₹Y · Expected wait ~Z min' (updates dynamically as services are toggled).
- **Submit button**: `[ Confirm & Take Token ]`
  - Submits `POST /api/queue/join`.
  - On success: transitions to Token Card view showing token (e.g. `S-014`), position, and direct button to My Status (`/track?q=S-014`).
  - If phone already has an active token, shows the existing token with alert: 'An active token already exists for this number'.
- **Error state**: If online queue is closed (within 30 mins of closing), shows amber notice: 'The online queue is closed. Walk-ins still welcome at the salon.'

---

## Screen 3: My Status / Token Tracker (`/track` or `/track?q=:id`)
- **Who uses it**: Customer waiting from home, coffee shop, or salon waiting area.
- **Look**: Clean mobile card with gold border and dark charcoal panel.
- **Token number**: 'S-14' in large gold serif font.
- **Position indicator**: '4th in line' (counts only competing customers ahead).
- **Countdown**: '~35 min estimated wait' (auto-syncs via Socket.IO).
- **Customer details**: Name, selected services list, assigned/preferred stylist, total price.
- **Dynamic Alert Banners**:
  - When 2nd in line: Amber banner: *'Start coming to the salon — your turn is near!'*
  - When called: Flashing full-screen gold ring banner: *'It's your turn! Please go to chair / stylist.'* + Web Audio chime plays.
- **Action buttons**:
  - `[ Share Link ]`: Copies tracking link to clipboard.
  - `[ Cancel My Spot ]`: Prompts confirmation popup before calling `PUT /api/queue/:id/cancel`.

---

## Screen 4: Reception Dashboard (`/reception`) — Tablet / Desktop
- **Who uses it**: Front-desk receptionist or salon manager.
- **Top bar**:
  - Live counts: Waiting, In Chair, Completed Today, Avg Wait.
  - `[ + Add Walk-In ]` button: Opens quick popup modal (Name, 10-digit Phone, 1–3 Services, Barber preference) to issue an instant `WALK_IN` token.
- **Top section — Stylist Chairs On Duty (3-column cards)**:
  - Each barber card displays: Stylist Name, Live Duty Badge (`Available (Ready)`, `Busy (In Chair S-011)`, `On Break`).
  - Action button: `[ Call Next Customer ]`.
    - Active when barber is `AVAILABLE`.
    - Disabled when barber is `BUSY` or `ON_BREAK` (prevents calling errors).
- **Main section — Waiting List Table**:
  - Status filter tabs: `ALL`, `ACTIVE`, `WAITING`, `CALLED`, `IN_CHAIR`, `DONE`, `NO_SHOW`.
  - Search input: Real-time search by Token (e.g. `S-14`), customer name, or phone.
  - Columns: Token & Source (`ONLINE` vs `WALK_IN`), Customer Name & Phone, Services, Stylist, Status Badge, Wait Time / Join Time, Actions.
  - Highlight: Tokens waiting > 60 min highlighted in amber text.
  - Row Actions:
    - If `WAITING`: `[ Call ]` (calls this specific customer), `[ Cancel ]`.
    - If `CALLED`: `[ No-Show ]` (marks customer as no-show after grace period).

---

## Screen 5: Barber View (`/barber`) — Phone / Tablet at Station
- **Who uses it**: Stylist working at their chair (Ravi, Amit, Imran).
- **Top bar**: Stylist name, active workstation indicator. (Dropdown chair switcher for Admins/Receptionists).
- **Duty Toggle**:
  - Shows current status: `Available` or `On Break`.
  - One-click toggle: `[ Go On Break ]` vs `[ Mark Available ]` (`PUT /api/barbers/:id/availability`).
- **Current customer card (Focus Area)**:
  - If customer assigned and `CALLED`:
    - Shows customer name, phone, requested services, and duration.
    - Big green button: `[ Start Service ]` (transitions status to `IN_CHAIR`, records start timestamp).
    - Danger button: `[ No-Show ]`.
  - If customer `IN_CHAIR`:
    - Shows customer name, requested services, live elapsed timer.
    - Big gold button: `[ Finish Service / Done ]` (transitions status to `DONE`, records revenue, frees chair).
  - If chair empty:
    - Message: 'Your chair is currently empty.'
    - Big button: `[ Call Next Customer ]` (fetches next eligible customer from queue).
- **Up Next Preview**: Card displaying next waiting customer assigned to this stylist or general pool (`Next for you: S-15 Kunal · Haircut`).

---

## Screen 6: Waiting Area TV (`/board` or `/display`) — TV Screen
- **Who uses it**: Waiting room guests watching a wall-mounted TV.
- **Look**: High-contrast dark charcoal (`#070A0F`), large fonts readable from 5+ meters, zero scrolling required.
- **Top Bar**:
  - Salon branding.
  - Audio Bell Toggle: `[ Chime ON / Muted ]`.
  - Live Digital Clock (HH:mm:ss).
  - `[ Fullscreen ]` button.
- **Left Column (2/3 width) — "Now Serving"**:
  - One prominent card per stylist chair.
  - Stylist photo/initial, name, duty badge (`AVAILABLE`, `BUSY`, `ON_BREAK`).
  - Huge gold token box (e.g. `S-12`) with status badge and requested service tags.
  - When newly called: Card pulses with gold border animation (`animate-gold-pulse`) and rings 3-tone chime.
  - When free: Displays 'Available — Ready for next guest'.
- **Right Column (1/3 width) — "Up Next in Queue"**:
  - Badge showing total waiting count.
  - Numbered list of next 5 tokens (`#1 S-13`, `#2 S-14`, etc.) with preferred barber and estimated wait time (`~10m`).

---

## Screen 7: Owner Settings & Analytics (`/admin`) — Desktop
- **Who uses it**: Salon owner / administrator.
- **KPI Summary Cards**:
  - Today's Revenue (`₹`), Completed Guests, Average Wait Time (`mins`), Average Service Time (`mins`).
- **Analytics Tab**:
  - 7-day daily revenue and customer volume bar chart (Recharts).
  - Queue status breakdown pie chart (`Waiting`, `Serving`, `Done`, `No-Show`, `Cancelled`).
- **Services Menu Tab**:
  - List of services with English name, Gujarati name, duration (mins), price (₹), and active toggle.
  - `[ + Add New Service ]` modal and Edit / Deactivate actions.
- **Stylists Tab**:
  - List of barbers, working hours, and duty toggles.
- **Salon Operations Settings Tab**:
  - Opening time & Closing time inputs (`09:00` - `21:00`).
  - Online queue switch: `Open / Closed for online joining`.
  - Online queue cutoff before close (`30 mins`).
  - No-show grace period (`10 mins`).
  - `[ Save Changes ]` button.
