let io = null;

function initNotificationService(socketServer) {
    io = socketServer;
}

function emitAdminNotification(type, payload = {}) {
    if (!io) return;
    io.to('admins').emit('admin:notification', {
        id: `${type}-${Date.now()}`,
        type,
        createdAt: new Date().toISOString(),
        ...payload,
    });
}

module.exports = { initNotificationService, emitAdminNotification };
