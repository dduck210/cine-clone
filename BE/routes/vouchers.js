const express = require('express');
const router = express.Router();
const Voucher = require('../models/Voucher');
const { protect, admin } = require('../middleware/auth');

function calcDiscount(voucher, amount) {
    let discount = voucher.type === 'percent'
        ? Math.round(amount * voucher.value / 100)
        : voucher.value;
    if (voucher.maxDiscount) discount = Math.min(discount, voucher.maxDiscount);
    return Math.min(discount, amount);
}

// POST /api/vouchers/validate — check code and return discount amount (protected)
router.post('/validate', protect, async (req, res) => {
    const { code, orderAmount } = req.body;
    try {
        if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
        const voucher = await Voucher.findOne({ code: code.toUpperCase().trim(), status: 'active' });
        if (!voucher) return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
        if (voucher.expiresAt < new Date()) return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
        if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit)
            return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
        if (orderAmount < voucher.minOrderAmount)
            return res.status(400).json({ message: `Đơn tối thiểu ${voucher.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này` });
        const userUsed = voucher.usedBy.filter(id => id.toString() === req.user._id.toString()).length;
        if (voucher.perUserLimit !== null && userUsed >= voucher.perUserLimit)
            return res.status(400).json({ message: 'Bạn đã sử dụng mã này rồi' });

        const discountAmount = calcDiscount(voucher, orderAmount);
        res.json({
            valid: true,
            discountAmount,
            voucher: { code: voucher.code, type: voucher.type, value: voucher.value, description: voucher.description },
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin CRUD
router.get('/admin', protect, admin, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json(vouchers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/admin', protect, admin, async (req, res) => {
    try {
        const { code, type, value, minOrderAmount, maxDiscount, expiresAt, usageLimit, perUserLimit, description } = req.body;
        const voucher = await Voucher.create({
            code: code.toUpperCase().trim(), type, value,
            minOrderAmount: minOrderAmount || 0,
            maxDiscount: maxDiscount || null,
            expiresAt,
            usageLimit: usageLimit || null,
            perUserLimit: perUserLimit ?? 1,
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
        const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
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
