const mongoose = require('mongoose');

const comboSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: String,
        items: [
            {
                name: String,
                quantity: Number,
                price: Number
            }
        ],
        price: {
            type: Number,
            required: true
        },
        image: String,
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Combo', comboSchema);
