# Phase 04 — Admin Features

## Context Links
- FE/src/components/admin/ShowtimesTab.jsx:1-306
- FE/src/components/admin/MoviesTab.jsx (existing)
- FE/src/pages/Admin/Dashboard.jsx:67-407
- FE/src/components/admin/Sidebar.jsx
- Phase 02 endpoints (price-configs CRUD, batch, emergency-cancel, seat-matrix)

## Overview
- Priority: P1
- Status: pending (depends on Phase 02)
- Effort: 8h
- Goal: Admin UI for: seat matrix editor, price config table, batch showtime creation, movie-duration impact warning, emergency-cancel confirmation, room manager.

## Key Insights
- Dashboard already has tab routing via `?tab=...` (see Dashboard.jsx:69). Add 2 new tabs: `rooms` and `prices`.
- `Sidebar.jsx` is the nav — needs 2 new entries.
- `ShowtimesTab.jsx` `ShowtimeModal` (lines 18-175) handles single create — must extend with "batch mode" toggle.
- Cancel showtime currently uses `window.confirm` (Dashboard.jsx:271) — replace with a proper modal that accepts a refund reason and shows affected booking count.
- Movie edit modal lives in `MoviesTab.jsx` — must add duration-change warning step.

## Requirements

### Functional
1. **Seat matrix editor**: new admin tab "Phòng chiếu". List rooms; click -> open editor; grid where each cell is a button cycling through regular/vip/couple/locked/aisle (color-coded). Save -> PUT /admin/rooms/:id/seat-matrix.
2. **Price config UI**: new tab "Cấu hình giá". Table of 27 rows (3 seatType × 3 timeSlot × 3 dayType). Inline edit `multiplier` numeric input. Save row-by-row.
3. **Batch showtime creation**: toggle in ShowtimeModal: "Tạo nhiều suất chiếu". Select multiple dates (date-picker w/ multi-select via list of date inputs + add-button) + multiple times (list of time inputs). Preview matrix `dates × times`. Submit -> POST /showtimes/batch.
4. **Showtime overlap UX**: on conflict (409), show inline error listing the conflicting showtime IDs.
5. **Movie duration warning**: in MovieModal, on edit + duration changed -> on submit call `GET /movies/:id/showtime-impact`, if non-empty show warning modal "Sẽ ảnh hưởng N suất chiếu" + list, then PUT with `confirmImpact=true`.
6. **Emergency cancel showtime**: replace `window.confirm` with `EmergencyCancelModal`: text input "Lý do hủy", shows affected paid bookings count fetched from `GET /admin/showtimes/:id/affected-bookings` (new helper endpoint OR client filter), submit -> POST /showtimes/:id/emergency-cancel.

### Non-functional
- Seat matrix editor: 200-line cap; split into `SeatMatrixGrid.jsx` (drawing) + `RoomsTab.jsx` (list).
- All admin actions use existing axiosInstance + toast pattern (Dashboard.jsx style).

## Architecture

### New tab: Rooms (seat matrix editor)
```
RoomsTab
├── RoomList (table of rooms with edit button)
└── SeatMatrixEditor (modal/full-page)
    ├── header: room name, rows/cols inputs
    ├── grid: rows×cols clickable cells
    │     onClick: cycle [regular -> vip -> couple -> locked -> aisle -> regular]
    ├── palette: 5 swatches (info only)
    └── save button (disabled if active showtime exists -> 409 shown)
```

### New tab: Prices
```
PricesTab
└── PriceConfigTable
    ├── filters: seatType, dayType
    └── 27 editable rows (or paginated 9 per dayType)
       fields: seatType | timeSlot | dayType | multiplier (input) | actions
```

### ShowtimeModal extension
```
[ ] Tạo nhiều suất (batch mode)
   if checked:
     - dates: [ '2026-05-16', '2026-05-17', '+ add' ]
     - times: [ '10:00', '14:00', '+ add' ]
     - preview: "Sẽ tạo 6 suất chiếu"
     - submit -> /showtimes/batch
   else: single create (current behavior)
```

### EmergencyCancelModal
```
Inputs: reason (textarea)
Read-only: "X suất bị ảnh hưởng — Y người đã đặt — Z tổng tiền sẽ hoàn"
Submit -> POST /showtimes/:id/emergency-cancel { reason }
On success: toast w/ summary + refresh showtime list
```

## Related Code Files

### To modify
- `FE/src/pages/Admin/Dashboard.jsx` — add 2 new tabs to `tabTitle` (line 281), wire components in render (line 332-358), add data fetching effects for `rooms`/`prices`.
- `FE/src/components/admin/Sidebar.jsx` — add 2 nav entries: "Phòng chiếu", "Cấu hình giá".
- `FE/src/components/admin/ShowtimesTab.jsx` — extend `ShowtimeModal` (lines 18-175) with batch toggle + multi-input. Wire 409 conflict UI in `onSubmit` catch (line 51).
- `FE/src/components/admin/MoviesTab.jsx` — extend `MovieModal` with duration-impact step.

### To create
- `FE/src/components/admin/RoomsTab.jsx` — list + handlers (~150 lines).
- `FE/src/components/admin/SeatMatrixEditor.jsx` — modal w/ grid (~180 lines).
- `FE/src/components/admin/PricesTab.jsx` — table view (~150 lines).
- `FE/src/components/admin/EmergencyCancelModal.jsx` — confirm w/ reason (~120 lines).
- `FE/src/components/admin/BatchShowtimePanel.jsx` — date/time multi-inputs (~150 lines), used inside ShowtimeModal.
- `FE/src/components/admin/DurationImpactWarning.jsx` — small list modal (~80 lines).

### To delete
- (none)

## Implementation Steps

1. **Sidebar** — add 2 entries with icons (Lucide: `LayoutGrid`, `Wallet`):
   ```jsx
   { id: 'rooms', label: 'Phòng chiếu', icon: LayoutGrid },
   { id: 'prices', label: 'Cấu hình giá', icon: Wallet },
   ```

2. **Dashboard tabs wiring** (`Dashboard.jsx:281, 332-358`):
   - Add `rooms` and `prices` to `tabTitle`.
   - Add 2 useEffect blocks fetching `/admin/rooms` (call `/admin/cinemas` to list rooms per cinema) and `/admin/price-configs`.
   - Render `<RoomsTab />` / `<PricesTab />`.

3. **RoomsTab.jsx**:
   - Fetch `/admin/cinemas`. For each cinema, list rooms.
   - Click edit -> open `SeatMatrixEditor` with `room` prop.
   - Table cols: name, rows×cols, total seats, status, edit button.

4. **SeatMatrixEditor.jsx**:
   - State: `matrix: [[String]]` initialized from `room.seatMatrix` or all `regular`.
   - Grid: `rows × cols` buttons; on click cycle types.
   - Color map: regular=white, vip=amber-200, couple=purple-200, locked=slate-700 text-white, aisle=transparent dashed.
   - Save: PUT `/admin/rooms/:id/seat-matrix` body `{ rows, cols, seatMatrix }`. 409 -> show conflicting showtime IDs toast.

5. **PricesTab.jsx**:
   - Fetch `/admin/price-configs`.
   - Render table with one row per config; multiplier as `<input type="number" step="0.1">`.
   - On blur or "Lưu" button per row: POST `/admin/price-configs` with the row (upsert by composite key).
   - Add "Reset về mặc định" button (deletes all + re-seeds defaults — call DELETE then POST in loop).

6. **BatchShowtimePanel.jsx** (used inside `ShowtimeModal`):
   - Props: `register`, `setValue`, `watch` from react-hook-form parent.
   - Holds `dates: string[]`, `times: string[]` (controlled via setValue).
   - Show preview: `dates.length × times.length` count.

7. **Modify ShowtimeModal** (`ShowtimesTab.jsx:18-175`):
   - Add checkbox `batchMode` (boolean state).
   - If false: keep current single-create flow.
   - If true: render `<BatchShowtimePanel/>` instead of single date/time inputs.
   - `onSubmit`:
     - If single: same as now.
     - If batch: POST `/showtimes/batch` with `{ items: dates.flatMap(d=>times.map(t=>({date:d, startTime:t}))) }`.
   - Catch 409: show inline error list with conflicting times.

8. **EmergencyCancelModal.jsx**:
   - Props: `showtime`, `onClose`, `onSaved`.
   - Fetch affected count via inline computation: `await axios.get('/admin/bookings?showtime=...')` OR just submit and rely on summary in response.
   - Textarea reason (min 5 chars), confirm button red.
   - On submit: POST `/showtimes/:id/emergency-cancel` `{reason}`. Show summary toast.

9. **Replace `handleCancelShowtime`** (`Dashboard.jsx:270-279`):
   - Instead of `window.confirm`, open `EmergencyCancelModal` with `setSelectedCancel(showtime)`.

10. **MovieModal duration warning** (`MoviesTab.jsx`):
    - Track `originalDuration` on edit open.
    - On submit, if duration changed: GET `/movies/:id/showtime-impact`. If non-empty: show `<DurationImpactWarning impacted={...} onConfirm={()=> submit with confirmImpact=true} />`.
    - Else: submit normally.

11. **DurationImpactWarning.jsx**: list of `{ date, startTime, old end, new end }` rows + confirm/cancel buttons.

12. **Smoke tests** in dev:
    - Create a room with matrix `[['vip','vip','couple','aisle','regular',...]]` -> save -> create showtime -> open BookingPage -> verify colors.
    - Edit a PriceConfig multiplier 1.0 -> 2.0 -> create new showtime -> seat price doubles.
    - Batch create 3 dates × 2 times = 6 showtimes -> all visible.
    - Cancel a paid showtime with EmergencyCancelModal -> verify booking status `refunded` in MyTickets.

## Todo List
- [ ] Sidebar.jsx — add 2 entries
- [ ] Dashboard.jsx — wire 2 new tabs + data fetch
- [ ] RoomsTab.jsx
- [ ] SeatMatrixEditor.jsx
- [ ] PricesTab.jsx
- [ ] BatchShowtimePanel.jsx
- [ ] ShowtimeModal — batch toggle + 409 UI
- [ ] EmergencyCancelModal.jsx
- [ ] Replace window.confirm in Dashboard with modal
- [ ] DurationImpactWarning.jsx
- [ ] MovieModal — duration step

## Success Criteria
- Admin can paint a 6×8 room with mixed seat types and save without errors.
- Trying to save matrix while active showtime exists -> error toast naming the showtime.
- Batch creating 5 dates × 2 times = 10 showtimes in one click.
- Conflicting batch entry -> 0 created, 409 with conflict list shown.
- Editing a movie duration with future showtimes -> warning modal lists them; only after confirm does PUT succeed.
- Cancelling a showtime via EmergencyCancelModal flips user bookings to `refunded`.

## Risk Assessment
| Risk | L | I | Mitigation |
|------|---|---|------------|
| Seat matrix file grows >200 lines | M | L | Split into `SeatMatrixGrid` (paint logic) + `SeatMatrixEditor` (modal shell) |
| Couple seats double-counted in totalSeats | M | M | Decide: each "couple" cell == 1 seat (single booking unit). totalSeats = count(cell != locked && cell != aisle) |
| Admin paints couple but matrix has odd count | L | L | Doc-only; couple seats are independent units, not pair-bound |
| Batch creates 100 showtimes by accident | L | M | Validation: limit to max 50 entries per batch |
| Concurrent admin edits matrix while user is booking | L | M | seat-matrix update blocked if active showtime exists (server-side) |
| react-hook-form arrays mishandled | M | M | Use plain useState arrays in BatchShowtimePanel rather than RHF arrays — KISS |

## Security Considerations
- All admin tabs guarded by `AdminRoute` (existing).
- Server re-validates admin role on every endpoint (Phase 2).
- Reason field sanitized server-side before storing in `RefundLog.reason`.
- PriceConfig endpoints reject negative multipliers.

## Next Steps
- Phase 05 (stats) consumes data from Phase 1-4.
