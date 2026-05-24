const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true }, // percent (20) or fixed amount (50000)
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null }, // cap for percent type
    startsAt: { type: Date, default: null }, // null = effective immediately
    expiresAt: { type: Date, required: true },
    // Usage limits (null = unlimited)
    maxUsers: { type: Number, default: null }, // max unique users who can use this voucher
    maxUsagePerUser: { type: Number, default: null }, // max times each user can use (null = unlimited)
    totalUsageLimit: { type: Number, default: null }, // global usage cap
    // Counters
    totalUsedCount: { type: Number, default: 0 },
    uniqueUserCount: { type: Number, default: 0 },
    // Legacy tracking (deprecated — replaced by VoucherUsage collection)
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    perUserLimit: { type: Number, default: 1 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived'], default: 'active' },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Voucher', voucherSchema);
