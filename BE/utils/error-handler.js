/**
 * Centralized error handling utility for consistent API responses.
 */

const handleApiError = (res, error, defaultMsg = 'Internal Server Error') => {
    console.error(`[API Error] ${defaultMsg}:`, error);

    // Mongoose Validation Error
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            details: Object.keys(error.errors).map(key => error.errors[key].message)
        });
    }

    // Mongoose Cast Error (invalid ID)
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'ID không hợp lệ',
            path: error.path
        });
    }

    // JWT Errors
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token đã hết hạn'
        });
    }

    // Default Error
    return res.status(error.status || 500).json({
        success: false,
        message: error.message || defaultMsg,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

module.exports = { handleApiError };
