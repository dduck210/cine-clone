const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Genre = require('../models/Genre');
const Showtime = require('../models/Showtime');
const Booking = require('../models/Booking');
const Seat = require('../models/Seat');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { protect, admin } = require('../middleware/auth');
const { calcEndTime } = require('../utils/pricing');
const { sendRefundEmail, sendShowtimeCancelledEmail } = require('../services/email-service');
const notificationService = require('../services/notification-service');
const bulkController = require('../controllers/bulkController');

const { handleApiError } = require('../utils/error-handler');

router.get('/genres', async (req, res) => {
    try {
        const genres = await Genre.find({}).sort({ name: 1 });
        res.json(genres);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi lấy danh sách thể loại');
    }
});

// POST /api/movies/bulk-delete — xóa nhiều phim
router.post('/bulk-delete', protect, admin, bulkController.bulkDeleteMovies);

router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find({}).populate('genre');
        res.json(movies);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi lấy danh sách phim');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).populate('genre');
        if (!movie) return res.status(404).json({ message: 'Phim không tồn tại' });
        res.json(movie);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi lấy thông tin phim');
    }
});

router.post('/', protect, admin, async (req, res) => {
    try {
        if (req.body.genre === '' || (Array.isArray(req.body.genre) && req.body.genre.length === 0)) {
            delete req.body.genre;
        }

        const movie = new Movie(req.body);
        const createdMovie = await movie.save();
        
        try {
            await createdMovie.populate('genre');
        } catch (popError) {
            console.error('Populate Genre Error (Non-fatal):', popError.message);
        }

        notificationService.createNotification({
            type: 'movie_created',
            title: 'Phim mới đã được thêm',
            message: `Phim "${createdMovie.title}" đã được thêm vào hệ thống.`,
            data: { movieId: createdMovie._id }
        });

        return res.status(201).json(createdMovie);
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi thêm phim');
    }
});

router.put('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Phim không tồn tại' });

        const oldDuration = movie.duration;
        const newDuration = req.body.duration ? Number(req.body.duration) : oldDuration;
        const durationChanged = newDuration !== oldDuration;

        Object.assign(movie, req.body);
        const updated = await movie.save();

        let affectedShowtimes = [];

        if (durationChanged) {
            const upcoming = await Showtime.find({
                movie: movie._id,
                status: 'active',
                date: { $gte: new Date() },
            }).populate('cinema', 'name').populate('room', 'name');

            for (const st of upcoming) {
                const newEndTime = calcEndTime(st.startTime, newDuration);
                await Showtime.findByIdAndUpdate(st._id, { endTime: newEndTime });

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

        await updated.populate('genre');
        res.json({
            movie: updated,
            durationChanged,
            affectedShowtimes,
            warning: affectedShowtimes.length > 0
                ? `Thời lượng phim thay đổi ảnh hưởng ${affectedShowtimes.length} suất chiếu sắp tới`
                : null,
        });
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi cập nhật phim');
    }
});

router.post('/:id/cancel-affected', protect, admin, async (req, res) => {
    try {
        const { showtimeIds } = req.body;
        if (!showtimeIds || showtimeIds.length === 0) {
            return res.status(400).json({ message: 'Không có ID suất chiếu nào được cung cấp' });
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
        handleApiError(res, error, 'Lỗi khi hủy suất chiếu bị ảnh hưởng');
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Phim không tồn tại' });

        // Cascade: find and cancel all showtimes for this movie
        const showtimes = await Showtime.find({ movie: movie._id });
        let cancelledCount = 0;
        let refundedCount = 0;

        for (const st of showtimes) {
            if (st.status === 'cancelled') continue;

            st.status = 'cancelled';
            await st.save();
            cancelledCount++;

            // Cancel related bookings and free seats
            const bookings = await Booking.find({ showtime: st._id, status: { $in: ['pending', 'paid'] } });
            if (bookings.length > 0) {
                const bookingIds = bookings.map(b => b._id);
                const seatIds = bookings.flatMap(b => b.seats);

                await Seat.updateMany({ _id: { $in: seatIds } }, { status: 'available', bookedBy: null });
                await Booking.updateMany({ _id: { $in: bookingIds } }, { status: 'cancelled' });

                const paidBookings = bookings.filter(b => b.status === 'paid');
                for (const booking of paidBookings) {
                    await Payment.updateMany({ booking: booking._id, status: 'success' }, {
                        $set: { status: 'refunded', refundDate: new Date(), refundAmount: booking.totalPrice }
                    });
                    await Booking.findByIdAndUpdate(booking._id, { status: 'refunded' });
                }
                refundedCount += paidBookings.length;
            }
        }

        // Send refund emails BEFORE deleting movie (so populate still resolves)
        if (refundedCount > 0) {
            const movieTitle = movie.title;
            for (const st of showtimes) {
                const refundedBookings = await Booking.find({ showtime: st._id, status: 'refunded' });
                for (const booking of refundedBookings) {
                    try {
                        const ctx = await Booking.findById(booking._id)
                            .populate('user')
                            .populate({ path: 'showtime', populate: [{ path: 'movie' }, { path: 'cinema' }, { path: 'room' }] });
                        if (ctx) {
                            await sendShowtimeCancelledEmail(ctx, `Phim "${movieTitle}" đã bị xóa khỏi hệ thống`);
                            await sendRefundEmail(ctx, `Phim "${movieTitle}" đã bị xóa khỏi hệ thống`);
                        }
                    } catch (e) {
                        console.error(`[DELETE MOVIE] Email failed for booking ${booking._id}:`, e.message);
                    }
                }
            }
        }

        console.log(`[DELETE MOVIE] Admin ${req.user._id} (${req.user.name}) deleted movie "${movie.title}" (${movie._id}). Cancelled ${cancelledCount} showtimes, refunded ${refundedCount} bookings.`);

        // Cascade: nullify movie reference in reviews so they display with fallback
        await Review.updateMany({ movie: movie._id }, { $set: { movie: null } });

        await movie.deleteOne();
        res.json({
            message: `Đã xóa phim "${movie.title}". ${cancelledCount > 0 ? `Hủy ${cancelledCount} suất chiếu, hoàn tiền ${refundedCount} đơn hàng.` : ''}`,
            cancelledShowtimes: cancelledCount,
            refundedBookings: refundedCount,
        });
    } catch (error) {
        handleApiError(res, error, 'Lỗi khi xóa phim');
    }
});

module.exports = router;
