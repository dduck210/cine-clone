# Hướng Dẫn Test Luồng Voucher

---

## 1. Khởi động server

```bash
# Terminal 1 — Backend
cd BE && npm run dev

# Terminal 2 — Frontend
cd FE && npm run dev
```

---

## 2. Tạo voucher mẫu (Admin)

1. Vào `http://localhost:5173/admin` → đăng nhập `admin@cinema.com` / `123456`
2. Sidebar → **Voucher** → bấm **Tạo voucher**
3. Điền form:

| Field | Giá trị |
|---|---|
| Mã code | `GIAM20` |
| Loại | Phần trăm (%) |
| Giảm (%) | `20` |
| Giảm tối đa (đ) | `100000` |
| Đơn tối thiểu | `50000` |
| Hết hạn | Chọn ngày mai |
| Tổng lượt dùng | `10` |
| Lượt / user | `1` |

4. Bấm **Tạo voucher** → thấy dòng mới trong bảng, toggle **Đang bật**

---

## 3. Test nhập mã khi đặt vé (User)

1. Mở tab mới, đăng nhập tài khoản user thường
2. Chọn phim → chọn suất chiếu → trang đặt vé
3. Click vào ít nhất **1 ghế** → bấm **Tiếp tục** (sang step 2)
4. Tìm ô **Mã giảm giá** màu tím ở đầu trang
5. Nhập `GIAM20` → bấm **Áp dụng**

**Kết quả đúng:**

- Ô hiện: `GIAM20 −xxđ` + nút `×` để xóa
- Panel bên phải hiện thêm dòng tím: `Voucher GIAM20 −xxđ`
- Tổng cộng giảm đúng 20% (tối đa 100,000đ)

6. Tiếp tục thanh toán bình thường → đặt vé thành công

---

## 4. Test các trường hợp lỗi

| Tình huống | Cách thực hiện | Thông báo mong đợi |
|---|---|---|
| Mã không tồn tại | Nhập `ABCXYZ` | "Mã giảm giá không tồn tại hoặc đã hết hạn" |
| Mã bị tắt | Admin toggle OFF → nhập lại | "Mã giảm giá không tồn tại hoặc đã hết hạn" |
| Đơn chưa đủ min | Tạo voucher `minOrder=9999999` → nhập | "Đơn tối thiểu ...đ để dùng mã này" |
| Dùng lại lần 2 | Sau khi đặt xong → đặt vé khác → nhập `GIAM20` | "Bạn đã sử dụng mã này rồi" |
| Hết tổng lượt | Tạo voucher `usageLimit=1`, dùng xong → user khác nhập | "Mã giảm giá đã hết lượt sử dụng" |

---

## 5. Xác nhận BE đã apply đúng

Sau khi booking thành công, kiểm tra qua **Admin → Đơn đặt vé** hoặc gọi thẳng API:

```
GET /api/bookings/:id
→ booking.voucherDiscount  phải > 0
→ booking.totalPrice       phải = (ghế + combo) - mondayDiscount - voucherDiscount
```

Hoặc kiểm tra voucher:

```
GET /api/vouchers/admin  (đăng nhập admin)
→ voucher.usedCount  tăng lên 1
```

---

## 6. Test stack với Gold Monday (tùy chọn)

1. Tạo suất chiếu vào **Thứ Hai** (hoặc đổi ngày máy tính thành Thứ Hai khi test local)
2. Đặt vé → nhập voucher `GIAM20`
3. Panel summary phải hiện **2 dòng giảm**:
   - `Gold Monday −20%` → giảm 20% giá gốc
   - `Voucher GIAM20 −xxđ` → giảm thêm 20% tính trên giá sau Monday

---

## 7. Giải thích logic "giảm % + tối đa"

| Giá đơn | 20% tính ra | Thực tế giảm | Lý do |
|---|---|---|---|
| 200,000đ | 40,000đ | **40,000đ** | 40k < 100k → dùng 20% |
| 400,000đ | 80,000đ | **80,000đ** | 80k < 100k → dùng 20% |
| 600,000đ | 120,000đ | **100,000đ** | 120k > 100k → bị chặn lại |
| 1,000,000đ | 200,000đ | **100,000đ** | 200k > 100k → bị chặn lại |

> Bỏ trống `maxDiscount` = giảm đúng 20% không giới hạn.
