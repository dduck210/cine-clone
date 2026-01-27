const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            trim: true
        },
        avatar: String,
        role: {
            type: String,
            enum: ['member', 'staff', 'admin'],
            default: 'member'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'blocked'],
            default: 'active'
        },
        points: {
            type: Number,
            default: 0
        },
        otp: String,
        otpExpire: Date,
        lastLogin: Date,
        loginAttempts: { type: Number, default: 0 },
        lockUntil: Date
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);