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
// POST /api/vouchers/admin/bulk-delete — xóa nhiều voucher
router.post('/admin/bulk-delete', protect, admin, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });
        }
        const result = await Voucher.deleteMany({ _id: { $in: ids } });
        res.json({ 
            message: `Đã xóa ${result.deletedCount} voucher thành công`, 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Lỗi khi xóa voucher' });
    }
});

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
        
        // Senior: Assume ICT (UTC+7) for datetime-local strings if no offset
        const parseClientDate = (d) => {
            if (!d) return null;
            if (d.includes('+') || d.endsWith('Z')) return new Date(d);
            return new Date(d + ":00+07:00");
        };

        const voucher = await Voucher.create({
            code: code.toUpperCase().trim(),
            type,
            value: Number(value),
            minOrderAmount: Number(minOrderAmount) || 0,
            maxDiscount: toNumberOrNull(maxDiscount),
            startsAt: parseClientDate(startsAt),
            expiresAt: parseClientDate(expiresAt) || new Date(), // Defensive
            maxUsers: toNumberOrNull(maxUsers),
            maxUsagePerUser: toNumberOrNull(maxUsagePerUser),
            totalUsageLimit: toNumberOrNull(totalUsageLimit),
            description: description || '',
            status: 'active'
        });
        res.status(201).json(voucherStatusService.enrichVoucher(voucher));
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Mã voucher đã tồn tại' });
        res.status(500).json({ message: error.message });
    }
});

router.put('/admin/:id', protect, admin, async (req, res) => {
    try {
        const update = { ...req.body };
        
        const parseClientDate = (d) => {
            if (!d) return null;
            if (typeof d !== 'string') return d;
            if (d.includes('+') || d.endsWith('Z')) return new Date(d);
            return new Date(d + ":00+07:00");
        };

        if (update.startsAt !== undefined) update.startsAt = parseClientDate(update.startsAt);
        if (update.expiresAt !== undefined) update.expiresAt = parseClientDate(update.expiresAt);

        // Normalize numeric fields
        ['maxUsers', 'maxUsagePerUser', 'totalUsageLimit', 'maxDiscount', 'minOrderAmount', 'value'].forEach((k) => {
            if (update[k] === '') update[k] = null;
            else if (update[k] !== undefined) update[k] = Number(update[k]);
        });

        const voucher = await Voucher.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!voucher) return res.status(404).json({ message: 'Không tìm thấy voucher' });
        res.json(voucherStatusService.enrichVoucher(voucher));
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
