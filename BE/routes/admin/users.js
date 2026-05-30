const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Review = require('../../models/Review');
const { protect, admin } = require('../../middleware/auth');
const { auditLog } = require('../../utils/audit-logger');
const bulkController = require('../../controllers/bulkController');

// POST /api/admin/users/bulk-delete
router.post('/users/bulk-delete', protect, admin, bulkController.bulkDeleteUsers);

// GET /api/admin/users
router.get('/users', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/admin/users/:id
router.put('/users/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const { name, role } = req.body;
        if (name) user.name = name;
        if (role) user.role = role;
        await user.save();
        res.json(await User.findById(user._id).select('-password'));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, admin, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
        }

        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: 'Không thể tự xóa tài khoản của bạn' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (user.role === 'admin') return res.status(400).json({ message: 'Không thể xóa tài khoản admin' });

        console.log(`[DELETE USER] Admin ${req.user._id} (${req.user.name}) is deleting user ${user._id} (${user.name}, ${user.email})`);

        // Nullify user reference in reviews so they survive deletion
        await Review.updateMany({ user: user._id }, { $set: { user: null } });

        await user.deleteOne();
        auditLog(req, 'DELETE_USER', 'User', user._id, `Deleted user ${user.name} (${user.email})`);

        res.json({ message: 'Đã xóa người dùng thành công', deletedUserId: user._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
