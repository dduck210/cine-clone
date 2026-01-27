const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        showtimeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Showtime',
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        seatCode: {
            type: String,
            required: true
        },
        qrCode: String,
        status: {
            type: String,
            enum: ['unused', 'used', 'cancelled'],
            default: 'unused'
        },
        usedAt: Date
    },
    { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);