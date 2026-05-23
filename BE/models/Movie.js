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

movieSchema.pre('save', function(next) {
    const now = new Date();
    
    // Auto update status based on dates
    if (this.releaseDate) {
        // If release date has passed and status is still coming_soon, move to now_showing
        if (this.releaseDate <= now && this.status === 'coming_soon') {
            this.status = 'now_showing';
        } 
        // If release date is in the future and status is now_showing, move back to coming_soon
        else if (this.releaseDate > now && this.status === 'now_showing') {
            this.status = 'coming_soon';
        }
    }

    if (this.screeningEndDate && this.screeningEndDate < now && this.status === 'now_showing') {
        this.status = 'stopped';
    }

    next();
});

module.exports = mongoose.model('Movie', movieSchema);