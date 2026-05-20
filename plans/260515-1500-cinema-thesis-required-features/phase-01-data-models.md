# Phase 01 — Data Models & Migrations

## Context Links
- BE/models/Seat.js:1-17
- BE/models/Booking.js:1-22
- BE/models/Showtime.js:1-15
- BE/models/CinemaRoom.js:1-12
- BE/models/Movie.js:1-17
- BE/models/Payment.js:1-14

## Overview
- Priority: P1 (blocks all other phases)
- Status: pending
- Effort: 4h
- Goal: Extend Mongoose schemas + write one-shot migration script. Non-destructive — all new fields optional with defaults.

## Key Insights (from scout)
- `Seat` already has `price` (per seat) — we keep it. We ADD `seatType`.
- `Booking.status` enum is `['pending','paid','cancelled']` — must add `'expired'` and `'refunded'`. Existing FE code only knows the old three (FE update happens in Phase 3).
- `Showtime` already has `endTime`, `price`, `totalSeats`. We add `timeSlot`, `dayType`, `basePrice` (keep `price` as the legacy fallback).
- `CinemaRoom` has only `rows/cols`. We add optional `seatMatrix: [[String]]`. If null, fallback = generate uniform regular seats (preserves current behavior).
- Booking has no `expiresAt`. Cron uses this in Phase 2.
- `Payment` already has `refundAmount` + `refundDate` — reuse.

## Requirements

### Functional
1. Seat document carries `seatType: 'regular' | 'vip' | 'couple'` with default `'regular'`.
2. Booking has `expiresAt: Date` (only for pending bookings) and supports statuses `expired`, `refunded`.
3. Showtime carries `timeSlot ('morning'|'evening'|'late')`, `dayType ('regular'|'weekend'|'holiday')`, `basePrice` (number).
4. CinemaRoom has optional `seatMatrix` (2D array of strings: `regular|vip|couple|locked|aisle`).
5. New `PriceConfig` collection — global scope: `(seatType, timeSlot, dayType) -> multiplier`.
6. Booking carries `concessions: [{ name, price, quantity }]` and `concessionTotal: Number`.
7. New `RefundLog` collection (audit trail for emergency cancellation).

### Non-functional
- All new fields backward compatible (optional + defaults).
- Migration script must be idempotent (safe to re-run).

## Architecture

### Updated `Seat` schema
```js
seatType: { type: String, enum: ['regular','vip','couple'], default: 'regular' },
// price stays — set by showtime creation from PriceConfig
```

### Updated `Booking` schema
```js
status: { ..., enum: ['pending','paid','cancelled','expired','refunded'] }
expiresAt: { type: Date, index: true },  // queried by cron, indexed
concessions: [{
  name: String,
  price: Number,
  quantity: Number,
}],
concessionTotal: { type: Number, default: 0 },
refundedAt: Date,
refundReason: String,
```
NOTE: do NOT use Mongo TTL index on `expiresAt` — TTL would delete the document; we need to keep it for history and just flip its status. Use cron instead.

### Updated `Showtime` schema
```js
timeSlot: { type: String, enum: ['morning','evening','late'], default: 'evening' },
dayType: { type: String, enum: ['regular','weekend','holiday'], default: 'regular' },
basePrice: { type: Number },           // new — source of dynamic pricing
// price kept for legacy compatibility (last seat-applied price for display)
```
Auto-derivation rules (controller, not schema):
- `timeSlot`: hour < 12 -> morning, 12..18 -> evening, > 18 -> late
- `dayType`: Sat/Sun -> weekend; in `HOLIDAYS[]` -> holiday; else regular

### Updated `CinemaRoom` schema
```js
seatMatrix: {
  type: [[String]],            // 2D: matrix[r][c] in {regular,vip,couple,locked,aisle}
  default: undefined,          // undefined -> fallback to uniform regular
},
```

### NEW `PriceConfig` collection (BE/models/PriceConfig.js)
```js
{
  seatType: enum,
  timeSlot: enum,
  dayType: enum,
  multiplier: { type: Number, default: 1 },
}
// compound unique index (seatType, timeSlot, dayType)
```
Default rows (seeded by migration):
| seatType | timeSlot | dayType | multiplier |
|---|---|---|---|
| regular | morning | regular | 0.8 |
| regular | evening | regular | 1.0 |
| regular | late    | regular | 1.1 |
| vip     | *       | *       | base * 1.5 |
| couple  | *       | *       | base * 2.0 |
| *       | *       | weekend | base * 1.2 |
| *       | *       | holiday | base * 1.5 |
(Final logic: `price = showtime.basePrice * seatTypeMul * timeSlotMul * dayTypeMul`. Each row stores only one multiplier; final price multiplies all three matching configs — see phase-02 helper.)

### NEW `RefundLog` collection (BE/models/RefundLog.js)
```js
{
  booking: ObjectId ref Booking,
  showtime: ObjectId ref Showtime,
  amount: Number,
  reason: String,
  triggeredBy: { type: String, enum: ['admin_cancel','manual'] },
  createdAt: { default: Date.now },
}
```

## Related Code Files

### To modify
- `BE/models/Seat.js` — add `seatType`.
- `BE/models/Booking.js` — extend status enum, add `expiresAt`, `concessions`, `concessionTotal`, `refundedAt`, `refundReason`.
- `BE/models/Showtime.js` — add `timeSlot`, `dayType`, `basePrice`.
- `BE/models/CinemaRoom.js` — add `seatMatrix`.

### To create
- `BE/models/PriceConfig.js`
- `BE/models/RefundLog.js`
- `BE/migrate-thesis-features.js` — one-shot migration script (executable via `node BE/migrate-thesis-features.js`).
- `BE/utils/holidays.js` — exports `HOLIDAYS = ['MM-DD', ...]` (Vietnam national holidays for thesis demo).

### To delete
- (none)

## Implementation Steps

1. Edit `BE/models/Seat.js`:
   - Add `seatType` enum field before `bookedBy`.

2. Edit `BE/models/Booking.js`:
   - Extend status enum to include `'expired'`, `'refunded'`.
   - Add `expiresAt`, `concessions[]`, `concessionTotal`, `refundedAt`, `refundReason`.
   - Add index `bookingSchema.index({ status: 1, expiresAt: 1 })` for cron lookup.

3. Edit `BE/models/Showtime.js`:
   - Add `timeSlot`, `dayType`, `basePrice`.

4. Edit `BE/models/CinemaRoom.js`:
   - Add `seatMatrix` (default `undefined`).

5. Create `BE/models/PriceConfig.js` with schema above + compound unique index.

6. Create `BE/models/RefundLog.js`.

7. Create `BE/utils/holidays.js`:
   ```js
   module.exports = {
     HOLIDAYS: ['01-01','04-30','05-01','09-02'], // VN public holidays
     isHoliday(date) {
       const mmdd = `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
       return module.exports.HOLIDAYS.includes(mmdd);
     },
   };
   ```

8. Create `BE/migrate-thesis-features.js`:
   - Connect via `config/database.js`.
   - For each Seat with no `seatType`: set `seatType='regular'`.
   - For each Booking with `status='pending'` and no `expiresAt`: set `expiresAt = createdAt + 5min`; if already past, set `status='expired'` and release seats.
   - For each Showtime with no `basePrice`: copy `price -> basePrice`; derive `timeSlot` from `startTime`; derive `dayType` from `date`.
   - Insert default PriceConfig rows if collection empty.
   - Log counts; exit 0.

9. Add npm script `"migrate": "node migrate-thesis-features.js"` to `BE/package.json`.

10. Compile-check: `cd BE && node -c app.js` (syntax check only, no Mongo needed).

## Todo List
- [ ] Modify `Seat.js` (seatType)
- [ ] Modify `Booking.js` (status enum, expiresAt, concessions)
- [ ] Modify `Showtime.js` (timeSlot, dayType, basePrice)
- [ ] Modify `CinemaRoom.js` (seatMatrix)
- [ ] Create `PriceConfig.js`
- [ ] Create `RefundLog.js`
- [ ] Create `utils/holidays.js`
- [ ] Create `migrate-thesis-features.js`
- [ ] Update `package.json` script
- [ ] Run `npm run migrate` on dev DB and verify counts in mongo shell

## Success Criteria
- `node -c migrate-thesis-features.js` passes.
- After running migration on dev DB:
  - Every existing seat has `seatType`.
  - Every existing pending booking has `expiresAt` (or has been auto-expired).
  - Every showtime has `basePrice`, `timeSlot`, `dayType`.
  - `priceconfigs` collection has 12 rows (3 seatTypes x 3 timeSlots default config + extras).
- Existing booking flow still works (regression smoke test): seat list loads, can select+create booking.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|------------|
| Migration kills running prod data | L | H | Only run in dev; idempotent with `$exists:false` guards |
| Unique index on PriceConfig fails on duplicate seed run | M | L | Use `updateOne(filter, {$setOnInsert:...}, {upsert:true})` |
| Status enum widening breaks legacy code reading status | L | M | Existing code uses `=== 'paid'` checks; new statuses just fall to default branches. Verified across `routes/bookings.js:86-87`, `controllers/bookingController.js:84` — no exhaustive switch statements |
| Field `expiresAt` shadowing a future TTL feature | L | L | Doc this in plan; do NOT add TTL spec to the index |

## Security Considerations
- Migration script must NOT be exposed as an HTTP endpoint — CLI-only.
- `PriceConfig` admin write endpoints (Phase 4) require `admin` middleware.
- `seatType` enum strictly validated (Mongoose enum) — prevent client injecting `couple` to get a different price by mistake.

## Next Steps
- After this phase: Phase 02 (backend logic) — needs the new fields/collections.
