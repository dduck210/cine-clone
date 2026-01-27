# 🚀 Hướng dẫn Deploy Backend lên Render.com

## 📋 Yêu cầu chuẩn bị

1. **Tài khoản Render.com** - Đăng ký tại https://render.com
2. **GitHub Repository** - Push code lên GitHub
3. **MongoDB Atlas** - Database (không dùng local MongoDB)
4. **Environment Variables** - Chuẩn bị các biến môi trường

---

## 🔧 Bước 1: Chuẩn bị Database

### Tạo MongoDB Atlas Free Tier:
1. Truy cập https://www.mongodb.com/cloud/atlas
2. Tạo tài khoản (hoặc đăng nhập)
3. Tạo mới một **Cluster** (chọn M0 Free Tier)
4. Chọn region gần nhất với Render (tùy chọn)
5. Tạo **Database User** (lưu username & password)
6. Whitelist IP address: **0.0.0.0/0** (cho phép mọi IP)
7. Lấy **Connection String**:
   - Click "Connect"
   - Chọn "Drivers"
   - Copy connection string (dạng: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Thêm database name vào cuối: `/5cine_booking`

---

## 📤 Bước 2: Push Code lên GitHub

```bash
# 1. Khởi tạo Git (nếu chưa có)
git init

# 2. Thêm tất cả files
git add .

# 3. Commit
git commit -m "Init 5Cine Backend"

# 4. Thêm remote GitHub
git remote add origin https://github.com/your-username/5cine-backend.git

# 5. Push lên GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 Bước 3: Deploy lên Render

### Option 1: Sử dụng Render Dashboard (Dễ nhất)

1. Đăng nhập vào https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Deploy an existing repository"**
4. Kết nối GitHub account (authorize)
5. Chọn repository: `5cine-backend`
6. Cấu hình:
   - **Name**: `5cine-backend`
   - **Environment**: `Node`
   - **Region**: Chọn region (Singapore nếu có)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Option 2: Sử dụng render.yaml (Tự động)

1. File `render.yaml` đã có sẵn
2. Push code lên GitHub
3. Render sẽ tự động detect và deploy

---

## 🔐 Bước 4: Cấu hình Environment Variables

Trên Render Dashboard:

1. Đi đến **Web Service** → **Environment**
2. Thêm các biến sau:

```
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/5cine_booking
JWT_SECRET=<generate_random_32_chars>
FRONTEND_URL=https://your-frontend-domain.com
VNPAY_TMN_CODE=your_code
VNPAY_HASH_SECRET=your_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Tạo JWT_SECRET ngẫu nhiên:

**Cách 1:** Chạy lệnh trong terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Cách 2:** Sử dụng online tool:
https://www.uuidgenerator.net/ (copy 2-3 lần liên tiếp)

---

## 📝 Bước 5: Thiết lập Email (Gmail App Password)

Nếu muốn dùng email notifications:

1. Đăng nhập Gmail
2. Vào https://myaccount.google.com/apppasswords
3. Chọn **App**: Mail → **Device**: Windows Computer
4. Sao chép password được generate
5. Dùng password này làm `EMAIL_PASSWORD` trên Render

---

## ✅ Kiểm tra Deploy

1. Xem logs trên Render:
   ```
   Web Service → Logs
   ```

2. Test endpoint health:
   ```
   GET https://5cine-backend.render.com/api/health
   ```

3. Test root endpoint:
   ```
   GET https://5cine-backend.render.com/
   ```

---

## 🐛 Troubleshooting

### ❌ "Cannot find module"
- Chạy `npm install` locally xem có lỗi không
- Check `package.json` - các dependency có đầy đủ?

### ❌ MongoDB Connection Error
- Kiểm tra connection string có đúng không
- Whitelist IP: 0.0.0.0/0
- Check username/password không có ký tự đặc biệt cần escape

### ❌ Build fails
- Check build command: `npm install`
- Xem logs chi tiết trên Render
- Test locally: `npm start` trong thư mục BE/

### ❌ Port issues
- Render tự động set PORT - không cần lo
- Code đã handle: `PORT = process.env.PORT || 5000`

### ❌ CORS errors
- Update `FRONTEND_URL` trên Render
- Check `corsOptions` trong `app.js`

---

## 🔄 Deploy Updates

Khi cập nhật code:

```bash
git add .
git commit -m "Update: description"
git push origin main
```

Render sẽ **tự động redeploy** (nếu cấu hình đúng).

---

## 📚 Tài liệu hữu ích

- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Express.js](https://expressjs.com/)
- [Socket.io Deployment](https://socket.io/docs/v4/deployment/#deployment-with-multiple-nodejs-servers)

---

## 🎉 Xong!

Nếu mọi thứ OK, bạn sẽ có:
- **Backend URL**: `https://5cine-backend.render.com`
- **Health Check**: `https://5cine-backend.render.com/api/health`

Update `FRONTEND_URL` trên frontend để kết nối!
