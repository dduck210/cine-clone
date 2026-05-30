const AuditLog = require('../models/AuditLog');

/**
 * Log an admin action to the audit trail.
 * Call this after a successful admin operation.
 */
const auditLog = async (req, action, entity, entityId, detail) => {
    try {
        await AuditLog.create({
            admin: req.user._id,
            adminName: req.user.name,
            action,
            entity,
            entityId: entityId?.toString(),
            detail,
            ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown',
        });
    } catch (err) {
        console.error('[AuditLog] Failed to write:', err.message);
    }
};

module.exports = { auditLog };
