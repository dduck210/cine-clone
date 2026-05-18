const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    city: { type: String },
    totalRooms: { type: Number, default: 0 },
    image: { type: String, default: '' },
    status: { type: String, enum: ['active', 'incident', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Cinema', cinemaSchema);
