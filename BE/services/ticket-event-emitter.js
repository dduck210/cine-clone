// In-memory SSE event emitter for real-time ticket status updates
// When admin scans/prints a ticket, the user's phone auto-updates

const channels = new Map(); // bookingId → Set of response objects

function subscribe(bookingId, res) {
    const id = bookingId.toString();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    if (!channels.has(id)) channels.set(id, new Set());
    channels.get(id).add(res);

    // Send heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
        try { res.write(': ping\n\n'); } catch { /* ignore */ }
    }, 15000);

    res.on('close', () => {
        clearInterval(heartbeat);
        const subs = channels.get(id);
        if (subs) { subs.delete(res); if (subs.size === 0) channels.delete(id); }
    });

    return () => {
        clearInterval(heartbeat);
        const subs = channels.get(id);
        if (subs) { subs.delete(res); if (subs.size === 0) channels.delete(id); }
    };
}

function emit(bookingId, event, data) {
    const id = bookingId.toString();
    const subs = channels.get(id);
    if (!subs) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    subs.forEach((res) => {
        try { res.write(payload); } catch { /* broken connection, close handler cleans up */ }
    });
}

module.exports = { subscribe, emit };
