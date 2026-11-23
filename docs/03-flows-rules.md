# Flows & Rules

How a customer moves from joining to finishing, plus the queue rules in plain English and the complete verification test checklist.

---

## 1. Main Flows

### Flow: Remote Customer (Online Booking)
1. Customer opens **Home (`/`)** ➔ taps **Join Queue (`/join`)** ➔ enters name & phone ➔ picks `Haircut` + `'Any barber'` ➔ taps **Confirm**.
2. Receives token **S-14** (e.g. 6th in line).
3. Watches **My Status (`/track?q=S-14`)** from home or on the go; when 2nd in line, sees amber alert: *'Start coming to the salon'*.
4. Receptionist or Stylist taps **Call next** on Amit's card ➔ **S-14** becomes `CALLED`.
5. Customer's phone rings with 3-tone chime + flashes gold: *'It's your turn! Go to Amit'*; Waiting Area TV flashes S-14.
6. Amit taps **Start** (status `IN_CHAIR`), then **Done** (status `DONE`) ➔ S-14 leaves the active queue and revenue is logged.

### Flow: Walk-In Customer
1. Guest arrives physically at the salon without a booking.
2. Receptionist taps **`[ + Add walk-in ]`** in `/reception` ➔ enters name, phone, services, barber preference.
3. System assigns the next sequential token (source: `WALK_IN`) and adds the guest to the same FIFO queue at the end.
4. Guest sits in the lounge and watches the Waiting Area TV display (`/board`).

---

## 2. Queue Rules (Plain English)

1. **Statuses & Transitions**:
   - `Waiting` ➔ `Called` ➔ `In chair` ➔ `Done`. Never backwards.
   - `Waiting` ➔ `Cancelled` (by customer or receptionist).
   - `Called` ➔ `No-show` (if customer does not show up within grace period).
   - Terminal states: `Done`, `Cancelled`, `No-show`. Terminal entries cannot be modified.
2. **First Come, First Served (FIFO)**:
   - Earliest `joinedAt` timestamps are prioritized.
3. **Barber Allocation**:
   - **Call next for Barber X** picks the earliest waiting customer who chose **X** or **'Any'**.
   - A customer who chose **Ravi** is **never** given to another barber, even if other barbers are free.
   - A customer who chose **'Any barber'** is eligible for the next available free chair.
4. **Single Active Client Constraint**:
   - A barber has only **one** customer in their chair at a time (`Called` or `In chair`).
   - Attempting to call next for a busy barber returns `409 Conflict`.
5. **Waiting Time Estimation Rule**:
   $$\text{Waiting time} \approx \frac{\text{Total remaining minutes of services ahead}}{\text{Number of barbers working (not on break)}}$$
6. **One Active Spot Per Phone Number**:
   - A phone number can only have **one** active token (`Waiting`, `Called`, or `In chair`).
   - If the same phone tries to join again, it returns their existing active token (no duplicates).
7. **No-Show Rule**:
   - A customer called has a **10-minute grace period** (`noShowGraceMinutes`).
   - If they fail to appear, receptionist/barber marks `No-show`.
   - If they arrive later, they must be registered again as a new walk-in at the **END** of the queue with a new token.
8. **Online Cutoff Rule**:
   - Online queue joining closes **30 minutes before salon closing time** (`onlineQueueClosingMinutes`).
   - Walk-in registrations remain open until the salon closes (`closingTime`).
9. **Barber Break Rule**:
   - When a barber toggles **On break**, they are excluded from automated `callNext` candidate pools.
   - Customers browsing the stylist picker see `'Ravi is on break'`.

---

## 3. Test Checklist

- [x] **Join with 2 services** ➔ Correct total duration (mins) and price (₹) calculated and shown.
- [x] **Same phone joins twice** ➔ Shows existing spot with HTTP 200, no duplicate token created.
- [x] **Barber preference respected** ➔ Call next for Amit skips a waiting customer who explicitly chose Ravi.
- [x] **Real-time token call** ➔ Customer's phone shows 'It's your turn!' and rings audio chime when called.
- [x] **Stage transitions sync** ➔ Start / Done on Barber View immediately updates Reception and TV displays.
- [x] **No-show re-add** ➔ Customer marked No-show who rejoins gets a new token at the end of the line.
- [x] **Online cutoff** ➔ Closing online queue disables the Join button on `/join` with an explanatory message.
- [x] **Bilingual parity** ➔ Language toggle instantly switches all UI labels to Gujarati.
- [x] **Dynamic wait time** ➔ Estimated waiting time decreases dynamically as customers ahead finish.
- [x] **Multi-window sync** ➔ Phone (`/track`), tablet (`/reception`), and TV (`/board`) windows stay in sync via WebSockets.
