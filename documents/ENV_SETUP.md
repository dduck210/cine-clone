# 🔐 Environment Variables - Hướng dẫn chi tiết

## Overview

File `.env` chứa tất cả cấu hình nhạy cảm (passwords, keys, URLs).

⚠️ **QUAN TRỌNG**: Không bao giờ commit `.env` lên GitHub! (đã có trong .gitignore)

---

## Biến bắt buộc (REQUIRED)

### 1. Database - MONGO_URI
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/5cine_booking
```

**Cách lấy:**
1. Tạo account: https://mongodb.com/cloud/atlas
2. Tạo Cluster M0 (free)
3. Tạo Database User (lưu username + password)
4. Click "Connect" → "Drivers"
5. Copy connection string
6. Thêm database name vào cuối: `/5cine_booking`

**Ví dụ:**
```
MONGO_URI=mongodb+srv://hoannvbo:hoannvbo123@cluster0.mzy5guk.mongodb.net/5cine_booking
```

### 2. JWT Secret - JWT_SECRET
```
JWT_SECRET=your_32_character_random_string_here
```

**Tạo JWT_SECRET:**
```bash
# Option 1: Terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Quy tắc:**
- Tối thiểu 32 ký tự
- Chứa chữ cái, số (không có ký tự đặc biệt)
- Không được để giống nhau trong cơ sở dữ liệu khác

---

## Biến tùy chọn (OPTIONAL nhưng nên cấu hình)

### 3. Server Configuration
```
NODE_ENV=development    # development | production
PORT=5000               # Render sẽ override
```

### 4. Frontend URL - FRONTEND_URL
```
FRONTEND_URL=http://localhost:3000
```

**Khi deploy production:**
```
FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Payment Gateway - VNPAY
```
VNPAY_TMN_CODE=your_vnpay_terminal_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret_key
```

**Cách lấy:**
1. Đăng ký: https://sandbox.vnpayment.vn/
2. Tạo merchant account
3. Lấy TMN_CODE và HASH_SECRET

### 6. Payment Gateway - MOMO
```
MOMO_ACCESS_KEY=your_access_key
MOMO_SECRET_KEY=your_secret_key
MOMO_PARTNER_CODE=your_partner_code
```

**Cách lấy:**
1. Đăng ký: https://momo.vn/
2. Tạo merchant account
3. Lấy keys từ dashboard

### 7. Email Configuration
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=5Cine <noreply@5cine.com>
```

**Thiết lập Gmail App Password:**
1. Bật 2FA trên Gmail
2. Vào: https://myaccount.google.com/apppasswords
3. Chọn App: Mail → Device: Windows Computer
4. Copy password → dùng làm EMAIL_PASSWORD

### 8. Logging
```
LOG_LEVEL=debug    # Khi development
LOG_LEVEL=info     # Khi production
```

---

## 📋 Bảng tham khảo nhanh

| Biến | Dev Value | Prod Value | Required |
|------|-----------|-----------|----------|
| MONGO_URI | local hoặc Atlas | Atlas | ✅ |
| JWT_SECRET | any 32+ char string | secure random | ✅ |
| NODE_ENV | development | production | ⭐ |
| FRONTEND_URL | http://localhost:3000 | https://domain.com | ✅ |
| PORT | 5000 | auto (Render) | ⭐ |
| VNPAY_TMN_CODE | test_code | real_code | ⭐ |
| EMAIL_USER | test@gmail.com | real@gmail.com | ⭐ |

**✅ = Bắt buộc**
**⭐ = Nên cấu hình**

---

## 🚀 Cấu hình cho Render

Tạo file `.env.render` với:

```env
# Production
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/5cine_booking

# JWT
JWT_SECRET=your_generated_32_char_secret

# Frontend
FRONTEND_URL=https://your-frontend.render.com

# Payment & Email
VNPAY_TMN_CODE=your_prod_code
VNPAY_HASH_SECRET=your_prod_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

## ✅ Validation Checklist

- [ ] MONGO_URI không rỗng
- [ ] JWT_SECRET >= 32 ký tự
- [ ] FRONTEND_URL bắt đầu với http:// hoặc https://
- [ ] EMAIL_PASSWORD là App Password (không regular password)
- [ ] VNPAY_TMN_CODE từ VNPay dashboard
- [ ] Không có trailing/leading spaces
- [ ] Không có quote characters

---

## 🔒 Security Tips

1. **Không commit .env** → Check .gitignore
2. **Unique JWT_SECRET** → Generate riêng cho mỗi environment
3. **Không share secrets** → Không paste vào chat/email
4. **Rotate keys định kỳ** → Mỗi 3-6 tháng
5. **Use environment variables** → Không hardcode trong code
6. **Log level = info trên prod** → Tránh leak sensitive data

---

## 🐛 Debug Issues

| Issue | Giải pháp |
|-------|----------|
| "Cannot connect to MongoDB" | Check MONGO_URI, whitelist IP on Atlas |
| "Invalid JWT" | Check JWT_SECRET length (>= 32 chars) |
| "CORS Error" | Update FRONTEND_URL, check corsOptions |
| "Email not working" | Use Gmail App Password, not regular password |
| "Payment failed" | Check VNPAY keys, test on sandbox first |

---

## 📚 Reference Files

- `.env` - Local development
- `.env.render` - Production template
- `src/app.js` - CORS configuration
- `src/config/db.js` - Database connection

---

**Updated:** January 2026
