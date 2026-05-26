const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', default: null },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
}, { timestamps: true });

// One review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
