const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
    seatNumbers: [String], // e.g., ['A1', 'A2', 'B1']
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    bookingCode: { type: String, unique: true },
    notes: String,
}, { timestamps: true });

// Generate booking code
bookingSchema.pre('save', async function (next) {
    if (!this.bookingCode) {
        this.bookingCode = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);