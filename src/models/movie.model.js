const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: String,
        duration: {
            type: Number,
            required: true
        },
        ageLimit: {
            type: String,
            enum: ['G', 'PG', 'PG-13', 'R', '16+', '18+'],
            default: 'PG'
        },
        trailerUrl: String,
        posterUrl: String,
        genres: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Genre'
            }
        ],
        director: String,
        cast: [String],
        releaseDate: Date,
        status: {
            type: String,
            enum: ['now_showing', 'coming_soon', 'hidden'],
            default: 'coming_soon'
        },
        rating: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        reviewCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Movie', movieSchema);