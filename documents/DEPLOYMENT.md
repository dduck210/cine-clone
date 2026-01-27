# 🚀 Hướng dẫn Deploy 5CINE Backend lên Render.com

## 📋 Yêu cầu

- Node.js v18.x trở lên
- npm v9.x trở lên
- MongoDB Atlas account (database cloud)
- Git & GitHub account
- Render.com account (free)

---

## 🔧 Chuẩn bị Môi Trường Local

### 1. Clone Project
```bash
cd c:\Users\hoank\OneDrive\Máy tính\DATN\BE
```

### 2. Cài đặt Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Copy .env.example thành .env
cp .env.example .env

# Hoặc trên Windows:
copy .env.example .env
```

### 4. Sửa File .env
Mở file `.env` và điền các giá trị:

```env
# MongoDB - Tạo tại mongodb.com
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/5cine_booking

# JWT Secret - Tạo bằng lệnh:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<paste_generated_secret_here>

# Frontend URL (lúc dev trên local)
FRONTEND_URL=http://localhost:3000

# Các thông tin payment khác (tuỳ chọn)
```

### 5. Chạy Local
```bash
# Development mode (auto reload)
npm run dev

# Hoặc production mode
npm start
```

Server sẽ chạy tại `http://localhost:5000`

Test endpoint: `http://localhost:5000/api/health`

---

## 🌐 Deploy lên Render.com

### Bước 1: Chuẩn Bị GitHub
```bash
# Tạo git repository nếu chưa có
git init
git add .
git commit -m "Initial commit - 5Cine Backend"

# Push lên GitHub
git branch -M main
git remote add origin https://github.com/your-username/5cine-backend.git
git push -u origin main
```

### Bước 2: Tạo MongoDB Atlas Database

1. Truy cập [mongodb.com](https://www.mongodb.com)
2. Tạo account và đăng nhập
3. Tạo project mới
4. Tạo cluster (chọn M0 - free tier)
5. Lấy connection string:
   - Security → Database Access → tạo user
   - Networking Access → Add IP → Allow from anywhere (0.0.0.0/0)
   - Databases → Connect → Copy connection string
6. Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/5cine_booking`

### Bước 3: Deploy trên Render

#### 3.1 Tạo Web Service
1. Truy cập [render.com](https://render.com)
2. Đăng nhập bằng GitHub
3. Click **+ New** → **Web Service**
4. Kết nối repository GitHub
5. Điền thông tin:
   - **Name**: `5cine-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

#### 3.2 Thêm Environment Variables
Trong trang Web Service, chọn **Environment**:

```env
NODE_ENV=production
PORT=5000

MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/5cine_booking
JWT_SECRET=<your_generated_secret>
JWT_EXPIRE=7d

FRONTEND_URL=https://your-frontend-domain.com

VNPAY_TMN_CODE=your_code
VNPAY_HASH_SECRET=your_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paygate/pay.html

MOMO_ACCESS_KEY=your_key
MOMO_SECRET_KEY=your_secret
MOMO_PARTNER_CODE=your_code

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=5Cine <noreply@5cine.com>

LOG_LEVEL=info
```

#### 3.3 Deploy
Click **Create Web Service** → Render sẽ tự động deploy

Chờ khoảng 2-3 phút cho deploy hoàn tất.

---

## 🔍 Kiểm Tra Deployment

### 1. Xem Logs
- Trong Render dashboard, chọn Web Service → **Logs**
- Kiểm tra có error gì không

### 2. Test API
```bash
# Health check
curl https://your-service-name.onrender.com/api/health

# Response:
{
  "status": "OK",
  "message": "Server is running ✅",
  "timestamp": "2024-01-27T...",
  "environment": "production"
}
```

### 3. Kết nối Frontend
- Cập nhật `FRONTEND_URL` ở .env trên Render
- Update URL API ở frontend:
```javascript
// Trong frontend app
const API_URL = 'https://your-service-name.onrender.com/api';
```

---

## 🔄 Cập Nhật Code

Sau khi deploy, mỗi khi bạn update code:

```bash
git add .
git commit -m "Update: description"
git push origin main
```

Render sẽ tự động redeploy trong 1-2 phút.

---

## 🛠️ Troubleshooting

### Error: "Cannot find module"
- Chạy `npm install` lại
- Kiểm tra package.json có đầy đủ dependencies không

### Error: "MongoDB connection failed"
- Kiểm tra MONGO_URI đúng không
- Kiểm tra IP whitelist (0.0.0.0/0) trên MongoDB Atlas
- Kiểm tra username/password đúng

### Error: "PORT already in use"
- Render tự động cấp port
- Không cần fix PORT cứng

### Server bị suspend sau 15 phút inactivity (Free Tier)
- Upgrade lên Paid Plan hoặc
- Sử dụng external service để ping server định kỳ

### CORS Error
- Kiểm tra FRONTEND_URL ở .env đúng không
- Kiểm tra frontend có gửi request tới đúng domain không

---

## 📊 Monitoring

### Xem Metrics
- Render Dashboard → Web Service → **Metrics**
- Xem CPU, Memory, Requests

### Xem Logs
- Render Dashboard → Web Service → **Logs**
- Xem real-time logs

---

## 🔐 Security Tips

1. **Luôn dùng HTTPS** (Render cung cấp miễn phí)
2. **Thay đổi JWT_SECRET** định kỳ
3. **Không commit .env file** (đã add .gitignore)
4. **Rotate database credentials** hàng quý
5. **Enable 2FA** trên GitHub & MongoDB

---

## 📞 Support

Nếu có vấn đề:
1. Kiểm tra Render logs
2. Kiểm tra Network tab ở browser DevTools
3. Kiểm tra MongoDB Atlas status
4. Xem error messages chi tiết

---

## ✅ Checklist Deployment

- [ ] Clone code từ GitHub
- [ ] npm install dependencies
- [ ] Cấu hình .env với đúng values
- [ ] Chạy và test local (npm run dev)
- [ ] Push code lên GitHub
- [ ] Tạo MongoDB Atlas
- [ ] Tạo Web Service trên Render
- [ ] Thêm environment variables
- [ ] Deploy và chờ build complete
- [ ] Test health endpoint
- [ ] Kết nối frontend và test E2E

---

**Happy Coding! 🎬**
