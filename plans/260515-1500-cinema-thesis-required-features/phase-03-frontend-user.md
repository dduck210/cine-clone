# Phase 03 — Frontend User-Facing

## Context Links
- FE/src/pages/Booking/BookingPage.jsx:1-317
- FE/src/pages/Ticket/MyTicketsPage.jsx:1-210
- FE/src/pages/Profile/ProfilePage.jsx:8-12, 228-329
- FE/src/pages/Payment/PaymentPage.jsx (existing)
- FE/src/api/axiosConfig.js
- Phase 02 endpoints

## Overview
- Priority: P1
- Status: pending (depends on Phase 02)
- Effort: 6h
- Goal: Booking page shows 5-min countdown, blocks gap selections, renders seat-type colors. MyTickets + Profile history show EXPIRED and REFUNDED statuses with proper labels.

## Key Insights
- `BookingPage.jsx:28` only stores flat seats array — needs `seatType` rendering. Existing seat fetch at line 42 already gets full seat docs from BE; after Phase 1, `seatType` will be present.
- `BookingPage.jsx:83` uses single `PRICE_PER_TICKET` — must switch to `seat.price` per-seat aggregation.
- `BookingPage.jsx:170-183` legend currently shows only 3 categories — must expand.
- `MyTicketsPage.jsx:8-12` `statusMap` is the single source of label/colors — extend with `expired` and `refunded`.
- `ProfilePage.jsx:228-232` has a duplicate inline `statusMap` — extend BOTH (or extract to shared helper — KISS: small duplication ok for 5 entries).
- Tabs in `MyTicketsPage.jsx:33-38` lists only 4 — add "Đã hết hạn" + "Đã hoàn tiền". Animated bar at line 90-92 uses `4` as divisor — change to `tabs.length` to scale.

## Requirements

### Functional
1. **Countdown timer**: from booking creation (or page load if user is on BookingPage pre-creation, show static 5:00 placeholder). After creating booking on payment step, store `expiresAt` and show ticking countdown. On 0, redirect to "session expired" view.
2. **Gap pre-validation (client-side)**: when user clicks a seat, if resulting selection leaves a gap in same row, show toast warning + block selection.
3. **Seat type colors**:
   - regular -> current white/border style
   - vip -> amber/gold border + bg-amber-50 (selected: amber-600)
   - couple -> purple (selected: purple-600); spans 2 visual cells (couples are 2 seats sharing a col pair — render as wider button)
   - locked/aisle from matrix -> not rendered (empty space)
4. **Legend** updated with seat types + their prices (fetched from seat data).
5. **Status badges**: `expired` -> gray "Đã hết hạn", `refunded` -> blue "Đã hoàn tiền" in MyTickets + Profile.
6. **MyTickets tab filters** extended for new statuses.

### Non-functional
- Timer must NOT keep ticking after navigate-away (cleanup in useEffect).
- Gap check happens BEFORE network call — no extra API roundtrip.

## Architecture

### Timer flow
```
PaymentPage / after createBooking:
  receives { booking } with expiresAt
  countdown = (expiresAt - now)
  useEffect setInterval 1s -> decrement
  on 0 -> toast.error -> navigate('/booking-expired') OR re-fetch via GET /:id/remaining
```
Use GET `/bookings/:id/remaining` as authoritative on resume (handles user refresh).

### Gap check on click (BookingPage)
```
canSelect(row, col):
  next = [...selectedSeats, `${row}${col}`]
  for each row in next:
     occupied = booked + reserved + nextInRow (sorted by col)
     for each adjacent pair in occupied: if pair[1].col - pair[0].col == 2 AND col(pair[0]+1) is a real seat (not aisle) AND col(pair[0]+1) NOT in occupied: return false (gap)
  return true
```
Then `handleSeatClick` calls `canSelect` before toggling.

### Seat type rendering
```
seatTypeStyles = {
  regular: { base: 'border-slate-300', selected: 'bg-red-600', label: 'Thường' },
  vip:     { base: 'border-amber-400 bg-amber-50', selected: 'bg-amber-500', label: 'VIP' },
  couple:  { base: 'border-purple-400 bg-purple-50', selected: 'bg-purple-600', label: 'Đôi', span: 2 },
}
```
For `couple`: render as one wider button when col is odd-indexed; skip the next col. (Simpler approach: couple takes 2 adjacent cols in matrix — pair them.)

## Related Code Files

### To modify
- `FE/src/pages/Booking/BookingPage.jsx` — add timer state, gap helper, seat-type renderer, dynamic per-seat price aggregation.
- `FE/src/pages/Payment/PaymentPage.jsx` — display timer (read from state passed from BookingPage), call create booking on mount, store expiresAt.
- `FE/src/pages/Ticket/MyTicketsPage.jsx` — extend `statusMap`, add tabs.
- `FE/src/pages/Profile/ProfilePage.jsx` — extend inline `statusMap` (lines 228-232).

### To create
- `FE/src/utils/booking-helpers.js` — exports `validateNoGap(seats, selectedSeatNumbers, row)` (mirrors BE) and `formatCountdown(seconds)`.
- `FE/src/components/booking/SeatGridLegend.jsx` (~50 lines) — extracted legend rendering.
- `FE/src/components/booking/CountdownBanner.jsx` (~40 lines) — sticky red banner with mm:ss.
- `FE/src/pages/Booking/BookingExpiredPage.jsx` — simple "session expired, please rebook" view.

### To delete
- (none)

## Implementation Steps

1. Create `FE/src/utils/booking-helpers.js`:
   - `validateNoGap(allSeats, selectedSeatNumbers)`: groups by row, returns `{ ok, conflicts: [{row,col}] }`. Excludes seats where `seatType` is `'aisle'` or status missing (locked).
   - `formatCountdown(secs)`: returns `mm:ss` string.

2. Modify `BookingPage.jsx`:
   - In `handleSeatClick`: before adding seatNum, run `validateNoGap` with prospective selection; if not ok, `toast.error("Không được để ghế trống xen kẽ")` and return.
   - Replace single `PRICE_PER_TICKET` math (line 83) with `selectedSeats.reduce((sum, sn) => sum + seats.find(s=>s.seatNumber===sn).price, 0)`.
   - In seat grid render (line 144-159): switch className based on `seatTypeStyles[seat.seatType]`.
   - Hide `locked`/`aisle` seats with `<div className="w-9 h-9 sm:w-11 sm:h-11"/>` spacer.
   - Replace legend block (170-183) with `<SeatGridLegend prices={...} />`.

3. Create `FE/src/components/booking/SeatGridLegend.jsx`:
   - Receives `prices: { regular, vip, couple }` (min price per type from seats array).
   - Renders 5 swatches: Thường / VIP / Đôi / Đang chọn / Đã đặt.

4. Modify `PaymentPage.jsx`:
   - On mount: call `POST /bookings` with seats + concessions, receive `{ _id, expiresAt }`, store in state.
   - Mount `<CountdownBanner expiresAt={expiresAt} bookingId={id}/>`.
   - On expire: navigate `/booking-expired`.
   - If user goes back: cancel booking via PUT `/bookings/:id/cancel`.

5. Create `FE/src/components/booking/CountdownBanner.jsx`:
   - Props: `expiresAt`, `bookingId`.
   - useEffect: setInterval 1s decrement; on mount also fire `GET /bookings/:id/remaining` to sync; clear on unmount.
   - Renders sticky bar: `"Hoàn tất thanh toán trong: 04:59"` red bg.

6. Create `FE/src/pages/Booking/BookingExpiredPage.jsx` (~60 lines):
   - Big icon + message + button "Đặt vé lại" -> navigate movie listing.
   - Add route in `App.jsx`: `<Route path="/booking-expired" element={<BookingExpiredPage/>} />`.

7. Extend `MyTicketsPage.jsx`:
   - `statusMap` (line 8-12) — add:
     ```
     expired: { label: "Đã hết hạn", color: "bg-gray-100 text-gray-600 border-gray-200" },
     refunded: { label: "Đã hoàn tiền", color: "bg-blue-100 text-blue-700 border-blue-200" },
     ```
   - `tabs` (line 33-38) — add `{ id: "expired", label: "Hết hạn" }` and `{ id: "refunded", label: "Hoàn tiền" }`.
   - Tab bar divisor (line 92) — change `/4` to `/${tabs.length}`.

8. Extend `ProfilePage.jsx`:
   - Inline `statusMap` (line 228-232) — add same `expired` + `refunded` entries.

9. Smoke test:
   - `npm run dev` (FE) — no build errors.
   - Browse to booking page; click A1 then skip A2 click A3 -> blocked.
   - Mock a paid+then admin-cancelled booking on BE -> open MyTickets -> "Đã hoàn tiền" badge renders.

## Todo List
- [ ] utils/booking-helpers.js
- [ ] components/booking/SeatGridLegend.jsx
- [ ] components/booking/CountdownBanner.jsx
- [ ] pages/Booking/BookingExpiredPage.jsx + route wire
- [ ] BookingPage: gap check on click, per-seat price, seat-type rendering, legend swap
- [ ] PaymentPage: create booking on mount, show countdown, expire redirect
- [ ] MyTickets: statusMap + tabs extension
- [ ] Profile: statusMap extension

## Success Criteria
- Visiting payment page starts a visible 05:00 countdown. After 5 minutes inactivity: redirect to expired page; backend booking flipped to `expired`.
- VIP seats render amber; couple seats render purple-wide.
- Selecting A1 then A3 (with A2 free) shows toast "không để ghế trống xen kẽ".
- MyTickets shows 6 tabs; clicking "Hoàn tiền" filters refunded bookings only.
- No console errors.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|------------|
| Timer drift across tab switches | M | L | Re-sync with `/remaining` on visibilitychange listener |
| Couple seat rendering breaks grid alignment | M | M | Use `colSpan` style approach; demo on a 10-col room first |
| Gap check too strict (blocks corner gaps) | M | M | Only enforce BETWEEN two occupied; corners OK |
| User opens 2 tabs and double-creates booking | M | M | Backend will create 2 bookings but seats reserve guard prevents overlap; surface 400 to user |
| Booking created on PaymentPage mount + user goes back | M | M | Wire cancel on unmount + browser back |

## Security Considerations
- Do NOT trust the client-side gap check — server re-validates.
- Do NOT send `price` from client — derive from seat.price stored in DB.
- Countdown is visual only; expiry is server-enforced.

## Next Steps
- Independent of Phase 4/5 — can run in parallel with them after Phase 2.
