# 🚀 Quick Start Guide - 5Cine Backend

## Cài Đặt Nhanh

### Bước 1: Cải Thiện Môi Trường (.env)

Tạo file `.env` từ `.env.example`:

```bash
cd BE
cp .env.example .env
```

**Sửa các thông tin quan trọng trong .env:**
```
MONGO_URI=mongodb://localhost:27017/cinema_booking
JWT_SECRET=your-secret-key-12345
PORT=5000
NODE_ENV=development
```

### Bước 2: Cài Dependencies

```bash
npm install
```

### Bước 3: Khởi Động MongoDB

**Nếu chưa cài MongoDB:**
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
