# ✅ Render Deployment Checklist

## Pre-Deployment

- [ ] **Database Ready**
  - [ ] MongoDB Atlas tài khoản tạo
  - [ ] Cluster M0 (free) tạo thành công
  - [ ] Database User tạo (lưu username + password)
  - [ ] Connection String lấy được
  - [ ] IP Whitelist: 0.0.0.0/0
  - [ ] Test connection locally (optional)

- [ ] **Code Preparation**
  - [ ] Code build & run locally: `npm start`
  - [ ] Không có syntax errors
  - [ ] All dependencies trong package.json
  - [ ] .env file setup đúng

- [ ] **GitHub Ready**
  - [ ] GitHub repository tạo
  - [ ] Code push lên main branch
  - [ ] .env file trong .gitignore (an toàn!)
  - [ ] README.md có sẵn

## Deployment Steps

- [ ] **Render Dashboard Setup**
  - [ ] Tài khoản Render.com tạo
  - [ ] Connect GitHub account
  - [ ] New Web Service tạo
  - [ ] Repository chọn: 5cine-backend
  - [ ] Build command: `npm install`
  - [ ] Start command: `npm start`
  - [ ] Region chọn
  - [ ] Plan: Free

- [ ] **Environment Variables**
  - [ ] NODE_ENV=production
  - [ ] MONGO_URI=mongodb+srv://...
  - [ ] JWT_SECRET=generated_random_32_chars
  - [ ] FRONTEND_URL=https://...
  - [ ] VNPAY_TMN_CODE=...
  - [ ] VNPAY_HASH_SECRET=...
  - [ ] EMAIL_HOST=smtp.gmail.com
  - [ ] EMAIL_PORT=587
  - [ ] EMAIL_USER=...
  - [ ] EMAIL_PASSWORD=...

- [ ] **Initial Deploy**
  - [ ] Deploy process starts
  - [ ] Logs show no errors
  - [ ] "Deploy successful" message
  - [ ] Service live (URL generated)

## Post-Deployment Tests

- [ ] **Health Check**
  - [ ] GET https://[your-service].render.com/api/health → 200 OK
  - [ ] GET https://[your-service].render.com/ → endpoints list

- [ ] **Database Connection**
  - [ ] Logs show: "✅ MongoDB connected"
  - [ ] No connection errors in logs
  - [ ] Can query database (test API)

- [ ] **API Testing**
  - [ ] POST /api/auth/register → works
  - [ ] GET /api/movies → returns data
  - [ ] GET /api/cinemas → returns data
  - [ ] CORS working (test từ frontend)

- [ ] **Frontend Integration**
  - [ ] Update FRONTEND_URL in render dashboard
  - [ ] Backend URL in frontend: https://[your-service].render.com
  - [ ] Login flow works
  - [ ] Booking flow works

## Common Issues Fixed

- [x] MongoDB connection optimized (retry logic)
- [x] PORT configuration ready for Render
- [x] CORS properly configured
- [x] Error handling middleware ready
- [x] Environment variables documented
- [x] .gitignore includes .env files
- [x] render.yaml configuration created

## Documentation Created

- [x] [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Chi tiết đầy đủ
- [x] [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Nhanh gọn 3 bước
- [x] [.env.render](./.env.render) - Template production

---

## Bước tiếp theo

1. ✅ Đọc [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - 5 phút
2. ✅ Chuẩn bị MongoDB Atlas - 10 phút
3. ✅ Push code lên GitHub - 2 phút
4. ✅ Deploy lên Render - 5 phút
5. ✅ Test API - 5 phút

**Tổng cộng: ~30 phút để deploy thành công!** 🎉
