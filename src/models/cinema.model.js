const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true
        },
        phone: String,
        email: String,
        city: String,
        district: String,
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        description: String,
        image: String
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cinema', cinemaSchema);