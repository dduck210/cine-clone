const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    seatCode: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'holding', 'booked'],
        default: 'available'
    },
    holdExpireAt: Date
});

const showtimeSchema = new mongoose.Schema(
    {
        movieId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Movie',
            required: true
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
        },
        cinemaId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cinema',
            required: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: Date,
        price: {
            type: Number,
            required: true
        },
        seats: [seatSchema],
        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
            default: 'scheduled'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Showtime', showtimeSchema);