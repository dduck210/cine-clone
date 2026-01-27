# ⚡ QUICKSTART - 5Cine Backend

**⏱️ Thời gian: 5 phút để chạy server local**

---

## 🎯 Quick Setup (Windows)

### Bước 1: Run Setup Script
```bash
.\setup.bat
```
Script sẽ tự động:
- Copy .env.example → .env
- Cài npm dependencies

### Bước 2: Cấu Hình .env
Mở file `.env` và cập nhật:

```env
# ⚠️ QUAN TRỌNG: MongoDB
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/5cine_booking

# ⚠️ QUAN TRỌNG: JWT Secret
JWT_SECRET=your_secret_key_min_32_characters

# Mặc định OK
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Bước 3: Chạy Server
```bash
npm run dev
```

**Output:**
```
╔═══════════════════════════════════════╗
║   🎬 5CINE BACKEND SERVER STARTED    ║
║   Port: 5000                           ║
║   Environment: development             ║
║   Database: Connected to MongoDB     ║
╚═══════════════════════════════════════╝
```

### Bước 4: Test API
```bash
# Mở browser hoặc Postman
http://localhost:5000/api/health

# Response:
{
  "status": "OK",
  "message": "Server is running ✅",
  "timestamp": "2024-01-27T...",
  "environment": "development"
}
```

---

## 🗄️ MongoDB Atlas Setup (2 phút)

### Option 1: Nhanh nhất - Dùng Free Tier

1. **Tạo tài khoản**: https://www.mongodb.com/cloud/atlas
2. **Tạo Cluster**:
   - Select M0 (Free)
   - Click Create
   - Chờ 2-3 phút

3. **Tạo User**:
   - Security → Database Access
   - Add User
   - Remember username & password

4. **Allow Network**:
   - Security → Network Access
   - Add IP: 0.0.0.0/0

5. **Lấy Connection String**:
   - Clusters → Connect → Drivers
   - Copy URL
   - Format: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/5cine_booking`

6. **Paste vào .env**:
   ```env
   MONGO_URI=mongodb+srv://your_user:your_pass@cluster0.xxxxx.mongodb.net/5cine_booking
   ```

### Option 2: Local MongoDB

```bash
# Cài MongoDB Community
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community

# Khởi động
mongod

# .env
MONGO_URI=mongodb://localhost:27017/5cine_booking
```

---

## 📝 .env Template

Copy & paste vào .env:

```env
# 📦 Database
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/5cine_booking

# 🖥️ Server
PORT=5000
NODE_ENV=development

# 🔐 JWT
JWT_SECRET=use_this_command_to_generate:_node_-e_require_crypto_randomBytes_32_toString_hex
JWT_EXPIRE=7d

# 🌐 Frontend
FRONTEND_URL=http://localhost:3000

# 📧 Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_password_not_main_password

# 💳 Payment (Optional - can leave as is)
VNPAY_TMN_CODE=xxxxx
VNPAY_HASH_SECRET=xxxxx
MOMO_PARTNER_CODE=xxxxx
```

---

## 🧪 Test Endpoints

### Postman
1. Download: https://www.postman.com
2. Method: GET
3. URL: `http://localhost:5000/api/health`
4. Send

### Terminal (cURL)
```bash
curl http://localhost:5000/api/health
```

### Browser
```
http://localhost:5000/api/health
```

---

## 📚 Các File Cần Đọc

| File | Dùng khi |
|------|---------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Muốn setup chi tiết |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Muốn deploy lên Render |
| [README.md](./README.md) | Muốn hiểu project structure |
| [API_SPECIFICATION.md](./API_SPECIFICATION.md) | Muốn xem API endpoints |

---

## ⚠️ Common Issues

### Port 5000 đang dùng
```bash
# Thay port trong .env
PORT=5001
```

### MongoDB connection error
```
Kiểm tra:
1. MONGO_URI đúng format
2. Username/password đúng
3. IP whitelist (0.0.0.0/0)
```

### Dependencies error
```bash
npm install --legacy-peer-deps
```

---

## ✅ Checklist

- [ ] Node.js v18+ installed
- [ ] npm v9+ installed
- [ ] Repository cloned
- [ ] .env created & filled
- [ ] MongoDB Atlas/Local configured
- [ ] `npm install` ran
- [ ] Server started (`npm run dev`)
- [ ] Health endpoint tested (/api/health)

---

## 🚀 Next Steps

1. **Bạn đang ở đâu:**
   - ✅ Server chạy local
   - ✅ Database connected
   - ✅ API ready

2. **Tiếp theo:**
   - Chạy frontend: `cd ../FE/cine-clone && npm run dev`
   - Hoặc deploy lên Render: xem DEPLOYMENT.md
   - Hoặc explore APIs: xem API_SPECIFICATION.md

---

## 💡 Tips

- Dùng `npm run dev` khi develop (auto reload)
- Dùng `npm start` khi test production
- Kiểm tra Render docs: https://docs.render.com
- Kiểm tra MongoDB docs: https://docs.mongodb.com

---

**You're all set! 🎉**

Nếu gặp vấn đề:
1. Đọc error message kỹ
2. Xem terminal output
3. Kiểm tra .env file
4. Xem SETUP_GUIDE.md troubleshooting section
```bash
# Windows: Download từ mongodb.com hoặc dùng WSL
# Linux/Mac: brew install mongodb-community
mongod
```

### Bước 4: Khởi Động Server

```bash
npm run dev
```

**Output mong đợi:**
```
✅ MongoDB connected
Server running on port 5000
```

---

## 🧪 Test API Nhanh

Sử dụng Postman hoặc curl:

### 1. Đăng Ký
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "123456",
    "phone": "0123456789"
  }'
```

### 2. Đăng Nhập
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'
```

*Lưu token từ response*

### 3. Lấy Danh Sách Phim
```bash
curl http://localhost:5000/api/movies
```

### 4. Kiểm Tra Health
```bash
curl http://localhost:5000/api/health
```

---

## 📊 Postman Collection

### Tạo Environment
```json
{
  "baseUrl": "http://localhost:5000/api",
  "token": "{{ JWT token từ login }}",
  "movieId": "{{ movie id }}",
  "showtimeId": "{{ showtime id }}"
}
```

### Headers cho Protected Endpoints
```
Authorization: Bearer {{token}}
```

---

## 🛠️ Database Setup (Optional)

### Thêm Test Data

Tạo file `seed.js`:
```javascript
const mongoose = require('mongoose');
const Movie = require('./src/models/movie.model');
const Genre = require('./src/models/genre.model');

async function seedDB() {
  await mongoose.connect('mongodb://localhost:27017/cinema_booking');
  
  // Tạo genres
  const action = await Genre.create({ name: 'Action', status: 'active' });
  const drama = await Genre.create({ name: 'Drama', status: 'active' });
  
  // Tạo movies
  await Movie.create({
    title: 'Top Gun: Maverick',
    description: 'Phim hành động tuyệt vời',
    duration: 131,
    ageLimit: '13+',
    genres: [action._id],
    status: 'now_showing',
    rating: 8.5
  });
  
  console.log('✅ Database seeded!');
  process.exit(0);
}

seedDB().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Chạy:
```bash
node seed.js
```

---

## 📋 Common Issues

### Error: connect ECONNREFUSED
**Nguyên nhân:** MongoDB không chạy
**Giải pháp:**
```bash
mongod  # Khởi động MongoDB
```

### Error: MONGO_URI not defined
**Nguyên nhân:** Chưa tạo .env
**Giải pháp:**
```bash
cp .env.example .env
```

### Error: Cannot find module
**Nguyên nhân:** Dependencies chưa cài
**Giải pháp:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔄 Development Workflow

1. **Sửa code** → Nodemon tự động reload
2. **Kiểm tra errors** → Check console
3. **Test API** → Postman hoặc curl
4. **Commit code** → Git

---

## 📝 Các File Quan Trọng

| File | Mục Đích |
|---|---|
| `src/app.js` | Express setup |
| `src/server.js` | HTTP + Socket.io |
| `src/config/db.js` | MongoDB connection |
| `.env` | Environment variables |
| `README.md` | Documentation |
| `API_SPECIFICATION.md` | API docs |
| `CHANGES_SUMMARY.md` | Danh sách thay đổi |

---

## 🎯 Next Steps

1. ✅ **Backend**: Đã hoàn thành (bạn đang ở đây)
2. ⏳ **Frontend**: Kết nối với React
3. ⏳ **Testing**: Unit tests & Integration tests
4. ⏳ **Deployment**: Deploy lên production

---

## 🤝 Support

Nếu gặp vấn đề:
1. Check console logs
2. Xem README.md
3. Xem API_SPECIFICATION.md
4. Check .env configuration

---

**Happy Coding! 🚀**
