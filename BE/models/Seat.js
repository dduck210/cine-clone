const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CinemaRoom', required: true },
    row: { type: String, required: true },
    col: { type: Number, required: true },
    seatNumber: { type: String, required: true }, // e.g., A1, B3
    type: { type: String, enum: ['normal', 'vip', 'couple'], default: 'normal' },
    status: { type: String, enum: ['available', 'booked', 'reserved'], default: 'available' },
    isLocked: { type: Boolean, default: false }, // maintenance lock by admin
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    price: { type: Number, required: true },
}, { timestamps: true });

seatSchema.index({ showtime: 1, room: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
