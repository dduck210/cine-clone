const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String },
    action: { type: String, required: true }, // e.g. 'CREATE_MOVIE', 'DELETE_USER', 'CANCEL_SHOWTIME'
    entity: { type: String }, // e.g. 'Movie', 'User', 'Showtime'
    entityId: { type: String },
    detail: { type: String }, // human-readable description
    ip: { type: String },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ admin: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
