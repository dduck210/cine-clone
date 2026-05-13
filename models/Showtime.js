const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'CinemaRoom', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // HH:mm format
    endTime: { type: String },
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Showtime', showtimeSchema);