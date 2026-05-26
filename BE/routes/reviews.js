const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const bulkController = require('../controllers/bulkController');

// endTime is "HH:mm" Vietnam time (UTC+7); date is stored as UTC Date
function isShowtimeEnded(showtime) {
    if (!showtime.endTime) return false;
    const d = new Date(showtime.date);
    const [h, m] = showtime.endTime.split(':').map(Number);
    // Convert VN endTime to UTC: subtract 7 hours (Date.UTC handles underflow)
    const endUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h - 7, m);
    return Date.now() > endUtc;
}

async function recalcMovieRating(movieId) {
    const result = await Review.aggregate([
        { $match: { movie: new mongoose.Types.ObjectId(movieId) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);
    const avg = result.length ? Math.round(result[0].avg * 10) / 10 : 0;
    await Movie.findByIdAndUpdate(movieId, { rating: avg });
}

// POST /api/reviews/admin/bulk-delete — xóa nhiều review
router.post('/admin/bulk-delete', protect, admin, bulkController.bulkDeleteReviews);

// GET /api/reviews/movie/:movieId — public
router.get('/movie/:movieId', async (req, res) => {
    try {
        const reviews = await Review.find({ movie: req.params.movieId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/reviews/can-review/:movieId — check eligibility (protected)
router.get('/can-review/:movieId', protect, async (req, res) => {
    try {
        const showtimes = await Showtime.find({ movie: req.params.movieId }).select('_id date startTime endTime');
        const showtimeIds = showtimes.map(s => s._id);

        const paidBookings = await Booking.find({
            user: req.user._id,
            showtime: { $in: showtimeIds },
            status: 'paid',
        }).select('showtime');

        const existingReview = await Review.findOne({ user: req.user._id, movie: req.params.movieId });

        if (!paidBookings.length) {
            return res.json({ canReview: false, hasReviewed: !!existingReview, reviewId: existingReview?._id, hasPendingShowtime: false });
        }

        const showtimeMap = Object.fromEntries(showtimes.map(s => [s._id.toString(), s]));
        let canReview = false;
        let hasPendingShowtime = false;

        for (const booking of paidBookings) {
            const st = showtimeMap[booking.showtime.toString()];
            if (!st) continue;
            if (isShowtimeEnded(st)) canReview = true;
            else hasPendingShowtime = true;
        }

        res.json({ canReview, hasReviewed: !!existingReview, reviewId: existingReview?._id, hasPendingShowtime });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/reviews — add review (protected, requires paid booking after showtime ends)
router.post('/', protect, async (req, res) => {
    const { movieId, rating, comment } = req.body;
    try {
        const showtimes = await Showtime.find({ movie: movieId }).select('_id date startTime endTime');
        const showtimeIds = showtimes.map(s => s._id);

        const paidBookings = await Booking.find({
            user: req.user._id,
            showtime: { $in: showtimeIds },
            status: 'paid',
        }).select('showtime');

        if (!paidBookings.length)
            return res.status(403).json({ message: 'Bạn cần đặt vé xem phim này trước khi đánh giá' });

        const showtimeMap = Object.fromEntries(showtimes.map(s => [s._id.toString(), s]));
        const hasEndedShowtime = paidBookings.some(b => {
            const st = showtimeMap[b.showtime.toString()];
            return st && isShowtimeEnded(st);
        });

        if (!hasEndedShowtime)
            return res.status(403).json({ message: 'Bạn chỉ có thể đánh giá sau khi phim kết thúc' });

        const review = await Review.create({ user: req.user._id, movie: movieId, rating, comment });
        await review.populate('user', 'name');
        await recalcMovieRating(movieId);
        res.status(201).json(review);
    } catch (error) {
        if (error.code === 11000)
            return res.status(400).json({ message: 'Bạn đã đánh giá phim này rồi' });
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/reviews/:id — delete own review (protected)
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review không tồn tại' });
        if (review.user.toString() !== req.user._id.toString())
            return res.status(403).json({ message: 'Không có quyền xóa review này' });

        const movieId = review.movie;
        await review.deleteOne();
        await recalcMovieRating(movieId);
        res.json({ message: 'Đã xóa review' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/reviews/admin/all — list all reviews for admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const { search = '', rating = '', page = 1, limit = 10 } = req.query;
        const query = {};
        if (rating) query.rating = Number(rating);

        let reviews = await Review.find(query)
            .populate('user', 'name email')
            .populate('movie', 'title poster')
            .sort({ createdAt: -1 });

        if (search) {
            const q = search.toLowerCase();
            reviews = reviews.filter(r =>
                r.movie?.title?.toLowerCase().includes(q) ||
                r.user?.name?.toLowerCase().includes(q) ||
                r.comment?.toLowerCase().includes(q)
            );
        }

        const total = reviews.length;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const paginated = reviews.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({ items: paginated, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/reviews/admin/:id — admin delete any review
router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review không tồn tại' });

        const movieId = review.movie;
        await review.deleteOne();
        await recalcMovieRating(movieId);
        res.json({ message: 'Đã xóa review' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
