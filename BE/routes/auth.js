const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { protect } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailConfigured() {
    return !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

const mailer = isEmailConfigured() ? nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
}) : null;

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Register user
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ message: 'Email không đúng định dạng' });
        }
        if (!isEmailConfigured()) {
            return res.status(500).json({ message: 'Hệ thống email chưa được cấu hình. Vui lòng thử lại sau.' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }
        const otp = crypto.randomInt(100000, 999999).toString();
        const user = await User.create({
            name,
            email,
            password,
            phone: phone || '',
            isVerified: false,
            verifyOtp: otp,
            verifyOtpExpiry: new Date(Date.now() + 15 * 60 * 1000),
        });

        try {
            await mailer.sendMail({
                from: `"5Cine" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Xác thực tài khoản - 5Cine',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
                        <h2 style="color:#dc2626;margin:0 0 8px">5Cine</h2>
                        <p style="color:#374151;margin:0 0 8px">Xin chào <strong>${name}</strong>,</p>
                        <p style="color:#374151;margin:0 0 24px">Cảm ơn bạn đã đăng ký tài khoản. Sử dụng mã OTP bên dưới để xác thực email:</p>
                        <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:8px;margin-bottom:24px">
                            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#dc2626">${otp}</span>
                        </div>
                        <p style="color:#6b7280;font-size:13px;margin:0">Mã có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
                    </div>`,
            });
        } catch (emailErr) {
            console.error('[auth] register email failed:', emailErr.message);
            return res.status(201).json({
                message: 'Tài khoản đã được tạo nhưng không gửi được email xác thực. Vui lòng thử "Gửi lại mã" sau.',
                email,
            });
        }

        res.status(201).json({ message: 'Vui lòng kiểm tra email để xác thực tài khoản.', email });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
        if (user.isVerified === false) {
            return res.status(403).json({ message: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra email hoặc yêu cầu gửi lại mã OTP.' });
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
        if (user.isVerified !== false) return res.status(400).json({ message: 'Email đã được xác thực' });
        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return res.status(400).json({ message: 'OTP không đúng' });
        }
        if (new Date() > new Date(user.verifyOtpExpiry)) {
            return res.status(400).json({ message: 'OTP đã hết hạn' });
        }
        user.isVerified = true;
        user.verifyOtp = null;
        user.verifyOtpExpiry = null;
        await user.save();
        res.json({ message: 'Đăng ký thành công! Bạn có thể đăng nhập ngay.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Resend verify OTP
router.post('/resend-verify-otp', async (req, res) => {
    const { email } = req.body;
    try {
        if (!isEmailConfigured()) {
            return res.status(500).json({ message: 'Hệ thống email chưa được cấu hình. Vui lòng thử lại sau.' });
        }
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
        if (user.isVerified !== false) return res.status(400).json({ message: 'Email đã được xác thực' });

        // Cooldown 60s to prevent spam
        if (user.verifyOtpExpiry) {
            const otpCreatedAt = new Date(user.verifyOtpExpiry).getTime() - 15 * 60 * 1000;
            if (Date.now() - otpCreatedAt < 60000) {
                return res.status(429).json({ message: 'Vui lòng đợi 1 phút trước khi yêu cầu gửi lại mã' });
            }
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.verifyOtp = otp;
        user.verifyOtpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        try {
            await mailer.sendMail({
                from: `"5Cine" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Mã OTP xác thực tài khoản - 5Cine',
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
                        <h2 style="color:#dc2626;margin:0 0 8px">5Cine</h2>
                        <p style="color:#374151;margin:0 0 24px">Sử dụng mã OTP bên dưới để xác thực tài khoản:</p>
                        <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:8px;margin-bottom:24px">
                            <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#dc2626">${otp}</span>
                        </div>
                        <p style="color:#6b7280;font-size:13px;margin:0">Mã có hiệu lực trong <strong>15 phút</strong>.</p>
                    </div>`,
            });
        } catch (emailErr) {
            console.error('[auth] resend email failed:', emailErr.message);
            return res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại sau.' });
        }

        res.json({ message: 'OTP đã được gửi lại đến email của bạn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get current user profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone || '', role: user.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        user.name = req.body.name || user.name;
        user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
        const updated = await user.save();
        res.json({ _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot password — send OTP to email
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại trong hệ thống' });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await user.save();

        await mailer.sendMail({
            from: `"5Cine" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Mã OTP đặt lại mật khẩu - 5Cine',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
                    <h2 style="color:#dc2626;margin:0 0 8px">5Cine</h2>
                    <p style="color:#374151;margin:0 0 24px">Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã OTP bên dưới:</p>
                    <div style="text-align:center;padding:20px;background:#fef2f2;border-radius:8px;margin-bottom:24px">
                        <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#dc2626">${otp}</span>
                    </div>
                    <p style="color:#6b7280;font-size:13px;margin:0">Mã có hiệu lực trong <strong>15 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
                </div>`,
        });

        res.json({ message: 'OTP đã được gửi đến email của bạn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset password — verify OTP and set new password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email không tồn tại' });
        if (!user.resetOtp || user.resetOtp !== otp) {
            return res.status(400).json({ message: 'OTP không đúng' });
        }
        if (new Date() > new Date(user.resetOtpExpiry)) {
            return res.status(400).json({ message: 'OTP đã hết hạn' });
        }
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        user.password = newPassword;
        user.resetOtp = null;
        user.resetOtpExpiry = null;
        await user.save();

        res.json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;