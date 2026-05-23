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
    releaseDate: { type: Date, required: true },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['now_showing', 'coming_soon', 'stopped'], default: 'coming_soon' },
    screeningEndDate: { type: Date, required: true },
    ageRestriction: { type: String, default: 'All ages' },
}, { timestamps: true });

movieSchema.pre('save', function(next) {
    const now = new Date();
    // Normalize now to start of day for comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Ensure we are working with Date objects
    const releaseDate = this.releaseDate ? new Date(this.releaseDate) : null;
    const screeningEndDate = this.screeningEndDate ? new Date(this.screeningEndDate) : null;

    if (screeningEndDate && screeningEndDate < today) {
        this.status = 'stopped';
    } 
    else if (releaseDate) {
        if (releaseDate <= today) {
            this.status = 'now_showing';
        } else {
            this.status = 'coming_soon';
        }
    }

    next();
});

module.exports = mongoose.model('Movie', movieSchema);