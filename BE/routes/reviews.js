const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/auth');
const Review = require('../models/Review');
const User = require('../models/User'); // Import User model
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');
const Movie = require('../models/Movie');
const bulkController = require('../controllers/bulkController');

// endTime is "HH:mm" Vietnam time (UTC+7)
// date may be stored as UTC midnight OR Vietnam midnight depending on script origin
function isShowtimeEnded(showtime) {
    if (!showtime.endTime || !showtime.date) return false;
    // Always extract Vietnam calendar date to avoid off-by-one from timezone mismatch
    const vnDateStr = new Date(showtime.date)
        .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
    const endVN = new Date(`${vnDateStr}T${showtime.endTime}:00+07:00`);
    // Handle midnight crossing: e.g. startTime 23:00, endTime 01:30 → end is next day
    if (showtime.startTime && showtime.endTime < showtime.startTime) {
        endVN.setUTCDate(endVN.getUTCDate() + 1);
    }
    return Date.now() > endVN.getTime();
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
        let reviews = await Review.find({ movie: req.params.movieId })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Transform null users to fallback so FE never crashes
        reviews = reviews.map(r => ({
            ...r,
            user: r.user || { _id: null, name: 'Người dùng đã xóa' },
        }));

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
        if (!review.user || review.user.toString() !== req.user._id.toString())
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

        // LAYER 1: Raw DB query
        const rawReviews = await Review.find(query)
            .populate('user', 'name email')
            .populate('movie', 'title poster')
            .sort({ createdAt: -1 })
            .lean();

        console.log(`[Admin Reviews DEBUG] Total from DB: ${rawReviews.length}`);
        if (rawReviews.length > 0) {
            console.log(`[Admin Reviews DEBUG] Sample 0: ID=${rawReviews[0]._id}, User=${rawReviews[0].user?.name}, Movie=${rawReviews[0].movie?.title}`);
        }

        // LAYER 2: Transform
        let reviews = rawReviews.map(r => ({
            ...r,
            user: r.user || { _id: null, name: 'Người dùng đã xóa', email: '' },
            movie: r.movie || { _id: null, title: 'Phim đã xóa', poster: '' },
        }));

        // LAYER 3: Search filter
        if (search) {
            const q = search.toLowerCase();
            reviews = reviews.filter(r =>
                (r.movie?.title && r.movie.title.toLowerCase().includes(q)) ||
                (r.user?.name && r.user.name.toLowerCase().includes(q)) ||
                (r.comment && r.comment.toLowerCase().includes(q))
            );
        }

        const total = reviews.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        
        // Check if page is out of bounds
        if ((pageNum - 1) * limitNum >= total && total > 0) {
            console.log(`[Admin Reviews DEBUG] Page ${pageNum} out of bounds (total: ${total})`);
        }

        const paginated = reviews.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        console.log(`[Admin Reviews DEBUG] Returning ${paginated.length} reviews for page ${pageNum}`);

        res.json({
            reviews: paginated,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        console.error('[Admin Reviews DEBUG] ERROR:', error);
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
