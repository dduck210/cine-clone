const express = require('express');
const router = express.Router();
const AuditLog = require('../../models/AuditLog');
const { protect, admin } = require('../../middleware/auth');

// GET /api/admin/audit-logs — paginated audit trail
router.get('/audit-logs', protect, admin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            AuditLog.find()
                .populate('admin', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            AuditLog.countDocuments(),
        ]);

        res.json({ logs, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
