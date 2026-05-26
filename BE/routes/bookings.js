const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const CinemaRoom = require('../models/CinemaRoom');
const Cinema = require('../models/Cinema');
const voucherService = require('../services/voucher-service');
const { protect } = require('../middleware/auth');
const { sendRefundEmail } = require('../services/email-service');

const ticketEvents = require('../services/ticket-event-emitter');

const HOLD_MINUTES = 5;

// Validate no available seat gaps between selected seats in same row
async function validateNoGap(showtimeId, selectedSeatNumbers) {
    const allSeats = await Seat.find({ showtime: showtimeId });
    const seatMap = {};
    for (const s of allSeats) {
        seatMap[s.seatNumber] = s;
    }

    // Group selected seats by row
    const byRow = {};
    for (const sn of selectedSeatNumbers) {
        const row = sn.match(/^([A-Z]+)/)?.[1];
        const col = parseInt(sn.match(/(\d+)$/)?.[1]);
        if (!row || isNaN(col)) continue;
        if (!byRow[row]) byRow[row] = [];
        byRow[row].push(col);
    }

    for (const [row, cols] of Object.entries(byRow)) {
        cols.sort((a, b) => a - b);
        for (let i = 0; i < cols.length - 1; i++) {
            const from = cols[i];
            const to = cols[i + 1];
            for (let gap = from + 1; gap < to; gap++) {
                const gapSeatNumber = `${row}${gap}`;
                const gapSeat = seatMap[gapSeatNumber];
                // If gap seat exists and is available → invalid selection
                if (gapSeat && gapSeat.status === 'available' && !gapSeat.isLocked) {
                    return `Cannot leave seat ${gapSeatNumber} empty between your selections`;
                }
            }
        }
    }
    return null;
}

// Create booking
router.post('/', protect, async (req, res) => {
    const { showtimeId, seats: seatNumbers, extraItems = [], voucherCode } = req.body;
    try {
        const showtime = await Showtime.findById(showtimeId);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });
        if (showtime.status === 'cancelled') return res.status(400).json({ message: 'Showtime is cancelled' });

        // Block booking if room or cinema is under maintenance
        const [room, cinema] = await Promise.all([
            CinemaRoom.findById(showtime.room).select('status'),
            Cinema.findById(showtime.cinema).select('status'),
        ]);
        if (room?.status === 'maintenance') {
            return res.status(400).json({ message: 'Phòng chiếu đang bảo trì, không thể đặt vé' });
        }
        if (cinema?.status === 'incident' || cinema?.status === 'inactive') {
            return res.status(400).json({ message: 'Rạp đang bảo trì, không thể đặt vé' });
        }

        // Validate seat gap rule
        const gapError = await validateNoGap(showtimeId, seatNumbers);
        if (gapError) return res.status(400).json({ message: gapError });

        // Check availability (not reserved, not booked, not locked)
        const availableSeats = await Seat.find({
            showtime: showtimeId,
            seatNumber: { $in: seatNumbers },
            status: 'available',
            isLocked: false,
        });

        if (availableSeats.length !== seatNumbers.length) {
            return res.status(400).json({ message: 'Some seats are not available' });
        }

        // Calculate total: seat prices + extra items
        const seatTotal = availableSeats.reduce((sum, s) => sum + s.price, 0);
        const extraTotal = extraItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const rawTotal = seatTotal + extraTotal;
        // Monday 20% discount — use UTC+7 (Vietnam) day to avoid server-timezone shift
        const vnDate = new Date(new Date(showtime.date).getTime() + 7 * 60 * 60 * 1000);
        const isMonday = vnDate.getUTCDay() === 1;
        const afterMonday = isMonday ? Math.round(rawTotal * 0.8) : rawTotal;

        // Voucher discount
        let voucherDiscount = 0;
        let appliedVoucher = null;
        if (voucherCode) {
            const result = await voucherService.validateVoucher(voucherCode, req.user._id, afterMonday);
            if (result.valid) {
                voucherDiscount = result.discountAmount;
                appliedVoucher = result.voucher._id;
                await voucherService.applyVoucher(result.voucher._id, req.user._id);
            }
        }

        const totalPrice = Math.max(0, afterMonday - voucherDiscount);
        const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

        const booking = new Booking({
            user: req.user._id,
            showtime: showtimeId,
            seats: availableSeats.map(s => s._id),
            seatNumbers,
            totalPrice,
            status: 'pending',
            expiresAt,
            extraItems,
            voucher: appliedVoucher,
            voucherDiscount,
        });
        await booking.save();

        // Mark seats as reserved and decrement available count
        await Seat.updateMany(
            { _id: { $in: availableSeats.map(s => s._id) } },
            { status: 'reserved', bookedBy: booking._id }
        );
        await Showtime.findByIdAndUpdate(showtimeId, { $inc: { availableSeats: -availableSeats.length } });

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user's bookings
router.get('/user/all', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room', select: 'name' }] })
            .populate('seats')
            .populate('paymentId', 'method status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SSE stream for real-time ticket status updates (user side)
router.get('/:bookingId/stream', async (req, res) => {
    const { bookingId } = req.params;
    try {
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
    } catch {
        return res.status(400).json({ message: 'Invalid booking ID' });
    }
    ticketEvents.subscribe(bookingId, res);
});

// Get booking by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }] })
            .populate('seats');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel booking by user (only pending allowed)
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (!['pending', 'paid'].includes(booking.status)) {
            return res.status(400).json({ message: 'Cannot cancel this booking' });
        }

        const wasConfirmed = booking.status === 'paid';
        booking.status = wasConfirmed ? 'refunded' : 'cancelled';
        await booking.save();

        await Seat.updateMany(
            { _id: { $in: booking.seats } },
            { status: 'available', bookedBy: null }
        );
        await Showtime.findByIdAndUpdate(booking.showtime, { $inc: { availableSeats: booking.seats.length } });

        if (wasConfirmed && booking.paymentId) {
            await Payment.findByIdAndUpdate(booking.paymentId, {
                status: 'refunded',
                refundDate: new Date(),
                refundAmount: booking.totalPrice,
            });

            const bookingContext = await Booking.findById(booking._id)
                .populate('user', 'name email phone')
                .populate({
                    path: 'showtime',
                    populate: [
                        { path: 'movie', select: 'title poster' },
                        { path: 'cinema', select: 'name address' },
                        { path: 'room', select: 'name' },
                    ],
                });
            await sendRefundEmail(bookingContext, 'Khách hàng đã hủy vé');
        }

        res.json({ message: wasConfirmed ? 'Booking refunded' : 'Booking cancelled', booking });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
