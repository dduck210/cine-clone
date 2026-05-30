const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/auth');
const notificationService = require('../../services/notification-service');

// GET /api/admin/notifications
router.get('/notifications', protect, admin, async (req, res) => {
    try {
        const items = notificationService.listNotifications();
        res.json({
            items,
            unreadCount: items.filter((item) => !item.read).length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/admin/notifications/stream — SSE stream
router.get('/notifications/stream', protect, admin, async (req, res) => {
    const unsubscribe = notificationService.subscribe(res);
    req.on('close', unsubscribe);
});

// POST /api/admin/notifications/read
router.post('/notifications/read', protect, admin, async (req, res) => {
    try {
        const { ids = [] } = req.body || {};
        const items = notificationService.markRead(ids);
        res.json({
            items,
            unreadCount: items.filter((item) => !item.read).length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
