const listeners = new Set();
let notifications = [];

function createNotification(payload) {
    const notification = {
        id: `ntf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: payload.type || 'system',
        title: payload.title || 'Thông báo',
        message: payload.message || '',
        data: payload.data || null,
        createdAt: new Date().toISOString(),
        read: false,
    };

    notifications = [notification, ...notifications].slice(0, 100);

    const event = `data: ${JSON.stringify(notification)}\n\n`;
    listeners.forEach((listener) => {
        try {
            listener.write(event);
        } catch (error) {
            // Ignore broken SSE listeners; cleanup happens on close.
        }
    });

    return notification;
}

function listNotifications() {
    return notifications;
}

function markRead(ids = []) {
    const idSet = new Set(ids);
    notifications = notifications.map((item) => (
        ids.length === 0 || idSet.has(item.id)
            ? { ...item, read: true }
            : item
    ));
    return notifications;
}

function subscribe(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    listeners.add(res);

    return () => {
        listeners.delete(res);
    };
}

module.exports = {
    createNotification,
    listNotifications,
    markRead,
    subscribe,
    initNotificationService: () => {}, // no-op, legacy socket.io init
};
