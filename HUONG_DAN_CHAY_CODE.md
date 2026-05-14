# Hướng dẫn cài đặt & chạy dự án 5Cine

> Đọc kỹ từng bước, làm theo thứ tự. Không bỏ qua bước nào.

---

## Mục lục

1. [Yêu cầu môi trường](#1-yêu-cầu-môi-trường)
2. [Lấy source code](#2-lấy-source-code)
3. [Chạy Backend](#3-chạy-backend)
4. [Chạy Frontend](#4-chạy-frontend)
5. [Tài khoản test](#5-tài-khoản-test)
6. [Hướng dẫn test từng luồng](#6-hướng-dẫn-test-từng-luồng)
7. [Kiểm tra API bằng curl](#7-kiểm-tra-api-bằng-curl)
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu môi trường

Trước khi bắt đầu, cài đặt các phần mềm sau:

| Phần mềm | Phiên bản tối thiểu | Kiểm tra |
|----------|---------------------|----------|
| Node.js  | 18 trở lên          | `node -v` |
| npm      | 9 trở lên           | `npm -v`  |

> **Lưu ý:** Dự án dùng MongoDB Atlas (cloud), **không cần cài MongoDB** trên máy. Chỉ cần có kết nối Internet.

---

## 2. Lấy source code

### Nếu clone lần đầu:

```bash
git clone https://github.com/dduck210/cine-clone.git
cd cine-clone
```

### Nếu đã clone rồi, pull code mới nhất:

```bash
git pull origin main
```

Sau khi clone/pull, cấu trúc thư mục sẽ như sau:

```
cine-clone/
├── BE/          ← Backend (Node.js + Express)
├── FE/          ← Frontend (React + Vite)
└── HUONG_DAN_CHAY_CODE.md
```

---

## 3. Chạy Backend

### Bước 1 — Mở terminal, vào thư mục BE:

```bash
cd BE
```

### Bước 2 — Cài dependencies:

```bash
npm install
```

> Chờ npm cài xong (khoảng 1-2 phút lần đầu). Bước này chỉ cần làm 1 lần.

### Bước 3 — Kiểm tra file `.env`:

File `.env` đã có sẵn trong thư mục `BE/`, **không cần tạo thêm hay chỉnh sửa gì**. Nó chứa sẵn:
- URL kết nối MongoDB Atlas
- JWT secret key
- Thông tin MoMo sandbox

### Bước 4 — Khởi động Backend:

```bash
npm run dev
```

**Backend khởi động thành công** khi terminal hiển thị:

```
Server running on port 5000
MongoDB connected
```

> **Giữ terminal này mở**, đừng đóng lại. Backend chạy tại `http://localhost:5000`

---

## 4. Chạy Frontend

### Bước 1 — Mở thêm 1 terminal MỚI (giữ nguyên terminal backend đang chạy):

```bash
cd FE
```

### Bước 2 — Cài dependencies:

```bash
npm install
```

> Chờ npm cài xong (khoảng 1-2 phút lần đầu).

### Bước 3 — Khởi động Frontend:

```bash
npm run dev
```

**Frontend khởi động thành công** khi terminal hiển thị:

```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Bước 4 — Mở trình duyệt:

Truy cập: **http://localhost:5173**

Trang chủ 5Cine hiện ra là xong.

> **Lưu ý:** Frontend tự động proxy các request `/api/...` sang `http://localhost:5000` — không cần cấu hình gì thêm.

---

## 5. Tài khoản test

| Role  | Email            | Mật khẩu | Quyền hạn |
|-------|------------------|-----------|-----------|
| User  | user@cinema.com  | 123456    | Đặt vé, xem vé, xem lịch sử |
| Admin | admin@cinema.com | 123456    | Toàn bộ quyền + trang quản trị `/admin` |

---

## 6. Hướng dẫn test từng luồng

---

### Luồng 1 — Đăng ký tài khoản mới

1. Vào `http://localhost:5173`
2. Click nút **Đăng nhập** (góc phải trên cùng)
3. Cửa sổ hiện ra → chọn tab **Đăng ký**
4. Điền đầy đủ: Họ tên, Email, Mật khẩu
5. Bấm **Đăng ký**

**Kết quả mong đợi:** Tự động đăng nhập và chuyển về trang chủ. Góc trên phải hiện tên user.

---

### Luồng 2 — Đặt vé & thanh toán qua MoMo (sandbox)

**Bước 1 — Chọn phim và suất chiếu:**
1. Đăng nhập tài khoản **user**
2. Trang chủ → click vào 1 phim đang chiếu (có nút **Đặt vé**)
3. Bấm **Đặt vé** (hoặc vào trang chi tiết phim → bấm **Đặt vé**)
4. Chọn **ngày chiếu** và **suất chiếu** mong muốn

**Bước 2 — Chọn ghế:**
1. Bản đồ ghế hiện ra:
   - **Ghế xám** = còn trống, có thể chọn
   - **Ghế đỏ** = đã được đặt, không chọn được
2. Click vào ghế muốn ngồi (có thể chọn nhiều ghế)
3. Ghế đã chọn chuyển sang màu xanh lá
4. Bấm **Tiếp tục**

**Bước 3 — Chọn combo (tuỳ chọn):**
- Chọn thêm bắp rang / nước uống nếu muốn
- Bấm **Tiếp tục**

**Bước 4 — Điền thông tin và thanh toán:**
1. Điền Họ tên, Số điện thoại, Email nhận vé
2. Chọn phương thức thanh toán: **Ví MoMo**
3. Bấm **THANH TOÁN QUA MOMO**

**Bước 5 — Thanh toán trên trang MoMo sandbox:**

Trình duyệt chuyển sang trang MoMo test. Dùng một trong hai cách sau:

**Cách 1 — Thanh toán bằng Ví MoMo test:**

| Trường         | Giá trị    |
|----------------|------------|
| Số điện thoại  | `0000000000` |
| OTP            | `000000`   |

**Cách 2 — Thanh toán bằng thẻ ATM nội địa (Napas):**

| Trường          | Giá trị              |
|-----------------|----------------------|
| Số thẻ          | `9704 0000 0000 0018` |
| Tên chủ thẻ     | `NGUYEN VAN A`       |
| Ngày phát hành  | `03/07`              |
| OTP             | `otp`                |

6. Bấm **Xác nhận** / **Thanh toán**

**Kết quả mong đợi:** Trình duyệt redirect về trang vé điện tử có **QR code**, thông tin phim, ghế ngồi, mã vé.

---

### Luồng 3 — Đặt vé & thanh toán tiền mặt tại quầy

**Bước 1 đến 3:** Làm giống Luồng 2 (chọn phim → suất → ghế → combo)

**Bước 4 — Chọn tiền mặt:**
1. Điền thông tin liên hệ
2. Chọn phương thức thanh toán: **Tiền mặt**
3. Bấm **XÁC NHẬN THANH TOÁN**

**Kết quả mong đợi:**
- Trang vé hiện ra với **biểu tượng đồng hồ** thay vì QR code
- Có thông báo "QR xuất hiện sau khi thanh toán tại quầy"
- Trạng thái vé: **Chờ thanh toán**

---

### Luồng 4 — Admin xác nhận thanh toán tiền mặt

> Làm sau Luồng 3. Dùng tài khoản admin để xác nhận đơn vừa đặt.

1. Mở tab/cửa sổ mới, vào `http://localhost:5173`
2. Đăng nhập bằng tài khoản **admin** → tự động chuyển vào `/admin`
3. Sidebar trái → click **Đơn hàng**
4. Tìm đơn hàng vừa đặt:
   - **Status:** Chờ thanh toán
   - **Phương thức:** Tiền mặt
5. Bấm nút **Xác nhận** (màu xanh) ở cột Action

**Kết quả mong đợi:**
- Status đơn đổi thành **Đã thanh toán**
- Quay lại tab user → vào **Vé của tôi** → F5 trang
- Vé bây giờ hiển thị **QR code** đầy đủ

---

### Luồng 5 — Xem lịch sử vé

1. Đăng nhập tài khoản user
2. Click vào **avatar** góc trên phải → chọn **Vé của tôi**
   - Hoặc truy cập thẳng: `http://localhost:5173/my-tickets`
3. Lọc theo tab:
   - **Tất cả** — toàn bộ vé
   - **Sắp chiếu** — vé đã thanh toán, phim chưa chiếu
   - **Đã xem** — phim đã chiếu xong
   - **Đã hủy** — vé bị hủy
4. Click vào 1 vé → xem chi tiết vé điện tử

**Kết quả mong đợi:** Hiện đầy đủ thông tin vé (phim, rạp, ghế, giờ chiếu, QR code nếu đã thanh toán).

---

### Luồng 6 — Admin quản lý người dùng

1. Đăng nhập **admin** → vào `/admin`
2. Sidebar → click **Thành viên**
3. Danh sách tất cả user hiển thị
4. Tìm kiếm: gõ tên vào ô tìm kiếm → danh sách tự lọc
5. **Sửa user:** Click icon **bút chì** → chỉnh tên hoặc đổi role (user ↔ admin) → Lưu
6. **Xóa user:** Click icon **thùng rác** → xác nhận xóa

> **Lưu ý:** Không thể xóa tài khoản admin. Nút xóa sẽ bị vô hiệu hóa với tài khoản có role admin.

---

### Luồng 7 — Admin quản lý phim

1. Đăng nhập **admin** → vào `/admin`
2. Sidebar → click **Quản lý Phim**

**Thêm phim mới:**
1. Bấm **+ Thêm phim mới** (góc trên phải)
2. Điền đầy đủ thông tin: Tên phim, thể loại, thời lượng, mô tả, poster URL, trailer URL
3. Bấm **Lưu**

**Chỉnh sửa phim:**
1. Click icon **bút chì** bên cạnh tên phim
2. Cập nhật thông tin → Lưu

**Xóa phim:**
1. Click icon **thùng rác**
2. Bấm **Xác nhận** trong hộp thoại

---

### Luồng 8 — Admin quản lý suất chiếu

1. Đăng nhập **admin** → vào `/admin`
2. Sidebar → click **Quản lý Suất chiếu**
3. Thêm suất chiếu mới: chọn phim, rạp, phòng chiếu, ngày, giờ, giá vé
4. Chỉnh sửa hoặc xóa suất chiếu tương tự quản lý phim

---

## 7. Kiểm tra API bằng curl

> Dùng để test nhanh backend mà không cần mở trình duyệt.

```bash
# Kiểm tra backend đang chạy
curl http://localhost:5000/api/movies

# Đăng nhập lấy token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@cinema.com","password":"123456"}'

# Lấy danh sách suất chiếu
curl http://localhost:5000/api/showtimes

# Lấy danh sách rạp
curl http://localhost:5000/api/cinemas
```

---

## 8. Xử lý lỗi thường gặp

### Backend không khởi động được

**Triệu chứng:** Terminal báo lỗi sau khi `npm run dev`

**Kiểm tra:**
1. Chắc chắn đang đứng trong thư mục `BE/` (không phải thư mục gốc hay `FE/`)
2. Chạy `npm install` trước nếu chưa cài
3. Kiểm tra file `.env` có tồn tại trong `BE/` không

---

### Frontend không kết nối được backend

**Triệu chứng:** Trang web hiển thị nhưng không load được dữ liệu phim, login lỗi

**Kiểm tra:**
1. Backend đang chạy chưa? Mở terminal backend xem có báo lỗi không
2. Backend phải chạy ở port **5000** (kiểm tra trong file `.env`: `PORT=5000`)
3. Thử truy cập `http://localhost:5000/api/movies` trong trình duyệt — nếu ra JSON là backend ổn

---

### Lỗi "Cannot connect to MongoDB"

**Triệu chứng:** Terminal backend báo lỗi kết nối MongoDB

**Nguyên nhân:** Mất kết nối Internet hoặc MongoDB Atlas bị chặn

**Cách xử lý:**
1. Kiểm tra kết nối Internet
2. Thử mở `https://cloud.mongodb.com` trong trình duyệt xem có vào được không
3. Một số mạng trường/công ty block MongoDB Atlas — thử dùng mạng khác hoặc VPN

---

### Thanh toán MoMo báo lỗi

**Triệu chứng:** Bấm thanh toán MoMo nhưng hiện thông báo lỗi

**Nguyên nhân thường gặp:**
- Số tiền booking = 0 (chọn ghế nhưng không có giá)
- Booking đã hết hạn (pending quá lâu)

**Cách xử lý:** Tạo booking mới, đặt vé lại từ đầu

---

### Port 5000 hoặc 5173 bị chiếm

**Triệu chứng:** Lỗi `EADDRINUSE: address already in use :::5000`

**Windows:**
```powershell
# Tìm process đang dùng port 5000
netstat -ano | findstr :5000
# Lấy PID từ kết quả, kill process đó
taskkill /PID <số_pid> /F
```

**macOS/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

Sau đó khởi động lại `npm run dev`.

---

## Tóm tắt nhanh

```
Terminal 1 (Backend):
  cd BE → npm install → npm run dev
  → Chờ thấy "MongoDB connected"

Terminal 2 (Frontend):
  cd FE → npm install → npm run dev
  → Mở http://localhost:5173
```

| Tài khoản | Email              | Mật khẩu |
|-----------|--------------------|----------|
| User      | user@cinema.com    | 123456   |
| Admin     | admin@cinema.com   | 123456   |
