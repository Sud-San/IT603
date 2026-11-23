# Salon Queue Management System

**Live demo:** http://localhost:5173  
**Hosted on:** React Vite (Frontend) + Express & MongoDB (Backend)

### Staff Credentials
| Role | Email | Password | Access |
|---|---|---|---|
| **Salon Owner (Admin)** | `admin@salon.demo` | `Admin@123` | Full access (`/admin`, `/reception`, `/barber`) |
| **Front Desk (Reception)** | `reception@salon.demo` | `Reception@123` | Walk-in registration & queue table (`/reception`) |
| **Stylist (Ravi Sharma)** | `ravi@salon.demo` | `Barber@123` | Chair 1 workstation (`/barber`) |
| **Stylist (Amit Patel)** | `amit@salon.demo` | `Barber@123` | Chair 2 workstation (`/barber`) |
| **Stylist (Imran Khan)** | `imran@salon.demo` | `Barber@123` | Chair 3 workstation (`/barber`) |

*(On the login page at `/login`, one-click demo preset tabs automatically fill these credentials).*

---

## 📖 Lab Documentation (Vibe Coding Lab Guide)

All required design documents specified in the **MSc IT Vibe Coding Lab TA Handout** are located in the `docs/` folder and root:

1. [docs/01-brief.md](file:///d:/BCA/Programs/React/saloon/docs/01-brief.md): Problem, Users, Must-Have Features (1–6), Don't-Build List, Look & Feel.
2. [docs/02-screens.md](file:///d:/BCA/Programs/React/saloon/docs/02-screens.md): Specifications for all 7 screens (Home, Join Queue, My Status, Reception, Barber View, Waiting Area TV, Owner Settings).
3. [docs/03-flows-rules.md](file:///d:/BCA/Programs/React/saloon/docs/03-flows-rules.md): Customer Flows (Remote & Walk-in), Plain-English Queue Rules, and 10-Item Test Checklist.
4. [AGENTS.md](file:///d:/BCA/Programs/React/saloon/AGENTS.md): Project overview, stack, commands, coding standards, and business invariants.
5. [prompts.md](file:///d:/BCA/Programs/React/saloon/prompts.md): Log of vibe coding prompts used to build the system.

---

## 🌟 Key Features

### 1. 📱 Customer Virtual Line
- **Phone Booking (`/join`)**: Pick 1 to 3 services with live duration & price tally. Choose any available barber or preferred stylist.
- **Live Status Tracker (`/track`)**: Live position countdown (`#2 in line`), wait countdown, 'Start coming to salon' warning, and full-screen gold ring when called.
- **Audio Chime**: Web Audio API multi-tone alert synthesized natively in the browser on token call.

### 2. 📺 Waiting Area TV Display (`/board`)
- Split-screen lobby TV dashboard:
  - **Now Serving**: Large gold token numbers per barber chair with animated border pulse on call.
  - **Up Next**: Top 5 waiting tokens with estimated wait times.
  - Digital clock, chime toggle, and fullscreen mode.

### 3. 🛎️ Receptionist Dashboard (`/reception`)
- **Quick Walk-In Entry**: Modal form to generate in-person tokens (`WALK_IN`).
- **Stylist Chairs Bar**: Shows live duty (`Available (Ready)`, `Busy (In Chair)`, `On Break`) and 'Call Next' button.
- **Queue Table**: Search and filter by All, Active, Waiting, Called, In-Chair, Done, No-Show.

### 4. ✂️ Barber Workstation (`/barber`)
- Displays current guest in chair with requested services.
- Stage action buttons: `[ Start Service ]` ➔ `[ Finish Service / Done ]`.
- Duty toggle: `[ Available ]` vs `[ On Break ]`.
- Preview of next waiting client in line.

### 5. 📊 Owner Settings & Analytics (`/admin`)
- Recharts daily revenue and status breakdown charts.
- Services menu catalog management (English + Gujarati names, pricing, durations).
- Salon operating hours, online cutoff minutes, and no-show grace period controls.

### 6. 🌐 Dual-Language Support
- Full bilingual toggle for **English** and **Gujarati (ગુજરાતી)** across all guest interfaces and menus.

---

## 🚀 Quick Run Guide

### 1. Install & Seed
```powershell
npm run install:all
npm run seed
```

### 2. Run Locally
In two separate terminals:
```powershell
# Terminal 1: Backend API & Socket.IO (Port 5000)
npm run dev:server

# Terminal 2: Frontend Vite Client (Port 5173)
npm run dev:client
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Tests & Build
```powershell
npm test
npm run build
```
