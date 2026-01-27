const express = require('express');
const router = express.Router();
const User = require('../models/users.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, authorize } = require('../middlewares/auth.middleware');

/* =========================
   UC01 – ĐĂNG KÝ
========================= */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
        }

        // Check if user exists
        const exist = await User.findOne({ email });
        if (exist) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashPassword,
            phone,
            role: 'member',
            status: 'active'
        });

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ message: 'Đăng ký thành công', user: userResponse });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   UC02 – ĐĂNG NHẬP
========================= */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Sai email hoặc mật khẩu' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || 'SECRET_KEY',
            { expiresIn: '7d' }
        );

        // Update last login
        user.lastLogin = new Date();
        user.loginAttempts = 0;
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ message: 'Đăng nhập thành công', token, user: userResponse });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   UC03 – QUÊN MẬT KHẨU
========================= */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        res.json({
            message: 'OTP đã được gửi (mock - dùng cho demo)',
            otp,
            email
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   RESET MẬT KHẨU
========================= */
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
        }

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

/* =========================
   UC04 – CẬP NHẬT HỒCHSƠ
========================= */
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { name, phone, avatar } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { name, phone, avatar },
            { new: true }
        ).select('-password');

        res.json({ message: 'Cập nhật thành công', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'Người dùng không tìm thấy' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
        }

        const user = await User.findById(req.user.userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   ADMIN – LẤY DANH SÁCH USER
========================= */
router.get('/', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { role, status } = req.query;
        let query = {};

        if (role) query.role = role;
        if (status) query.status = status;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get user by id (Admin)
router.get('/:id', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Người dùng không tìm thấy' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

/* =========================
   ADMIN – KHÓA / MỞ USER
========================= */
router.patch('/:id/status', verifyToken, authorize('admin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select('-password');

        res.json({ message: 'Cập nhật trạng thái thành công', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin-only endpoint
router.get(
    '/admin-only',
    verifyToken,
    authorize('admin'),
    (req, res) => {
        res.json({ message: 'Admin access granted' });
    }
);

module.exports = router;
