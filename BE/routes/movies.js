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

// Utility to handle common Mongoose errors
const handleErrors = (res, error, defaultMsg = 'Internal Server Error') => {
    console.error(`[Error] ${defaultMsg}:`, error);
    if (error.name === 'ValidationError') {
        return res.status(400).json({ 
            message: error.message, 
            details: Object.keys(error.errors).map(key => error.errors[key].message) 
        });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'ID không hợp lệ' });
    }
    return res.status(500).json({ message: error.message || defaultMsg });
};

router.get('/genres', async (req, res) => {
    try {
        const genres = await Genre.find({}).sort({ name: 1 });
        res.json(genres);
    } catch (error) {
        handleErrors(res, error, 'Lỗi khi lấy danh sách thể loại');
    }
});

// POST /api/movies/bulk-delete — xóa nhiều phim
router.post('/bulk-delete', protect, admin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });
        }
        const result = await Movie.deleteMany({ _id: { $in: ids } });
        res.json({ message: `Đã xóa ${result.deletedCount} phim`, deletedCount: result.deletedCount });
    } catch (error) {
        handleErrors(res, error, 'Lỗi khi xóa phim');
    }
});

router.get('/', async (req, res) => {
    try {
        const movies = await Movie.find({}).populate('genre');
        res.json(movies);
    } catch (error) {
        handleErrors(res, error, 'Lỗi khi lấy danh sách phim');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).populate('genre');
        if (!movie) return res.status(404).json({ message: 'Phim không tồn tại' });
        res.json(movie);
    } catch (error) {
        handleErrors(res, error, 'Lỗi khi lấy thông tin phim');
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
        handleErrors(res, error, 'Lỗi khi thêm phim');
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
        handleErrors(res, error, 'Lỗi khi cập nhật phim');
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
        handleErrors(res, error, 'Lỗi khi hủy suất chiếu bị ảnh hưởng');
    }
});

router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ message: 'Phim không tồn tại' });
        await movie.deleteOne();
        res.json({ message: 'Đã xóa phim' });
    } catch (error) {
        handleErrors(res, error, 'Lỗi khi xóa phim');
    }
});

module.exports = router;
