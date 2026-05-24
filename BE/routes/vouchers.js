const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const { protect, admin } = require('../middleware/auth');
const voucherService = require('../services/voucher-service');
const voucherStatusService = require('../services/voucher-status-service');

// POST /api/vouchers/validate — check code and return discount amount (protected)
router.post('/validate', protect, async (req, res) => {
    const { code, orderAmount } = req.body;
    try {
        if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });

        const result = await voucherService.validateVoucher(code, req.user._id, orderAmount || 0);

        if (!result.valid) {
            return res.status(400).json({ message: result.error });
        }

        res.json({
            valid: true,
            discountAmount: result.discountAmount,
            voucher: {
                code: result.voucher.code,
                type: result.voucher.type,
                value: result.voucher.value,
                description: result.voucher.description,
            },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin CRUD
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        const enriched = vouchers.map((v) => voucherStatusService.enrichVoucher(v));
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/admin', protect, admin, async (req, res) => {
    try {
        const {
            code, type, value,
            minOrderAmount, maxDiscount,
            startsAt, expiresAt,
            maxUsers, maxUsagePerUser, totalUsageLimit,
            description,
        } = req.body;

        const toNumberOrNull = (v) => (v === '' || v === undefined || v === null ? null : Number(v));

        const voucher = await Voucher.create({
            code: code.toUpperCase().trim(),
            type,
            value: Number(value),
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscount: toNumberOrNull(maxDiscount),
            startsAt: startsAt || null,
            expiresAt: new Date(expiresAt),
            maxUsers: toNumberOrNull(maxUsers),
            maxUsagePerUser: toNumberOrNull(maxUsagePerUser),
            totalUsageLimit: toNumberOrNull(totalUsageLimit),
            // Legacy fields for backward compat
            usageLimit: toNumberOrNull(totalUsageLimit),
            perUserLimit: toNumberOrNull(maxUsagePerUser) ?? 1,
            usedCount: 0,
            totalUsedCount: 0,
            description: description || '',
        });
        res.status(201).json(voucher);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
        res.status(500).json({ message: error.message });
    }
});

router.put('/admin/:id', protect, admin, async (req, res) => {
    try {
        const update = { ...req.body };

        // Sync legacy fields when new fields are present
        if (req.body.totalUsageLimit !== undefined) {
            update.usageLimit = req.body.totalUsageLimit === '' || req.body.totalUsageLimit === null
                ? null : Number(req.body.totalUsageLimit);
        }
        if (req.body.maxUsagePerUser !== undefined) {
            update.perUserLimit = req.body.maxUsagePerUser === '' || req.body.maxUsagePerUser === null
                ? null : Number(req.body.maxUsagePerUser);
        }

        // Normalize empty strings to null for numeric fields
        ['maxUsers', 'maxUsagePerUser', 'totalUsageLimit', 'maxDiscount'].forEach((k) => {
            if (update[k] === '') update[k] = null;
        });

        const voucher = await Voucher.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });
        res.json(voucher);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/admin/:id', protect, admin, async (req, res) => {
    try {
        await Voucher.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa voucher' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
