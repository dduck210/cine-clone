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
    reminder24hSentAt: { type: Date },
    reviewReminderSentAt: { type: Date },
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
    voucherDiscount: { type: Number, default: 0 },
    extraItems: [{ // F&B combos
        name: String,
        quantity: Number,
        price: Number,
    }],
    notes: String,
    otpCode: { type: String },
    otpExpiry: { type: Date },
    momoTransId: { type: String },
    momoOrderId: { type: String },
    payosOrderCode: { type: Number },
    refundAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
    refundReason: { type: String },
}, { timestamps: true });

bookingSchema.pre('save', async function () {
    if (!this.bookingCode) {
        this.bookingCode = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
    }
});

module.exports = mongoose.model('Booking', bookingSchema);
