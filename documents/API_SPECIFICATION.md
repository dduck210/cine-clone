# 5Cine Backend - API Specification

## Tổng Quan

Backend API cho hệ thống đặt vé xem phim trực tuyến 5Cine, hỗ trợ 19 use cases từ tài liệu yêu cầu.

**Base URL**: `http://localhost:5000/api`

---

## 1. AUTHENTICATION ENDPOINTS

### 1.1 Đăng Ký Tài Khoản (UC01)
```
POST /users/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "phone": "0123456789"
}

Response:
{
  "message": "Đăng ký thành công",
  "user": {
    "_id": "...",
    "name": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "member",
    "status": "active"
  }
}
```

### 1.2 Đăng Nhập (UC02)
```
POST /users/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Đăng nhập thành công",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### 1.3 Quên Mật Khẩu - Gửi OTP (UC03)
```
POST /auth/forgot-password
{
  "email": "user@example.com"
}

Response:
{
  "message": "OTP đã được gửi",
  "otp": "123456",  // Cho demo
  "email": "user@example.com"
}
```

### 1.4 Đặt Lại Mật Khẩu
```
POST /auth/reset-password
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}

Response:
{
  "message": "Đặt lại mật khẩu thành công"
}
```

### 1.5 Cập Nhật Thông Tin Cá Nhân (UC04)
```
PUT /users/profile
Authorization: Bearer <token>
{
  "name": "Nguyễn Văn B",
  "phone": "0987654321",
  "avatar": "https://..."
}

Response:
{
  "message": "Cập nhật thành công",
  "user": {...}
}
```

---

## 2. MOVIE ENDPOINTS

### 2.1 Danh Sách Phim (UC06)
```
GET /movies?status=now_showing
GET /movies?status=coming_soon

Response:
[
  {
    "_id": "...",
    "title": "Top Gun: Maverick",
    "duration": 131,
    "posterUrl": "...",
    "rating": 8.5,
    "status": "now_showing",
    "genres": ["Action", "Drama"],
    "releaseDate": "2024-01-15"
  }
]
```

### 2.2 Chi Tiết Phim (UC07)
```
GET /movies/:movieId

Response:
{
  "_id": "...",
  "title": "Top Gun: Maverick",
  "description": "...",
  "duration": 131,
  "ageLimit": "16+",
  "trailerUrl": "https://youtube.com/...",
  "posterUrl": "...",
  "director": "Joseph Kosinski",
  "cast": ["Tom Cruise", "Miles Teller"],
  "rating": 8.5,
  "reviewCount": 1234,
  "genres": [...],
  "showtimes": [
    {
      "_id": "...",
      "startTime": "2024-01-26T14:00:00Z",
      "endTime": "2024-01-26T15:51:00Z",
      "price": 80000,
      "cinema": { "name": "5Cine Tân Bình" },
      "room": { "name": "Phòng 1" }
    }
  ]
}
```

### 2.3 Tìm Kiếm Phim (UC05)
```
GET /movies/search/query?q=top+gun

Response: [...]
```

---

## 3. CINEMA & ROOM ENDPOINTS

### 3.1 Danh Sách Rạp
```
GET /cinemas

Response:
[
  {
    "_id": "...",
    "name": "5Cine Tân Bình",
    "address": "...",
    "phone": "...",
    "city": "Hồ Chí Minh",
    "status": "active"
  }
]
```

### 3.2 Danh Sách Phòng Chiếu
```
GET /rooms?cinemaId=<cinemaId>

Response:
[
  {
    "_id": "...",
    "name": "Phòng 1",
    "rows": 10,
    "columns": 15,
    "totalSeats": 150,
    "status": "active"
  }
]
```

---

## 4. SHOWTIME ENDPOINTS (UC08, UC09)

### 4.1 Lấy Sơ Đồ Ghế
```
GET /booking/showtime/:showtimeId

Response:
{
  "_id": "...",
  "startTime": "2024-01-26T14:00:00Z",
  "price": 80000,
  "movie": {
    "title": "Top Gun: Maverick",
    "duration": 131
  },
  "cinema": { "name": "5Cine Tân Bình" },
  "room": { "name": "Phòng 1", "rows": 10, "columns": 15 },
  "seats": [
    {
      "seatCode": "A1",
      "status": "available"  // available, holding, booked
    },
    {
      "seatCode": "A2",
      "status": "booked"
    }
    // ... 150 ghế
  ]
}
```

### 4.2 Giữ Ghế (5 phút)
```
POST /booking/hold-seat
Authorization: Bearer <token>
{
  "showtimeId": "...",
  "seatCode": "A1"
}

Response:
{
  "message": "Ghế đã được giữ trong 5 phút",
  "seatCode": "A1"
}
```

### 4.3 Tạo Đơn Hàng (Đặt Vé)
```
POST /booking/create-order
Authorization: Bearer <token>
{
  "showtimeId": "...",
  "seats": ["A1", "A2", "A3"],
  "combos": [
    { "comboId": "...", "quantity": 2, "price": 150000 }
  ],
  "paymentMethod": "vnpay"
}

Response:
{
  "message": "Đơn hàng đã được tạo",
  "order": {
    "_id": "order123",
    "totalAmount": 390000,  // 3 ghế x 80k + 2 combo x 75k
    "status": "pending",
    "tickets": [
      {
        "seatCode": "A1",
        "qrCode": "data:image/png;base64,..."
      }
    ]
  }
}
```

---

## 5. PAYMENT ENDPOINTS (UC10)

### 5.1 Tạo Thanh Toán
```
POST /payments
Authorization: Bearer <token>
{
  "orderId": "...",
  "amount": 390000,
  "method": "vnpay"
}

Response:
{
  "_id": "...",
  "status": "pending",
  "transactionId": null
}
```

### 5.2 Callback VNPAY
```
POST /payments/vnpay/callback
{
  "orderId": "...",
  "transactionId": "vnpay123",
  "responseCode": "00"  // 00 = success
}

Response:
{
  "status": "success",
  "message": "Thanh toán thành công"
}
```

### 5.3 Lịch Sử Thanh Toán
```
GET /payments/user/history
Authorization: Bearer <token>

Response: [...]
```

---

## 6. BOOKING HISTORY (UC11)

### 6.1 Lịch Sử Vé
```
GET /booking/history
Authorization: Bearer <token>

Response:
[
  {
    "_id": "order123",
    "showtimeId": {
      "movie": { "title": "Top Gun: Maverick" },
      "startTime": "2024-01-26T14:00:00Z",
      "price": 80000
    },
    "tickets": [
      {
        "seatCode": "A1",
        "qrCode": "data:image/png;base64,..."
      }
    ],
    "totalAmount": 390000,
    "status": "paid",
    "createdAt": "2024-01-20T10:00:00Z"
  }
]
```

---

## 7. STAFF ENDPOINTS

### 7.1 Bán Vé Tại Quầy (UC18)
```
POST /staff/pos/sell
Authorization: Bearer <token>
Header: role = "staff"
{
  "showtimeId": "...",
  "seats": ["A1", "A2"],
  "combos": [
    { "comboId": "...", "quantity": 1, "price": 75000 }
  ],
  "customerInfo": {
    "notes": "Khách hàng lẻ"
  }
}

Response:
{
  "message": "Bán vé thành công",
  "order": {...},
  "tickets": [...]
}
```

### 7.2 Soát Vé (UC19)
```
POST /staff/check-in
Authorization: Bearer <token>
Header: role = "staff"
{
  "qrCode": "order123-A1"
}

Response:
{
  "message": "Soát vé thành công",
  "ticket": {
    "seatCode": "A1",
    "status": "used"
  },
  "movieTitle": "Top Gun: Maverick"
}
```

---

## 8. ADMIN ENDPOINTS

### 8.1 Quản Lý Phim (UC12)

#### Tạo Phim
```
POST /admin/movies
Authorization: Bearer <token>
Header: role = "admin"
{
  "title": "Avatar 3",
  "description": "...",
  "duration": 192,
  "ageLimit": "13+",
  "trailerUrl": "...",
  "posterUrl": "...",
  "director": "James Cameron",
  "cast": ["Zoe Saldana"],
  "releaseDate": "2024-12-20",
  "genres": ["movieId1", "movieId2"],
  "status": "coming_soon"
}

Response:
{
  "_id": "...",
  "title": "Avatar 3",
  ...
}
```

#### Cập Nhật Phim
```
PATCH /admin/movies/:id
{...}
```

#### Thay Đổi Trạng Thái Phim
```
PATCH /admin/movies/:id/status
{
  "status": "hidden"  // now_showing, coming_soon, hidden
}
```

### 8.2 Quản Lý Thể Loại (UC13)
```
GET /genres
POST /genres
PATCH /genres/:id
DELETE /genres/:id
```

### 8.3 Quản Lý Rạp & Phòng (UC14)
```
GET /cinemas
POST /cinemas
PATCH /cinemas/:id
DELETE /cinemas/:id

GET /rooms
POST /rooms
PATCH /rooms/:id
DELETE /rooms/:id
```

### 8.4 Quản Lý Lịch Chiếu (UC15)

#### Tạo Lịch Chiếu (Check trùng lặp)
```
POST /admin/showtimes
Authorization: Bearer <token>
{
  "movieId": "...",
  "roomId": "...",
  "cinemaId": "...",
  "startTime": "2024-01-26T14:00:00Z",
  "price": 80000
}

Response:
{
  "_id": "...",
  "startTime": "2024-01-26T14:00:00Z",
  "endTime": "2024-01-26T15:51:00Z",  // auto từ duration
  "seats": [
    { "seatCode": "A1", "status": "available" },
    { "seatCode": "A2", "status": "available" },
    // ... tất cả ghế
  ]
}
```

### 8.5 Quản Lý Vé & Đơn Hàng (UC16)
```
GET /admin/orders
GET /admin/orders/:id
PATCH /admin/orders/:id/cancel
```

### 8.6 Báo Cáo Thống Kê (UC17)

#### Báo Cáo Doanh Thu
```
GET /admin/reports/revenue?startDate=2024-01-01&endDate=2024-01-31

Response:
{
  "totalRevenue": 10500000,
  "totalOrders": 150,
  "averageOrderValue": 70000,
  "orders": [...]
}
```

#### Báo Cáo Tỷ Lệ Lấp Đầy
```
GET /admin/reports/fill-rate?startDate=2024-01-01&endDate=2024-01-31&cinemaId=...

Response:
[
  {
    "showtimeId": "...",
    "totalSeats": 150,
    "bookedSeats": 120,
    "availableSeats": 30,
    "fillRate": "80.00%"
  }
]
```

#### Báo Cáo Doanh Thu Theo Phim
```
GET /admin/reports/movie-sales?startDate=2024-01-01&endDate=2024-01-31

Response:
[
  {
    "_id": "movieId",
    "totalRevenue": 5000000,
    "totalTickets": 70,
    "movie": { "title": "Top Gun: Maverick" }
  }
]
```

---

## Authentication & Authorization

Tất cả endpoints (ngoại trừ login/register) yêu cầu:

```
Authorization: Bearer <JWT_TOKEN>
```

Token có 3 ngày tuổi. Roles:
- **member**: Người dùng thông thường
- **staff**: Nhân viên bán vé
- **admin**: Quản trị viên

---

## Error Responses

```json
{
  "message": "Mô tả lỗi",
  "statusCode": 400
}
```

Common Status Codes:
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

## Real-time Events (Socket.io)

```javascript
// Client-side

// Join showtime room
socket.emit('joinShowtime', showtimeId);

// Listen for real-time updates
socket.on('seatHolding', (data) => {
  console.log(`Ghế ${data.seatCode} đang được giữ`);
});

socket.on('seatBooked', (data) => {
  console.log(`Ghế ${data.seatCode} vừa được đặt`);
});

socket.on('seatAvailable', (data) => {
  console.log(`Ghế ${data.seatCode} hiện available`);
});

socket.on('seatsUpdated', (seats) => {
  console.log('Cập nhật toàn bộ sơ đồ ghế');
});
```

---

## Cấu Hình Biến Môi Trường

Xem [.env.example](.env.example) để cấu hình đầy đủ:
- MONGO_URI
- JWT_SECRET
- VNPAY credentials
- MOMO credentials
- Email configuration

---

## Rate Limiting & Security

- JWT expiry: 7 days
- Hold seat timeout: 5 minutes
- OTP timeout: 10 minutes
- Failed login attempts: track & lock account

---

## Documentiation Generated Date
2024-01-26
