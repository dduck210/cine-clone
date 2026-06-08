# MB Bank Payment — Developer Guide

Tài liệu này mô tả toàn bộ kỹ thuật của tích hợp thanh toán chuyển khoản MB Bank qua dịch vụ Casso.

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Danh sách file liên quan](#2-danh-sách-file-liên-quan)
3. [Luồng xử lý (Flow)](#3-luồng-xử-lý-flow)
4. [Cấu hình môi trường](#4-cấu-hình-môi-trường)
5. [API Endpoints](#5-api-endpoints)
6. [Logic khớp giao dịch](#6-logic-khớp-giao-dịch)
7. [processSuccessfulPayment — Side effects](#7-processsuccessfulpayment--side-effects)
8. [FE Polling](#8-fe-polling)
9. [Webhook (tùy chọn)](#9-webhook-tùy-chọn)
10. [Models liên quan](#10-models-liên-quan)
11. [Cách test](#11-cách-test)
12. [Troubleshooting](#12-troubleshooting)
13. [Mở rộng](#13-mở-rộng)

---

## 1. Tổng quan kiến trúc

```
User browser
    │
    │  1. Navigate to /payment/bank (state có bookingId, bookingCode, amount)
    │
    ▼
BankTransferPaymentPage.jsx
    │
    │  2. Render QR (VietQR API) + bảng thông tin chuyển khoản
    │  3. setInterval(pollStatus, 1500) — gọi GET /api/payments/casso/status/:id
    │
    ▼
BE: GET /api/payments/casso/status/:bookingId       (casso.js)
    │
    │  4. Nếu booking đã paid → trả kết quả ngay
    │  5. Nếu CASSO_API_KEY có → gọi Casso API
    │
    ▼
Casso API (https://oauth.casso.vn/v2/transactions)
    │
    │  6. Trả về danh sách giao dịch 24h gần nhất
    │
    ▼
BE: findMatchingTransaction()
    │
    │  7. So khớp bookingCode + amount (±1000đ tolerance)
    │  8. Nếu khớp → processSuccessfulPayment()
    │
    ▼
processSuccessfulPayment()
    │  - findOneAndUpdate Booking: pending → paid  (atomic)
    │  - Tạo Payment record
    │  - Seat.updateMany → booked
    │  - Gửi email (user + admin)
    │  - Tạo notification
    │
    ▼
BE trả về { paid: true }
    │
    ▼
FE navigate('/payment-success', state)
```

---

## 2. Danh sách file liên quan

### Backend

| File | Vai trò |
|------|---------|
| `BE/routes/payments/casso.js` | Router chính — status polling + webhook Casso |
| `BE/app.js` | Mount routes: `app.use('/api/payments/casso', cassoRouter)` |
| `BE/.env` | Chứa `CASSO_API_KEY` (không commit lên git) |
| `BE/models/Booking.js` | Model đơn đặt vé — `status: pending/paid/cancelled` |
| `BE/models/Payment.js` | Model bản ghi thanh toán — lưu transactionId, method, amount |
| `BE/models/Seat.js` | Model ghế — `status: available/reserved/booked` |
| `BE/services/email-service.js` | `sendPaymentSuccessEmail`, `sendAdminPaymentNotificationEmail` |
| `BE/services/notification-service.js` | `createNotification` — in-app notification |

### Frontend

| File | Vai trò |
|------|---------|
| `FE/src/features/payment/pages/BankTransferPaymentPage.jsx` | Trang hiển thị QR + polling + copy buttons |
| `FE/src/features/payment/pages/PaymentPage.jsx` | Trang chọn phương thức → navigate to /payment/bank |
| `FE/src/features/payment/pages/PaymentSuccessPage.jsx` | Trang kết quả sau khi thanh toán thành công |
| `FE/src/api/services/payment-service.js` | `getCassoStatus(bookingId)` — gọi BE |
| `FE/src/App.jsx` | Route `/payment/bank` → BankTransferPaymentPage |

---

## 3. Luồng xử lý (Flow)

```
[User chọn MB Bank]
        │
        ▼
PaymentPage.jsx
  navigate('/payment/bank', {
    bookingId, bookingCode, amount, movieTitle,
    cinemaName, roomName, showTime, showDate,
    showAddress, selectedSeats, duration, poster,
    combos, originalPrice, mondayDiscount, voucherDiscount
  })
        │
        ▼
BankTransferPaymentPage.jsx
  ├─ Render VietQR image
  │    URL: https://img.vietqr.io/image/MB-0964717591-qr_only.png
  │         ?amount={amount}&addInfo=5CINE%20{bookingCode}
  │
  ├─ setInterval(pollStatus, 1500ms)
  │
  └─ qrTimerRef: setTimeout 3s → ẩn QR, hiện overlay "Đang chờ xác nhận"

[User chuyển khoản]
        │
        ▼
pollStatus() → getCassoStatus(bookingId)
  → GET /api/payments/casso/status/:bookingId
        │
        ▼
[BE] booking.status === 'paid'?
  ├─ YES → return { paid: true, ...bookingData }
  └─ NO  → gọi findMatchingTransaction(booking)
                │
                ▼
           GET https://oauth.casso.vn/v2/transactions
           headers: { Authorization: 'Apikey {CASSO_API_KEY}' }
           params:  { fromDate: 'YYYY-MM-DD', pageSize: 50, sort: 'DESC' }
                │
                ▼
           records.find(tx => 
             tx.amount > 0 &&
             tx.description.toUpperCase().includes(bookingCode) &&
             Math.abs(tx.amount - booking.totalPrice) <= 1000
           )
                │
         ┌──────┴──────┐
        YES            NO
         │              │
         ▼              ▼
processSuccessfulPayment  return { paid: false }
         │
         ▼
[FE] data.paid === true
  → clearInterval(pollRef)
  → navigate('/payment-success', state)
```

---

## 4. Cấu hình môi trường

### BE/.env

```env
# Casso — bắt buộc để thanh toán MB Bank hoạt động
CASSO_API_KEY=AK_CS.xxxxxxxxxxxxxxxxxxxx

# Không cần cấu hình thêm phía BE cho MB Bank
# VietQR chỉ dùng ở FE (public API, không cần key)
```

### FE — hardcoded trong BankTransferPaymentPage.jsx

```js
const MB_ACCOUNT      = "0964717591";     // số tài khoản MB Bank
const MB_ACCOUNT_NAME = "DUONG ANH DUC";  // tên chủ tài khoản
const MB_BANK_CODE    = "MB";             // bank code VietQR
```

Nếu muốn đổi tài khoản ngân hàng: sửa 3 hằng số này + đăng ký tài khoản mới trên Casso.

### Lấy CASSO_API_KEY

1. Đăng ký tại [casso.vn](https://casso.vn)
2. Kết nối tài khoản MB Bank
3. Vào **Settings → API** → copy API Key
4. Paste vào `BE/.env`

> **Lưu ý:** `CASSO_API_KEY` phải khớp với tài khoản MB Bank đã kết nối trong Casso. Nếu sai key, hàm `findMatchingTransaction` trả về `null` và thanh toán sẽ không được xác nhận tự động.

---

## 5. API Endpoints

### `GET /api/payments/casso/status/:bookingId`

FE poll mỗi 1500ms. Yêu cầu JWT (`protect` middleware).

**Request:**
```
Authorization: Bearer <access_token>
```

**Response — chưa thanh toán:**
```json
{ "paid": false }
```

**Response — đã thanh toán:**
```json
{
  "paid": true,
  "bookingId": "...",
  "bookingCode": "BK1748234567",
  "movieTitle": "...",
  "cinemaName": "...",
  "roomName": "...",
  "showTime": "19:30",
  "showDate": "08/06/2026",
  "selectedSeats": ["A1", "A2"],
  "finalTotalPrice": 180000,
  "poster": "https://...",
  "combos": []
}
```

**Response — booking đã paid từ trước (không cần gọi Casso):**
Tương tự trên, trả về ngay mà không gọi API Casso.

**Response — lỗi:**
```json
{ "message": "Booking not found" }   // 404
{ "message": "..." }                  // 500
```

---

### `POST /api/payments/casso/webhook`

Casso gọi webhook này khi phát hiện giao dịch mới. Không yêu cầu authentication (tùy chọn cấu hình secret).

**Request body (từ Casso):**
```json
{
  "error": 0,
  "data": [
    {
      "id": 123456,
      "tid": "FT24ABC",
      "description": "5CINE BK1748234567",
      "amount": 180000,
      "reference": "...",
      "when": "2026-06-08T10:00:00Z"
    }
  ]
}
```

**Logic:**
1. Với mỗi transaction trong `data`
2. Extract booking codes từ `description` (`BK[0-9A-Z]{8,}`)
3. `Booking.findOne({ bookingCode: { $in: codes }, status: 'pending' })`
4. Kiểm tra amount tolerance ±1000đ
5. Gọi `processSuccessfulPayment`

**Response:** `{ "error": 0 }`

---

---

## 6. Logic khớp giao dịch

```js
// Trong findMatchingTransaction() — casso.js:85
return records.find((tx) => {
    if (tx.amount <= 0) return false;
    const desc = (tx.description || '').toUpperCase();
    if (!desc.includes(bookingCode)) return false;           // bookingCode phải xuất hiện trong description
    if (Math.abs(tx.amount - booking.totalPrice) > 1000) return false;  // tolerance 1000đ
    return true;
}) || null;
```

**Các điểm quan trọng:**

| Điểm | Chi tiết |
|------|---------|
| Tìm trong 24h gần nhất | `fromDate = new Date(Date.now() - 24h)` |
| pageSize | 50 giao dịch gần nhất (sort DESC) |
| bookingCode so sánh | `toUpperCase()` — case-insensitive |
| Amount tolerance | ±1000đ — cho phép sai lệch phí chuyển khoản |
| Nếu nhiều booking khớp | `find()` lấy cái đầu tiên tìm thấy |
| Atomic update | `findOneAndUpdate({ status: 'pending' })` — tránh double-confirm |

**Format nội dung chuyển khoản FE tạo ra:**
```js
const transferContent = `5CINE ${bookingCode}`;
// Ví dụ: "5CINE BK1748234567"
```

**Regex extract bookingCode trong webhook:**
```js
/BK[0-9A-Z]{8,}/g
// Match: BK + 8 ký tự số/chữ hoa trở lên
```

---

## 7. processSuccessfulPayment — Side effects

```js
async function processSuccessfulPayment(bookingId, transactionId, amount) {
    // 1. Atomic update — findOneAndUpdate tránh race condition
    const booking = await Booking.findOneAndUpdate(
        { _id: bookingId, status: 'pending' },   // chỉ update nếu vẫn còn pending
        { $set: { status: 'paid' } },
        { returnDocument: 'after' }
    );
    if (!booking) return;  // đã được xử lý bởi request trước → skip

    // 2. Tạo Payment record
    const payment = new Payment({
        booking: bookingId,
        method: 'qr',          // method = 'qr' cho MB Bank (Casso)
        amount,
        transactionId,          // Casso tid
        status: 'success',
        paymentDate: new Date()
    });
    await payment.save();
    booking.paymentId = payment._id;
    await booking.save();

    // 3. Cập nhật trạng thái ghế → booked
    await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'booked' });

    // 4. Populate đầy đủ để gửi email
    const ctx = await Booking.findById(bookingId).populate(...);

    // 5. Email user (async, không await — không block response)
    await sendPaymentSuccessEmail(ctx, 'qr').catch(() => {});

    // 6. Email admin
    sendAdminPaymentNotificationEmail(ctx, 'qr').catch(() => {});

    // 7. Notification in-app
    notificationService.createNotification({ type: 'payment_paid', ... });
}
```

**Race condition được xử lý:** Nếu FE poll 2 request cùng lúc và cả 2 đều thấy giao dịch phù hợp, chỉ request đầu tiên thực sự update (do `status: 'pending'` filter). Request thứ hai sẽ thấy `booking === null` và return ngay.

---

## 8. FE Polling

```jsx
// BankTransferPaymentPage.jsx

// Interval 1500ms
useEffect(() => {
    pollRef.current = setInterval(pollStatus, 1500);
    qrTimerRef.current = setTimeout(() => setQrPhase(false), 3000); // ẩn QR sau 3s
    return () => {
        clearInterval(pollRef.current);
        clearTimeout(qrTimerRef.current);
    };
}, []);

const pollStatus = async () => {
    try {
        const data = await getCassoStatus(bookingId);
        if (data.paid) handlePaid(location.state);
    } catch { /* silent — không toast */ }
};

// Khi navigate đến /payment-success
const handlePaid = (state) => {
    clearInterval(pollRef.current);
    clearTimeout(qrTimerRef.current);
    navigate('/payment-success', {
        state: { ...state, orderId: bookingCode, bookingId, paymentMethod: 'bank' }
    });
};
```

**State truyền sang PaymentSuccessPage:**
```js
{
    ...state,               // tất cả state từ PaymentPage (movieTitle, seats, v.v.)
    orderId: bookingCode,   // dùng để hiển thị mã đơn
    bookingId,              // dùng để FE stream SSE ticket_printed event
    paymentMethod: 'bank'
}
```

**getCassoStatus trong payment-service.js:**
```js
export const getCassoStatus = (bookingId) =>
    axiosInstance.get(`/payments/casso/status/${bookingId}`).then(r => r.data);
```

---

## 9. Webhook (tùy chọn)

Webhook cho phép Casso chủ động push vào BE thay vì FE phải poll. Hiện tại FE vẫn poll độc lập — webhook chỉ là cơ chế backup.

**Cách cấu hình trong Casso:**
1. Vào Casso dashboard → Settings → Webhook
2. URL: `https://{SERVER_URL}/api/payments/casso/webhook`
3. Chọn event: `Transaction created`

**Lưu ý:** Webhook URL phải public (không phải localhost). Dùng ngrok hoặc deploy lên server thật.

**Test webhook local với ngrok:**
```bash
ngrok http 5000
# Copy URL ngrok → paste vào Casso webhook config
# Casso sẽ gọi: https://xxxx.ngrok-free.app/api/payments/casso/webhook
```

---

## 10. Models liên quan

### Booking

```js
{
    _id: ObjectId,
    bookingCode: String,      // e.g. "BK1748234567" — dùng để match giao dịch
    status: String,           // 'pending' | 'paid' | 'cancelled'
    totalPrice: Number,       // dùng để so sánh amount
    seats: [ObjectId],        // ref Seat
    seatNumbers: [String],    // e.g. ["A1", "A2"] — hiển thị
    user: ObjectId,           // ref User
    showtime: ObjectId,       // ref Showtime
    paymentId: ObjectId,      // ref Payment — được set sau khi thanh toán
    extraItems: Array,        // combos
    expiresAt: Date,          // booking tự hủy sau 5 phút nếu chưa thanh toán
}
```

### Payment

```js
{
    _id: ObjectId,
    booking: ObjectId,        // ref Booking
    method: String,           // 'qr' cho MB Bank (Casso); 'momo' cho MoMo; 'cash'
    amount: Number,
    transactionId: String,    // Casso tid
    status: String,           // 'success' | 'failed' | 'pending'
    paymentDate: Date,
}
```

### Seat

```js
{
    _id: ObjectId,
    status: String,           // 'available' | 'reserved' | 'booked'
    // ...
}
```

---

## 11. Cách test

### Test manual (không có CASSO_API_KEY)

Nếu `CASSO_API_KEY` trống, `findMatchingTransaction()` sẽ không được gọi. Để test flow thủ công:

```js
// Gọi trực tiếp qua curl (bypass FE polling):
curl -X GET http://localhost:5000/api/payments/casso/status/{bookingId} \
  -H "Authorization: Bearer {token}"
```

Hoặc update booking status trực tiếp trong MongoDB Atlas:
```js
db.bookings.updateOne(
  { bookingCode: "BK1748234567" },
  { $set: { status: "paid" } }
)
```
→ Lần poll tiếp theo FE sẽ nhận `paid: true`.

### Test với Casso sandbox

Casso không có sandbox rõ ràng — dùng tài khoản thật với số tiền nhỏ (1.000đ) để test.

Đảm bảo nội dung chuyển khoản chứa `bookingCode` đúng format.

### Test webhook với curl

```bash
curl -X POST http://localhost:5000/api/payments/casso/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "error": 0,
    "data": [{
      "tid": "TEST_TX_001",
      "description": "5CINE BK1748234567",
      "amount": 180000,
      "reference": "REF001"
    }]
  }'
```

---

## 12. Troubleshooting

### `paid: false` mãi không chuyển sang `paid: true`

**Kiểm tra theo thứ tự:**

1. **`CASSO_API_KEY` có được set không?**
   ```bash
   # Trong BE terminal log:
   console.log(process.env.CASSO_API_KEY)  # phải có giá trị
   ```

2. **Casso có đang nhận tiền không?**
   - Đăng nhập casso.vn → xem danh sách giao dịch
   - Nếu không thấy giao dịch → vấn đề phía ngân hàng/Casso

3. **Nội dung chuyển khoản có khớp không?**
   - FE hiển thị: `5CINE BK1748234567`
   - Casso lưu trong `description` field
   - BE so sánh: `desc.includes(bookingCode)` → bookingCode = `BK1748234567`

4. **Amount có trong tolerance không?**
   - `Math.abs(tx.amount - booking.totalPrice) <= 1000`
   - Nếu sai quá 1000đ → không khớp

5. **Casso API có trả về đúng không?**
   ```js
   // Thêm log tạm vào casso.js để debug:
   console.log('[casso] records:', records.length, records[0]);
   ```

6. **bookingCode hết hạn?**
   - Booking `expiresAt` < now → booking bị job hủy, status = `cancelled`
   - Tạo booking mới

### Lỗi `401 Unauthorized` từ Casso API

- API Key sai hoặc hết hạn
- Tài khoản MB Bank đã bị ngắt kết nối trong Casso
- Vào casso.vn → kiểm tra trạng thái kết nối

### Lỗi `ECONNREFUSED` / timeout khi gọi Casso

- Timeout mặc định: 5000ms (`axios timeout: 5000`)
- Kiểm tra network, firewall, DNS
- `BE/app.js` dòng 2 đã set DNS `8.8.8.8` — xem có được apply không

### Double-confirm (thanh toán 2 lần)

Không xảy ra — được xử lý bởi `findOneAndUpdate({ status: 'pending' })`. Nếu booking đã `paid`, update sẽ return `null` và hàm return sớm.

---

## 13. Mở rộng

### Đổi tài khoản ngân hàng khác (không phải MB Bank)

1. `BankTransferPaymentPage.jsx`:
   ```js
   const MB_ACCOUNT      = "SỐ_TK_MỚI";
   const MB_ACCOUNT_NAME = "TÊN_CHỦ_TK";
   const MB_BANK_CODE    = "BANK_CODE";  // xem danh sách tại vietqr.io/danh-sach-ngan-hang
   ```
2. Đăng ký tài khoản mới trên Casso

### Tăng số giao dịch Casso trả về

```js
// casso.js:88
params: { fromDate, pageSize: 100, sort: 'DESC' }  // tăng từ 50 lên 100
```

### Giảm interval polling

```jsx
// BankTransferPaymentPage.jsx:74
pollRef.current = setInterval(pollStatus, 1000);  // 1s thay vì 1500ms
```

Lưu ý: giảm interval sẽ tăng số request lên BE và Casso. Casso có rate limit — kiểm tra tài liệu Casso trước khi giảm quá thấp.

### Thêm secret verification cho Casso webhook

Hiện tại webhook không xác thực. Để bảo mật:

```js
// casso.js — thêm vào đầu POST /webhook handler:
const CASSO_WEBHOOK_SECRET = process.env.CASSO_WEBHOOK_SECRET || '';
if (CASSO_WEBHOOK_SECRET) {
    const signature = req.headers['x-casso-signature'];
    // verify signature theo docs Casso
    if (!isValidSignature(signature, req.body, CASSO_WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 1 });
    }
}
```
