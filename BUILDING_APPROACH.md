# Building Approach

Ember Coach Hire is a focused demo of a self-serve coach quote flow. I scoped it around single-day journeys only: one-way trips and same-day returns. That keeps the product realistic enough to exercise route pricing, capacity, pickup timing, and return constraints without pretending to solve fleet operations, payment, or live availability.

## Product Scope

The flow asks for the minimum information needed to price a useful enquiry:

```text
/book              Journey type, passengers, travel date
/book/pickups      Pickup locations, plus passenger counts for large multi-pickup groups
/book/dropoff      Destination and required arrival time
/book/return       Same-day return departure, only for return journeys
/book/quote        Price and journey details
/book/contact      Customer details
/book/confirmation Reference number
```

There is no online checkout, real auth, or database. The output is a structured enquiry with an estimated quote and reference number, with payment arranged after Ember confirms the details by phone.

## Core Decisions

- Arrival time means drop-off complete, not coach arrival at the kerb. The app works backwards from that time to calculate pickup timelines.
- Every passenger stop is 15 minutes. Outbound journeys include each pickup plus the final destination drop-off. Return journeys include destination boarding plus each return drop-off.
- Same-day rules are shared business logic, not only UI controls. `lib/outbound-window.ts` prevents arrival times that would require pickup before `00:00`; `lib/return-window.ts` prevents return journeys that would finish after midnight.
- Large groups use coach-minutes. `lib/coach-allocation.ts` splits passengers into 53-seat coach plans, then each coach route is priced separately.
- Google Maps is isolated behind `app/api/route-segments/route.ts`, so the browser never receives `GOOGLE_MAPS_API_KEY`.

## Pricing Logic

The quote engine combines coach count, real route segments, stop time, and waiting time:

```text
PRICE =
  (coachCount * £300)
  + (totalBillableMinutes / 60 * £60)
  + (totalWaitingMinutes / 60 * £20)
```

`lib/quote-engine.ts` orchestrates the calculation. It builds coach plans, requests route segments through a provider, adds stop minutes, validates same-day timing, and returns both the quote and journey details for the UI.

## Timing Logic

For outbound arrival feasibility:

```text
earliest arrival = 00:00 + longest outbound coach plan duration
```

That duration includes pickup boarding, real drive time, and final destination drop-off. The drop-off step uses this to constrain the arrival picker, and the quote engine validates it again.

For same-day returns:

```text
latest return departure = midnight - longest return coach plan duration
```

Return departure must also be at or after outbound drop-off complete, so waiting time is always a same-day gap between arrival complete and return boarding.

## Architecture

- `context/BookingContext.tsx`: wizard state with `useReducer` and `localStorage`
- `lib/business-rules.ts`: rates, capacity, stop time, booking window
- `lib/coach-allocation.ts`: 53-seat coach planning
- `lib/outbound-window.ts`: earliest feasible arrival
- `lib/return-window.ts`: latest feasible return departure
- `lib/pickup-times.ts`: pickup timeline back-calculation
- `lib/quote-engine.ts`: quote orchestration and shared validation
- `lib/schemas.ts`: Zod validation schemas
- `app/api/route-segments/route.ts`: server-side Google Geocoding and Distance Matrix calls

The important business rules live in `lib/` so they can be unit-tested without rendering the wizard.

## Verification

The current implementation is covered by Vitest unit tests for pricing, coach allocation, pickup timing, route windows, schemas, itinerary copy, and reference generation.

```bash
npm run test -- --run
npx tsc --noEmit
npm run build
```

## What I Would Build Next

- persist enquiries and notify the operations team
- add structured API error logging and rate limiting
- add Playwright coverage for the full booking flow
- add an operator review dashboard before payment
- support richer operational notes without expanding beyond single-day trips too early
