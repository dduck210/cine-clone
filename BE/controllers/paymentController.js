const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');

// Create payment (for credit card, etc.)
const createPayment = async (req, res) => {
    const { bookingId, method, transactionId } = req.body;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (booking.status === 'paid') {
            return res.status(400).json({ message: 'Booking already paid' });
        }

        const payment = new Payment({
            booking: bookingId,
            method: method || 'credit_card',
            amount: booking.totalPrice,
            transactionId: transactionId || `TXN-${Date.now()}`,
            status: 'success',
            paymentDate: new Date(),
        });

        await payment.save();

        // Update booking status
        booking.status = 'paid';
        booking.paymentId = payment._id;
        await booking.save();

        // Update seat status to booked
        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'booked', bookedBy: booking._id }
        );

        res.status(201).json({ message: 'Payment successful', payment, booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('booking');
        if (payment) {
            res.json(payment);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Refund payment
const refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (payment.status !== 'success') {
            return res.status(400).json({ message: 'Can only refund successful payments' });
        }

        payment.status = 'cancelled';
        payment.refundAmount = payment.amount;
        payment.refundDate = new Date();
        await payment.save();

        // Update booking status
        const booking = await Booking.findById(payment.booking);
        booking.status = 'cancelled';
        await booking.save();

        // Release seats
        await Seat.updateMany({ _id: { $in: booking.seats } }, { status: 'available' });

        res.json({ message: 'Refund processed', payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPayment, getPaymentById, refundPayment };