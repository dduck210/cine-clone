# ⚡ Quick Deploy Guide for Render

## 3 Bước đơn giản để deploy lên Render

### Bước 1: Chuẩn bị Database
```
1. Tạo tài khoản MongoDB Atlas (free tier)
2. Tạo Cluster M0
3. Tạo Database User
4. Lấy Connection String: mongodb+srv://user:pass@cluster.mongodb.net/5cine_booking
5. Whitelist IP: 0.0.0.0/0
```

### Bước 2: Push Code lên GitHub
```bash
git add .
git commit -m "Init 5Cine Backend"
git push origin main
```

### Bước 3: Deploy lên Render
1. Truy cập: https://dashboard.render.com
2. Click "New Web Service"
3. Kết nối GitHub & chọn repository
4. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free
5. Environment Variables:
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=(tạo random 32 chars)
   FRONTEND_URL=https://your-frontend.com
   ```
6. Click "Create Web Service"

### Kiểm tra kết quả
```
✅ Logs: https://dashboard.render.com/services/5cine-backend/logs
✅ Health: https://5cine-backend.render.com/api/health
✅ API: https://5cine-backend.render.com/
```

## Tạo JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

| Lỗi | Giải pháp |
|-----|----------|
| Cannot find module | npm install locally test |
| MongoDB connection | Check connection string, whitelist IP |
| CORS errors | Update FRONTEND_URL trên Render |
| Build fails | Xem logs chi tiết |

## Auto-deploy

Sau khi setup lần đầu, cứ `git push` là Render tự động deploy!

```bash
git push origin main  # ✨ Auto deploy
```

---

📖 Chi tiết: Xem [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
