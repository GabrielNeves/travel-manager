# Phase 2: Core Features — Implementation Plan

## Overview

Phase 2 delivers the core value of Travel Manager: users create flight price alerts, the system checks prices via Amadeus API on a schedule, stores price history, and sends in-app notifications when prices drop below thresholds.

**Implementation approach:** 7 sequential steps, each self-contained with a passing `pnpm build`. The user will approve and implement each step one at a time.

---

## Architectural Decisions

1. **Enum casing:** Use Prisma UPPER_CASE enums (`ONE_WAY`, `MORNING`, etc.) consistently across frontend and backend. The `packages/shared` kebab-case types are unused and will remain untouched.
2. **Date handling:** Frontend sends ISO date strings (`YYYY-MM-DD`). Backend parses to `Date` objects. Amadeus API also uses `YYYY-MM-DD`.
3. **Decimal conversion:** Prisma `Decimal` fields are converted to `number` via `.toNumber()` in service functions before sending as JSON.
4. **Airport codes:** Made required in the create-alert Zod schema (even though Prisma schema has them optional) because Amadeus API requires IATA codes. The airport combobox guides users to select from autocomplete.
5. **Booking links:** Amadeus does not return direct booking URLs. Store `null` for now; can construct Google Flights deep links later.

---

## Step 1: Flight Alerts Backend (CRUD API) ✅

**Delivers:** All 7 alert CRUD endpoints functional, testable with curl.

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/alerts/alerts.schemas.ts` | Zod schemas: `createAlertSchema`, `updateAlertSchema`, `listAlertsQuerySchema` |
| `apps/api/src/modules/alerts/alerts.service.ts` | Prisma CRUD: create, list (with lowestPrice aggregation), get, update, delete (soft), pause, resume |
| `apps/api/src/modules/alerts/alerts.routes.ts` | 7 route handlers with authGuard + safeParse |
| `apps/api/src/modules/alerts/alerts.plugin.ts` | Plugin registration at `/api/alerts` |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Register `alertsPlugin` |

### API Endpoints

```
GET    /api/alerts              — List alerts (query: ?status=ACTIVE|PAUSED)
POST   /api/alerts              — Create alert
GET    /api/alerts/:id          — Get alert detail
PUT    /api/alerts/:id          — Update alert
DELETE /api/alerts/:id          — Soft delete (status → DELETED)
POST   /api/alerts/:id/pause    — Pause alert (clears nextCheckAt)
POST   /api/alerts/:id/resume   — Resume alert (sets nextCheckAt = now)
```

### Key Service Logic

- `createAlert`: Sets `nextCheckAt = new Date()` so the scheduler picks it up immediately
- `listAlerts`: Includes computed `lowestPrice` (MIN from price_records) and `priceRecordCount`
- All mutating operations include ownership check (alert.userId === request.user.sub)
- `deleteAlert`: Soft delete via `status = 'DELETED'`, not actual row deletion
- `updateAlert`: If `checkFrequency` changes, recalculates `nextCheckAt`

### Create Alert Schema (key validations)

```
departureCity:          string, required
departureAirportCode:   string, 3 chars, uppercase, required (for Amadeus)
destinationCity:        string, required
destinationAirportCode: string, 3 chars, uppercase, required (for Amadeus)
tripType:               enum ONE_WAY | ROUND_TRIP
departureDate:          string (YYYY-MM-DD), required
departureDateEnd:       string (YYYY-MM-DD), optional (flexible dates)
departureDayShift:      array of MORNING|AFTERNOON|NIGHT, min 1
returnDate:             required if ROUND_TRIP
returnDateEnd:          optional
returnDayShift:         array, default []
priceThreshold:         positive number, max 99999999
airlines:               string array, default []
maxFlightDuration:      positive integer (minutes), optional
checkFrequency:         enum, default HOURS_6
```

Refinement: if `tripType === 'ROUND_TRIP'`, `returnDate` is required.

---

## Step 2: Amadeus API Integration (Service Layer) ✅

**Delivers:** Reusable Amadeus client with OAuth2 token caching, flight search, airport autocomplete endpoint.

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/services/amadeus/amadeus.client.ts` | HTTP client with OAuth2 token management (cached in memory, 60s safety buffer) |
| `apps/api/src/services/amadeus/amadeus.types.ts` | TypeScript types for Amadeus API responses |
| `apps/api/src/services/amadeus/amadeus.service.ts` | High-level: `searchFlights(params)`, `searchAirports(keyword)` |
| `apps/api/src/services/amadeus/index.ts` | Re-exports |
| `apps/api/src/modules/airports/airports.routes.ts` | `GET /api/airports/search?q=...` (authGuard) |
| `apps/api/src/modules/airports/airports.plugin.ts` | Plugin at `/api/airports` |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/lib/env.ts` | Add `AMADEUS_API_KEY`, `AMADEUS_API_SECRET` (default `''`) |
| `apps/api/src/index.ts` | Register `airportsPlugin` |
| `.env.example` | Add Amadeus env var entries |

### Amadeus Client Design

- OAuth2 token cached in memory (tokens last ~30 min, refreshed with 60s buffer)
- Single retry on 401 (token invalidated server-side)
- ISO 8601 duration parser (`PT2H30M` → 150 minutes)
- `searchFlights` returns normalized results: `{ price, currency, airline, flightNumber, departureTime, arrivalTime, duration, stops }`
- `searchAirports` returns: `{ name, iataCode, cityName, countryCode }`
- No SDK needed — uses native `fetch`

---

## Step 3: Alerts Frontend (List + Create + Detail) ✅

**Delivers:** Full alert management UI — list, create form, detail page with pause/resume/delete.

### New Dependencies

```bash
pnpm --filter @travel-manager/web add date-fns
```

### New shadcn/ui Components

```bash
cd apps/web && pnpm dlx shadcn@latest add badge table calendar popover checkbox command -y
```

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-alerts.ts` | Query hooks: `useAlerts`, `useAlert`, `useCreateAlert`, `useUpdateAlert`, `useDeleteAlert`, `usePauseAlert`, `useResumeAlert` |
| `apps/web/src/hooks/use-airports.ts` | Debounced airport search hook (300ms, enabled when query >= 2 chars) |
| `apps/web/src/pages/alerts/index.tsx` | Alert list page (replaces skeleton) |
| `apps/web/src/pages/alerts/create.tsx` | Alert creation page *(deleted in Step 3.5)* |
| `apps/web/src/pages/alerts/detail.tsx` | Alert detail page *(deleted in Step 3.5)* |
| `apps/web/src/components/alerts/alert-form.tsx` | Reusable form (create + edit) |
| `apps/web/src/components/alerts/airport-combobox.tsx` | Airport search combobox |
| `apps/web/src/components/alerts/date-picker.tsx` | Date picker using calendar + popover |
| `apps/web/src/components/alerts/day-shift-select.tsx` | Checkbox group: Morning / Afternoon / Night |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/src/routes.tsx` | Add `/alerts/new` and `/alerts/:id` routes *(simplified in Step 3.5)* |
| `apps/web/src/pages/alerts.tsx` | Delete (replaced by `alerts/index.tsx` directory) |

### Alert Form UX (single-page, 3 card sections)

**Card 1 — Route:** Departure city/airport combobox, Destination city/airport combobox, Trip type select

**Card 2 — Dates:** Departure date picker, optional "Flexible dates?" toggle with end date, Day shift checkboxes (Morning/Afternoon/Night). Return fields shown only for round-trip.

**Card 3 — Filters:** Price threshold (R$ prefix input), Airlines (text input, comma-separated or empty for "Any"), Max flight duration (minutes input, optional), Check frequency (select dropdown)

Submit button at bottom. Zod safeParse validation with field-level errors. Success toast + navigate to `/alerts`.

### Alert List Page

- Header with title + "New Alert" button
- Status filter: All / Active / Paused
- Card-based list showing: route, trip type badge, dates, threshold (BRL), status badge, lowest price found, last checked time
- Click navigates to detail page
- Empty state for no alerts

### Alert Detail Page

- Full alert info display
- Actions: Pause/Resume button, Delete (with confirmation dialog)
- Price history section: placeholder text until Step 5

---

## Step 3.5: Alerts UI Improvements ✅

**Delivers:** Split-panel master-detail layout, Sheet overlays for create/edit, airport search fix, and UX polish.

### Changes Implemented

| # | Change | Description |
|---|--------|-------------|
| 1 | Active filter as default | `useState('ACTIVE')` instead of `useState('')` |
| 2 | Split-panel layout | 1/3 list + 2/3 detail on a single `/alerts` page |
| 3 | New alert in Sheet | Sheet overlay instead of separate `/alerts/new` page |
| 4 | Edit alert (two-tier warning) | Edit via Sheet with yellow warning when changing route/dates |
| 5 | Remove create button from empty state | Differentiated messages: "No alerts yet" vs "No active alerts" |
| 6 | Fix airport combobox | Rewrote without Popover/Command due to Sheet focus trap conflict |
| 7 | Time preferences | Morning 5:00-12:00, Night 18:00-5:00 |

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/alerts/alert-list-item.tsx` | Compact clickable list item for left panel |
| `apps/web/src/components/alerts/alert-detail-panel.tsx` | Detail view with 4 info cards, actions (edit/pause/resume/delete) |

### Deleted Files

| File | Reason |
|------|--------|
| `apps/web/src/pages/alerts/create.tsx` | Replaced by Sheet overlay in `index.tsx` |
| `apps/web/src/pages/alerts/detail.tsx` | Replaced by `alert-detail-panel.tsx` component |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/src/pages/alerts/index.tsx` | Rewritten: split-panel layout, Sheet overlays for create/edit |
| `apps/web/src/components/alerts/alert-form.tsx` | Accepts `mode` (create/edit), `initialData`, callback props; two-tier warning via `useMemo`; fixed `parseDateString` for ISO datetime strings |
| `apps/web/src/components/alerts/airport-combobox.tsx` | Completely rewritten: inline dropdown (no Popover/Portal) with callback ref for instant focus |
| `apps/web/src/components/alerts/day-shift-select.tsx` | Updated time ranges: Morning 5:00-12:00, Night 18:00-5:00 |
| `apps/web/src/hooks/use-alerts.ts` | Added `UpdateAlertInput` interface and `useUpdateAlert` hook |
| `apps/web/src/routes.tsx` | Removed `/alerts/new` route, replaced `/alerts/:id` with `<Navigate to="/alerts" replace />` |

### New shadcn Components Installed

```bash
cd apps/web && pnpm dlx shadcn@latest add scroll-area alert sheet --overwrite
```

### Key Design Decisions

**Airport combobox rewrite:** The original implementation used shadcn `Command` inside `Popover`. Since the combobox lives inside a `Sheet` (Radix Dialog with focus trap), the `Popover` renders via `Portal` outside the Dialog DOM, and the Dialog's focus trap prevents focus from reaching the Popover content. The fix avoids Popover/Portal entirely — uses a `Button`/`<input>` swap with an absolutely-positioned dropdown `<div>`. A `useCallback` ref auto-focuses the input the moment React mounts it (single click to start typing).

**Edit form two-tier system:**
- *Always editable (no warning):* priceThreshold, checkFrequency, airlines, maxFlightDuration, departureDayShift, returnDayShift, departureDateEnd, returnDateEnd
- *Editable with warning:* departureCity/Code, destinationCity/Code, tripType, departureDate, returnDate
- Warning: yellow `Alert` banner — "Changing the route, trip type, or travel dates means existing price history may no longer be relevant."

**Date parsing fix:** API returns full ISO datetime strings (`"2025-07-15T00:00:00.000Z"`). The `parseDateString` function extracts the date part via `dateStr.split('T')[0]` before constructing a local `Date` object.

---

## Step 4: Price Check Scheduler (BullMQ) ✅

**Delivers:** Automated background price checking. Alerts are checked on their configured schedule. Price records stored in database.

### New Dependencies

```bash
pnpm --filter @travel-manager/api add bullmq ioredis
```

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/lib/redis.ts` | IORedis connection (`REDIS_URL`, `maxRetriesPerRequest: null`) |
| `apps/api/src/jobs/queue.ts` | Queue definitions and constants |
| `apps/api/src/jobs/price-check.job.ts` | Job processor: fetch alert → call Amadeus → filter results → store PriceRecords → update nextCheckAt |
| `apps/api/src/jobs/scheduler.ts` | Repeatable job (every 60s): scan alerts where `nextCheckAt <= now AND status = ACTIVE`, enqueue price-check jobs |
| `apps/api/src/jobs/index.ts` | `startJobSystem()` / `stopJobSystem()` lifecycle functions |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Call `startJobSystem()` after server listen, `stopJobSystem()` in shutdown handler |

### Queue Architecture

- **`alert-scheduler` queue** — Single repeatable job every 60 seconds. Queries alerts due for checking (uses `[nextCheckAt, status]` index). Enqueues individual jobs with `jobId = alertId` for deduplication.
- **`price-check` queue** — Individual jobs per alert. Concurrency: 3 (natural Amadeus rate throttle).

### Price Check Job Flow

1. Fetch alert from DB (skip if deleted/paused since enqueue)
2. Build Amadeus search params from alert fields
3. Call `amadeusService.searchFlights()`
4. Filter results by day shift, airlines, max duration
5. Store matching results as PriceRecords via `createMany()`
6. Update alert: `lastCheckedAt = now`, `nextCheckAt = now + frequency`
7. If lowest price < threshold → trigger notification (wired in Step 6)

### Rate Limiting

- Amadeus free tier: 2,000 calls/month (~67/day)
- Concurrency 3 + 60s scheduler interval keeps usage well within limits
- 10 alerts at HOURS_6 = ~40 calls/day

### Monthly API Call Counter (Cost Control)

Amadeus does not offer built-in spending caps. To prevent unexpected billing in production, the scheduler implements a **client-side monthly call counter** stored in Redis.

- **Redis key:** `amadeus:calls:{YYYY-MM}` with TTL of 35 days (auto-cleanup)
- **Configurable limit:** `AMADEUS_MONTHLY_CALL_LIMIT` env var (default: `2000`)
- **Enforcement:** Before each Amadeus API call, the counter is checked via `INCR`. If the count exceeds the limit, the job is skipped and the alert's `nextCheckAt` is pushed forward (not lost, just delayed)
- **Logging:** Warning logged when 80% threshold is reached; error logged when limit is hit
- **Visibility:** The scheduler exposes the current count so it can be surfaced in a future admin/settings UI

### New Env Var

| Var | Default | Description |
|-----|---------|-------------|
| `AMADEUS_MONTHLY_CALL_LIMIT` | `2000` | Maximum Amadeus API calls per calendar month. Set to `0` to disable the limit. |

### New File

| File | Purpose |
|------|---------|
| `apps/api/src/services/amadeus/amadeus.rate-limiter.ts` | `incrementAndCheck()`: atomic Redis INCR + limit check. `getCurrentUsage()`: read current month's count. |

### Modified Files (additional)

| File | Change |
|------|--------|
| `apps/api/src/lib/env.ts` | Add `AMADEUS_MONTHLY_CALL_LIMIT` (default `'2000'`) |

### Retry: 3 attempts with exponential backoff (1min, 5min, 15min)

---

## Step 5: Price History API + Frontend ✅

**Delivers:** Price history table with sort toggle on alert detail page. Enriched alert response with lowest price airline details.

### Improvements Over Original Plan

1. **Dropped `GET /:id/current` endpoint** — The alert response already includes `lowestPrice`. Instead, enriched `ALERT_INCLUDE` in `alerts.service.ts` to fetch the lowest record's airline, flight number, and departure time. Avoids an extra API call.
2. **Dropped `lowest-price-card.tsx`** — The existing "Price Monitoring" card already shows lowest price. Enhanced it to display airline/flight info when available.
3. **Added sort toggle** — Price history table defaults to newest-first (`checkedAt desc`) but toggles to cheapest-first (`price asc`). Uses existing `@@index([alertId, price])` index.

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/alerts/prices.schemas.ts` | Zod schema: `priceHistoryQuerySchema` (limit, offset, sort) |
| `apps/api/src/modules/alerts/prices.service.ts` | `getPriceHistory(userId, alertId, query)` with ownership check, pagination, Decimal→Number |
| `apps/api/src/modules/alerts/prices.routes.ts` | `GET /:id/prices` with authGuard + safeParse |
| `apps/web/src/hooks/use-prices.ts` | `usePriceHistory(alertId, sort, limit, offset)` TanStack Query hook |
| `apps/web/src/components/alerts/price-history-table.tsx` | Table with 7 columns, sort toggle (Newest/Cheapest), green price highlight, empty state |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/modules/alerts/alerts.service.ts` | `ALERT_INCLUDE` fetches airline, flightNumber, departureTime from lowest price record; `serializeAlert` exposes `lowestPriceAirline`, `lowestPriceFlightNumber`, `lowestPriceDepartureTime` |
| `apps/api/src/modules/alerts/alerts.plugin.ts` | Register `pricesRoutes` under same `/api/alerts` prefix |
| `apps/web/src/hooks/use-alerts.ts` | Added `lowestPriceAirline`, `lowestPriceFlightNumber`, `lowestPriceDepartureTime` to `FlightAlertResponse` |
| `apps/web/src/components/alerts/alert-detail-panel.tsx` | Replaced placeholder card with `<PriceHistoryTable>`; enhanced lowest price display with airline/flight info |

### API Endpoint

```
GET /api/alerts/:id/prices   — Price history (query: ?limit=50&offset=0&sort=recent|cheapest)
```

Includes ownership check (alert belongs to user). Returns `{ records: [...], total: number }`.

### Price History Table Columns

| Column | Format |
|--------|--------|
| Price | `formatCurrency()` — green text if ≤ threshold |
| Airline | Raw string |
| Flight | Flight number or "—" |
| Departure | `MMM d, HH:mm` (date-fns) |
| Duration | e.g. "2h 30m" |
| Stops | "Direct" / "1 stop" / "N stops" |
| Checked | Relative time (`formatDistanceToNow`) |

---

## Step 5.5: Price History Line Chart ✅

**Delivers:** Replaces the raw price history table with a line chart showing the lowest price found per day. Users can see at a glance whether the current price is historically good.

### User Decisions

- Chart only (no table) — the table was too noisy with individual records
- Interpolate missing days — smooth connected line (`type="monotone"`)
- Show price threshold as a dashed horizontal reference line

### New Dependencies

```bash
pnpm --filter @travel-manager/web add recharts
```

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/components/alerts/price-history-chart.tsx` | Recharts `ComposedChart` with `Line`, `Area`, `ReferenceLine` — theme-aware via CSS custom properties |

### Deleted Files

| File | Reason |
|------|--------|
| `apps/web/src/components/alerts/price-history-table.tsx` | Replaced entirely by the chart |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/modules/alerts/prices.service.ts` | Added `getDailyLowestPrices()` — raw SQL (`GROUP BY DATE("checkedAt")`) aggregation. Refactored ownership check into shared `checkAlertOwnership()` helper |
| `apps/api/src/modules/alerts/prices.routes.ts` | Added `GET /:id/prices/daily` route |
| `apps/web/src/hooks/use-prices.ts` | Added `useDailyPrices(alertId)` hook + `DailyPricePoint` interface |
| `apps/web/src/components/alerts/alert-detail-panel.tsx` | Swapped `PriceHistoryTable` → `PriceHistoryChart` |

### New API Endpoint

```
GET /api/alerts/:id/prices/daily — Daily lowest prices for chart
  Response: { points: [{ date: "2026-02-01", lowestPrice: 590.76 }, ...] }
```

No query params. One data point per day the alert has been checked. Ownership check + authGuard.

### Chart Design

- **`ComposedChart`** (not `LineChart`) to support both `Line` and `Area` components
- **`Line`**: `type="monotone"` for smooth interpolation, `connectNulls` for gaps, dots on data points
- **`Area`**: fill below line with 0.08 opacity for visual weight
- **`ReferenceLine`**: dashed horizontal line at the price threshold with label
- **XAxis**: date formatted as "Feb 1", "Feb 2" via date-fns
- **YAxis**: abbreviated BRL prices (`R$ 590`, `R$ 1.2k`)
- **Tooltip**: full `formatCurrency()` value, themed with CSS custom properties (`--popover`, `--border`)
- **Colors**: `hsl(var(--primary))` for the line, `hsl(var(--destructive))` for the threshold
- Loading state: `Skeleton` placeholder
- Empty state: "No price data yet" message

### Bug Fix — Raw SQL Column Names

The initial implementation used snake_case column names in the raw SQL (`checked_at`, `alert_id`), but the Prisma schema only has `@@map` on models (e.g., `@@map("price_records")`), not `@map` on individual fields. The actual PostgreSQL column names are camelCase (`"checkedAt"`, `"alertId"`). PostgreSQL lowercases unquoted identifiers, so `checked_at` silently matched nothing. Fixed by quoting: `"checkedAt"`, `"alertId"`.

---

## Step 6: In-App Notifications Backend

**Delivers:** Price drops create IN_APP notifications. Notification REST API works. Rate limiting: max 1 notification per alert per 24 hours.

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/modules/notifications/notifications.schemas.ts` | Zod schemas for list query params |
| `apps/api/src/modules/notifications/notifications.service.ts` | List, mark as read, get unread count |
| `apps/api/src/modules/notifications/notifications.routes.ts` | Route handlers |
| `apps/api/src/modules/notifications/notifications.plugin.ts` | Plugin at `/api/notifications` |
| `apps/api/src/services/notification/notification.service.ts` | Cross-cutting: `createPriceDropNotification()` — checks rate limit, checks user settings, creates notification |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/src/index.ts` | Register `notificationsPlugin` |
| `apps/api/src/jobs/price-check.job.ts` | Call `createPriceDropNotification()` when price < threshold |

### API Endpoints

```
GET  /api/notifications               — List (query: ?unread=true&limit=20&offset=0)
POST /api/notifications/:id/read      — Mark as read
GET  /api/notifications/unread-count   — Badge count (single number)
```

### Notification Creation Logic

1. Rate limit check: skip if notification sent for this alert in last 24 hours
2. User settings check: skip if `notifyInApp` is disabled
3. Create notification with: title ("Price Alert: City A -> City B"), message (price, threshold, savings), data JSON (price, airline, bookingLink)

---

## Step 7: Notifications Frontend + Sidebar Badge

**Delivers:** Full notifications page + unread count badge in sidebar nav.

### New Files

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-notifications.ts` | `useNotifications()`, `useMarkAsRead()`, `useUnreadCount()` (polls every 30s) |
| `apps/web/src/components/notifications/notification-item.tsx` | Individual notification card |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/src/pages/notifications.tsx` | Full rewrite from skeleton |
| `apps/web/src/components/layout/nav-main.tsx` | Add unread count badge next to "Notifications" nav item |

### Notifications Page

- Filter toggle: All / Unread
- List of notification items: title, message, relative timestamp, unread dot indicator
- Click marks as read + navigates to `/alerts/:alertId`
- Empty state message

### Sidebar Badge

- `useUnreadCount()` polls every 30 seconds
- Red badge with count shown next to "Notifications" in nav

---

## Step Dependency Diagram

```
Step 1 (Alerts Backend) ✅
  └─> Step 2 (Amadeus Integration) ✅
        ├─> Step 3 (Alerts Frontend) ✅
        │     └─> Step 3.5 (UI Improvements) ✅
        └─> Step 4 (Price Check Scheduler) ✅
              ├─> Step 5 (Price History) ✅
              │     └─> Step 5.5 (Price History Chart) ✅
              └─> Step 6 (Notifications Backend)
                    └─> Step 7 (Notifications Frontend)
```

## Summary

| Step | Name | Status | New Deps | Key Deliverable |
|------|------|--------|----------|-----------------|
| 1 | Alerts Backend | ✅ | — | CRUD API (7 endpoints) |
| 2 | Amadeus Integration | ✅ | — | Flight search + airport autocomplete |
| 3 | Alerts Frontend | ✅ | `date-fns` + shadcn | Full alert management UI |
| 3.5 | UI Improvements | ✅ | `scroll-area`, `alert`, `sheet` | Split-panel, Sheet overlays, edit, combobox fix |
| 4 | Price Scheduler | ✅ | `bullmq`, `ioredis` | Automated price checking |
| 5 | Price History | ✅ | — | Price history table + enriched alert response |
| 5.5 | Price History Chart | ✅ | `recharts` | Line chart replacing table, daily aggregation endpoint |
| 6 | Notifications Backend | pending | — | IN_APP notifications |
| 7 | Notifications Frontend | pending | — | Notification center + badge |

## Verification (end-to-end after all steps)

1. `pnpm build` passes with zero errors
2. Create alert via UI → appears in list with "Active" status
3. Airport autocomplete returns results from Amadeus
4. Scheduler picks up alert → PriceRecords appear in DB
5. Alert detail page shows price trend chart (daily lowest prices) and lowest price
6. Price below threshold → notification created in DB
7. Notifications page shows the alert with unread indicator
8. Sidebar badge shows unread count
9. Mark notification as read → badge decrements
10. Pause alert → scheduler stops checking it; resume → resumes
11. Delete alert → soft-deleted, disappears from list
12. All endpoints return 401 without valid Bearer token
