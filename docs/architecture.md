# System Architecture & Technical Specifications

## 1. Overview
The Aurelia Salon Queue Management System is built with an event-driven architecture designed to minimize latency, eliminate race conditions in token allocation, and deliver real-time state synchronization to all connected clients (customers, reception, barbers, wall display).

```
[ Customer / Mobile Client ] <----\
[ Wall Display Screen ]     <-----\   HTTP API / WebSockets
[ Reception Desk ]          <-----> [ Node.js Express Server ] <---> [ MongoDB ]
[ Barber Workstation ]      <-----/   (Socket.IO & JWT Auth)
[ Admin Executive Panel ]   <----/
```

---

## 2. Queue Allocation & Business Rules

### Token Generation
- Daily sequence format: `S-001`, `S-002`, `S-003`, etc.
- Guaranteed uniqueness via atomic counter increment in MongoDB (`Counter.findOneAndUpdate` with upsert).

### Status Lifecycle & State Machine
```
[WAITING] ──> [CALLED] ──> [IN_CHAIR] ──> [DONE]
    │            │
    └──> [CANCELLED] └──> [NO_SHOW]
```
- Transition rules enforced by `assertTransition` in `queueRules.js`:
  - `WAITING`: Can transition to `CALLED` or `CANCELLED`.
  - `CALLED`: Can transition to `IN_CHAIR` or `NO_SHOW`.
  - `IN_CHAIR`: Can transition to `DONE`.
  - Terminal statuses: `DONE`, `CANCELLED`, `NO_SHOW`.

### Barber Assignment & Preferences
- If customer specifies a `preferredBarberId`, they will only ever be called by that specific barber.
- If customer chooses "Any Available Stylist" (`null`), the next available barber calls them via FIFO queue order.
- A barber cannot call next if they already have an active client in `CALLED` or `IN_CHAIR` state.
- Barbers with `availability: 'ON_BREAK'` are skipped in automated queue allocation.

### Wait Time Estimation Algorithm
The estimated waiting minutes are calculated dynamically using:
1. Current active service durations remaining across all occupied chairs.
2. Number of active stylists currently available and on duty.
3. Queue position of competing customers ahead who chose the same barber or general pool.
4. Total duration of requested services (up to 3 services per token).

---

## 3. Real-Time WebSocket Event Flow

Socket.IO rooms:
- `staff`: Receives operational updates for reception desk and admin.
- `display`: Receives live board events for lobby TV.
- `customer:<entryId>`: Targeted events for individual tracking customer.
- `barber:<barberId>`: Station alerts for specific stylists.

Key events:
- `queue:updated`: Fired on token join, status change, or cancellation.
- `token:called`: Fired when a customer is called to chair (triggers audio chime).
- `service:started`: Transition to `IN_CHAIR`.
- `service:completed`: Transition to `DONE`.
- `barber:availability-changed`: Fired when barber marks break/available.
- `salon:settings-updated`: Fired when operational hours or online queue cutoff change.

---

## 4. Audio Notification System
- Employs native HTML5 **Web Audio API** synthesized oscillator frequencies (`587.33 Hz`, `880 Hz`, `1174.66 Hz` - D5, A5, D6).
- Zero external MP3/WAV dependencies; plays reliably across all modern desktop and mobile browsers.
