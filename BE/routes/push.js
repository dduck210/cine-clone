const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');

router.get('/vapid-key', (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(503).json({ message: 'Push not configured' });
    res.json({ publicKey: key });
});

router.post('/subscribe', async (req, res) => {
    try {
        const { subscription, bookingCode } = req.body;
        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !bookingCode) {
            return res.status(400).json({ message: 'Missing subscription or bookingCode' });
        }

        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint, bookingCode },
            { endpoint: subscription.endpoint, keys: subscription.keys, bookingCode, createdAt: new Date() },
            { upsert: true, new: true },
        );

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
