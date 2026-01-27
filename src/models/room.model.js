const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        cinemaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cinema',
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        rows: {
            type: Number,
            required: true
        },
        columns: {
            type: Number,
            required: true
        },
        totalSeats: {
            type: Number
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);