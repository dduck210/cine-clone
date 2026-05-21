self.addEventListener('push', (event) => {
    if (!event.data) return;
    let data;
    try { data = event.data.json(); } catch { data = {}; }

    event.waitUntil(
        self.registration.showNotification(data.title || '5Cine', {
            body: data.body || 'Vé của bạn đã được xác nhận!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: { url: data.url || '/' },
            requireInteraction: true,
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if (client.url === url && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
