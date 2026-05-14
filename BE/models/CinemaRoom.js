const mongoose = require('mongoose');

const cinemaRoomSchema = new mongoose.Schema({
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    name: { type: String, required: true }, // e.g., "Room A", "VIP Room"
    rows: { type: Number, required: true }, // number of rows
    cols: { type: Number, required: true }, // number of columns
    totalSeats: { type: Number, required: true },
    roomType: { type: String, enum: ['standard', 'premium', 'vip'], default: 'standard' },
    status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('CinemaRoom', cinemaRoomSchema);