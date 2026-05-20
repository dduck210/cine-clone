const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Showtime = require('../models/Showtime');

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
        const showtimes = await Showtime.find({ movie: req.params.movieId }).select('_id');
        const showtimeIds = showtimes.map(s => s._id);

        const hasPaidBooking = await Booking.exists({
            user: req.user._id,
            showtime: { $in: showtimeIds },
            status: 'paid',
        });

        const existingReview = await Review.findOne({ user: req.user._id, movie: req.params.movieId });

        res.json({ canReview: !!hasPaidBooking, hasReviewed: !!existingReview, reviewId: existingReview?._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/reviews — add review (protected, requires paid booking)
router.post('/', protect, async (req, res) => {
    const { movieId, rating, comment } = req.body;
    try {
        const showtimes = await Showtime.find({ movie: movieId }).select('_id');
        const showtimeIds = showtimes.map(s => s._id);

        const hasPaidBooking = await Booking.exists({
            user: req.user._id,
            showtime: { $in: showtimeIds },
            status: 'paid',
        });

        if (!hasPaidBooking)
            return res.status(403).json({ message: 'Bạn cần đặt vé xem phim này trước khi đánh giá' });

        const review = await Review.create({ user: req.user._id, movie: movieId, rating, comment });
        await review.populate('user', 'name');
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

        await review.deleteOne();
        res.json({ message: 'Đã xóa review' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
