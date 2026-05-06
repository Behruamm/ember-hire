# CLAUDE.md

Guidance for Claude Code when working in this repository.

---

## Project

**Ember Coach Hire** is a self-serve coach hire booking-flow portfolio project.

Key constraints:

- No full backend
- No authentication
- No online checkout
- Client-side booking wizard
- One server-side API route for Google Maps route calculations
- Single travel date only

---

## Non-Negotiables

- Run verification before marking work complete:
  - `npx tsc --noEmit`
  - `npm run test -- --run`
  - Relevant UI step works in the browser
- Never expose the Google Maps API key to client code.
- Google Maps calls must only go through `app/api/route-segments/route.ts`.
- Do not access `window` or `localStorage` during SSR.
- Use the existing `BookingContext` state flow instead of creating parallel state.
- Business rules for pricing, capacity, booking windows, and timing must stay centralized in `lib/`.
- Wizard pages and hook-based components need `"use client"`.
- API routes must not import client-only modules.

---

## Commands

```bash
cd ember-hire

npm run dev          # Start dev server on localhost:3000
npm run build        # Production build; run before deploy
npm run test         # Vitest unit tests
npm run lint         # ESLint via next lint
npx tsc --noEmit     # Type-check without emitting

# Run a single test file
npx vitest run __tests__/unit/pickup-times.test.ts
```

---

## Tech Stack

- **Next.js 16 App Router**
- **TypeScript strict mode**
- **Tailwind CSS**
- **React Context + useReducer**
- **localStorage persistence**
- **Google Geocoding API**
- **Google Distance Matrix API**
- **Vitest**

Main shared types live in:

```text
types/booking.ts
```

---

## Booking Flow

```text
/book
  Journey type, passengers, date

/book/pickups
  Pickup postcodes or addresses, one or many, in order

/book/dropoff
  Drop-off location and arrival time

/book/return
  Return pickup point, read-only return stops, passenger counts, departure time

/book/quote
  Real drive times, pickup timeline, price breakdown, estimated deposit

/book/contact
  Name, email, phone

/book/confirmation
  EMB-XXXXXXXX reference and confirmation message
```

One-way bookings skip `/book/return` and go straight from `/book/dropoff` to `/book/quote`.

---

## State Shape

Booking state is flat and single-day only.

```ts
{
  journeyType: 'oneway' | 'return' | null
  groupSize: number | null
  date: string | null
  pickups: string[]
  dropoff: string | null
  arrivalTime: string | null
  returnDepartTime: string | null
  returnPickups: string[]
  pickupPassengerCounts: number[]
  contact: {
    name: string
    email: string
    phone: string
    notes?: string
  } | null
  quote: QuoteBreakdown | null
  referenceNumber: string | null
}
```

State source of truth:

```text
context/BookingContext.tsx
```

Rules:

- `BookingProvider` wraps `app/book/layout.tsx`.
- All wizard pages share the same reducer.
- State persists to localStorage using key `ember-booking-v2`.
- Ignore the old `ember-booking` key.
- Use the exposed `hydrated` flag before redirecting.
- `clearBooking()` resets state and removes localStorage data on confirmation.

---

## Core Business Rules

Central business rules live in `lib/`.

Important constants:

- Coach capacity: **53 seats**
- Boarding time: **15 minutes per stop**
- Base rate: **£300 × coach count**
- Driving rate: **£60/hour**
- Waiting rate: **£20/hour × coach count**

Pricing formula:

```text
coachCount  = ceil(groupSize / 53)
baseRate    = £300 × coachCount
drivingCost = (totalDriveMinutes / 60) × £60
waitingCost = (totalWaitMinutes / 60) × £20 × coachCount
total       = baseRate + drivingCost + waitingCost
```

For multi-coach groups:

- Each coach is routed separately.
- Per-coach route times are added together.
- Passenger counts per pickup determine coach allocation.

---

## Route Segment API

Route calculations must go through:

```text
POST /api/route-segments
```

Request:

```json
{
  "stops": ["EH1 1YZ", "EH10 4BF", "Murrayfield Stadium"]
}
```

Response:

```json
{
  "segments": [
    {
      "from": "EH1 1YZ",
      "to": "EH10 4BF",
      "driveMinutes": 9,
      "distanceMetres": 3200
    },
    {
      "from": "EH10 4BF",
      "to": "Murrayfield Stadium",
      "driveMinutes": 12,
      "distanceMetres": 4100
    }
  ]
}
```

Rules:

- Geocoding and Distance Matrix calls are server-side only.
- Return `422` if any stop cannot be geocoded.
- Do not silently fall back to fake route data.
- Required Google APIs:
  - Geocoding API
  - Distance Matrix API

---

## Pickup Timeline Logic

Pickup times are back-calculated from the requested arrival time.

The arrival time means passengers are dropped off and ready to enter.

Algorithm:

```text
cursor = arrivalTime

cursor -= BOARDING_MINUTES        # destination drop-off before ready-by time

for each pickup from last to first:
  cursor -= segment.driveMinutes
  cursor -= BOARDING_MINUTES
  departTime = formatTime(cursor)
```

Return pickup results in forward order, first pickup first.

Relevant module:

```text
lib/pickup-times.ts
```

---

## Booking Windows

Outbound:

- Arrival time must be no earlier than the longest outbound coach plan can complete from a same-day `00:00` start.
- Enforced by `lib/outbound-window.ts` and `lib/quote-engine.ts`.

Return:

- Return departure must be at or after outbound completion.
- Return route must finish by midnight.
- UI bounds and quote-engine rules must match.
- Enforced by `lib/return-window.ts` and `lib/quote-engine.ts`.

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | `.env.local`, Vercel dashboard | Server-side Geocoding API and Distance Matrix API |
| `GEMINI_API_KEY` | `.env.local` | Reserved for future AI assistant feature |

Never expose either key in client components.

---

## Styling and Brand

Use the existing design tokens in:

```text
app/globals.css
```

Brand values:

- Background: `#ffffff`
- Primary accent: `#4f917a`
- Hover accent: `#238078`
- Primary text: `#252a31`
- Secondary text: `#60646c`
- Muted text: `#8b8d98`
- Font: **Montserrat**, loaded with `next/font/google`

Prefer CSS variables such as:

```css
var(--color-brand-green)
var(--radius-sm)
var(--shadow-card)
```

---

## SSR and Client Rules

- Any code using `window` or `localStorage` must run inside `useEffect` or be guarded with `typeof window !== 'undefined'`.
- Do not read localStorage directly in wizard components unless there is a strong reason.
- Prefer `BookingContext`.
- Route guards must wait for `hydrated`.
- Components using hooks need `"use client"`.
- `app/api/` routes must never import client-only modules.
- Shared `lib/` modules should stay server-safe.

---

## Testing Expectations

Before completion:

```bash
npx tsc --noEmit
npm run test -- --run
```

Expected test state:

```text
All tests pass.
Currently: 140 tests green.
```

For UI work, also verify the affected wizard step in the browser.

Do not claim work is complete if type-checking, tests, or relevant browser behavior have not been verified.

---

## When Editing Pricing or Timing

Check all affected areas:

- Quote total
- Coach count
- Multi-coach routing
- Pickup timeline
- Return wait time
- Outbound earliest arrival
- Return latest departure
- UI time picker bounds
- Unit tests

Update or add tests for any changed rule.

---

## When Editing the Wizard

Preserve these behaviors:

- Step order
- Route guards wait for hydration
- State persists across refresh
- Return journeys include return step
- One-way journeys skip return step
- Confirmation clears booking state
- Reference number format stays `EMB-XXXXXXXX`

---

## Repository Etiquette

- Keep business logic in `lib/`, not scattered through page components.
- Keep API secrets server-side.
- Prefer small, focused changes.
- Do not introduce duplicate sources of truth.
- Do not bypass existing validation schemas.
- Do not replace real route calculations with mock data unless explicitly working in a test.
