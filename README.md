# Ember Coach Hire

Self-serve coach hire quote flow for single-day journeys. This is a portfolio/demo project built to show product thinking, route-based pricing, and production-minded frontend architecture.

[Live demo](https://ember-hire.vercel.app/)

For the product and engineering rationale, see [BUILDING_APPROACH.md](BUILDING_APPROACH.md).

## Why This Project

I built this after reading Ember's role because the self-serve coach hire checkout problem stood out as the kind of ambiguous, product-heavy work I enjoy.

The goal was to explore how a customer could describe a journey, add pickup points, handle passenger counts, receive a route-based estimate, and submit an enquiry without needing a sales call first.

It is not intended to be a complete production system, but it is structured around the areas I would expect to evolve next: persistence, checkout, operational review, rate limiting, and richer route/traffic handling.

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
lib/outbound-window.ts           Earliest same-day arrival window logic
lib/return-window.ts             Same-day return timing window logic
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

The customer-facing arrival time means drop-off complete, so pickup timelines work backwards from the ready-by time and include the final destination stop before that point. Arrival time cannot be earlier than the longest outbound coach plan can complete from a 00:00 same-day start; this is enforced by shared outbound-window logic and guarded again in the quote engine. Return departure must be at or after outbound drop-off complete and early enough for the return route to finish before midnight; this is enforced by shared return-window logic and guarded again in the quote engine.

## Production-Readiness Status

Completed:

- Quote calculation extracted into `lib/quote-engine.ts`
- Zod validation schemas in `lib/schemas.ts`
- Silent Google fallback pricing removed
- Business constants centralized
- Production build passes
- Architecture docs updated

Future production work:

- Real enquiry persistence
- Rate limiting
- Structured API error codes/logging
- Playwright E2E coverage for the full one-way and return booking journeys
- Deployment hardening with restricted Google Maps key settings

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

## Testing

Current:

- Unit tests covering pricing, coach allocation, pickup timeline, itinerary copy, schemas, and booking logic
- TypeScript strict mode
- Production build verification

Next:

- Playwright E2E coverage for the full one-way and return booking journeys

## Verification

```bash
npx tsc --noEmit
npm run test -- --run
npm run build
```
