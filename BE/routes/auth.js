const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const { isEmailConfigured, sendEmail } = require('../services/email-service');
const { body, validationResult } = require('express-validator');

const handleValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    return null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function otpHtml(title, name, otp, email, expireMin = 15, contextText = '') {
    const defaultContext = title.includes('Đặt lại')
        ? 'Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản 5Cine. Sử dụng mã OTP bên dưới để tiến hành đặt lại mật khẩu.'
        : 'Bạn vừa đăng ký tài khoản tại 5Cine. Sử dụng mã OTP bên dưới để xác thực email và hoàn tất đăng ký.';
    const bodyContext = contextText || defaultContext;
    const supportEmail = process.env.EMAIL_USER || 'support@5cine.vn';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = title.includes('Đặt lại')
        ? `${frontendUrl}/forgot-password?email=${encodeURIComponent(email)}&code=${otp}`
        : `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}&code=${otp}`;

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
                    <p style="color:#dc2626;font-size:40px;font-weight:900;letter-spacing:10px;margin:0" data-autofill="one-time-code">${otp}</p>
                    <p style="color:#9ca3af;font-size:12px;margin:8px 0 0">Hiệu lực trong ${expireMin} phút</p>
                </div>
                <div style="display:none;font-size:0;line-height:0;color:transparent;max-height:0">
                    @5Cine #${otp}
                </div>
                <div style="text-align:center;margin:0 0 20px">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
                        <tr>
                            <td style="background-color:#dc2626;border-radius:8px;text-align:center;padding:14px 32px">
                                <a href="${verifyUrl}" style="color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif;display:inline-block;white-space:nowrap">Xác thực ngay →</a>
                            </td>
                        </tr>
                    </table>
                    <p style="color:#9ca3af;font-size:12px;margin:12px 0 0">Hoặc nhập thủ công mã OTP <strong>${otp}</strong> vào ứng dụng</p>
                </div>
                <p style="color:#9ca3af;font-size:12px;margin:0">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
                <div style="border-top:1px solid #f3f4f6;margin-top:28px;padding-top:16px;text-align:center">
                    <p style="color:#9ca3af;font-size:12px;margin:0 0 4px">© 2025 5Cine. Tất cả các quyền được bảo lưu.</p>
                    <p style="color:#9ca3af;font-size:12px;margin:0">Cần hỗ trợ? Liên hệ <a href="mailto:${supportEmail}" style="color:#dc2626;text-decoration:none">${supportEmail}</a></p>
                </div>
            </div>
        </div>`;
}

// Generate short-lived access token (30min) and long-lived refresh token (7 days)
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30m' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', { expiresIn: '7d' });

// Register user
router.post('/register',
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Họ tên phải từ 2-50 ký tự'),
    body('email').isEmail().normalizeEmail().withMessage('Email không đúng định dạng'),
    body('password').isLength({ min: 8 }).withMessage('Mật khẩu phải có ít nhất 8 ký tự'),
    body('phone').optional().matches(/^[0-9]{9,11}$/).withMessage('Số điện thoại không hợp lệ'),
async (req, res) => {
    const validErr = handleValidation(req, res); if (validErr) return;
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
            html: otpHtml('Xác thực tài khoản', name, otp, email, 15),
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
}); // end register

// Login user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        // Account lockout check
        if (user?.lockUntil && user.lockUntil > new Date()) {
            const minsLeft = Math.ceil((user.lockUntil - new Date()) / 60000);
            return res.status(423).json({ message: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${minsLeft} phút.` });
        }

        if (!user || !(await user.matchPassword(password))) {
            if (user) {
                user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
                if (user.failedLoginAttempts >= 5) {
                    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
                    user.failedLoginAttempts = 0;
                    await user.save();
                    return res.status(423).json({ message: 'Đăng nhập sai quá nhiều lần. Tài khoản bị tạm khóa 15 phút.' });
                }
                await user.save();
            }
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        if (user.isVerified === false && user.role !== 'admin') {
            return res.status(403).json({ message: 'Tài khoản chưa xác thực email. Vui lòng kiểm tra email hoặc yêu cầu gửi lại mã OTP.' });
        }

        // Reset failed attempts on success
        const refreshToken = generateRefreshToken(user._id);
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            token: generateToken(user._id),
            refreshToken,
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

        // Cooldown 45s to prevent spam
        if (pending.otpExpiry) {
            const otpCreatedAt = new Date(pending.otpExpiry).getTime() - 15 * 60 * 1000;
            if (Date.now() - otpCreatedAt < 45000) {
                return res.status(429).json({ message: 'Vui lòng đợi 45 giây trước khi yêu cầu gửi lại mã' });
            }
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        pending.otp = otp;
        pending.otpExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await pending.save();

        const emailResult = await sendEmail({
            to: email,
            subject: '[5Cine] Mã xác thực tài khoản (gửi lại)',
            html: otpHtml('Xác thực tài khoản', pending.name, otp, email, 15),
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
            html: otpHtml('Đặt lại mật khẩu', user.name, otp, email, 15),
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
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 8 ký tự' });
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

// Refresh access token using refresh token
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
        const user = await User.findById(decoded.id).select('refreshToken role');
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const newToken = generateToken(user._id);
        res.json({ token: newToken });
    } catch {
        res.status(401).json({ message: 'Refresh token expired or invalid' });
    }
});

// Logout — invalidate refresh token
router.post('/logout', protect, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        res.json({ message: 'Logged out' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get wishlist (populated movie details)
router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist', 'title poster genre rating duration status ageRestriction');
        res.json(user.wishlist || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Toggle movie in wishlist (add if not present, remove if present)
router.post('/wishlist/:movieId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const movieId = req.params.movieId;
        const idx = user.wishlist.findIndex((id) => id.toString() === movieId);

        if (idx === -1) {
            user.wishlist.push(movieId);
        } else {
            user.wishlist.splice(idx, 1);
        }
        await user.save();
        res.json({ saved: idx === -1, wishlist: user.wishlist });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;