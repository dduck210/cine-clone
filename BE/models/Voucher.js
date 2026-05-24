const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true }, // percent (20) or fixed amount (50000)
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent type
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: null }, // null = unlimited
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 }, // max uses per user
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
