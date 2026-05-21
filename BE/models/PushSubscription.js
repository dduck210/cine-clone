const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    bookingCode: { type: String, required: true, index: true },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now, expires: 7 * 24 * 60 * 60 },
});

pushSubscriptionSchema.index({ endpoint: 1, bookingCode: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
