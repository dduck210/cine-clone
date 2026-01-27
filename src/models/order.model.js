const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        showtimeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Showtime',
            required: true
        },
        tickets: [
            {
                seatCode: String,
                ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }
            }
        ],
        combos: [
            {
                comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
                quantity: Number,
                price: Number
            }
        ],
        totalAmount: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled', 'completed'],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            enum: ['vnpay', 'momo', 'cash']
        },
        notes: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);