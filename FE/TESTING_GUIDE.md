# 🎬 Cinema Clone - FE & BE Integration Testing Guide

## **✅ Hệ thống hiện tại**
- **Backend**: `http://localhost:5000` (Node.js + Express + MongoDB)
- **Frontend**: `http://localhost:5173` (React + Vite + Axios)
- **Database**: MongoDB Atlas (6 genres + 6 test movies)

---

## **🧪 Test Cases**

### **1. Test API Movies (Dữ liệu từ BE)**
**URL**: `http://localhost:5173/test-api`

**Cách setup**:
1. Mở file `src/App.jsx` hoặc route file chính
2. Thêm import: `import TestAPI from './pages/TestAPI';`
3. Thêm route: `<Route path="/test-api" element={<TestAPI />} />`
4. Truy cập: `http://localhost:5173/test-api`

**Kết quả mong đợi**:
- Thấy 6 movies: The Avengers, Superbad, Shawshank Redemption, The Ring, The Notebook, Interstellar
- Mỗi movie hiển thị: poster, title, description, rating, duration, status

**Kiểm tra Console**:
- Mở DevTools (F12) → Console
- Sẽ thấy log: `Movies fetched from BE: [...]`

---

### **2. Test Authentication (Register/Login)**
**URL**: `http://localhost:5173/test-auth`

**Cách setup**:
1. Mở file `src/App.jsx`
2. Thêm import: `import TestAuth from './pages/TestAuth';`
3. Thêm route: `<Route path="/test-auth" element={<TestAuth />} />`
4. Truy cập: `http://localhost:5173/test-auth`

**Test Register**:
1. Nhập thông tin:
   - Name: "My Test User"
   - Email: "mytest@email.com"
   - Password: "test123456"
2. Click "Register"
3. Kết quả: ✅ Thấy token được trả về
4. Token sẽ được lưu vào localStorage

**Test Login**:
1. Nhập:
   - Email: "mytest@email.com" (email vừa tạo)
   - Password: "test123456"
2. Click "Login"
3. Kết quả: ✅ Token được lưu, hiển thị trạng thái "Logged In"

**Kiểm tra Console**:
- Mở DevTools → Console
- Sẽ thấy log: `Login response: {_id, name, email, role, token}`

---

### **3. Test API Call Trực tiếp (Postman/Browser)**
**Get All Movies**:
```
GET http://localhost:5000/api/movies
```
Response sẽ là JSON array 6 movies

**Register**:
```
POST http://localhost:5000/api/auth/register
Body: {
  "name": "Test User",
  "email": "test@example.com",
  "password": "test123456"
}
```

**Login**:
```
POST http://localhost:5000/api/auth/login
Body: {
  "email": "test@example.com",
  "password": "test123456"
}
```

---

## **🔧 Cấu hình Proxy (Vite)**
File: `vite.config.js`
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```
**Ý nghĩa**: FE gọi `/api/movies` → Vite proxy tới `http://localhost:5000/api/movies`

---

## **📁 File Đã Tạo**
- `backend/app.js` - Entry point BE
- `backend/config/database.js` - MongoDB connection
- `backend/models/` - Mongoose schemas (User, Movie, Genre)
- `backend/middleware/auth.js` - JWT authentication
- `backend/controllers/authController.js` - Auth logic
- `backend/routes/` - API routes
- `backend/.env` - Environment variables
- `backend/seed.js` - Script thêm test data
- `cine-clone/src/api/axiosConfig.js` - Axios instance với interceptors
- `cine-clone/src/pages/TestAPI.jsx` - Component test Movies API
- `cine-clone/src/pages/TestAuth.jsx` - Component test Auth
- `cine-clone/.env` - FE environment
- `cine-clone/vite.config.js` - Vite config (có proxy)

---

## **⚡ Lệnh Chạy**

**Terminal 1 - Backend**:
```bash
cd backend
npm start
```

**Terminal 2 - Frontend**:
```bash
cd cine-clone
npm run dev
```

**Seed Data** (nếu cần add data):
```bash
cd backend
node seed.js
```

---

## **🚀 Next Steps**
1. ✅ Test Movies API → Hoạt động
2. ✅ Test Auth (Register/Login) → Hoạt động
3. ⏳ Implement Bookings API (POST /api/bookings)
4. ⏳ Implement Payments API (sử dụng VNPAY hoặc Momo callback)
5. ⏳ Implement Admin routes (reports, manage movies, etc.)

---

## **📝 Ghi chú**
- Token được lưu vào `localStorage` với key `token`
- Khi call API protected (admin, user profile), Axios tự động thêm header: `Authorization: Bearer {token}`
- Nếu token hết hạn (401 error), Axios tự động redirect tới login
- Dữ liệu test có thể xóa và regenerate bằng `node seed.js`

---

## **❓ Troubleshooting**
| Vấn đề | Giải pháp |
|--------|----------|
| CORS Error | Kiểm tra `app.use(cors())` trong `backend/app.js` |
| API 404 | Kiểm tra port BE (5000) có đúng không |
| Token không save | Kiểm trace localStorage console |
| Movies không hiển thị | Kiểm tra log BE có connect MongoDB không |

---

**Happy Testing! 🎉**