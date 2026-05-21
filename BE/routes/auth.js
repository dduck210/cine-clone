const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { isEmailConfigured, sendEmail } = require('../services/email-service');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function otpHtml(title, name, otp, expireMin = 15, contextText = '') {
    const defaultContext = title.includes('Đặt lại')
        ? 'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản 5Cine. Sử dụng mã OTP bên dưới để tiến hành đặt lại mật khẩu.'
        : 'Bạn vừa đăng ký tài khoản tại 5Cine. Sử dụng mã OTP bên dưới để xác thực email và hoàn tất đăng ký.';
    const bodyContext = contextText || defaultContext;
    const supportEmail = process.env.EMAIL_USER || 'support@5cine.vn';

    return `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900">5Cine</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">${title}</p>
            </div>
            <div style="background:#fff;padding:28px 24px">
                <p style="color:#374151;font-size:15px;margin:0 0 6px">Xin chào <strong>${name || 'bạn'}</strong>,</p>
                <p style="color:#374151;font-size:14px;margin:0 0 20px">${bodyContext}</p>
                <div style="background:#f9fafb;border:2px dashed #dc2626;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
                    <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:700">Mã xác nhận OTP</p>
                    <p style="color:#dc2626;font-size:40px;font-weight:900;letter-spacing:10px;margin:0">${otp}</p>
                    <p style="color:#9ca3af;font-size:12px;margin:8px 0 0">Hiệu lực trong ${expireMin} phút</p>
                </div>
                <p style="color:#9ca3af;font-size:12px;margin:0">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
                <div style="border-top:1px solid #f3f4f6;margin-top:28px;padding-top:16px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0 0 4px">© 2025 5Cine. Tất cả các quyền được bảo lưu.</p>
                    <p style="color:#9ca3af;font-size:12px;margin:0">Cần hỗ trợ? Liên hệ <a href="mailto:${supportEmail}" style="color:#dc2626;text-decoration:none">${supportEmail}</a></p>
                </div>
            </div>
        </div>`;
}

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
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

        // Replace any previous pending entry for this email (re-register scenario)
        await PendingRegistration.deleteOne({ email });
        const pending = new PendingRegistration({ name, email, password, phone: phone || '', otp, otpExpiry });
        await pending.save();

        const emailResult = await sendEmail({
            to: email,
            subject: '[5Cine] Mã xác thực tài khoản',
            html: otpHtml('Xác thực tài khoản', name, otp, 15),
        });

        if (emailResult.skipped || emailResult.sent === false) {
            console.error('[auth] register email failed:', emailResult.reason || emailResult.error);
            return res.status(201).json({
                emailFailed: true,
                message: 'Mã OTP chưa gửi được qua email. Vui lòng nhấn "Gửi lại mã" trên trang xác thực.',
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
        if (user.isVerified === false && user.role !== 'admin') {
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
        // Check if already verified (re-submit case)
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email đã được xác thực' });

        const pending = await PendingRegistration.findOne({ email });
        if (!pending) return res.status(404).json({ message: 'Yêu cầu đăng ký không tồn tại hoặc đã hết hạn' });
        if (pending.otp !== otp) return res.status(400).json({ message: 'OTP không đúng' });
        if (new Date() > new Date(pending.otpExpiry)) {
            return res.status(400).json({ message: 'OTP đã hết hạn' });
        }

        // Create real account — User pre-save hook hashes the plaintext password
        await User.create({
            name: pending.name,
            email: pending.email,
            password: pending.password,
            phone: pending.phone,
            isVerified: true,
        });
        await PendingRegistration.deleteOne({ email });

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
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email đã được xác thực' });

        const pending = await PendingRegistration.findOne({ email });
        if (!pending) return res.status(404).json({ message: 'Yêu cầu đăng ký không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại.' });

        // Cooldown 60s to prevent spam
        if (pending.otpExpiry) {
            const otpCreatedAt = new Date(pending.otpExpiry).getTime() - 15 * 60 * 1000;
            if (Date.now() - otpCreatedAt < 60000) {
                return res.status(429).json({ message: 'Vui lòng đợi 1 phút trước khi yêu cầu gửi lại mã' });
            }
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        pending.otp = otp;
        pending.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await pending.save();

        const emailResult = await sendEmail({
            to: email,
            subject: '[5Cine] Mã xác thực tài khoản (gửi lại)',
            html: otpHtml('Xác thực tài khoản', pending.name, otp, 15),
        });

        if (emailResult.skipped || emailResult.sent === false) {
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
        if (!isEmailConfigured()) {
            return res.status(500).json({ message: 'Hệ thống email chưa được cấu hình. Vui lòng thử lại sau.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.resetOtp = otp;
        user.resetOtpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await user.save();

        await sendEmail({
            to: email,
            subject: '[5Cine] Mã OTP đặt lại mật khẩu',
            html: otpHtml('Đặt lại mật khẩu', user.name, otp, 15),
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