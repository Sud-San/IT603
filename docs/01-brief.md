# Salon Queue — Brief

## Problem
On weekends customers sit 1–2 hours in the salon without knowing their turn. Some leave; others argue about who came first.

## Users
Customers, receptionist/owner, barbers.

## Must-have features
1. **Join the queue from your phone**: pick service(s) and barber (or 'Any Available')
2. **Live status**: your position, estimated wait time, 'You're next!' / 'Start coming' alert
3. **Receptionist dashboard**: add walk-ins, call next, mark no-show, cancel
4. **Barber screen**: current customer, Start / Done, break toggle
5. **Waiting-area TV**: who's with which barber + next 5 tokens
6. **Owner settings**: services (time + price), barbers on duty, open/close queue

## Don't build
Online payment, future-date appointments, SMS/WhatsApp integrations, loyalty points, multiple branches.

## Look & feel
Premium salon feel: dark charcoal (`#1F2937` / `#111827`) + gold accent (`#D4A017`), clean, mobile-first with rounded cards.
Labels in English and Gujarati (bilingual toggle).

---

## Technical Baseline
- **Frontend**: React 18 + Vite + Tailwind CSS (`client/`)
- **Backend**: Node.js + Express + MongoDB + Socket.IO (`server/`)
- **Audio Chime**: Web Audio API oscillator synthesis (no external MP3/WAV assets)
