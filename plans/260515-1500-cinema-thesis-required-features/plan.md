---
title: "Cinema Booking — Thesis-Required Features"
description: "Add seat hold timer, no-gap validation, seat types, dynamic pricing, refund/expired statuses, admin seat-matrix + batch showtimes + price config, and rich statistics."
status: pending
priority: P1
effort: 32h
branch: feat/thesis-required-features
tags: [thesis, booking, admin, stats, mongoose, react]
created: 2026-05-15
---

# Plan: Cinema Booking — Thesis Required Features

## Goal
Land ALL 16 teacher-required features so the DATN thesis passes review.
Group features into 5 sequential phases; do NOT skip any.

## Architecture Diagram (high-level data flow)

```
USER FLOW (booking)
  Browse -> Showtime -> BookingPage
                          | (5-min countdown + no-gap check)
                          v
                       POST /bookings  (server re-validates gap & lifetime)
                          | (sets expiresAt = now + 5min, status=pending)
                          v
                       Seats reserved
                          | success
                       Payment (MoMo/cash)
                          | success
                       status=paid, seats=booked
                          | timeout (cron, every 1 min)
                       status=expired, seats=available

ADMIN FLOW
  Cinema -> Room (with seatMatrix JSON) -> Showtime (batch, overlap-checked)
  PriceConfig (seatType x timeSlot x dayType) -> consumed by createShowtime
                                              -> seats get correct price
  EmergencyCancel Showtime -> all paid bookings refunded + status=refunded
```

## Phases (sequential — each unblocks the next)

| # | Phase | Effort | Status | File |
|---|------|--------|--------|------|
| 1 | Data models & migrations | 4h | pending | [phase-01-data-models.md](./phase-01-data-models.md) |
| 2 | Backend logic (routes, cron, validation) | 8h | pending | [phase-02-backend-logic.md](./phase-02-backend-logic.md) |
| 3 | Frontend user-facing (timer, gap, seat types, statuses) | 6h | pending | [phase-03-frontend-user.md](./phase-03-frontend-user.md) |
| 4 | Admin (seat matrix editor, price config, batch showtimes, warnings) | 8h | pending | [phase-04-admin-features.md](./phase-04-admin-features.md) |
| 5 | Statistics (endpoints + dashboard charts) | 6h | pending | [phase-05-stats.md](./phase-05-stats.md) |

## Dependencies
- Phase 1 MUST land first (schema changes) before phases 2-5.
- Phase 2 (backend logic) blocks phases 3, 4, 5.
- Phases 3, 4, 5 can run in parallel AFTER phase 2 — they touch disjoint FE files.

## Cross-cutting Risk
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Existing seats have no `seatType` | High | Medium | Phase-1 migration script sets `regular` as default |
| Existing bookings have no `expiresAt` | High | Low | Migration: only `pending` bookings get expiry = createdAt+5min |
| Refund flow breaks MoMo idempotency | Medium | High | Refund is BE-side only; we mark `status=refunded`, do NOT call MoMo refund API (out of scope for thesis) |
| Overlap validation false-positive on showtime edit | Medium | Medium | When updating, exclude self `_id` from overlap query |
| Cron in single Node process restarts | Low | Low | Cron is idempotent; missed run catches up next tick |

## Rollback Strategy
- Each phase = single MR; revert MR if blocked.
- Schema additions are non-destructive (new optional fields + defaults). Safe to deploy then revert FE without DB rollback.
- New collections (`PriceConfig`) can be dropped without affecting existing data.

## Test Matrix (per phase)
- Unit: model validators, helper functions (gap check, time overlap, price compute).
- Integration: POST /bookings (gap), POST /admin/showtimes/batch (overlap), cron expire.
- E2E (manual): full booking with timer, admin cancels showtime -> user sees REFUNDED, stats charts render.

## Success Criteria (definition of done)
1. All 16 features visible & functional in dev environment.
2. Booking auto-expires after 5 minutes without payment (verified by waiting 6 min).
3. Cannot leave a single-seat gap between booked seats (server returns 400).
4. Admin can paint seat types on a grid, save, and prices reflect in next booking.
5. Admin cancels showtime -> all paid bookings show "REFUNDED" in user history.
6. Dashboard renders 4 charts: revenue trend, refund stats, film performance, hot timeslots.
7. No regression on existing booking flow (MoMo + cash) for default `regular` seats.

## Open Questions
- Holiday calendar source: hardcoded array for thesis, or future admin-managed table? (Decision: hardcoded for V1 — see phase-01.)
- Concession revenue: combos are currently in-memory only on BookingPage. Need separate `BookingItem` collection? (Decision: store as `concessions` subdoc on Booking — see phase-01.)
