const router = require('express').Router();
const Showtime = require('../models/showtime.model');
const Order = require('../models/order.model');
const Ticket = require('../models/ticket.model');
const User = require('../models/users.model');
const { verifyToken } = require('../middlewares/auth.middleware');
const QRCode = require('qrcode');

// Get showtime details
router.get('/showtime/:showtimeId', async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.showtimeId)
            .populate('movieId')
            .populate('roomId')
            .populate('cinemaId');
        if (!showtime) return res.status(404).json({ message: 'Lịch chiếu không tìm thấy' });
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Hold seat (5 minutes)
router.post('/hold-seat', verifyToken, async (req, res) => {
    try {
        const { showtimeId, seatCode } = req.body;
        const expire = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const result = await Showtime.findOneAndUpdate(
            { _id: showtimeId, 'seats.seatCode': seatCode, 'seats.status': 'available' },
            { $set: { 'seats.$.status': 'holding', 'seats.$.holdExpireAt': expire } },
            { new: true }
        );

        if (!result) {
            return res.status(400).json({ message: 'Ghế không khả dụng hoặc đã bị đặt' });
        }

        res.json({ message: 'Ghế đã được giữ trong 5 phút', seatCode });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Release held seat
router.post('/release-seat', verifyToken, async (req, res) => {
    try {
        const { showtimeId, seatCode } = req.body;

        await Showtime.findOneAndUpdate(
            { _id: showtimeId, 'seats.seatCode': seatCode, 'seats.status': 'holding' },
            { $set: { 'seats.$.status': 'available', 'seats.$.holdExpireAt': null } }
        );

        res.json({ message: 'Ghế đã được thả' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create booking (order)
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { showtimeId, seats, combos = [] } = req.body;
        const userId = req.user.userId;

        // Verify showtime
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Lịch chiếu không tìm thấy' });

        // Calculate total amount
        let totalAmount = seats.length * showtime.price;
        if (combos.length > 0) {
            combos.forEach(combo => {
                totalAmount += combo.price * combo.quantity;
            });
        }

        // Create order
        const order = new Order({
            userId,
            showtimeId,
            tickets: seats.map(seat => ({ seatCode: seat })),
            combos,
            totalAmount,
            status: 'pending',
            paymentMethod: req.body.paymentMethod
        });

        const newOrder = await order.save();

        // Book seats
        seats.forEach(seat => {
            const seatToBook = showtime.seats.find(s => s.seatCode === seat);
            if (seatToBook) {
                seatToBook.status = 'booked';
                seatToBook.holdExpireAt = null;
            }
        });

        await showtime.save();

        // Create tickets
        const tickets = await Promise.all(
            seats.map(async seatCode => {
                const qrCodeData = `${newOrder._id}-${seatCode}`;
                const qrCode = await QRCode.toDataURL(qrCodeData);

                return Ticket.create({
                    orderId: newOrder._id,
                    showtimeId,
                    userId,
                    seatCode,
                    qrCode,
                    status: 'unused'
                });
            })
        );

        // Update order with tickets
        newOrder.tickets = tickets.map(t => ({ seatCode: t.seatCode, ticketId: t._id }));
        await newOrder.save();

        res.status(201).json({
            message: 'Đơn hàng đã được tạo',
            order: newOrder,
            tickets
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user booking history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .populate('showtimeId')
            .populate('tickets.ticketId')
            .populate('combos.comboId')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order details
router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('showtimeId')
            .populate('tickets.ticketId')
            .populate('combos.comboId');

        if (!order) return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking
router.post('/:orderId/cancel', verifyToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Đơn hàng không tìm thấy' });

        if (order.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Không có quyền' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng chờ xử lý' });
        }

        // Release seats
        const showtime = await Showtime.findById(order.showtimeId);
        if (showtime) {
            order.tickets.forEach(ticket => {
                const seat = showtime.seats.find(s => s.seatCode === ticket.seatCode);
                if (seat) {
                    seat.status = 'available';
                }
            });
            await showtime.save();
        }

        // Cancel tickets
        await Ticket.updateMany(
            { orderId: order._id },
            { status: 'cancelled' }
        );

        order.status = 'cancelled';
        await order.save();

        res.json({ message: 'Đơn hàng đã được hủy' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;