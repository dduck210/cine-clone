# Phase 05 — Statistics (Endpoints + Dashboard Charts)

## Context Links
- BE/routes/admin.js:144-216 (existing stats endpoints)
- BE/controllers/adminController.js:75-279 (legacy aggregations — most NOT wired to routes)
- FE/src/pages/Admin/Dashboard.jsx:22-65, 95-112 (DashboardView)
- BE/models/Payment.js, BE/models/Booking.js (after phase-01 has concessions + refundedAt)

## Overview
- Priority: P1
- Status: pending (depends on Phase 02)
- Effort: 6h
- Goal: Add 5 analytical endpoints + render 5 chart cards in admin dashboard. Use lightweight no-dependency-charts approach OR add `recharts`.

## Key Insights
- `routes/admin.js:144-216` already exposes `revenue`, `occupancy`, `top-movies`, `bookings` aggregations — extend, do NOT duplicate.
- Existing `Booking.totalPrice` is SEAT + COMBO combined; for "concession revenue separately" we need `Booking.concessionTotal` (added in Phase 1).
- Refund stats need `RefundLog` collection or filter `Booking.status='refunded'` + sum `Payment.refundAmount` (Phase 1 added `refundedAt` on Booking).
- "Hot time slots" requires `Showtime.timeSlot` (Phase 1 added).
- FE Dashboard currently has 3 simple StatCards (Dashboard.jsx:36-65). Will extend to a grid + charts section.
- No charting lib installed (FE/package.json). KISS choice: add `recharts` (lightweight, React 19 compat) OR build inline SVG bar charts. Decision: add `recharts` — ROI is high; bundle small.

## Requirements

### Functional
1. **Revenue by period**: GET `/admin/stats/revenue-period?bucket=day|month|quarter|year&from=&to=` returns time series.
2. **Concession revenue**: GET `/admin/stats/concession?from=&to=` returns total + breakdown by combo name.
3. **Refund stats**: GET `/admin/stats/refunds?from=&to=` returns `{ count, totalAmount, byReason: [{reason, count}] }`.
4. **Film performance**: GET `/admin/stats/film-performance?from=&to=` returns per-film `{ title, totalShowtimes, totalBookings, avgOccupancy }`.
5. **Hot time slots**: GET `/admin/stats/hot-timeslots?from=&to=` returns counts per `timeSlot` + per `dayType`.
6. **Dashboard FE**: render 5 chart cards using above endpoints with date-range filter (default: last 30 days).

### Non-functional
- All endpoints respond <500ms on dev dataset (sample size ~500 bookings).
- All aggregations use `$match` with date filter to prevent full collection scans.

## Architecture

### Endpoint specs (Mongo aggregations)

**revenue-period (bucket=day example)**
```
Payment.aggregate([
  { $match: { status: 'success', paymentDate: { $gte, $lte } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } }, revenue: { $sum: '$amount' }, count: {$sum:1} } },
  { $sort: { _id: 1 } }
])
```
For month: format `%Y-%m`. For quarter: derive via `$year` + `$ceil(divide($month, 3))`. For year: `%Y`.

**concession**
```
Booking.aggregate([
  { $match: { status: 'paid', createdAt: { $gte, $lte } } },
  { $unwind: '$concessions' },
  { $group: { _id: '$concessions.name', total: { $sum: { $multiply: ['$concessions.price', '$concessions.quantity'] } }, qty: { $sum: '$concessions.quantity' } } }
])
```
Also return `grandTotal = sum of all groups`.

**refunds**
```
Booking.aggregate([
  { $match: { status: 'refunded', refundedAt: { $gte, $lte } } },
  { $group: { _id: '$refundReason', count: { $sum: 1 }, total: { $sum: '$totalPrice' } } }
])
```

**film-performance**
```
Booking.aggregate([
  { $match: { status: 'paid', createdAt: { $gte, $lte } } },
  { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'st' } },
  { $unwind: '$st' },
  { $lookup: { from: 'movies', localField: 'st.movie', foreignField: '_id', as: 'm' } },
  { $unwind: '$m' },
  { $group: {
      _id: '$m._id',
      title: { $first: '$m.title' },
      poster: { $first: '$m.poster' },
      totalBookings: { $sum: 1 },
      totalRevenue: { $sum: '$totalPrice' },
      distinctShowtimes: { $addToSet: '$st._id' },
  }},
  { $project: { title:1, poster:1, totalBookings:1, totalRevenue:1, showtimeCount: { $size: '$distinctShowtimes' }, bookingsPerShowtime: { $divide: ['$totalBookings', { $size: '$distinctShowtimes' }] } } },
  { $sort: { totalRevenue: -1 } }
])
```

**hot-timeslots**
```
Booking.aggregate([
  { $match: { status: 'paid', createdAt: { $gte, $lte } } },
  { $lookup: { from: 'showtimes', localField: 'showtime', foreignField: '_id', as: 'st' } },
  { $unwind: '$st' },
  { $group: { _id: { timeSlot: '$st.timeSlot', dayType: '$st.dayType' }, count: { $sum: 1 }, revenue: { $sum: '$totalPrice' } } }
])
```

### FE Dashboard view (extended)
```
DashboardView
├── DateRange filter (default last 30 days)
├── StatCards row (existing 3 + 2 new: Refund total, Concession total)
├── Charts grid (2 cols)
│    ├── RevenueTrendChart (line) — uses revenue-period
│    ├── HotTimeSlotsChart (grouped bar) — uses hot-timeslots
│    ├── FilmPerformanceTable (sortable table) — uses film-performance
│    └── RefundStatsCard (donut + list) — uses refunds
```
Use `recharts` LineChart, BarChart, PieChart.

## Related Code Files

### To modify
- `BE/routes/admin.js` — append 5 new endpoints.
- `FE/src/pages/Admin/Dashboard.jsx` — replace `DashboardView` to consume new endpoints + render charts; add date-range state.
- `FE/package.json` — add `recharts` dep.

### To create
- `FE/src/components/admin/charts/RevenueTrendChart.jsx` (~120 lines)
- `FE/src/components/admin/charts/HotTimeSlotsChart.jsx` (~100 lines)
- `FE/src/components/admin/charts/FilmPerformanceTable.jsx` (~120 lines)
- `FE/src/components/admin/charts/RefundStatsCard.jsx` (~100 lines)
- `FE/src/components/admin/charts/DateRangeFilter.jsx` (~80 lines)
- `FE/src/hooks/useAdminStats.js` (~80 lines) — wraps the 5 fetches into one hook with shared date-range.

### To delete
- (none)

## Implementation Steps

1. **BE — append endpoints in `routes/admin.js`** (after existing stats):
   - `GET /admin/stats/revenue-period`
   - `GET /admin/stats/concession`
   - `GET /admin/stats/refunds`
   - `GET /admin/stats/film-performance`
   - `GET /admin/stats/hot-timeslots`
   - Helpers: `parseDateRange(req.query)` returning `{ from, to }` defaulting to last 30 days.

2. **FE — install recharts**:
   - `cd FE && npm install recharts`.

3. **DateRangeFilter.jsx**:
   - Two date inputs + preset buttons (7d / 30d / 90d / 1y).
   - `value: { from, to }`, `onChange`.

4. **useAdminStats hook**:
   - Accepts `{ from, to, bucket }`.
   - Returns `{ revenue, concession, refunds, films, hotSlots, loading, error }`.
   - Internally `Promise.all` fetches with abort on unmount.

5. **RevenueTrendChart**:
   - Recharts `LineChart` with `XAxis dataKey='_id'`, `YAxis`, two lines: `revenue`, `count`.
   - Bucket selector (day/month/quarter/year) inside the card.

6. **HotTimeSlotsChart**:
   - Recharts `BarChart` grouped by timeSlot, colored by dayType.
   - Tooltip shows `count` and `revenue`.

7. **FilmPerformanceTable**:
   - Plain table (sortable cols: title, totalBookings, totalRevenue, bookingsPerShowtime).
   - Mini poster thumbnail.

8. **RefundStatsCard**:
   - Big number "Tổng đã hoàn" + recharts `PieChart` by reason.

9. **Modify Dashboard.jsx**:
   - Replace `DashboardView` (line 35-65) to:
     - Render `<DateRangeFilter>`.
     - Call `useAdminStats({ from, to, bucket })`.
     - Lay out `StatCard`s for: Revenue, Tickets, Pending, Refund total, Concession total.
     - Below: 2-col grid with 4 chart components.

10. **Smoke test**:
    - Seed dev DB with multi-date paid bookings + a refunded one + concessions.
    - Open dashboard -> verify 4 charts render + numbers consistent.
    - Switch bucket to month -> series collapses to fewer points.

## Todo List
- [ ] Add 5 BE stats endpoints
- [ ] `npm install recharts` (FE)
- [ ] DateRangeFilter.jsx
- [ ] useAdminStats.js
- [ ] RevenueTrendChart.jsx
- [ ] HotTimeSlotsChart.jsx
- [ ] FilmPerformanceTable.jsx
- [ ] RefundStatsCard.jsx
- [ ] Refactor Dashboard.jsx DashboardView
- [ ] Smoke test with seeded data

## Success Criteria
- Visiting `/admin?tab=dashboard` shows 5 stat cards + 4 charts populated from real data.
- Changing date range or bucket triggers refetch within 500ms.
- Each chart legible at 1280×800 screen.
- Empty state: charts show "Chưa có dữ liệu" placeholders cleanly.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|------------|
| recharts bundle bloat | L | L | Tree-shake; only import specific components |
| Aggregations slow on large data | L | M | Indexes on `paymentDate`, `createdAt`, `status` (some already present); add `showtime` index if missing |
| Date timezone bugs | M | M | All dates UTC server-side; FE formats with `toLocaleDateString('vi-VN')` |
| Recharts incompatible with React 19 | L | H | Verify: recharts v2.13+ supports React 19. If not, fall back to inline SVG bars |
| Film-performance `$divide` by zero | L | L | Add `$cond: [{$gt:[size,0]}, divide, 0]` guard |

## Security Considerations
- All `/admin/stats/*` endpoints require admin middleware.
- Date inputs validated (Date.parse) before $match to prevent NoSQL injection via crafted strings.

## Next Steps
- After this phase: full feature set lands -> manual QA pass against teacher's checklist.
- Optional follow-up: export charts to PDF for thesis appendix (out of scope).
