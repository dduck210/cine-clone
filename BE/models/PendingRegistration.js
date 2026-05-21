const mongoose = require('mongoose');

// Temporary store for unverified registrations — auto-expires in 15 min via TTL index.
// Password is stored plaintext here; User model hashes it on final account creation.
const pendingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    otp: { type: String, required: true },
    otpExpiry: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now, expires: 900 },
});

module.exports = mongoose.model('PendingRegistration', pendingSchema);
