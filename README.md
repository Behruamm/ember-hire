# Ember Coach Hire

Self-serve coach hire quote flow for single-day journeys. This is a portfolio/demo project built to show product thinking, route-based pricing, and production-minded frontend architecture.

## What It Does

- One-way or same-day return coach hire quotes
- Passenger count and multi-coach handling
- Multiple pickup points with passenger counts for over-capacity groups
- Server-side Google Maps route calculation
- Exact-minute pricing from real drive times, passenger stop time, and waiting time
- Estimated 25% deposit display
- Contact/enquiry confirmation flow

No online checkout, no real auth, and no database yet. Payment is arranged after Ember confirms the enquiry by phone.

## Current Flow

```text
/book              Journey type + passengers + date
/book/pickups      Pickup locations
/book/dropoff      Destination + arrival time
/book/return       Same-day return details, only for return journeys
/book/quote        Quote from Google route segments
/book/contact      Name, email, phone
/book/confirmation Reference number
```

## Architecture

```text
app/api/route-segments/route.ts  Server-only Google Maps proxy
context/BookingContext.tsx       Wizard state + localStorage persistence
lib/business-rules.ts            Central business constants
lib/quote-engine.ts              Quote orchestration
lib/coach-allocation.ts          Multi-coach pickup plans
lib/pickup-times.ts              Time helpers and pickup timeline logic
lib/schemas.ts                   Zod validation schemas
lib/pricing.ts                   Rates and GBP formatting
```

The browser never sees the Google Maps API key. The quote page calls `/api/route-segments`, then `lib/quote-engine.ts` calculates the final quote from returned route segments.

## Pricing Model

```text
Total =
  base rate per coach
  + exact driving/stop minutes at £60/hr
  + return waiting minutes at £20/hr per coach
```

Business constants live in [lib/business-rules.ts](lib/business-rules.ts):

- Coach capacity: 53
- Base rate: £300 per coach
- Driving/passenger stops: £60/hr
- Waiting: £20/hr
- Passenger stop time: 15 minutes per pickup/drop-off
- Deposit estimate: 25%
- Minimum booking notice: 48 hours

## Production-Readiness Status

Completed:

- Quote calculation extracted into `lib/quote-engine.ts`
- Zod validation schemas in `lib/schemas.ts`
- Silent Google fallback pricing removed
- Business constants centralized
- Production build passes
- Architecture docs updated

Deferred:

- **Playwright E2E tests** — the `playwright.config.ts` is already wired up pointing at `__tests__/e2e/`. When written, tests should cover:
  - Complete one-way booking: journey step → pickups → dropoff → quote (mock `/api/route-segments`) → contact → confirmation with `EMB-` reference
  - Complete return booking: same flow through `/book/return`, set departure time via TimePicker, verify return timeline appears in journey details
  - Step 1 validation: submitting empty form shows 3 `role="alert"` elements (journey type, passengers, date)
  - Pickups validation: empty submit shows `aria-invalid` on Pickup stop 1; `Add another pickup` shows passenger count fields for over-capacity groups; mismatched totals show assignment error
  - Return departure time: TimePicker disables hours past `latestDepartTime`; hint shows "Latest same-day departure: HH:MM"
  - Contact validation: required fields show inline errors before submit
  - Key selectors to use: `getByLabel(/number of passengers/i)`, `getByLabel(/pickup stop 1/i)`, `getByLabel(/drop-off location/i)`, `getByLabel(/arrival time/i)`, `getByLabel(/return departure time/i)`, `getByTestId('quote-hero')`, `getByTestId('route-details')`, `getByRole('button', { name: /^continue$/i })`, `getByRole('button', { name: /^submit$/i })`
  - Note: arrival and departure times are selected via TimePicker (click-based dropdowns), not `fill()`

Future production work:

- Real enquiry persistence
- Rate limiting
- Structured API error codes/logging
- Deployment with restricted Google Maps key

See [dev-plan/PRODUCTION_READINESS_CHECKLIST.md](dev-plan/PRODUCTION_READINESS_CHECKLIST.md) for the detailed learning checklist.

## Run Locally

```bash
npm install
npm run dev
```

Create `ember-hire/.env.local`:

```text
GOOGLE_MAPS_API_KEY=your_key_here
```

Required Google APIs:

- Geocoding API
- Distance Matrix API

## Verification

```bash
npx tsc --noEmit
npm run test -- --run
npm run build
```

Current status:

- TypeScript passes
- 87 unit tests pass
- Production build passes
