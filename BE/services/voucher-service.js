const mongoose = require('mongoose');
const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');
const { getVoucherStatus } = require('./voucher-status-service');

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
    const voucher = await Voucher.findOne({ code: code.toUpperCase().trim() });
    if (!voucher) {
        return { valid: false, error: 'Mã giảm giá không tồn tại' };
    }

    const status = getVoucherStatus(voucher);

    // Specific error messages based on status
    if (status === 'inactive') {
        return { valid: false, error: 'Mã giảm giá đã bị vô hiệu hóa' };
    }
    if (status === 'upcoming') {
        return { valid: false, error: 'Mã giảm giá chưa đến thời gian sử dụng' };
    }
    if (status === 'expired') {
        return { valid: false, error: 'Mã giảm giá đã hết hạn' };
    }
    if (status === 'used-up') {
        return { valid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    // Check min order
    if (orderAmount < voucher.minOrderAmount) {
        return {
            valid: false,
            error: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này`,
        };
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

        // Increment totalUsedCount
        const voucher = await Voucher.findByIdAndUpdate(
            voucherId,
            { $inc: { totalUsedCount: 1 } },
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
