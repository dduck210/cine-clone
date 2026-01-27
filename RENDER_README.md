# 🚀 5CINE Backend - Render Deployment Guide

## 📋 Tổng quan

Dự án này đã được cấu hình sẵn để deploy lên **Render.com** (PaaS platform miễn phí).

---

## 🎯 Điều cần biết trước

- **Node.js**: v18.x
- **Database**: MongoDB Atlas (không hỗ trợ local MongoDB trên Render)
- **Platform**: Render.com (free tier)
- **Thời gian setup**: ~30 phút

---

## 🔧 Các file cấu hình

| File | Mục đích |
|------|----------|
| `render.yaml` | Cấu hình tự động cho Render |
| `.env.render` | Template environment variables production |
| `.gitignore` | Bảo vệ file nhạy cảm |
| `package.json` | Dependencies & scripts |
| `src/server.js` | Entry point |
| `src/app.js` | Express app configuration |

---

## 📚 Hướng dẫn từng bước

### Xem hướng dẫn chi tiết:

**Bắt đầu nhanh (5-10 phút):**
```
→ Xem: QUICK_DEPLOY.md
```

**Chi tiết đầy đủ (30 phút):**
```
→ Xem: RENDER_DEPLOYMENT.md
```

**Checklist theo dõi:**
```
→ Xem: DEPLOY_CHECKLIST.md
```

---

## ⚡ Quick Start (3 bước)

### 1️⃣ Setup Database
```bash
# MongoDB Atlas: https://www.mongodb.com/cloud/atlas
# Lấy connection string: mongodb+srv://user:pass@cluster.mongodb.net/5cine_booking
```

### 2️⃣ Push lên GitHub
```bash
git add .
git commit -m "Init 5Cine Backend"
git push origin main
```

### 3️⃣ Deploy lên Render
```
1. Vào: https://dashboard.render.com
2. New Web Service → GitHub
3. Chọn repository
4. Add Environment Variables (xem dưới)
5. Deploy!
```

---

## 🔐 Environment Variables

Bạn cần cấu hình trên Render Dashboard:

```env
# Production
NODE_ENV=production
PORT=3000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/5cine_booking

# Authentication
JWT_SECRET=<generate-32-random-characters>
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# Payment (VNPAY)
VNPAY_TMN_CODE=your_code
VNPAY_HASH_SECRET=your_secret

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### Tạo JWT_SECRET

**Cách 1** - Terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Cách 2** - Run script:
```bash
npm run setup-render.bat  # Windows
```

---

## ✅ Kiểm tra Deploy

Sau khi deploy:

```bash
# Health check
curl https://[service-name].render.com/api/health

# API endpoint
curl https://[service-name].render.com/
```

Hoặc trên browser:
```
https://5cine-backend.render.com/api/health
https://5cine-backend.render.com/
```

---

## 📊 Thông tin Render Service

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên service** | 5cine-backend |
| **Runtime** | Node |
| **Region** | Singapore (nếu có) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

---

## 🔄 Auto-Deployment

Sau khi setup lần đầu, **mỗi khi bạn push code lên GitHub**, Render sẽ **tự động deploy**!

```bash
# Cập nhật code
git add .
git commit -m "Update feature X"
git push origin main  # ✨ Automatic deploy triggered!
```

---

## 🐛 Troubleshooting

### ❌ "Cannot find module"
```
→ Xem RENDER_DEPLOYMENT.md phần Troubleshooting
```

### ❌ "MongoDB connection failed"
```
→ Kiểm tra MONGO_URI trên Render dashboard
→ Whitelist IP: 0.0.0.0/0 trên MongoDB Atlas
```

### ❌ "CORS Error"
```
→ Update FRONTEND_URL trên Render dashboard
→ Check corsOptions trong src/app.js
```

### ❌ "Build fails"
```
→ Xem logs trên Render dashboard
→ Test locally: npm start
```

---

## 📚 Tài liệu hữu ích

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Express.js](https://expressjs.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-web-app/)

---

## 📞 Support

Nếu gặp vấn đề:

1. ✅ Xem [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Có hầu hết câu trả lời
2. ✅ Xem logs trên Render Dashboard
3. ✅ Test locally: `npm start`
4. ✅ Check MongoDB Atlas connection

---

## 🎉 Bạn đã sẵn sàng!

Follow các hướng dẫn trên để deploy thành công! 🚀

---

**Tài liệu cập nhật:** January 2026
