const router = require('express').Router();
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');
const Ticket = require('../models/ticket.model');
const { verifyToken } = require('../middlewares/auth.middleware');

// Create payment record
router.post('/', verifyToken, async (req, res) => {
    try {
        const { orderId, amount, method } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });

        const payment = new Payment({
            orderId,
            userId: req.user.userId,
            amount,
            method,
            status: 'pending'
        });

        const newPayment = await payment.save();
        res.status(201).json(newPayment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get payment by id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('orderId')
            .populate('userId');
        if (!payment) return res.status(404).json({ message: 'Thanh toán không tìm thấy' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user payments
router.get('/user/history', verifyToken, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.userId })
            .populate('orderId')
            .sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// VNPAY callback
router.post('/vnpay/callback', async (req, res) => {
    try {
        const { orderId, transactionId, responseCode } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment) return res.status(404).json({ message: 'Thanh toán không tìm thấy' });

        if (responseCode === '00') {
            // Payment success
            payment.status = 'success';
            payment.transactionId = transactionId;
            payment.paymentDetails = req.body;

            // Update order status
            const order = await Order.findById(orderId);
            if (order) {
                order.status = 'paid';
                await order.save();
            }

            // Update ticket status
            await Ticket.updateMany({ orderId }, { $set: { status: 'unused' } });
        } else {
            // Payment failed
            payment.status = 'failed';
            payment.errorMessage = req.body.message;
        }

        await payment.save();
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// MOMO callback
router.post('/momo/callback', async (req, res) => {
    try {
        const { orderId, transactionId, status } = req.body;

        const payment = await Payment.findOne({ orderId });
        if (!payment) return res.status(404).json({ message: 'Thanh toán không tìm thấy' });

        if (status === 0) {
            // Payment success
            payment.status = 'success';
            payment.transactionId = transactionId;
            payment.paymentDetails = req.body;

            // Update order status
            const order = await Order.findById(orderId);
            if (order) {
                order.status = 'paid';
                await order.save();
            }

            // Update ticket status
            await Ticket.updateMany({ orderId }, { $set: { status: 'unused' } });
        } else {
            // Payment failed
            payment.status = 'failed';
            payment.errorMessage = req.body.message;
        }

        await payment.save();
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel payment
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Thanh toán không tìm thấy' });

        payment.status = 'cancelled';
        await payment.save();

        // Update order status
        const order = await Order.findById(payment.orderId);
        if (order) {
            order.status = 'cancelled';
            await order.save();
        }

        res.json({ message: 'Thanh toán đã được hủy' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
