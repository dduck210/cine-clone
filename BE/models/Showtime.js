const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CinemaRoom', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String },
    // Pricing: base + multipliers stored as final calculated prices
    basePrice: { type: Number, required: true },
    priceConfig: {
        normal: { type: Number, required: true },
        vip: { type: Number, required: true },
        couple: { type: Number, required: true },
    },
    timeSlot: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
    dayType: { type: String, enum: ['weekday', 'weekend', 'holiday'], required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    bookingLockMinutes: { type: Number, default: 5 }, // lock ticket booking N minutes before start
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);
