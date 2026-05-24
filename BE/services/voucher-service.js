const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');
const { getEffectiveStatus, getUsageStatus } = require('./voucher-status-service');

function calcDiscount(voucher, orderAmount) {
    let discount = voucher.type === 'percent'
        ? Math.round(orderAmount * voucher.value / 100)
        : voucher.value;
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
    return Math.min(discount, orderAmount);
}

/**
 * Pure validation — no side effects.
 * Returns { valid: true, discountAmount, voucher } or { valid: false, error }
 */
async function validateVoucher(code, userId, orderAmount) {
    const voucher = await Voucher.findOne({ code: code.toUpperCase().trim(), status: 'active' });
    if (!voucher) {
        return { valid: false, error: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu hóa' };
    }

    // Check effective status (time-based)
    const effective = getEffectiveStatus(voucher);
    if (effective === 'upcoming') {
        return { valid: false, error: 'Mã giảm giá chưa có hiệu lực' };
    }
    if (effective === 'expired') {
        return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }

    // Check min order
    if (orderAmount < voucher.minOrderAmount) {
        return {
            valid: false,
            error: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`,
        };
    }

    // Check usage status (quota-based)
    const usage = getUsageStatus(voucher);
    if (usage === 'sold_out') {
        return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    // Check per-user limits via VoucherUsage
    const usageRecord = await VoucherUsage.findOne({ voucher: voucher._id, user: userId });

    if (usageRecord) {
        if (voucher.maxUsagePerUser !== null && usageRecord.usageCount >= voucher.maxUsagePerUser) {
            return { valid: false, error: 'Bạn đã dùng hết số lượt của mã này' };
        }
    } else {
        if (voucher.maxUsers !== null && voucher.uniqueUserCount >= voucher.maxUsers) {
            return { valid: false, error: 'Mã giảm giá đã đạt giới hạn người dùng' };
        }
    }

    const discountAmount = calcDiscount(voucher, orderAmount);
    return { valid: true, discountAmount, voucher };
}

/**
 * Atomic apply — increments counters inside a transaction.
 * Call AFTER payment succeeds (or during booking creation).
 */
async function applyVoucher(voucherId, userId) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Increment totalUsedCount (and legacy usedCount for backward compat)
        const voucher = await Voucher.findByIdAndUpdate(
            voucherId,
            { $inc: { totalUsedCount: 1, usedCount: 1 } },
            { new: true, session }
        );
        if (!voucher) {
            await session.abortTransaction();
            session.endSession();
            return null;
        }

        // Upsert VoucherUsage
        const existing = await VoucherUsage.findOneAndUpdate(
            { voucher: voucherId, user: userId },
            {
                $inc: { usageCount: 1 },
                $set: { lastUsedAt: new Date() },
            },
            { upsert: true, new: true, session }
        );

        // If this was a new document (first time user), increment uniqueUserCount
        if (existing.usageCount === 1) {
            await Voucher.findByIdAndUpdate(
                voucherId,
                { $inc: { uniqueUserCount: 1 } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return existing;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}

module.exports = { calcDiscount, validateVoucher, applyVoucher };
