const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    duration: { type: Number, required: true }, // in minutes
    poster: { type: String }, // URL or path
    trailer: { type: String }, // URL
    description: { type: String },
    director: { type: String },
    cast: { type: String },
    releaseDate: { type: Date },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['now_showing', 'coming_soon', 'stopped'], default: 'coming_soon' },
    screeningEndDate: { type: Date },
    ageRestriction: { type: String, default: 'All ages' },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);