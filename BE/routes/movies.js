const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const { protect, admin } = require('../middleware/auth');
const { calcEndTime } = require('../utils/pricing');
const { sendRefundEmail, sendShowtimeCancelledEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');

router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find({}).populate('genre');
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).populate('genre');
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', protect, admin, async (req, res) => {
    const { title, genre, duration, poster, trailer, description, status, ageRestriction, director, cast, releaseDate } = req.body;
    try {
        const movie = new Movie({ title, genre, duration, poster, trailer, description, status, ageRestriction, director, cast, releaseDate });
        const createdMovie = await movie.save();
        res.status(201).json(createdMovie);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update movie — if duration changes, warn about affected showtimes
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });

        const oldDuration = movie.duration;
        const newDuration = req.body.duration ? Number(req.body.duration) : oldDuration;
        const durationChanged = newDuration !== oldDuration;

        Object.assign(movie, req.body);
        const updated = await movie.save();

        let affectedShowtimes = [];

        if (durationChanged) {
            // Find upcoming active showtimes for this movie
            const upcoming = await Showtime.find({
                movie: movie._id,
                status: 'active',
                date: { $gte: new Date() },
            }).populate('cinema', 'name').populate('room', 'name');

            for (const st of upcoming) {
                const newEndTime = calcEndTime(st.startTime, newDuration);
                // Update endTime in DB
                await Showtime.findByIdAndUpdate(st._id, { endTime: newEndTime });

                // Count pending/paid bookings affected
                const bookingCount = await Booking.countDocuments({
                    showtime: st._id,
                    status: { $in: ['pending', 'paid'] },
                });

                affectedShowtimes.push({
                    _id: st._id,
                    date: st.date,
                    startTime: st.startTime,
                    oldEndTime: st.endTime,
                    newEndTime,
                    cinema: st.cinema?.name,
                    room: st.room?.name,
                    affectedBookings: bookingCount,
                });
            }
        }

        res.json({
            movie: updated,
            durationChanged,
            affectedShowtimes,
            warning: affectedShowtimes.length > 0
                ? `Thời lượng phim thay đổi ảnh hưởng ${affectedShowtimes.length} suất chiếu sắp tới`
                : null,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Bulk cancel affected showtimes when movie duration changes significantly
// Admin calls this after reviewing warnings
router.post('/:id/cancel-affected', protect, admin, async (req, res) => {
    try {
        const { showtimeIds } = req.body; // array of showtime IDs to cancel + refund
        if (!showtimeIds || showtimeIds.length === 0) {
            return res.status(400).json({ message: 'No showtime IDs provided' });
        }

        let totalCancelled = 0;
        let totalRefunded = 0;

        for (const showtimeId of showtimeIds) {
            const showtime = await Showtime.findById(showtimeId);
            if (!showtime || showtime.status === 'cancelled') continue;

            showtime.status = 'cancelled';
            await showtime.save();

            const bookings = await Booking.find({
                showtime: showtimeId,
                status: { $in: ['pending', 'paid'] },
            });

            const bookingIds = bookings.map(b => b._id);
            const seatIds = bookings.flatMap(b => b.seats);

            await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });
            await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });

            const paidIds = bookings.filter(b => b.status === 'paid').map(b => b._id);
            if (paidIds.length > 0) {
                for (const booking of bookings.filter((item) => item.status === 'paid')) {
                    await Payment.updateMany(
                        { booking: booking._id, status: 'success' },
                        {
                            $set: {
                                status: 'refunded',
                                refundDate: new Date(),
                                refundAmount: booking.totalPrice,
                            },
                        }
                    );
                }
                await Booking.updateMany({ _id: { $in: paidIds } }, { status: 'refunded' });
                totalRefunded += paidIds.length;

                for (const bookingId of paidIds) {
                    const bookingContext = await Booking.findById(bookingId)
                        .populate('user', 'name email phone')
                        .populate({
                            path: 'showtime',
                            populate: [
                                { path: 'movie', select: 'title poster' },
                                { path: 'cinema', select: 'name address' },
                                { path: 'room', select: 'name' },
                            ],
                        });
                    await sendShowtimeCancelledEmail(bookingContext, 'Lịch chiếu bị ảnh hưởng do thay đổi thời lượng phim');
                    await sendRefundEmail(bookingContext, 'Lịch chiếu bị ảnh hưởng do thay đổi thời lượng phim');
                }
            }

            totalCancelled += bookings.length;
        }

        if (showtimeIds.length > 0) {
            notificationService.createNotification({
                type: 'showtime_cancelled',
                title: 'Hủy suất chiếu bị ảnh hưởng',
                message: `Đã hủy ${showtimeIds.length} suất chiếu sau khi cập nhật phim, hoàn ${totalRefunded} đơn`,
                data: {
                    movieId: req.params.id,
                    showtimeIds,
                    totalRefunded,
                },
            });
        }

        res.json({
            message: `Đã huỷ ${showtimeIds.length} suất chiếu, hoàn tiền ${totalRefunded} đơn`,
            totalCancelled,
            totalRefunded,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Movie not found' });
        await movie.deleteOne();
        res.json({ message: 'Movie removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
