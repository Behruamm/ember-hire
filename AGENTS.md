# AGENTS.md

Guidance for Codex agents working in this repository.

---

## Project

**Ember Coach Hire** is a self-serve quote flow for single-day coach hire. The app supports one-way and same-day return journeys only.

No online checkout, no real auth, no database. Booking state lives client-side and Google Maps calls run through a server-side API route so the key never reaches the browser.

Read these first:
- [Project.md](Project.md)
- [HANDOFF.md](HANDOFF.md)
- [dev-plan/README.md](dev-plan/README.md)

---

## Commands

```bash
cd ember-hire

npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run test -- --run
npx tsc --noEmit
```

---

## Architecture

### Tech Stack

- **Next.js 16 App Router**
- **TypeScript strict mode**
- **Tailwind CSS**
- **State:** React Context + `useReducer` + `localStorage` in `context/BookingContext.tsx`
- **Maps:** Google Geocoding + Distance Matrix via `app/api/route-segments/route.ts`
- **Tests:** Vitest unit tests

### User Flow

```text
/book            Journey type + passenger count + single travel date
/book/pickups    Pickup addresses, with passenger counts for over-capacity multi-pickup trips
/book/dropoff    Destination + required arrival time
/book/return     Same-day return details, only for return journeys
/book/quote      Price-focused quote, with optional journey details
/book/contact    Name/email/phone or fake login shortcut
/book/confirmation  Reference number
```

### Core Logic

```text
lib/pickup-times.ts      Back-calculates pickup timelines from arrival time
lib/business-rules.ts    Central rates, capacity, deposit, booking window
lib/coach-allocation.ts  Splits passenger groups into coach plans
lib/quote-engine.ts      Calculates quote totals from booking state and route segments
lib/coaches.ts           53-seat coach count helper
lib/pricing.ts           Exact-minute pricing
lib/schemas.ts           Zod validation schemas for wizard steps
lib/reference.ts         EMB-XXXXXXXX reference generation
```

### Pricing Formula

```text
PRICE = (coachCount * £300) + (TOTAL_BILLABLE_MINUTES / 60 * £60) + (TOTAL_WAITING_MINUTES / 60 * £20)
```

For multiple coaches, the base rate and route/stop minutes are calculated per coach plan.

Passenger stop time is 15 minutes for every pickup and every drop-off:
- Outbound: each pickup plus final destination drop-off.
- Return: destination pickup plus each return drop-off.

Waiting time is used only for same-day return journeys and is the gap between destination arrival and return departure, charged per coach.

The public form requires at least 48 hours' notice. Quotes may show an estimated 25% deposit, but payment is arranged only after Ember confirms the details by phone.

### Google Maps Boundary

Only `app/api/route-segments/route.ts` calls Google APIs. UI components POST stops to that route and receive segment drive times/distances.

Never expose `GOOGLE_MAPS_API_KEY` in client code.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Server-side Geocoding API + Distance Matrix API |
| `GEMINI_API_KEY` | Reserved for future AI assistant work |

---

## Workflow Rules

- Keep the product single-day only unless the project spec changes.
- Keep route and pricing logic in pure `lib/` helpers where possible.
- Verify meaningful changes with `npm run test -- --run` and `npx tsc --noEmit`.
- Guard browser APIs with `typeof window !== 'undefined'` or use `useEffect`.
- Do not call Google APIs directly from UI components.

---

## Brand

- Background: white `#ffffff`
- Primary accent: `#3D8B6E`
- Text: `#1a1a1a`, muted `#555555`
- Font: Inter/system-ui
- Coach capacity: 53 seats
- Passenger stop time: 15 minutes
