const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
            next();
            return;
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (req.query?.token) {
        try {
            token = req.query.token;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
            next();
            return;
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    return res.status(401).json({ message: 'Not authorized, no token' });
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
        return;
    } else {
        return res.status(401).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, admin };
