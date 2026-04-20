const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CinemaRoom', required: true },
    row: { type: String, required: true }, // A, B, C...
    col: { type: Number, required: true }, // 1, 2, 3...
    seatNumber: { type: String, required: true }, // A1, A2, B1...
    status: { type: String, enum: ['available', 'booked', 'reserved'], default: 'available' },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    price: { type: Number, required: true },
}, { timestamps: true });

// Compound index for unique seat per showtime
seatSchema.index({ showtime: 1, room: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);