const mongoose = require('mongoose');

// seatMatrix: 2D array, each cell is { label: "A1", type: "normal"|"vip"|"couple"|"aisle" }
// Example: [[ {label:"A1",type:"normal"}, {label:"AISLE",type:"aisle"}, {label:"A2",type:"vip"} ], ...]
const cinemaRoomSchema = new mongoose.Schema({
    cinema: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
    name: { type: String, required: true },
    rows: { type: Number, required: true },
    cols: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    roomType: { type: String, enum: ['Standard', 'Premium', 'VIP'], default: 'Standard' },
    status: { type: String, enum: ['active', 'maintenance'], default: 'active' },
    seatMatrix: { type: [[mongoose.Schema.Types.Mixed]], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('CinemaRoom', cinemaRoomSchema);
