const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
console.log('Mounting routes...');
app.use('/api/auth', require('./routes/auth'));
console.log('✓ /api/auth mounted');
app.use('/api/movies', require('./routes/movies'));
console.log('✓ /api/movies mounted');
app.use('/api/showtimes', require('./routes/showtimes'));
console.log('✓ /api/showtimes mounted');
app.use('/api/bookings', require('./routes/bookings'));
console.log('✓ /api/bookings mounted');
app.use('/api/payments', require('./routes/payments'));
console.log('✓ /api/payments mounted');
app.use('/api/tickets', require('./routes/tickets'));
console.log('✓ /api/tickets mounted');
app.use('/api/admin', require('./routes/admin'));
console.log('✓ /api/admin mounted');

// Default route
app.get('/', (req, res) => {
    res.send('Cinema Clone Backend API');
});

// Error handler - catch all 404s
app.use((req, res) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});