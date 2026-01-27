# 🎬 5Cine Backend API - v1.0.0

Hệ thống backend cho nền tảng đặt vé xem phim trực tuyến.

## ⚡ Quick Start

### Chạy Local
```bash
# Install dependencies
npm install

# Copy .env.example thành .env
cp .env.example .env

# Chạy development mode (auto reload)
npm run dev

# Server chạy tại http://localhost:5000
```

### Deploy lên Render
Xem file [DEPLOYMENT.md](./DEPLOYMENT.md) để hướng dẫn chi tiết.

---

## 📁 Cấu Trúc Dự Án

```
BE/
├── src/
│   ├── app.js                    # Express app setup & middleware
│   ├── server.js                 # HTTP server + Socket.io config
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT authentication
│   ├── models/                   # MongoDB schemas
│   │   ├── users.model.js
│   │   ├── movie.model.js
│   │   ├── genre.model.js
│   │   ├── cinema.model.js
│   │   ├── room.model.js
│   │   ├── showtime.model.js
│   │   ├── ticket.model.js
│   │   ├── order.model.js
│   │   ├── combo.model.js
│   │   └── payment.model.js
│   └── routes/                   # API routes
│       ├── auth.route.js
│       ├── user.route.js
│       ├── movie.route.js
│       ├── booking.route.js
│       ├── cinema.route.js
│       ├── genre.route.js
│       ├── room.route.js
│       ├── combo.route.js
│       ├── payment.route.js
│       ├── staff.route.js
│       └── admin.route.js
├── .env                          # Environment variables (local)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Project dependencies
├── README.md                     # This file
└── DEPLOYMENT.md                 # Deployment guide
```

### 3. Cấu hình môi trường
```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
```

### 4. Khởi động server
```bash
npm run dev   # Development mode
npm start     # Production mode
```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /forgot-password` - Gửi OTP quên mật khẩu
- `POST /reset-password` - Đặt lại mật khẩu
- `POST /google/callback` - Đăng nhập Google
- `POST /facebook/callback` - Đăng nhập Facebook

### User Routes (`/api/users`)
- `POST /register` - Đăng ký tài khoản (UC01)
- `POST /login` - Đăng nhập (UC02)
- `POST /forgot-password` - Quên mật khẩu (UC03)
- `PUT /profile` - Cập nhật thông tin cá nhân (UC04)
- `GET /profile` - Lấy thông tin cá nhân
- `POST /change-password` - Đổi mật khẩu
- `GET /` - Danh sách người dùng (Admin)
- `PATCH /:id/status` - Thay đổi trạng thái (Admin)

### Movie Routes (`/api/movies`)
- `GET /` - Danh sách phim (UC06)
- `GET /:id` - Chi tiết phim (UC07)
- `GET /search/query` - Tìm kiếm phim (UC05)

### Genre Routes (`/api/genres`)
- `GET /` - Danh sách thể loại
- `POST /` - Tạo thể loại (Admin)
- `PATCH /:id` - Cập nhật thể loại (Admin)
- `DELETE /:id` - Ẩn thể loại (Admin)

### Cinema Routes (`/api/cinemas`)
- `GET /` - Danh sách rạp
- `GET /:id` - Chi tiết rạp
- `POST /` - Tạo rạp (Admin)
- `PATCH /:id` - Cập nhật rạp (Admin)
- `DELETE /:id` - Ẩn rạp (Admin)

### Room Routes (`/api/rooms`)
- `GET /` - Danh sách phòng chiếu
- `GET /:id` - Chi tiết phòng (với sơ đồ ghế)
- `POST /` - Tạo phòng (Admin)
- `PATCH /:id` - Cập nhật phòng (Admin)
- `DELETE /:id` - Ẩn phòng (Admin)

### Combo Routes (`/api/combos`)
- `GET /` - Danh sách combo
- `GET /:id` - Chi tiết combo
- `POST /` - Tạo combo (Admin)
- `PATCH /:id` - Cập nhật combo (Admin)
- `DELETE /:id` - Ẩn combo (Admin)

### Booking Routes (`/api/booking`)
- `GET /showtime/:showtimeId` - Lấy chi tiết lịch chiếu (UC08)
- `POST /hold-seat` - Giữ ghế tạm thời (5 phút) (UC09)
- `POST /release-seat` - Thả ghế
- `POST /create-order` - Tạo đơn hàng (UC09)
- `GET /history` - Lịch sử vé (UC11)
- `GET /:orderId` - Chi tiết đơn hàng
- `POST /:orderId/cancel` - Hủy đơn hàng

### Payment Routes (`/api/payments`)
- `POST /` - Tạo thanh toán (UC10)
- `GET /:id` - Chi tiết thanh toán
- `GET /user/history` - Lịch sử thanh toán
- `POST /vnpay/callback` - Callback từ VNPAY
- `POST /momo/callback` - Callback từ MOMO
- `POST /:id/cancel` - Hủy thanh toán

### Staff Routes (`/api/staff`)
- `POST /pos/sell` - Bán vé tại quầy (UC18)
- `POST /check-in` - Soát vé (UC19)
- `GET /dashboard` - Dashboard POS

### Admin Routes (`/api/admin`)
- `GET /movies/all` - Danh sách tất cả phim
- `POST /movies` - Tạo phim (UC12)
- `PATCH /movies/:id` - Cập nhật phim
- `PATCH /movies/:id/status` - Thay đổi trạng thái phim
- `GET /showtimes` - Danh sách lịch chiếu
- `POST /showtimes` - Tạo lịch chiếu (UC15)
- `PATCH /showtimes/:id` - Cập nhật lịch chiếu
- `GET /orders` - Danh sách đơn hàng (UC16)
- `GET /orders/:id` - Chi tiết đơn hàng
- `PATCH /orders/:id/cancel` - Hủy đơn hàng
- `GET /reports/revenue` - Báo cáo doanh thu (UC17)
- `GET /reports/fill-rate` - Báo cáo tỷ lệ lấp đầy
- `GET /reports/movie-sales` - Báo cáo doanh thu theo phim

## Models

### User Schema
- name (String, required)
- email (String, unique, required)
- password (String, hashed)
- phone (String)
- avatar (String)
- role (String: 'member', 'staff', 'admin')
- status (String: 'active', 'inactive', 'blocked')
- points (Number)
- otp, otpExpire (cho quên mật khẩu)
- lastLogin, loginAttempts, lockUntil

### Movie Schema
- title, description, duration
- ageLimit, trailerUrl, posterUrl
- genres (Array of ObjectId)
- director, cast (Array)
- releaseDate, status, rating

### Showtime Schema
- movieId, roomId, cinemaId (References)
- startTime, endTime, price
- seats (Array with status: available/holding/booked)
- status (scheduled/ongoing/completed/cancelled)

### Order Schema
- userId, showtimeId (References)
- tickets (Array of seatCode + ticketId)
- combos (Array with quantity and price)
- totalAmount, status, paymentMethod

### Ticket Schema
- orderId, showtimeId, userId (References)
- seatCode, qrCode
- status (unused/used/cancelled)
- usedAt (Date)

### Payment Schema
- orderId, userId (References)
- amount, method (vnpay/momo/cash)
- transactionId, status
- paymentDetails, errorMessage

## Authentication

Tất cả endpoints (ngoại trừ register/login) yêu cầu JWT Token trong header:
```
Authorization: Bearer <token>
```

## Real-time Features (Socket.io)

```javascript
// Join showtime room
socket.emit('joinShowtime', showtimeId);

// Listen for real-time seat updates
socket.on('seatHolding', (seatData) => {...});
socket.on('seatBooked', (seatData) => {...});
socket.on('seatAvailable', (seatData) => {...});
socket.on('seatsUpdated', (seats) => {...});
```

## Các Use Case Được Hỗ Trợ

✅ UC01 - Đăng ký tài khoản
✅ UC02 - Đăng nhập (Email/Pass)
✅ UC03 - Quên mật khẩu (OTP)
✅ UC04 - Cập nhật thông tin cá nhân
✅ UC05 - Tìm kiếm phim
✅ UC06 - Xem danh sách phim
✅ UC07 - Xem chi tiết phim
✅ UC08 - Xem lịch chiếu
✅ UC09 - Đặt vé (Chọn suất → ghế → combo → thanh toán)
✅ UC10 - Thanh toán online (VNPAY/MOMO)
✅ UC11 - Xem lịch sử vé
✅ UC12 - Quản lý phim
✅ UC13 - Quản lý thể loại
✅ UC14 - Quản lý rạp & phòng
✅ UC15 - Quản lý lịch chiếu (Check trùng lặp)
✅ UC16 - Quản lý vé & đơn hàng
✅ UC17 - Báo cáo thống kê
✅ UC18 - Bán vé tại quầy (POS)
✅ UC19 - Soát vé (Check-in QR)

## Lưu Ý Quan Trọng

1. **Bảo Mật**: Luôn sử dụng HTTPS trong production
2. **JWT Secret**: Thay đổi SECRET_KEY trong .env
3. **CORS**: Cấu hình CORS domain cho phù hợp
4. **Validation**: Implement Joi validation cho tất cả endpoints
5. **Rate Limiting**: Thêm rate limiter để tránh abuse
6. **Error Handling**: Xử lý lỗi chi tiết để debug dễ dàng

## Công Nghệ Sử Dụng

- **Node.js + Express** - Server Framework
- **MongoDB + Mongoose** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **QRCode** - Generate QR codes for tickets
- **Morgan** - HTTP logging

## Contributors

5Cine Development Team
