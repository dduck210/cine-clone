# 📖 Hướng Dẫn Cài Đặt 5Cine Backend

## 🔧 Yêu Cầu Hệ Thống

- **Node.js**: v18.x hoặc cao hơn
- **npm**: v9.x hoặc cao hơn
- **Git**: Để clone repository
- **MongoDB**: MongoDB Atlas (free cloud database)
- **Text Editor**: VS Code (recommended)

---

## 🚀 Cài Đặt Nhanh (Quick Setup)

### Windows
1. Mở Command Prompt hoặc PowerShell
2. Navigate tới folder BE:
```bash
cd C:\Users\hoank\OneDrive\Máy tính\DATN\BE
```

3. Chạy setup script:
```bash
.\setup.bat
```

4. Update `.env` file với thông tin của bạn

5. Chạy server:
```bash
npm run dev
```

### Mac/Linux
```bash
cd ~/DATN/BE
chmod +x setup.sh
./setup.sh
npm run dev
```

---

## 📝 Cài Đặt Thủ Công (Manual Setup)

### Bước 1: Chuẩn Bị

```bash
# Navigate to BE folder
cd BE

# Check Node.js version
node --version  # Should be v18.x or higher
npm --version   # Should be v9.x or higher
```

### Bước 2: Cài Dependencies

```bash
# Install all packages from package.json
npm install

# Verify installation
npm list
```

### Bước 3: Cấu Hình Environment Variables

```bash
# Copy template file
copy .env.example .env    # Windows
# hoặc
cp .env.example .env      # Mac/Linux
```

**Mở file `.env` và điền các thông tin:**

```env
# 📦 Database
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/5cine_booking

# 🔐 Server
PORT=5000
NODE_ENV=development

# 🔑 JWT Secret (Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<your_generated_secret_here>
JWT_EXPIRE=7d

# 🌐 Frontend URL
FRONTEND_URL=http://localhost:3000

# 📧 Email (for OTP notifications)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

**🔴 QUAN TRỌNG:**
- **Không bao giờ commit .env file lên GitHub** ✅ .gitignore đã cấu hình
- Tạo JWT_SECRET khác cho production
- Sử dụng App Password cho Gmail, không phải password chính

### Bước 4: Khởi Động Server

```bash
# Development mode (auto reload khi thay đổi file)
npm run dev

# Production mode
npm start
```

**Output mong đợi:**
```
╔═══════════════════════════════════════╗
║   🎬 5CINE BACKEND SERVER STARTED    ║
║   Port: 5000                           ║
║   Environment: development             ║
║   Database: Connected to MongoDB     ║
╚═══════════════════════════════════════╝
```

### Bước 5: Test Server

Mở browser hoặc Postman:

```bash
# Test health endpoint
http://localhost:5000/api/health

# Hoặc dùng curl
curl http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "Server is running ✅",
  "timestamp": "2024-01-27T...",
  "environment": "development"
}
```

---

## 🗄️ Setup MongoDB

### Lựa Chọn 1: MongoDB Atlas (Cloud - Recommended)

1. **Tạo Tài Khoản**
   - Truy cập https://www.mongodb.com/cloud/atlas
   - Click "Register"
   - Điền email, password, tên
   - Verify email

2. **Tạo Organization & Project**
   - Tạo organization (nếu cần)
   - Click "New Project"
   - Đặt tên project: "5cine"
   - Click Create Project

3. **Tạo Cluster**
   - Click "Create Deployment"
   - Chọn "M0" (Free tier - 512MB storage)
   - Cloud Provider: AWS (hoặc tuỳ chọn)
   - Region: Chọn gần nhất (ap-southeast-1 cho VN)
   - Cluster Name: "Cluster0"
   - Click "Create"
   - Chờ 2-3 phút để deployment hoàn tất

4. **Tạo Database User**
   - Chọn tab "Security" → "Database Access"
   - Click "Add New Database User"
   - Username: `your_username`
   - Password: `your_secure_password`
   - Click "Add User"

5. **Allow Network Access**
   - Chọn tab "Security" → "Network Access"
   - Click "Add IP Address"
   - Select "Allow from anywhere" (0.0.0.0/0)
   - Confirm

6. **Lấy Connection String**
   - Click "Cluster0"
   - Click "Connect"
   - Chọn "Drivers" → Node.js
   - Copy connection string
   - Format: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/5cine_booking`

7. **Thêm vào .env**
   ```env
   MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/5cine_booking
   ```

### Lựa Chọn 2: MongoDB Local

1. **Cài MongoDB**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: https://docs.mongodb.com/manual/installation/

2. **Khởi Động Service**
   ```bash
   # Windows
   mongod

   # Mac
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. **Cấu Hình .env**
   ```env
   MONGO_URI=mongodb://localhost:27017/5cine_booking
   ```

---

## 🧪 Testing API

### Sử dụng Postman

1. **Tải Postman**: https://www.postman.com/downloads/

2. **Tạo Request**
   - Method: `GET`
   - URL: `http://localhost:5000/api/health`
   - Click "Send"

3. **Các Endpoint Khác**
   ```
   GET  /api/health              # Health check
   GET  /api/movies              # Get all movies
   GET  /api/cinemas             # Get all cinemas
   POST /api/auth/register       # Register user
   POST /api/auth/login          # Login
   ```

### Sử dụng cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Get movies
curl http://localhost:5000/api/movies

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"123456"}'
```

---

## ❌ Troubleshooting

### Error: "Cannot find module 'dotenv'"
```bash
# Cài lại dependencies
npm install
```

### Error: "Port 5000 is already in use"
```bash
# Thay đổi PORT trong .env
PORT=5001

# Hoặc kill process đang chiếm port
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Error: "MongoDB connection failed"
```
Nguyên nhân có thể:
1. MONGO_URI sai format
2. Username/password sai
3. IP address chưa whitelist trên MongoDB Atlas
4. MongoDB service không chạy

Giải pháp:
- Kiểm tra .env
- Verify credentials
- Check Network Access settings
- Khởi động MongoDB service
```

### Error: "CORS error"
```
Nguyên nhân:
- Frontend URL không match FRONTEND_URL trong .env

Giải pháp:
- Cập nhật FRONTEND_URL=http://localhost:3000
- Hoặc domain của frontend
```

### Server timeout hoặc slow
```
Giải pháp:
1. Kiểm tra kết nối internet
2. Kiểm tra MongoDB Atlas status
3. Xem Render logs (nếu deployed)
4. Kiểm tra CPU/Memory usage
```

---

## 📚 Tài Liệu Thêm

- **API Documentation**: Xem file `API_SPECIFICATION.md`
- **Deployment Guide**: Xem file `DEPLOYMENT.md`
- **Architecture**: Xem file `INDEX.md`

---

## ✅ Checklist Setup

- [ ] Node.js v18.x+ installed
- [ ] npm v9.x+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created & filled
- [ ] MongoDB configured (Atlas hoặc local)
- [ ] Server started (`npm run dev`)
- [ ] Health endpoint tested (`/api/health`)
- [ ] All routes working

---

## 🆘 Cần Giúp?

1. **Kiểm tra logs**
   ```bash
   # Terminal output
   npm run dev
   ```

2. **Xem error messages**
   - Đọc kỹ error message trong terminal
   - Tìm stackoverflow hoặc GitHub issues

3. **Liên hệ support**
   - Cung cấp full error message
   - Cung cấp Node.js version
   - Cung cấp OS information

---

**Happy Coding! 🎬**
