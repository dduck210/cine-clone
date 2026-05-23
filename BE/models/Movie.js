const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
    duration: { type: Number, required: true }, // in minutes
    poster: { type: String }, // URL or path (portrait 2:3)
    backdrop: { type: String }, // URL landscape 16:9 for banner slider
    trailer: { type: String }, // URL
    description: { type: String },
    director: { type: String },
    cast: { type: String },
    language: { type: String },
    releaseDate: { type: Date, required: true },
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['now_showing', 'coming_soon', 'stopped'], default: 'coming_soon' },
    screeningEndDate: { type: Date, required: true },
    ageRestriction: { type: String, default: 'All ages' },
}, { timestamps: true });

movieSchema.pre('save', async function() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const rd = this.releaseDate ? new Date(this.releaseDate) : null;
    const ed = this.screeningEndDate ? new Date(this.screeningEndDate) : null;

    let releaseDate = null;
    if (rd && !isNaN(rd.getTime())) {
        releaseDate = new Date(rd.getFullYear(), rd.getMonth(), rd.getDate());
    }

    let endDate = null;
    if (ed && !isNaN(ed.getTime())) {
        endDate = new Date(ed.getFullYear(), ed.getMonth(), ed.getDate());
    }

    let newStatus = 'coming_soon';

    if (endDate) {
        if (endDate < today) {
            newStatus = 'stopped';
        } else if (releaseDate) {
            if (releaseDate <= today) {
                newStatus = 'now_showing';
            } else {
                newStatus = 'coming_soon';
            }
        }
    } else if (releaseDate) {
        if (releaseDate <= today) {
            newStatus = 'now_showing';
        } else {
            newStatus = 'coming_soon';
        }
    }

    this.status = newStatus;
});

module.exports = mongoose.model('Movie', movieSchema);
