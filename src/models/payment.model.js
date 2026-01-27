const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            enum: ['vnpay', 'momo', 'cash'],
            required: true
        },
        transactionId: String,
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'cancelled'],
            default: 'pending'
        },
        paymentDetails: {
            bankCode: String,
            cardType: String,
            reference: String
        },
        errorMessage: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
