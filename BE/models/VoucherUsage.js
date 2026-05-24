const mongoose = require('mongoose');

const voucherUsageSchema = new mongoose.Schema({
    voucher: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date, default: Date.now },
}, { timestamps: true });

voucherUsageSchema.index({ voucher: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('VoucherUsage', voucherUsageSchema);
