# 5Cine — Hệ thống đặt vé xem phim trực tuyến

Ứng dụng đặt vé rạp chiếu phim fullstack gồm Frontend React + Backend Node.js/Express + MongoDB Atlas.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cấu trúc dự án](#2-cấu-trúc-dự-án)
3. [Cài đặt & Chạy dự án](#3-cài-đặt--chạy-dự-án)
4. [Cấu hình biến môi trường](#4-cấu-hình-biến-môi-trường)
5. [Khởi tạo dữ liệu mẫu](#5-khởi-tạo-dữ-liệu-mẫu)
6. [Tạo tài khoản Admin](#6-tạo-tài-khoản-admin)
7. [Hướng dẫn sử dụng — Người dùng](#7-hướng-dẫn-sử-dụng--người-dùng)
8. [Hướng dẫn sử dụng — Quản trị viên](#8-hướng-dẫn-sử-dụng--quản-trị-viên)
9. [API Backend](#9-api-backend)
10. [Công nghệ sử dụng](#10-công-nghệ-sử-dụng)

---

## 1. Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|---------------------|
| Node.js | v18+ |
| npm | v9+ |
| MongoDB | Atlas (cloud) hoặc local v6+ |
| Git | Bất kỳ |

---

## 2. Cấu trúc dự án

```
cine-clone/
├── BE/                          # Backend — Node.js + Express
│   ├── app.js                   # Entry point
│   ├── seed.js                  # Dữ liệu mẫu
│   ├── .env                     # Biến môi trường (tạo thủ công)
│   ├── config/                  # Kết nối database
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── movies.js
│   │   ├── showtimes.js
│   │   ├── bookings.js
│   │   ├── payments/            # Momo, PayOS, Casso
│   │   ├── tickets.js
│   │   ├── reviews.js
│   │   ├── vouchers.js
│   │   └── admin/               # Routes quản trị
│   ├── models/                  # Mongoose schemas
│   ├── controllers/             # Business logic
│   ├── services/                # Email, Momo, Push notification
│   ├── jobs/                    # Cron jobs tự động
│   ├── middleware/              # Auth, rate limiting
│   └── utils/                   # Pricing, seat validation...
│
└── FE/                          # Frontend — React + Vite
    ├── src/
    │   ├── App.jsx              # Router chính
    │   ├── features/            # Tính năng theo module
    │   │   ├── home/            # Trang chủ
    │   │   ├── movies/          # Danh sách & chi tiết phim
    │   │   ├── booking/         # Đặt vé & chọn ghế
    │   │   ├── payment/         # Thanh toán
    │   │   ├── tickets/         # Xem vé
    │   │   ├── profile/         # Trang cá nhân
    │   │   ├── admin/           # Dashboard quản trị
    │   │   ├── auth/            # Đăng ký, đăng nhập
    │   │   ├── cinemas/         # Danh sách rạp
    │   │   └── scan/            # Quét QR vé
    │   ├── shared/              # Components dùng chung
    │   └── api/                 # Axios & services gọi BE
    └── .env                     # Biến môi trường FE
```

---

## 3. Cài đặt & Chạy dự án

### Bước 1 — Clone dự án

```bash
git clone <repository-url>
cd cine-clone
```

### Bước 2 — Chạy Backend

```bash
cd BE
npm install
```

Tạo file `.env` trong thư mục `BE/` (xem [mục 4](#4-cấu-hình-biến-môi-trường)), sau đó:

```bash
npm run dev
# Hoặc chạy không tự reload:
npm start
```

> Server khởi động tại `http://localhost:5000`

Khi thành công sẽ thấy:
```
Server running on port 5000
MongoDB Connected: cluster0.rbfdlzz.mongodb.net
```

### Bước 3 — Chạy Frontend

Mở **terminal mới** (giữ terminal BE vẫn chạy):

```bash
cd FE
npm install
npm run dev
```

> Ứng dụng chạy tại `http://localhost:5173`

> **Quan trọng:** Chạy BE trước, FE sau.

---

## 4. Cấu hình biến môi trường

### BE — Tạo file `BE/.env`

```env
# Server
PORT=5000

# MongoDB Atlas
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.rbfdlzz.mongodb.net/cinema?appName=Cluster0

# JWT
JWT_SECRET=cinema_secret_key_2024

# Email (Gmail SMTP) — dùng để gửi OTP, xác nhận vé
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# URL Frontend (dùng trong email)
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

# URL Backend (dùng khi deploy hoặc ngrok)
SERVER_URL=http://localhost:5000

# PayOS — thanh toán QR Banking (tùy chọn)
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
```

> **Lấy Gmail App Password:** Google Account → Security → 2-Step Verification → App passwords → Tạo mật khẩu cho "Mail"

### FE — Tạo/chỉnh file `FE/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

> Nếu BE đang chạy qua ngrok thì thay bằng URL ngrok tương ứng.

---

## 5. Khởi tạo dữ liệu mẫu

Sau khi cấu hình `.env` xong, chạy seed để nạp phim, rạp, suất chiếu mẫu:

```bash
cd BE
node seed.js
```

Seed sẽ tự động bỏ qua nếu database đã có dữ liệu. Để xóa sạch và seed lại:

```bash
node seed.js --force
```

Dữ liệu được tạo bao gồm:
- 6 thể loại phim
- 8 phim (đang chiếu + sắp chiếu)
- 3 rạp tại Hà Nội
- 5 phòng chiếu với nhiều loại (standard, VIP, IMAX, premium)
- Nhiều suất chiếu với giá khác nhau

---

## 6. Tạo tài khoản Admin

Hệ thống không có tài khoản admin mặc định. Để tạo admin:

### Bước 1 — Đăng ký tài khoản thường

Vào `http://localhost:5173/register` → đăng ký bằng email → xác thực OTP → đăng nhập.

### Bước 2 — Nâng quyền thành Admin

Vào **MongoDB Atlas** → Database → Collections → `users` → tìm user vừa tạo → chỉnh trường `role` từ `"user"` thành `"admin"` → Save.

### Bước 3 — Đăng nhập lại

Đăng xuất rồi đăng nhập lại. Sau đó truy cập `http://localhost:5173/admin`.

---

## 7. Hướng dẫn sử dụng — Người dùng

### Đăng ký tài khoản

1. Vào `/register` → nhập Họ tên, Email, Mật khẩu (tối thiểu 8 ký tự)
2. Hệ thống gửi mã OTP 6 số về email (hiệu lực 15 phút)
3. Nhập OTP tại trang `/verify-email` để kích hoạt tài khoản
4. Đăng nhập tại `/login`

> Nếu quên mật khẩu: `/forgot-password` → nhập email → nhập OTP → đặt mật khẩu mới

### Xem phim

| Trang | Đường dẫn | Mô tả |
|-------|-----------|-------|
| Trang chủ | `/` | Hero banner, phim đang chiếu, sắp chiếu |
| Danh sách phim | `/movies` | Lọc theo thể loại, trạng thái, tìm kiếm |
| Chi tiết phim | `/movie/:id` | Thông tin, trailer, đánh giá, chọn suất chiếu |
| Danh sách rạp | `/cinemas` | Tất cả rạp theo thành phố |
| Chi tiết rạp | `/cinemas/:id` | Suất chiếu theo rạp, ngày |
| Khuyến mãi | `/promotions` | Danh sách ưu đãi |

### Đặt vé

1. Vào trang chi tiết phim → chọn **ngày, rạp, suất chiếu** → nhấn **Đặt vé**
2. Trang đặt vé (`/booking/:id`):
   - **Chọn ghế**: Ghế trống (trắng), đã đặt (đỏ), đang chọn (vàng)
   - Ghế có 3 loại: **Thường**, **VIP** (giá cao hơn), **Đôi** (ghế đôi)
   - Không được chọn ghế để trống khoảng cách giữa các ghế đã chọn
   - Chọn **Combo F&B** (bắp rang, nước uống...)
   - Nhập **mã voucher** nếu có
3. Nhấn **Tiếp tục** → xem tóm tắt đơn hàng → chọn phương thức thanh toán

> **Ưu đãi thứ Hai:** Tự động giảm 20% vào mỗi thứ Hai hàng tuần.

### Thanh toán

| Phương thức | Mô tả |
|-------------|-------|
| Tiền mặt | Thanh toán tại quầy rạp — đơn hàng ở trạng thái "Chờ xác nhận" cho đến khi admin duyệt |
| Thẻ tín dụng | Xác nhận trực tiếp — đơn hàng chuyển sang "Đã thanh toán" ngay |
| Momo | Chuyển đến trang thanh toán Momo |
| Chuyển khoản QR | Hiển thị QR Banking — hệ thống tự xác nhận khi nhận được tiền |

### Xem & Tải vé

- Vào `/my-tickets` để xem tất cả vé
- Mỗi vé có mã QR riêng để quét tại cổng rạp
- Nhấn **Tải PDF** để tải vé về máy
- Vé cũng được gửi tự động vào email sau khi thanh toán thành công

### Hủy đặt vé

Vào `/my-tickets` → chọn đơn → nhấn **Hủy**

| Trạng thái | Điều kiện hủy | Hoàn tiền |
|------------|---------------|-----------|
| Chờ thanh toán | Bất kỳ lúc nào | Không áp dụng |
| Đã thanh toán | Chưa in vé + Suất chiếu chưa bắt đầu + Còn hơn 2 giờ | Hoàn 80% |

### Trang cá nhân (`/profile`)

| Tab | Nội dung |
|-----|----------|
| Thông tin | Sửa tên, email, số điện thoại, ảnh đại diện |
| Đổi mật khẩu | Nhập mật khẩu cũ và mới |
| Lịch sử đặt vé | Xem tất cả đơn hàng, trạng thái, chi tiết |
| Danh sách yêu thích | Phim đã lưu vào wishlist |

### Đánh giá phim

Sau khi xem phim (có đơn hàng đã thanh toán), vào trang chi tiết phim → kéo xuống phần **Đánh giá** → chọn số sao + viết nhận xét.

---

## 8. Hướng dẫn sử dụng — Quản trị viên

Truy cập dashboard tại `http://localhost:5173/admin` (yêu cầu tài khoản role `admin`).

### Tổng quan Dashboard

- Thống kê: Tổng doanh thu, số đặt vé, tỷ lệ lấp đầy ghế
- Biểu đồ doanh thu theo ngày/tháng
- Top phim doanh thu cao nhất
- Thông báo real-time từ hệ thống

### Quản lý Phim

**Thêm phim mới:**
1. Tab **Phim** → nhấn **Thêm phim**
2. Nhập: Tên phim, Thể loại, Thời lượng, Poster URL, Trailer URL, Mô tả, Giới hạn độ tuổi
3. Trạng thái: `Sắp chiếu` → `Đang chiếu` → `Ngừng chiếu` (tự động theo ngày hoặc đặt thủ công)

**Sửa / Xóa phim:**
- Nhấn icon bút để sửa thông tin
- Nhấn icon thùng rác để xóa (hệ thống sẽ tự hủy suất chiếu liên quan và hoàn tiền)

**Xóa nhiều phim:** Tick chọn nhiều phim → Xóa hàng loạt

### Quản lý Rạp & Phòng chiếu

**Tab Rạp:**
- Thêm/sửa/xóa rạp: Tên, địa chỉ, thành phố, điện thoại, email
- Đổi trạng thái rạp: `Hoạt động` / `Sự cố` / `Đóng cửa`
- **Đóng khẩn cấp:** Đóng cửa rạp ngay lập tức → tự động hủy tất cả suất chiếu sắp tới + hoàn tiền

**Tab Phòng chiếu:**
- Thêm phòng vào rạp: Tên phòng, Loại (`standard`, `vip`, `premium`, `imax`), số hàng × số cột
- Xem sơ đồ ghế (Matrix Editor): trực quan hóa bố cục ghế, thiết lập ghế VIP/đôi
- Xem trạng thái ghế theo suất chiếu cụ thể

### Quản lý Suất chiếu

**Thêm suất chiếu:**
1. Tab **Suất chiếu** → **Thêm suất chiếu**
2. Chọn: Phim, Rạp, Phòng, Ngày, Giờ bắt đầu, Giá vé cơ bản
3. Hệ thống tự tính giờ kết thúc và phát hiện xung đột phòng chiếu

**Thêm hàng loạt:** Chọn nhiều ngày cùng lúc cho 1 suất chiếu

**Hủy suất chiếu:** Hủy suất → tự động hoàn tiền tất cả vé đã thanh toán + gửi email thông báo

**Cấu hình giá:** Giá điều chỉnh tự động theo:
- Khung giờ: Sáng sớm, Buổi sáng, Chiều, Tối, Khuya
- Loại ngày: Ngày thường, Cuối tuần, Ngày lễ Việt Nam

### Quản lý Đơn đặt vé

**Tab Đơn hàng:**
- Xem tất cả đơn: Mã đơn, Người dùng, Phim, Suất chiếu, Trạng thái, Tổng tiền
- Lọc theo trạng thái: `Chờ thanh toán`, `Đã thanh toán`, `Đã hủy`, `Hết hạn`
- Xem chi tiết: Thông tin ghế, combo, voucher, thông tin thanh toán
- **Xác nhận thanh toán tiền mặt:** Nhấn "Xác nhận thanh toán" cho đơn thanh toán tại quầy
- **Hoàn tiền:** Xử lý hoàn tiền cho đơn đã thanh toán

### Quản lý Người dùng

**Tab Người dùng:**
- Xem danh sách tất cả user: Tên, Email, Role, Ngày tạo, Trạng thái
- Đổi role: `user` ↔ `admin`
- Xóa tài khoản (không thể xóa admin, không thể tự xóa chính mình)
- Xóa hàng loạt

### Quản lý Voucher

**Tab Voucher:**
- Tạo voucher: Mã, Loại giảm giá (`%` hoặc tiền cố định), Giá trị, Số lượng, Ngày hết hạn
- Xem thống kê sử dụng từng voucher
- Kích hoạt / Vô hiệu hóa voucher

### Báo cáo & Thống kê

**Tab Báo cáo:**
- Doanh thu theo khoảng thời gian (ngày/tuần/tháng)
- Doanh thu theo từng phim
- Tỷ lệ lấp đầy ghế theo suất chiếu
- Xuất báo cáo ra file CSV

### Audit Log

**Tab Audit:** Lịch sử mọi thao tác của admin — ai làm gì, lúc nào, với dữ liệu nào.

### Đánh giá phim (Admin)

**Tab Đánh giá:** Xem và xóa các đánh giá không phù hợp của người dùng.

---

## 9. API Backend

Base URL: `http://localhost:5000/api`

### Xác thực (`/api/auth`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/register` | Đăng ký → gửi OTP email |
| POST | `/verify-email` | Xác thực OTP |
| POST | `/resend-verify-otp` | Gửi lại OTP |
| POST | `/login` | Đăng nhập → trả JWT |
| POST | `/refresh-token` | Làm mới access token |
| POST | `/forgot-password` | Gửi OTP đặt lại mật khẩu |
| POST | `/reset-password` | Đặt mật khẩu mới |
| GET | `/profile` | Xem thông tin cá nhân |
| PUT | `/profile` | Cập nhật thông tin |
| PUT | `/change-password` | Đổi mật khẩu |
| POST | `/wishlist/:movieId` | Thêm/xóa phim khỏi wishlist |

### Phim (`/api/movies`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách phim (hỗ trợ phân trang, lọc) |
| GET | `/:id` | Chi tiết phim |
| POST | `/` | Thêm phim (admin) |
| PUT | `/:id` | Sửa phim (admin) |
| DELETE | `/:id` | Xóa phim (admin) |

### Suất chiếu (`/api/showtimes`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách suất chiếu (lọc theo phim, rạp, ngày) |
| GET | `/:id/seats` | Sơ đồ ghế của suất chiếu |
| POST | `/` | Tạo suất chiếu (admin) |
| DELETE | `/:id` | Hủy suất chiếu (admin) |

### Đặt vé (`/api/bookings`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/` | Tạo đặt vé (giữ ghế 5 phút) |
| GET | `/my` | Lịch sử đặt vé của tôi |
| GET | `/:id` | Chi tiết đặt vé |
| POST | `/:id/cancel` | Hủy đặt vé |

### Thanh toán (`/api/payments`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/` | Thanh toán (cash, credit_card) |
| POST | `/momo/create` | Tạo thanh toán Momo |
| POST | `/momo/ipn` | Webhook Momo callback |
| POST | `/payos/create` | Tạo QR PayOS |
| POST | `/casso/webhook` | Webhook Casso |

### Vé (`/api/tickets`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/:bookingCode` | Xem vé |
| GET | `/:bookingCode/download` | Tải vé PDF |
| POST | `/scan` | Quét QR vé tại rạp |

### Health Check

```
GET /api/health
```

---

## 10. Công nghệ sử dụng

### Frontend

| Thư viện | Mục đích |
|----------|----------|
| React 19 | UI framework |
| Vite 7 | Build tool |
| React Router v7 | Routing |
| Axios | HTTP client |
| React Hook Form | Form management |
| React Hot Toast | Notifications |
| Tailwind CSS | Styling |
| Lucide React | Icons |
| QRCode.react | Hiển thị QR |
| html5-qrcode | Quét QR camera |

### Backend

| Thư viện | Mục đích |
|----------|----------|
| Express 5 | Web framework |
| Mongoose | MongoDB ODM |
| JWT | Xác thực |
| Bcryptjs | Mã hóa mật khẩu |
| Nodemailer | Gửi email |
| PDFKit | Tạo vé PDF |
| QRCode | Tạo mã QR |
| Socket.io | Real-time notifications |
| Node-cron | Scheduled jobs |
| Helmet | Security headers |
| Express Rate Limit | Chống brute force |
| Web-push | Push notifications |
| @payos/node | Tích hợp PayOS |

### Cron Jobs tự động (chạy nền)

| Job | Chức năng |
|-----|-----------|
| expire-bookings | Hủy đơn chờ thanh toán quá 5 phút |
| expire-showtimes | Đánh dấu suất chiếu đã qua |
| expire-movies | Cập nhật trạng thái phim hết hạn |
| update-movie-status | Tự động chuyển phim sắp chiếu → đang chiếu |
| send-upcoming-reminders | Gửi email nhắc nhở trước suất chiếu |
| send-review-reminders | Gửi email mời đánh giá sau khi xem phim |

---

## Lưu ý bảo mật

- **Không commit file `.env`** lên GitHub — đã có trong `.gitignore`
- Gmail App Password ≠ mật khẩu Gmail thông thường
- `JWT_SECRET` nên là chuỗi ngẫu nhiên dài ít nhất 32 ký tự khi deploy production
- MongoDB Atlas: chỉ whitelist IP cần thiết thay vì `0.0.0.0/0` khi production

---

## Hỗ trợ

Nếu gặp lỗi kết nối MongoDB Atlas:
1. Kiểm tra IP đã được whitelist trong **Network Access**
2. Đổi DNS về Google: `8.8.8.8` / `8.8.4.4`
3. Kiểm tra username/password trong `MONGO_URI`

Nếu không nhận được email OTP:
1. Kiểm tra `EMAIL_USER` và `EMAIL_PASS` trong `.env`
2. `EMAIL_PASS` phải là **App Password** (16 ký tự), không phải mật khẩu Gmail
3. Bật **2-Step Verification** trong Google Account trước khi tạo App Password
