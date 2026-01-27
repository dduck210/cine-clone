const router = require('express').Router();
const { verifyToken, authorize } = require('../middlewares/auth.middleware');
const Showtime = require('../models/showtime.model');
const Order = require('../models/order.model');
const Ticket = require('../models/ticket.model');
const QRCode = require('qrcode');

/* =========================
   UC18 – BÁN VÉ TẠI QUẦY (POS)
========================= */
router.post(
    '/pos/sell',
    verifyToken,
    authorize('staff'),
    async (req, res) => {
        try {
            const { showtimeId, seats, combos = [], customerInfo = null } = req.body;

            // Verify showtime
            const showtime = await Showtime.findById(showtimeId);
            if (!showtime) return res.status(404).json({ message: 'Lịch chiếu không tìm thấy' });

            // Calculate total
            let totalAmount = seats.length * showtime.price;
            if (combos.length > 0) {
                combos.forEach(combo => {
                    totalAmount += combo.price * combo.quantity;
                });
            }

            // Create order
            const order = await Order.create({
                userId: customerInfo?.userId || null,
                showtimeId,
                tickets: seats.map(seat => ({ seatCode: seat })),
                combos,
                totalAmount,
                status: 'paid',
                paymentMethod: 'cash',
                notes: customerInfo?.notes
            });

            // Create tickets with QR codes
            const tickets = await Promise.all(
                seats.map(async seatCode => {
                    const qrCodeData = `${order._id}-${seatCode}`;
                    const qrCode = await QRCode.toDataURL(qrCodeData);

                    return Ticket.create({
                        orderId: order._id,
                        showtimeId,
                        seatCode,
                        qrCode,
                        status: 'unused'
                    });
                })
            );

            // Update order with tickets
            order.tickets = tickets.map(t => ({ seatCode: t.seatCode, ticketId: t._id }));
            await order.save();

            // Book seats
            seats.forEach(seat => {
                const seatToBook = showtime.seats.find(s => s.seatCode === seat);
                if (seatToBook) {
                    seatToBook.status = 'booked';
                }
            });
            await showtime.save();

            res.json({
                message: 'Bán vé thành công',
                order,
                tickets
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
);

/* =========================
   UC19 – SOÁT VÉ (CHECK-IN)
========================= */
router.post(
    '/check-in',
    verifyToken,
    authorize('staff'),
    async (req, res) => {
        try {
            const { qrCode } = req.body;

            const ticket = await Ticket.findOne({ qrCode })
                .populate('orderId')
                .populate('showtimeId');

            if (!ticket) {
                return res.status(404).json({ message: 'Vé không hợp lệ' });
            }

            if (ticket.status === 'used') {
                return res.status(400).json({ message: 'Vé đã được sử dụng' });
            }

            if (ticket.status === 'cancelled') {
                return res.status(400).json({ message: 'Vé đã bị hủy' });
            }

            // Check if showtime is today
            const showtime = ticket.showtimeId;
            const today = new Date();
            const showtimeDate = new Date(showtime.startTime);

            if (showtimeDate.toDateString() !== today.toDateString()) {
                return res.status(400).json({ message: 'Vé không hợp lệ cho suất chiếu này' });
            }

            ticket.status = 'used';
            ticket.usedAt = new Date();
            await ticket.save();

            res.json({
                message: 'Soát vé thành công',
                ticket,
                movieTitle: ticket.orderId.showtimeId?.movieId?.title,
                seatCode: ticket.seatCode
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
);

// Get POS dashboard data
router.get('/dashboard', verifyToken, authorize('staff'), async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'paid'
        });

        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: today, $lt: tomorrow },
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        res.json({
            todayOrders,
            todayRevenue: todayRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
