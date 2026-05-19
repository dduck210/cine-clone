const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    method: { type: String, enum: ['credit_card', 'cash', 'momo', 'qr'], default: 'momo' },
    amount: { type: Number, required: true },
    transactionId: String,
    status: { type: String, enum: ['pending', 'success', 'failed', 'cancelled', 'refunded'], default: 'pending' },
    paymentDate: Date,
    refundAmount: { type: Number, default: 0 },
    refundDate: Date,
    notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
