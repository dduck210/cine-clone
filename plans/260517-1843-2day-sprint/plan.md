# Sprint Plan — 2 ngày (17–18/05/2026)

## Tổng quan

- **Thời gian:** 17/05 → 18/05/2026
- **Team:** Dev 1 (User-facing) + Dev 2 (Admin & System)
- **Mục tiêu:** Hoàn thành 15 tính năng / sửa lỗi trên cả FE và BE
- **Git strategy:** Mỗi người làm trên nhánh `feat/` riêng, không overlap file

---

## Phân loại độ phức tạp

| Ký hiệu | Mức độ     | Thời gian ước tính |
| ------- | ---------- | ------------------ |
| 🟢      | Đơn giản   | < 1.5h             |
| 🟡      | Trung bình | 2–4h               |
| 🔴      | Phức tạp   | 4–8h               |

---

## DAY 1 — 17/05/2026

### Dev 1 — Nhánh: `feat/dev1-user-d1-fe` + `feat/dev1-user-d1-be`

| #   | Tính năng                            | File                                          | Độ KP | Ghi chú                                                      |
| --- | ------------------------------------ | --------------------------------------------- | ----- | ------------------------------------------------------------ |
| 1   | 🟢 Bỏ search ở Navbar user           | `Navbar.jsx`                                  | 🟢    | Ẩn/xóa ô input search phía user                              |
| 2   | 🟢 Nút "Đặt vé ngay" có action       | `MovieDetailPage.jsx`                         | 🟢    | Scroll xuống hoặc navigate tới chọn suất                     |
| 3   | 🟡 Hiển thị tên phòng trong vé       | `MyTicketsPage.jsx`, `PaymentSuccessPage.jsx` | 🟡    | BE: populate `roomId` trong booking query                    |
| 4   | 🟡 Discount 20% tự động vào thứ Hai  | `BookingPage.jsx` (hiện badge)                | 🟡    | BE `routes/bookings.js`: check `dayOfWeek === 1`, apply 0.8× |
| 5   | 🟢 Lịch chiếu hiển thị ngày Chủ nhật | `CinemaDetailPage.jsx`                        | 🟢    | Kiểm tra date picker có đang skip Chủ nhật không             |

**Kết thúc Day 1 → PR vào nhánh FE + BE**

---

### Dev 2 — Nhánh: `feat/dev2-admin-d1-fe` + `feat/dev2-admin-d1-be`

| #   | Tính năng                                      | File                                             | Độ KP | Ghi chú                                            |
| --- | ---------------------------------------------- | ------------------------------------------------ | ----- | -------------------------------------------------- |
| 1   | 🟢 Admin orders: thêm username + email         | `OrdersTab.jsx`                                  | 🟢    | Hiện thị `booking.userId.name` + `email`           |
| 2   | 🟢 Admin phim: search theo tên                 | `MoviesTab.jsx`                                  | 🟢    | Filter client-side hoặc query param                |
| 3   | 🟢 Admin phim: filter theo thể loại            | `MoviesTab.jsx`                                  | 🟢    | Dropdown genre, filter array                       |
| 4   | 🟡 Suất chiếu hết hạn → trạng thái `expired`   | `models/Showtime.js`, `jobs/expire-showtimes.js` | 🟡    | Cron job chạy mỗi ngày 00:00, update status        |
| 5   | 🟡 Ẩn suất chiếu hết hạn trên màn user         | `routes/showtimes.js`, `BookingPage.jsx`         | 🟡    | BE: filter `date >= today`, FE: không hiện suất cũ |
| 6   | 🟢 Admin ShowtimesTab: hiện badge `Đã hết hạn` | `ShowtimesTab.jsx`                               | 🟢    | Add badge cho status `expired`                     |

**Kết thúc Day 1 → PR vào nhánh FE + BE**

---

## DAY 2 — 18/05/2026

### Dev 1 — Nhánh: `feat/dev1-user-d2-fe` + `feat/dev1-user-d2-be`

| #   | Tính năng                      | File                                                              | Độ KP | Ghi chú                                                               |
| --- | ------------------------------ | ----------------------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| 1   | 🟡 Quên mật khẩu (FE form)     | `ForgotPasswordPage.jsx` (new), `LoginPage.jsx`, `App.jsx`        | 🟡    | Form nhập email, gửi request                                          |
| 2   | 🟡 Quên mật khẩu (BE endpoint) | `routes/auth.js`                                                  | 🟡    | Gửi email reset link hoặc OTP tạm thời                                |
| 3   | 🔴 Bình luận & đánh giá (BE)   | `models/Review.js` (new), `routes/reviews.js` (new)               | 🔴    | Schema: userId, movieId, rating (1–5), comment, createdAt             |
| 4   | 🔴 Bình luận & đánh giá (FE)   | `MovieDetailPage.jsx`, `components/movie/ReviewSection.jsx` (new) | 🔴    | Hiện danh sách, form thêm review (chỉ user đã đặt vé mới được review) |

---

### Dev 2 — Nhánh: `feat/dev2-admin-d2-fe` + `feat/dev2-admin-d2-be`

| #   | Tính năng                                                   | File                                                                                        | Độ KP | Ghi chú                                                                                                                                   |
| --- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 🟡 Rạp: trạng thái "sự cố" + "đang hoạt động"               | `models/Cinema.js`, `routes/admin.js`                                                       | 🟡    | Thêm enum `active/incident/inactive`, API PATCH status                                                                                    |
| 2   | 🟡 Admin: chọn phòng khi đóng khẩn cấp                      | `RoomsTab.jsx` hoặc modal trong Dashboard                                                   | 🟡    | Chọn 1 hoặc nhiều phòng → cancel các showtime liên quan                                                                                   |
| 3   | 🔴 Email notifications                                      | `services/email-service.js` (new)                                                           | 🔴    | Nodemailer/SendGrid. Các trigger: ① Thanh toán thành công (PDF link), ② Nhắc 24h trước, ③ Admin hủy suất (hoàn tiền tự động), ④ Hoàn tiền |
| 4   | 🔴 Real-time: thông báo admin khi user thanh toán / quét QR | `services/notification-service.js` (new), `app.js` (socket.io), `Dashboard.jsx` (bell icon) | 🔴    | Socket.io emit khi booking `status → paid` hoặc `ticketStatus → printed`                                                                  |

---

## File Ownership (không overlap)

```
Dev 1 sở hữu:                          Dev 2 sở hữu:
─────────────────────────────────────  ──────────────────────────────────────
FE/src/pages/Auth/ForgotPasswordPage   FE/src/components/admin/OrdersTab
FE/src/pages/Auth/LoginPage            FE/src/components/admin/MoviesTab
FE/src/pages/Movie/MovieDetailPage     FE/src/components/admin/ShowtimesTab
FE/src/components/movie/ReviewSection  FE/src/components/admin/RoomsTab
FE/src/pages/Ticket/MyTicketsPage      FE/src/pages/Booking/BookingPage
FE/src/pages/Payment/PaymentSuccessPage FE/src/pages/Admin/Dashboard
FE/src/pages/Payment/PaymentPage       FE/src/pages/CinemaDetailPage (shared?)
FE/src/pages/CinemaDetailPage ⚠️
FE/src/components/common/Navbar
FE/src/App.jsx

BE/routes/auth.js                      BE/routes/admin.js
BE/routes/bookings.js                  BE/routes/showtimes.js
BE/routes/reviews.js (new)             BE/routes/payments.js
BE/models/Review.js (new)              BE/models/Cinema.js
                                       BE/models/Showtime.js
                                       BE/jobs/expire-showtimes.js
                                       BE/services/email-service.js (new)
                                       BE/services/notification-service.js (new)
                                       BE/app.js (socket.io)
```

> ⚠️ `CinemaDetailPage.jsx` — nếu Dev 1 làm Chủ nhật schedule và Dev 2 làm expired showtime filter ở đây thì cần **1 người làm cả 2 task này** hoặc **Dev 1 làm CinemaDetailPage, Dev 2 chỉ sửa BE route**.

---

## Git Workflow

```bash
# Dev 1 — Day 1
git checkout FE && git pull
git checkout -b feat/dev1-user-d1-fe
# ... làm task ... commit ...
git push -u origin feat/dev1-user-d1-fe
# Tạo PR → merge vào FE

# Dev 2 — Day 1 (song song)
git checkout FE && git pull
git checkout -b feat/dev2-admin-d1-fe
# ... làm task ... commit ...
git push -u origin feat/dev2-admin-d1-fe
# Tạo PR → merge vào FE

# Tương tự với nhánh BE
```

**Merge order:** Không phụ thuộc nhau → merge bất kỳ thứ tự, không conflict.

---

## Estimated Timeline

```
Day 1 (17/05)       08:00──────────────────────────17:00
Dev 1:              [Navbar][ĐặtVéNgay][TênPhòng][Discount][ChủNhật]
Dev 2:              [Orders][MoviesSearch/Filter][ExpiredCron][HideExpired][Badge]

Day 2 (18/05)       08:00──────────────────────────17:00
Dev 1:              [QuênMK-FE+BE]────────[Reviews-BE+FE]──────────────
Dev 2:              [CinemaSựCố]──[EmailService]──────[RealtimeNotif]──
```

---

## Tính năng để lại (ngoài 2 ngày)

Những tính năng này phức tạp, cần thêm thời gian thiết lập (SendGrid, SMTP, PDF generation):

- PDF vé (cần thư viện như `pdfkit` hoặc `puppeteer`)
- Cron nhắc 24h (cần queue như `bull` hoặc MongoDB scheduled job)

→ Có thể implement tuần sau sau khi cơ sở hạ tầng email service ổn định.
