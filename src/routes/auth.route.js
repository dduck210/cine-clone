const router = require('express').Router();
const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Note: For production, implement real OAuth providers (Google, Facebook)
// This is a basic structure for demo purposes

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        await user.save();

        res.json({
            message: 'OTP đã được gửi (mock)',
            otp // demo cho thầy xem
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email, otp });
        if (!user || user.otpExpire < new Date()) {
            return res.status(400).json({ message: 'OTP không hợp lệ hoặc hết hạn' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = null;
        user.otpExpire = null;
        await user.save();

        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Google OAuth callback (requires google-auth-library)
router.post('/google/callback', async (req, res) => {
    try {
        // This is a placeholder - implement actual Google OAuth verification
        const { email, name, googleId } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                name,
                password: 'oauth-provider',
                role: 'member'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '7d' }
        );

        res.json({ message: 'Đăng nhập Google thành công', token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Facebook OAuth callback (requires facebook-sdk)
router.post('/facebook/callback', async (req, res) => {
    try {
        // This is a placeholder - implement actual Facebook OAuth verification
        const { email, name, facebookId } = req.body;

        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({
                email,
                name,
                password: 'oauth-provider',
                role: 'member'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '7d' }
        );

        res.json({ message: 'Đăng nhập Facebook thành công', token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;