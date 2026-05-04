# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project

**Ember Coach Hire** — a self-serve coach hire booking flow. Portfolio project. No backend, no online checkout, no auth. Client-side wizard with one server-side API route for Google Maps.

---

## Commands

```bash
cd ember-hire

npm run dev          # Start dev server on localhost:3000
npm run build        # Production build (run before every deploy)
npm run test         # Vitest unit tests — all must pass before any UI work
npm run lint         # ESLint via next lint
npx tsc --noEmit     # Type-check without emitting

# Run a single test file
npx vitest run __tests__/unit/pickup-times.test.ts
```

---

## Architecture

### Tech Stack
- **Next.js 16 App Router** — file-based routing, `app/` directory
- **TypeScript strict mode** — all types in `types/booking.ts`
- **Tailwind CSS** — white background, `#3D8B6E` green accent, Inter font
- **State:** React Context + `useReducer` + `localStorage` via `context/BookingContext.tsx`
- **Maps:** Google Maps APIs (Geocoding + Distance Matrix) — server-side only via `app/api/route-segments/route.ts`
- **Tests:** Vitest (unit)

### User Flow

```
Step 1  /book            Journey type + passengers + date, single travel date only
Step 2  /book/pickups    Pickup postcodes/addresses (one or many, in order)
Step 3  /book/dropoff    Drop-off location + arrival time
          IF one way → /book/quote
          IF return  → /book/return
Step 3b /book/return     Return pickup point + read-only drop-off stops with passenger counts + departure time
Step 4  /book/quote      Quote — real drive times via Google Maps, pickup timeline, price breakdown, estimated deposit
Step 5  /book/contact    Name, email, phone
Step 6  /book/confirmation  EMB-XXXXXXXX reference, "we'll call within 24hrs"
```

### State Shape (flat, single day only)

```typescript
// types/booking.ts
{
  journeyType: 'oneway' | 'return' | null
  groupSize: number | null
  date: string | null           // ISO YYYY-MM-DD
  pickups: string[]             // postcodes/addresses in order
  dropoff: string | null
  arrivalTime: string | null    // HH:MM
  returnDepartTime: string | null
  returnPickups: string[]       // pre-filled from outbound pickups
  pickupPassengerCounts: number[]  // per-pickup counts for over-capacity multi-pickup groups
  contact: { name: string; email: string; phone: string; notes?: string } | null
  quote: QuoteBreakdown | null
  referenceNumber: string | null
}
```

### Page Structure

```
app/page.tsx                        # Landing page (Ember brand replica)
app/book/layout.tsx                 # BookingProvider wrapper + EmberHeader
app/book/page.tsx                   # Step 1: Journey type + passengers + date
app/book/journey/page.tsx           # Legacy redirect to /book
app/book/group/page.tsx             # Legacy redirect to /book
app/book/date/page.tsx              # Legacy redirect to /book
app/book/pickups/page.tsx           # Step 2: Pickup locations
app/book/dropoff/page.tsx           # Step 3: Drop-off + arrival time
app/book/return/page.tsx            # Step 3b: Return stops + departure time
app/book/quote/page.tsx             # Step 4: Quote with real drive times + timeline
app/book/contact/page.tsx           # Step 5: Contact details
app/book/confirmation/page.tsx      # Step 6: Reference number
app/api/route-segments/route.ts     # POST — geocode + Distance Matrix, server-side only
```

### Logic Layer

```
lib/business-rules.ts    # central rates, capacity, deposit, booking window — single source of truth
lib/quote-engine.ts      # calculateQuote(state, routeProvider) → quote + journey details
lib/coach-allocation.ts  # allocateCoaches() — splits large groups across coaches by pickup
                         # routeForCoach() / returnRouteForCoach() — per-coach route arrays
lib/pickup-times.ts      # calcPickupTimeline(segments, pickups, arrivalTime) → departure times
                         # parseTime(hhmm) → minutes, formatTime(minutes) → HH:MM
                         # BOARDING_MINUTES = 15 per stop
lib/return-window.ts     # calculateReturnWindow() → latest same-day departure time
                         # canCompleteReturnSameDay(departTime, latestDepartTime) → boolean
lib/pricing.ts           # buildQuote(coaches, driveMin, waitMin) → QuoteBreakdown
                         # formatGBP(amount) → '£1,234'
                         # RATES: base £300, drive £60/hr, wait £20/hr
lib/coaches.ts           # coachCount(groupSize) — 53 capacity
                         # capacityWarning(groupSize) — multi-coach banner text
lib/schemas.ts           # Zod schemas for wizard validation
lib/format.ts            # addDays(), toISO(), formatDisplay(), formatShortDate()
lib/reference.ts         # generateReference() — 8-char alphanumeric
```

### Key Data Flow

1. User fills wizard steps → state stored in `BookingContext` (single `useReducer`, persisted to `localStorage` key `ember-booking-v2`)
2. Route guards on each page check `hydrated` flag before redirecting — prevents false redirects on page refresh
3. On quote page: client POSTs stops to `/api/route-segments` → server geocodes via Google Geocoding API → gets drive times via Distance Matrix API → returns segments
4. `calcPickupTimeline()` back-calculates departure times from arrival time using real segment data
5. Quote calculation uses exact route/stop minutes and wait minutes, then contact submits the enquiry

### Route Segment API

`POST /api/route-segments`
```json
// Request
{ "stops": ["EH1 1YZ", "EH10 4BF", "Murrayfield Stadium"] }

// Response
{ "segments": [
    { "from": "EH1 1YZ", "to": "EH10 4BF", "driveMinutes": 9, "distanceMetres": 3200 },
    { "from": "EH10 4BF", "to": "Murrayfield Stadium", "driveMinutes": 12, "distanceMetres": 4100 }
  ]
}
```

Geocoding and Distance Matrix calls run in parallel per batch. Returns a 422 if any stop cannot be geocoded — no silent fallback.

### Pickup Timeline Back-Calculation

Walk backwards from arrival time. For each pickup (last → first):
```
cursor -= segment.driveMinutes   // drive from this stop to the next
cursor -= 15                     // boarding time at this stop
departTime = formatTime(cursor)
```

Results returned in forward order (first pickup first).

### Pricing Formula

```
baseRate    = £300 × coachCount
drivingCost = (totalDriveMinutes / 60) × £60        // shared across all coaches
waitingCost = (totalWaitMinutes / 60) × £20 × coachCount
total       = baseRate + drivingCost + waitingCost

coachCount  = ceil(groupSize / 53)
```

`totalDriveMinutes` is the sum of all per-coach route times (drive + 15min stop per pickup and drop-off). For multi-coach groups each coach is routed separately so their minutes are added together.
`totalWaitMinutes` = gap between outbound arrival and return departure (return journeys only). Multiplied per coach.

---

## Environment Variables

| Variable | Where set | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | `.env.local` (local), Vercel dashboard (prod) | Geocoding API + Distance Matrix API — server-side only |
| `GEMINI_API_KEY` | `.env.local` | Reserved for future AI assistant feature |

Required Google Maps APIs (both must be enabled on the key):
- Geocoding API
- Distance Matrix API

---

## State Management

`context/BookingContext.tsx` is the single source of truth:
- `BookingProvider` wraps `app/book/layout.tsx` — all wizard pages share one reducer
- `hydrated` boolean is exposed so route guards wait for localStorage rehydration before firing
- Storage key: `ember-booking-v2` (v1 key `ember-booking` is ignored)
- `clearBooking()` resets state + removes from localStorage (called on confirmation page)

## Workflow Rules

### Verification
Never mark a task complete without:
- `npx tsc --noEmit` passes
- `npm run test -- --run` passes (all 87 tests green)
- The relevant UI step works in the browser

### SSR Guards
Any code accessing `window` or `localStorage` must be inside `useEffect` or guarded with `typeof window !== 'undefined'`. The `BookingProvider` handles this — don't access localStorage directly in components.

### `"use client"` Directive
All wizard pages and components using hooks need `"use client"`. The `app/api/` routes must never import client-only modules. All `lib/` modules are server-safe.

### Never Expose the Maps Key
All Google Maps API calls go through `app/api/route-segments/route.ts` only. Never call Google APIs from client components.

---

## Brand

- Background: white (`#ffffff`)
- Primary accent: `#4f917a` (Ember Green — buttons, icons, active states); hover `#238078`
- Text: `#252a31` (ink/primary), `#60646c` (secondary), `#8b8d98` (muted/placeholder)
- Font: **Montserrat** (Google Fonts, loaded via `next/font/google`)
- Design tokens: defined in `app/globals.css` under `@theme` — use CSS vars like `var(--color-brand-green)`, `var(--radius-sm)`, `var(--shadow-card)` etc.
- Coach capacity: 53 seats
- Boarding time: 15 min per stop
