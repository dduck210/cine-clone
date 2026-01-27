# 🚀 5CINE Backend - Express.js + Socket.io

## 📌 NEW: Render Deployment Ready!

**Your backend is now fully configured for Render.com deployment!** 

👉 **[Open: 00_START_HERE_RENDER.md](./00_START_HERE_RENDER.md)** to get started (takes 5 minutes)

---

## 📋 Project Overview

5CINE is an **Online Movie Ticket Booking System** built with:
- **Backend**: Express.js + Socket.io
- **Database**: MongoDB
- **Authentication**: JWT
- **Payment**: VNPAY, MOMO
- **Hosting**: Render.com (with free tier support)

---

## 🚀 Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (copy from .env.render)
# Add your MongoDB connection string

# 3. Start server
npm start

# Or with auto-reload
npm run dev

# 4. Test
curl http://localhost:5000/api/health
```

### Production (Render.com)

```bash
# Follow: 00_START_HERE_RENDER.md
# Takes ~30 minutes total
```

---

## 📁 Project Structure

```
src/
├── server.js              # Entry point with Socket.io
├── app.js                 # Express app config
├── config/
│   └── db.js              # MongoDB connection (optimized)
├── models/                # Database schemas
│   ├── users.model.js
│   ├── movies.model.js
│   ├── cinema.model.js
│   ├── showtime.model.js
│   ├── ticket.model.js
│   ├── booking.model.js
│   ├── payment.model.js
│   ├── room.model.js
│   ├── genre.model.js
│   ├── combo.model.js
│   └── order.model.js
├── routes/                # API endpoints
│   ├── auth.route.js
│   ├── user.route.js
│   ├── movie.route.js
│   ├── booking.route.js
│   ├── payment.route.js
│   ├── admin.route.js
│   └── ...
└── middlewares/
    └── auth.middleware.js # JWT authentication
```

---

## 🔑 API Endpoints

### Authentication
```
POST   /api/auth/register      # Register user
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
```

### Movies
```
GET    /api/movies             # Get all movies
GET    /api/movies/:id         # Get movie details
POST   /api/movies             # Create movie (admin)
PUT    /api/movies/:id         # Update movie (admin)
```

### Cinemas
```
GET    /api/cinemas            # Get all cinemas
GET    /api/cinemas/:id        # Get cinema details
```

### Booking
```
POST   /api/booking/create     # Create booking
GET    /api/booking/:id        # Get booking details
GET    /api/booking/user/:id   # Get user bookings
```

### Payment
```
POST   /api/payments/vnpay     # VNPAY payment
POST   /api/payments/momo      # MOMO payment
```

### Admin
```
GET    /api/admin/dashboard    # Dashboard stats
GET    /api/admin/users        # Manage users
GET    /api/admin/bookings     # Manage bookings
```

---

## 🔐 Environment Variables

### Required
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/5cine_booking
JWT_SECRET=your_32_character_secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend.com
```

### Optional but Recommended
```env
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

👉 See [ENV_SETUP.md](./ENV_SETUP.md) for detailed configuration

---

## 📊 Features

### ✅ Core Features
- User registration & authentication (JWT)
- Movie catalog & details
- Cinema locations & showtimes
- Seat selection & booking
- Real-time seat updates (Socket.io)
- Payment integration (VNPAY, MOMO)
- Order tracking

### ✅ Admin Features
- Dashboard with statistics
- User management
- Movie management
- Booking management
- Revenue reports

### ✅ Technical Features
- Real-time notifications (Socket.io)
- Error handling & logging
- CORS support
- Request validation (Joi)
- Graceful shutdown

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18.x |
| Framework | Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.io |
| Auth | JWT (JsonWebToken) |
| Validation | Joi |
| Hashing | bcryptjs |
| Logging | Morgan |
| Email | Nodemailer |

---

## 🚀 Deployment

### For Render.com

**👉 [Full Guide: RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)**

Quick steps:
1. Create MongoDB Atlas (10 min)
2. Push to GitHub (2 min)
3. Deploy on Render (5 min)

### Deployment Files
- `render.yaml` - Auto-deployment config
- `.env.render` - Production template
- `setup-render.bat` - Windows helper

---

## 📚 Documentation

### Render Deployment
- `00_START_HERE_RENDER.md` - Start here!
- `QUICK_DEPLOY.md` - 5-min quick start
- `RENDER_DEPLOYMENT.md` - 30-min complete guide
- `ENV_SETUP.md` - Environment variables
- `VISUAL_GUIDE.md` - Visual flowchart
- `DEPLOY_CHECKLIST.md` - Progress tracking

### Reference
- `RENDER_README.md` - Render overview
- `DOCS_INDEX.md` - All documentation
- `CHANGES_MADE.md` - Code improvements
- `DEPLOYMENT_SUMMARY.md` - Complete summary

---

## 🧪 Testing Endpoints

```bash
# Health check
curl http://localhost:5000/api/health

# Get movies
curl http://localhost:5000/api/movies

# Get cinemas
curl http://localhost:5000/api/cinemas

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
✓ Check MONGO_URI format
✓ Whitelist IP on MongoDB Atlas (0.0.0.0/0)
✓ Check username/password
✓ Check database name
```

### Port Already in Use
```bash
# Use different port
PORT=5001 npm start

# Or kill process on port 5000
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

### CORS Error
```
✓ Update FRONTEND_URL in .env
✓ Check corsOptions in app.js
✓ Ensure frontend URL is in origin list
```

👉 More issues? See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) Troubleshooting

---

## 📝 Scripts

```bash
npm start                # Start server
npm run dev             # Start with nodemon
npm install             # Install dependencies

# Windows helpers
setup-render.bat        # Setup automation
```

---

## 📞 Support

### Documentation
- 11 comprehensive guides included
- Step-by-step instructions
- Troubleshooting section

### Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Socket.io Documentation](https://socket.io/)
- [Render Documentation](https://render.com/docs)

---

## 📈 Performance

### Expected Performance
- **Cold start** (Render): 30-60 seconds
- **Warm start**: 2-5 seconds
- **API response**: < 200ms
- **Database query**: < 100ms
- **Real-time updates**: < 100ms

### Optimizations
- Connection pooling (MongoDB)
- Caching strategies
- Efficient queries
- Graceful error handling

---

## 🔒 Security

✅ JWT authentication
✅ Password hashing (bcryptjs)
✅ CORS protection
✅ Input validation (Joi)
✅ Error details hidden on production
✅ Environment variables protected
✅ HTTPS ready

---

## 🎯 Next Steps

### First Time?
1. Read [00_START_HERE_RENDER.md](./00_START_HERE_RENDER.md) (5 min)
2. Read [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) (3 min)
3. Follow deployment steps (~30 min)

### Want to Deploy?
1. Setup MongoDB Atlas (10 min)
2. Push to GitHub (2 min)
3. Deploy on Render (5 min)

### Need Help?
→ Check [DOCS_INDEX.md](./DOCS_INDEX.md) for all guides

---

## 📋 License

ISC

---

## 👥 Team

5CINE Development Team

---

## 🎉 Ready to Deploy?

**👉 [Open: 00_START_HERE_RENDER.md](./00_START_HERE_RENDER.md)**

Takes only 30 minutes from start to live! 🚀

---

**Status:** ✅ Production Ready for Render
**Last Updated:** January 28, 2026
**Version:** 1.0.0

---

## 🚀 Deploy Now!

```
┌────────────────────────────────────┐
│                                    │
│  Everything is ready to deploy!    │
│                                    │
│  👉 Read: 00_START_HERE_...       │
│  Then: Follow 3 simple steps       │
│  Result: Live in 30 minutes        │
│                                    │
│  🎉 Let's go! 🎉                   │
│                                    │
└────────────────────────────────────┘
```
