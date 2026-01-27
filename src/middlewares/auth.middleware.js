const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Không có token' });
    }

    try {
        const decoded = jwt.verify(token, 'SECRET_KEY');
        req.user = decoded; // { userId, role }
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token không hợp lệ' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Không có quyền truy cập' });
        }
        next();
    };
};
