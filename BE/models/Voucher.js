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
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived'], default: 'active' },
    description: { type: String, default: '' },
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Senior Alignment: Aliases to match log.md requirements exactly
voucherSchema.virtual('startDate').get(function() { return this.startsAt; }).set(function(v) { this.startsAt = v; });
voucherSchema.virtual('endDate').get(function() { return this.expiresAt; }).set(function(v) { this.expiresAt = v; });
voucherSchema.virtual('usageLimit').get(function() { return this.totalUsageLimit; }).set(function(v) { this.totalUsageLimit = v; });
voucherSchema.virtual('usedCount').get(function() { return this.totalUsedCount; }).set(function(v) { this.totalUsedCount = v; });
voucherSchema.virtual('isActive').get(function() { return this.status === 'active'; });

// Principal Standard: Additional aliases
voucherSchema.virtual('discountType').get(function() { return this.type; }).set(function(v) { this.type = v; });
voucherSchema.virtual('discountValue').get(function() { return this.value; }).set(function(v) { this.value = v; });
voucherSchema.virtual('usedUsersCount').get(function() { return this.uniqueUserCount; }).set(function(v) { this.uniqueUserCount = v; });
voucherSchema.virtual('perUserLimit').get(function() { return this.maxUsagePerUser; }).set(function(v) { this.maxUsagePerUser = v; });

module.exports = mongoose.model('Voucher', voucherSchema);
