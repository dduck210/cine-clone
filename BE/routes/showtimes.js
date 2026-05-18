const express = require('express');
const router = express.Router();
const Showtime = require('../models/Showtime');
const Seat = require('../models/Seat');
const CinemaRoom = require('../models/CinemaRoom');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { protect, admin } = require('../middleware/auth');
const { getTimeSlot, getDayTypeFromDate, calcEndTime, calcPriceConfig } = require('../utils/pricing');
const { sendShowtimeCancelledEmail, sendRefundEmail } = require('../services/email-service');
const { getStartOfToday, getLocalDayRange, isUpcomingShowtime } = require('../utils/showtime-availability');

async function markPaymentsRefunded(bookingIds = []) {
    if (!bookingIds.length) return [];

    const payments = await Payment.find({
        booking: { $in: bookingIds },
        status: 'success',
    });

    if (!payments.length) return [];

    const refundDate = new Date();

    await Promise.all(
        payments.map((payment) => {
            payment.status = 'refunded';
            payment.refundAmount = payment.amount;
            payment.refundDate = refundDate;
            return payment.save();
        })
    );

    return [...new Set(payments.map((payment) => payment.booking.toString()))];
}

// Get all showtimes with filters
router.get('/', async (req, res) => {
    try {
        const { movieId, cinemaId, date } = req.query;
        const today = getStartOfToday();
        const filter = { status: 'active', date: { $gte: today } };
        if (movieId) filter.movie = movieId;
        if (cinemaId) filter.cinema = cinemaId;
        if (date) {
            const { start: startDate, end: endDate } = getLocalDayRange(date);
            if (startDate < today) {
                return res.json([]);
            }
            filter.date = { $gte: startDate, $lt: endDate };
        }
        const showtimes = await Showtime.find(filter)
            .populate('movie')
            .populate('cinema')
            .populate('room')
            .sort({ date: 1, startTime: 1 });
        res.json(showtimes.filter((showtime) => isUpcomingShowtime(showtime)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get showtime by ID with seats
router.get('/:id', async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id)
            .populate('movie')
            .populate('cinema')
            .populate('room');
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        if (showtime.status !== 'active' || !isUpcomingShowtime(showtime)) {
            return res.status(400).json({ message: 'Showtime is not available' });
        }

        const seats = await Seat.find({ showtime: req.params.id }).sort({ row: 1, col: 1 });
        res.json({ data: showtime, seats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create showtime (admin) - supports single or bulk creation
router.post('/', protect, admin, async (req, res) => {
    // bulk: array of showtimes; single: one object
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    try {
        const results = [];
        const errors = [];

        for (const item of payload) {
            const { movieId, cinemaId, roomId, date, startTime, basePrice, dayType: dayTypeOverride } = item;

            const [room, movie] = await Promise.all([
                CinemaRoom.findById(roomId),
                Movie.findById(movieId),
            ]);
            if (!room) { errors.push({ date, startTime, error: 'Room not found' }); continue; }
            if (!movie) { errors.push({ date, startTime, error: 'Movie not found' }); continue; }
            if (String(room.cinema) !== String(cinemaId)) {
                errors.push({ date, startTime, error: 'Room does not belong to selected cinema' });
                continue;
            }
            if (room.status !== 'active') {
                errors.push({ date, startTime, error: 'Room is under maintenance' });
                continue;
            }

            const timeSlot = getTimeSlot(startTime);
            const dayType = dayTypeOverride || getDayTypeFromDate(date);
            const endTime = calcEndTime(startTime, movie.duration);
            const priceConfig = calcPriceConfig(basePrice, timeSlot, dayType);

            // Conflict check: same room, same date, overlapping time
            const conflict = await Showtime.findOne({
                room: roomId,
                date: { $gte: new Date(new Date(date).setHours(0,0,0,0)), $lt: new Date(new Date(date).setHours(23,59,59,999)) },
                status: 'active',
                $or: [
                    { startTime: { $gte: startTime, $lt: endTime } },
                    { endTime: { $gt: startTime, $lte: endTime } },
                    { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
                ],
            });

            if (conflict) {
                errors.push({ date, startTime, error: `Time conflict with showtime at ${conflict.startTime}` });
                continue;
            }

            // Count actual seats (non-aisle) from matrix
            let totalSeats = 0;
            if (room.seatMatrix && room.seatMatrix.length > 0) {
                for (const row of room.seatMatrix) {
                    for (const cell of row) {
                        if (cell && cell.type !== 'aisle') totalSeats++;
                    }
                }
            } else {
                totalSeats = room.totalSeats;
            }

            const showtime = new Showtime({
                movie: movieId,
                cinema: cinemaId,
                room: roomId,
                date: new Date(date),
                startTime,
                endTime,
                basePrice,
                priceConfig,
                timeSlot,
                dayType,
                totalSeats,
                availableSeats: totalSeats,
            });
            await showtime.save();

            // Generate seats from matrix if available, else fallback to rows×cols
            const seats = [];
            if (room.seatMatrix && room.seatMatrix.length > 0) {
                for (const matrixRow of room.seatMatrix) {
                    for (const cell of matrixRow) {
                        if (!cell || cell.type === 'aisle') continue;
                        seats.push({
                            showtime: showtime._id,
                            room: roomId,
                            row: cell.label.match(/^([A-Z]+)/)?.[1] || 'A',
                            col: parseInt(cell.label.match(/(\d+)$/)?.[1] || '1'),
                            seatNumber: cell.label,
                            type: cell.type || 'normal',
                            price: priceConfig[cell.type] || priceConfig.normal,
                        });
                    }
                }
            } else {
                for (let i = 0; i < room.rows; i++) {
                    const row = String.fromCharCode(65 + i);
                    const isCouple = room.rows >= 6 && i === room.rows - 1;
                    const isVip    = room.rows >= 6 && i >= room.rows - 2;
                    const seatType = isCouple ? 'couple' : isVip ? 'vip' : 'normal';
                    for (let j = 1; j <= room.cols; j++) {
                        seats.push({
                            showtime: showtime._id,
                            room: roomId,
                            row,
                            col: j,
                            seatNumber: `${row}${j}`,
                            type: seatType,
                            price: priceConfig[seatType] || priceConfig.normal,
                        });
                    }
                }
            }

            await Seat.insertMany(seats);
            results.push(showtime);
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'All showtimes failed', errors });
        }

        res.status(201).json({ created: results, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update showtime (admin)
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const { date, startTime, basePrice, dayType: dayTypeOverride } = req.body;
        const showtime = await Showtime.findById(req.params.id).populate('movie');
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        if (startTime) {
            const timeSlot = getTimeSlot(startTime);
            const dayType = dayTypeOverride || getDayTypeFromDate(date || showtime.date);
            const endTime = calcEndTime(startTime, showtime.movie.duration);
            const priceConfig = calcPriceConfig(basePrice || showtime.basePrice, timeSlot, dayType);
            showtime.startTime = startTime;
            showtime.endTime = endTime;
            showtime.timeSlot = timeSlot;
            showtime.dayType = dayType;
            showtime.priceConfig = priceConfig;
        }
        if (date) showtime.date = new Date(date);
        if (basePrice) showtime.basePrice = basePrice;
        if (dayTypeOverride) showtime.dayType = dayTypeOverride;

        await showtime.save();
        res.json(showtime);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Cancel showtime + bulk refund all pending/confirmed bookings
router.put('/:id/cancel', protect, admin, async (req, res) => {
    try {
        const showtime = await Showtime.findById(req.params.id);
        if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

        showtime.status = 'cancelled';
        await showtime.save();

        // Find all non-cancelled bookings for this showtime
        const bookings = await Booking.find({
            showtime: showtime._id,
            status: { $in: ['pending', 'paid'] },
        }).populate('user', 'name email');

        const bookingIds = bookings.map(b => b._id);
        const seatIds = bookings.flatMap(b => b.seats);

        // Release all seats
        await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });

        // Mark bookings as cancelled
        await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });

        // Mark confirmed payments as refunded
        const confirmedBookingIds = bookings.filter(b => b.status === 'paid').map(b => b._id);
        if (confirmedBookingIds.length > 0) {
            const refundedBookingIds = await markPaymentsRefunded(confirmedBookingIds);
            if (refundedBookingIds.length > 0) {
                await Booking.updateMany({ _id: { $in: refundedBookingIds } }, { status: 'refunded' });
            }
        }

        for (const booking of bookings) {
            sendShowtimeCancelledEmail(booking).catch(() => {});
            if (booking.status === 'paid') sendRefundEmail(booking).catch(() => {});
        }

        res.json({
            message: 'Showtime cancelled',
            cancelledBookings: bookings.length,
            refundedBookings: confirmedBookingIds.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
