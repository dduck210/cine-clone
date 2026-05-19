const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
    seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],
    seatNumbers: [String],
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled', 'expired', 'refunded'],
        default: 'pending'
    },
    ticketStatus: {
        type: String,
        enum: ['not_printed', 'printed'],
        default: 'not_printed'
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    bookingCode: { type: String, unique: true },
    expiresAt: { type: Date }, // 5-minute seat hold expiry
    extraItems: [{ // F&B combos
        name: String,
        quantity: Number,
        price: Number,
    }],
    notes: String,
}, { timestamps: true });

bookingSchema.pre('save', async function () {
    if (!this.bookingCode) {
        this.bookingCode = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
