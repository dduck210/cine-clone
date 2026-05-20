# Phase 02 — Backend Logic (Routes, Cron, Validation)

## Context Links
- BE/routes/bookings.js:1-105
- BE/routes/showtimes.js:1-141
- BE/routes/payments.js:1-80
- BE/routes/admin.js:1-218
- BE/routes/momo.js:137-156 (processSuccessfulPayment)
- BE/app.js:1-50
- Phase-01 schema additions

## Overview
- Priority: P1
- Status: pending (depends on Phase 01)
- Effort: 8h
- Goal: Implement seat-hold timer + cron, gap validation, dynamic pricing engine, showtime overlap, batch create, emergency cancel + auto-refund, price config CRUD.

## Key Insights
- Existing seat-creation in `routes/showtimes.js:80-94` uses a uniform `room.rows x room.cols` loop with one `price`. Must rewrite to consult `seatMatrix` + `PriceConfig`.
- Booking creation in `routes/bookings.js:9-51` lacks: gap check, expiry stamp, seat lifetime guarantee. Existing `extraAmount` param is already there — repurpose for concessions.
- Existing cancel logic at `routes/payments.js:52-78` releases seats — reuse for refund path.
- No process-level cron exists; need to add via `setInterval` in `app.js` (no external lib required — KISS).

## Requirements

### Functional
1. **Booking expiry timer**: when booking created with status `pending`, set `expiresAt = now + 5min`. Cron tick every 60 s flips expired pendings to `expired`, releases seats.
2. **No-gap validation** (server-side): for each row in selectedSeats, fetch row's existing seat statuses; ensure the selection doesn't leave a single-seat island.
3. **Dynamic pricing engine**: `computeSeatPrice(basePrice, seatType, timeSlot, dayType)` consults PriceConfig.
4. **Showtime overlap check**: when creating/updating, query existing showtimes in same room on same date; reject if `[startTime, endTime]` intersects.
5. **Batch showtime create**: accept array of `(date, startTime)` tuples — atomically create or roll back if any overlap detected.
6. **Emergency cancel showtime**: admin endpoint flips showtime to `cancelled`, marks all paid bookings as `refunded`, releases all seats, creates RefundLog rows.
7. **Movie duration update warning**: when admin updates movie.duration, return list of affected (future) showtimes — admin confirms before save.
8. **PriceConfig CRUD**: GET list, PUT/POST upsert.

### Non-functional
- Cron must be idempotent (re-runs safe).
- Gap check O(row_width) per row — acceptable.
- Batch create wraps in mongoose session (transactions need replica set; for thesis dev — use try/catch + manual cleanup).

## Architecture

### Cron expiry (in `BE/app.js`)
```
setInterval -> Booking.find({ status: 'pending', expiresAt: { $lte: new Date() } })
              -> for each: status='expired', Seat.updateMany({ _id: $in seats }, { status: 'available' })
              -> tick every 60s
```

### Dynamic price helper (`BE/utils/pricing.js`)
```
deriveTimeSlot(startTime) -> 'morning'|'evening'|'late'
deriveDayType(date)       -> 'regular'|'weekend'|'holiday' (uses utils/holidays.js)
computeSeatPrice(basePrice, seatType, timeSlot, dayType):
  // fetch up to 3 multipliers from PriceConfig (cached), default 1
  // return basePrice * mulSeat * mulTime * mulDay
```
Cache: in-memory `Map<seatType|*timeSlot|*dayType, mul>` invalidated on PriceConfig write.

### No-gap validation (`BE/utils/seat-gap.js`)
```
validateNoGap(showtimeId, selectedSeatNumbers):
  // Group by row
  // For each row:
  //   fetch all seats in row with status in ['booked','reserved']
  //   merge with selected (numeric col indices)
  //   sort cols ascending
  //   gaps = pairs with diff == 2 (i.e. one column between two occupied)
  //   also detect island: a single seat with both neighbors free is OK; flag only if neighbors are occupied AND selection misses a column
  // Return { ok, gaps: [{ row, col }] }
```
Rule simplification for thesis: forbid a SELECTION that leaves a single-column gap between any two occupied (existing+selected) seats in same row. Aisle columns from seatMatrix are excluded.

### Overlap check (`BE/utils/showtime-overlap.js`)
```
overlapsExisting(roomId, date, startTime, endTime, excludeId=null):
  // dayStart = start-of-day(date), dayEnd = start+1day
  // find showtimes where room=roomId, date in [dayStart,dayEnd), status=active, _id != excludeId
  // for each: if intersect([startTime, endTime], [s.startTime, s.endTime]) return true
```
`intersect` operates on HH:mm strings -> minutes.

### Routes added/modified

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/bookings | user | (modified) gap check + expiresAt |
| GET | /api/bookings/:id/remaining | user | (new) returns seconds until expire |
| POST | /api/showtimes | admin | (modified) overlap check + seatMatrix-aware seat gen |
| PUT | /api/showtimes/:id | admin | (modified) overlap check excluding self |
| POST | /api/showtimes/batch | admin | (new) bulk create |
| POST | /api/showtimes/:id/emergency-cancel | admin | (new) cancel + refund all paid |
| GET | /api/movies/:id/showtime-impact | admin | (new) preview impacted showtimes when duration changes |
| PUT | /api/movies/:id | admin | (modified) accept `?confirmImpact=1` flag |
| GET, POST, PUT, DELETE | /api/admin/price-configs | admin | (new) CRUD |
| PUT | /api/admin/rooms/:id/seat-matrix | admin | (new) update matrix |

## Related Code Files

### To modify
- `BE/app.js` — add cron setInterval after `connectDB()` call.
- `BE/routes/bookings.js` — add gap check, expiresAt, concessions in POST `/`; add GET `/:id/remaining`.
- `BE/routes/showtimes.js` — overlap check, seatMatrix-aware seat gen using dynamic pricing.
- `BE/routes/admin.js` — add price-config CRUD, room seat-matrix update, batch + emergency-cancel endpoints (or split into new file — see below).
- `BE/routes/movies.js` — extend PUT to require confirmImpact flag when duration changes.
- `BE/routes/payments.js` — refund endpoint logs RefundLog, sets status='refunded' (was 'cancelled').
- `BE/controllers/bookingController.js` — DEPRECATE (not imported in routes; verify and either delete or align with new logic).
- `BE/controllers/showtimeController.js` — same, align or DEPRECATE.

### To create
- `BE/utils/pricing.js`
- `BE/utils/seat-gap.js`
- `BE/utils/showtime-overlap.js`
- `BE/cron/booking-expire.js` — exports `startBookingExpireCron()`.
- `BE/routes/price-configs.js` (or fold into admin.js — fold to keep KISS).
- `BE/routes/showtimes-batch.js` (or fold into showtimes.js — fold).

### To delete
- (none; deprecate but keep unused controllers for now to avoid scope creep)

## Implementation Steps

1. **Cron**
   - Create `BE/cron/booking-expire.js` exporting `startBookingExpireCron()`.
   - Inside: `setInterval(async () => { ... }, 60_000)` with try/catch.
   - In `BE/app.js`: after `connectDB()`, call `require('./cron/booking-expire').startBookingExpireCron();`.

2. **Pricing helper**
   - Create `BE/utils/pricing.js` with `deriveTimeSlot`, `deriveDayType`, `computeSeatPrice`, `invalidateCache`.
   - PriceConfig query: `findOne({ seatType, timeSlot, dayType })` for the most-specific; fall back to wildcard `'*'`-not-supported approach: store one row per combination (3x3x3 = 27 rows). Simpler. Migration in Phase 01 seeds defaults; missing rows mean multiplier=1.

3. **Showtime seat generation** (`POST /showtimes` in `routes/showtimes.js`):
   - Fetch room; if `room.seatMatrix` exists -> loop matrix; else uniform loop.
   - For each cell:
     - if value `'locked'` or `'aisle'` -> skip (no seat).
     - seatType = cellValue.
     - price = `computeSeatPrice(basePrice, seatType, showtime.timeSlot, showtime.dayType)`.
   - Compute `endTime` using movie.duration (look up Movie) instead of hardcoded 150.

4. **Overlap check** (`POST/PUT /showtimes`):
   - Call `overlapsExisting(roomId, date, startTime, endTime, excludeId)`.
   - 409 if overlap, message includes the conflicting showtime ID and time.

5. **Batch endpoint** `POST /showtimes/batch`:
   - Body: `{ movieId, cinemaId, roomId, basePrice, items: [{date, startTime}] }`.
   - Validate ALL items for overlap first; if any conflict, 409 with conflict list.
   - Iterate: create Showtime + Seats. If any fails mid-loop, delete already-created showtimes + seats.

6. **Emergency cancel** `POST /showtimes/:id/emergency-cancel`:
   - Body: `{ reason }`.
   - Set `showtime.status='cancelled'`.
   - Find all `Booking` with `showtime=id, status='paid'`.
   - For each: `status='refunded'`, `refundedAt=now`, `refundReason=reason`. Update related Payment: `status='cancelled'`, `refundAmount=totalPrice`, `refundDate=now`. Create RefundLog row. Release seats.
   - Also flip `status='expired'` on pending bookings, release seats.
   - Return summary `{ refundedCount, expiredCount, totalRefunded }`.

7. **Movie duration impact** `GET /movies/:id/showtime-impact`:
   - Find future showtimes for movie.
   - Return list `{ _id, date, startTime, currentEndTime, proposedEndTime }`.
   - Frontend shows confirm dialog before PUT.

8. **PUT /movies/:id**:
   - If `duration` changed, require `req.body.confirmImpact === true` else 409.
   - On confirm: update movie + recalc `endTime` on future showtimes (no booking impact unless overlap; warn but don't block).

9. **PriceConfig CRUD** (in `routes/admin.js`):
   - `GET /admin/price-configs` -> list all rows.
   - `POST /admin/price-configs` -> upsert by composite key.
   - `DELETE /admin/price-configs/:id`.
   - On any write -> `pricing.invalidateCache()`.

10. **Room seat-matrix update** `PUT /admin/rooms/:id/seat-matrix`:
    - Body: `{ rows, cols, seatMatrix }`. Validate dims match.
    - Block if any active showtime exists for this room (return 409 with showtime IDs) — prevent invariant violation.

11. **Booking endpoint** `POST /bookings`:
    - Validate seats with gap check; 400 if gap detected.
    - Compute `totalPrice` from seat.price (already correct because seats are created with dynamic price) + `concessionTotal`.
    - Persist `concessions[]` array from request body.
    - Set `expiresAt = new Date(Date.now() + 5*60*1000)`.

12. **GET /bookings/:id/remaining**:
    - If status != pending -> 200 `{ remaining: 0 }`.
    - Else `remaining = Math.max(0, (expiresAt - now)/1000)`.

13. **Payments refund** (`routes/payments.js`):
    - Replace `booking.status = 'cancelled'` with `'refunded'` when triggered after payment success.
    - Append RefundLog row.

14. **Compile check**: `cd BE && node -c app.js` after each file change.

## Todo List
- [ ] cron/booking-expire.js
- [ ] utils/pricing.js
- [ ] utils/seat-gap.js
- [ ] utils/showtime-overlap.js
- [ ] Modify routes/bookings.js (gap, expiresAt, concessions, remaining)
- [ ] Modify routes/showtimes.js (overlap, matrix, duration-from-movie)
- [ ] Add POST /showtimes/batch
- [ ] Add POST /showtimes/:id/emergency-cancel
- [ ] Add GET /movies/:id/showtime-impact + guard PUT /movies/:id
- [ ] Add /admin/price-configs CRUD
- [ ] Add PUT /admin/rooms/:id/seat-matrix
- [ ] Wire cron in app.js
- [ ] Adjust /api/payments/:id/refund to use 'refunded' status
- [ ] Smoke test all endpoints with curl or test-endpoints.js

## Success Criteria
- Create a pending booking, wait 6 minutes -> booking.status === 'expired' AND seats === 'available'.
- POST /bookings with seats A1 + A3 (A2 not selected, both unbooked) returns 400 (gap).
- POST /showtimes with same room+date+overlapping time returns 409.
- POST /showtimes/batch with 5 entries succeeds atomically; intentionally introduce overlap -> none created.
- Emergency cancel returns summary; user's MyTickets page (after Phase 3) shows REFUNDED.
- PriceConfig change reflected on the next showtime creation; existing seats not touched.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|------------|
| Cron fires before DB connected | L | M | Wrap cron body in try/catch; connectDB is awaited at startup |
| Gap check rejects legitimate edges | M | M | Only check between EXISTING occupied seats; edges (col 1, col max) are OK to leave free |
| Batch create partial on mongo failure | M | M | Track created IDs; cleanup on exception |
| Refund cascade misses some bookings | M | H | Query `{ showtime: id, status: { $in: ['paid','pending'] } }`, log counts; test in dev with 2-3 bookings |
| PriceConfig cache stale across instances | L | L | Single-instance dev only — invalidate in-process is fine. Document this limitation |
| `routes/showtimes.js` deletes seats on cancel? | — | — | Current code (line 122-138) only flips status; does NOT delete seats. Emergency-cancel must NOT delete seats either |

## Security Considerations
- All admin endpoints behind `protect, admin` middleware.
- Validate `seatMatrix` cells against enum to prevent code injection via JSON.
- Refund triggers idempotent (status check before update).
- Movie duration change requires explicit `confirmImpact=true` to avoid silent cascading changes.

## Next Steps
- Phase 03 (FE user-facing) and Phase 04 (FE admin) can start in parallel after this phase.
