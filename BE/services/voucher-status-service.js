/**
 * Voucher Status Service — fully runtime-computed.
 * Corrected to handle legacy fields and strict date comparisons.
 */

const EFFECTIVE_STATUS = {
    UPCOMING: 'upcoming',
    ACTIVE: 'active',
    EXPIRED: 'expired',
};

const USAGE_STATUS = {
    UNLIMITED: 'unlimited',
    AVAILABLE: 'available',
    LIMITED: 'limited',
    SOLD_OUT: 'sold_out',
};

/**
 * Compute effective status based on current time.
 */
function getEffectiveStatus(voucher, now = new Date()) {
    const start = voucher.startsAt ? new Date(voucher.startsAt) : null;
    const end = new Date(voucher.expiresAt);

    if (start && start > now) return EFFECTIVE_STATUS.UPCOMING;
    if (end < now) return EFFECTIVE_STATUS.EXPIRED; // Strict less than
    return EFFECTIVE_STATUS.ACTIVE;
}

/**
 * Compute usage status based on quota counters.
 * Handles both new and legacy fields.
 */
function getUsageStatus(voucher) {
    const limit = voucher.totalUsageLimit ?? voucher.usageLimit;
    
    if (limit === null || limit === undefined) {
        return USAGE_STATUS.UNLIMITED;
    }

    const used = voucher.totalUsedCount ?? voucher.usedCount ?? 0;
    
    if (used >= limit) return USAGE_STATUS.SOLD_OUT;
    
    const remaining = limit - used;
    if (limit > 0 && (remaining / limit) <= 0.1) return USAGE_STATUS.LIMITED;
    
    return USAGE_STATUS.AVAILABLE;
}

/**
 * Master display status.
 */
function getDisplayStatus(voucher, now = new Date()) {
    const sys = voucher.status;

    if (sys === 'inactive') return { label: 'Đã tắt', key: 'inactive', color: 'slate' };
    if (sys === 'draft') return { label: 'Bản nháp', key: 'draft', color: 'purple' };
    if (sys === 'archived') return { label: 'Lưu trữ', key: 'archived', color: 'zinc' };

    const effective = getEffectiveStatus(voucher, now);
    const usage = getUsageStatus(voucher);

    if (effective === EFFECTIVE_STATUS.EXPIRED) {
        return { label: 'Đã hết hạn', key: 'expired', color: 'red' };
    }
    if (effective === EFFECTIVE_STATUS.UPCOMING) {
        return { label: 'Sắp diễn ra', key: 'upcoming', color: 'amber' };
    }
    if (usage === USAGE_STATUS.SOLD_OUT) {
        return { label: 'Hết lượt', key: 'sold_out', color: 'zinc' };
    }
    if (usage === USAGE_STATUS.LIMITED) {
        return { label: 'Sắp hết', key: 'limited', color: 'orange' };
    }
    return { label: 'Đang hoạt động', key: 'active', color: 'emerald' };
}

function getExpiryCountdown(voucher, now = new Date()) {
    const expiresAt = new Date(voucher.expiresAt);
    const diffMs = expiresAt - now;
    if (diffMs <= 0) return { days: 0, hours: 0, urgency: 'expired' };
    const diffHours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(diffHours / 24);
    const hours = Math.floor(diffHours % 24);
    let urgency = 'normal';
    if (days <= 1) urgency = 'critical';
    else if (days <= 3) urgency = 'warning';
    return { days, hours, urgency };
}

function getStatusTooltip(voucher, now = new Date()) {
    const display = getDisplayStatus(voucher, now);
    const limit = voucher.totalUsageLimit ?? voucher.usageLimit;
    const used = voucher.totalUsedCount ?? voucher.usedCount ?? 0;

    switch (display.key) {
        case 'inactive': return 'Admin đã tắt voucher này';
        case 'draft': return 'Voucher đang ở chế độ nháp';
        case 'archived': return 'Voucher đã được lưu trữ';
        case 'expired': return `Đã hết hạn từ ${new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}`;
        case 'upcoming': return `Sẽ có hiệu lực từ ${voucher.startsAt ? new Date(voucher.startsAt).toLocaleDateString('vi-VN') : 'ngay'}`;
        case 'sold_out': return `Đã đạt giới hạn ${limit?.toLocaleString('vi-VN')} lượt dùng`;
        case 'limited': return `Chỉ còn ${limit - used} lượt dùng`;
        case 'active': return 'Voucher đang hoạt động bình thường';
        default: return '';
    }
}

function enrichVoucher(voucher, now = new Date()) {
    const obj = voucher.toObject ? voucher.toObject() : voucher;
    
    // Ensure numeric fields are present even if legacy
    const maxUsers = obj.maxUsers ?? null;
    const maxUsagePerUser = obj.maxUsagePerUser ?? obj.perUserLimit ?? null;
    const totalUsageLimit = obj.totalUsageLimit ?? obj.usageLimit ?? null;
    const totalUsedCount = obj.totalUsedCount ?? obj.usedCount ?? 0;

    const effective = getEffectiveStatus(obj, now);
    const usage = getUsageStatus(obj);
    const display = getDisplayStatus(obj, now);
    const countdown = getExpiryCountdown(obj, now);
    const tooltip = getStatusTooltip(obj, now);

    return {
        ...obj,
        maxUsers,
        maxUsagePerUser,
        totalUsageLimit,
        totalUsedCount,
        effectiveStatus: effective,
        usageStatus: usage,
        usageRemaining: totalUsageLimit !== null ? Math.max(0, totalUsageLimit - totalUsedCount) : null,
        usagePercent: totalUsageLimit ? Math.round((totalUsedCount / totalUsageLimit) * 100) : null,
        displayStatus: display,
        expiryCountdown: countdown,
        statusTooltip: tooltip,
    };
}

module.exports = {
    EFFECTIVE_STATUS,
    USAGE_STATUS,
    getEffectiveStatus,
    getUsageStatus,
    getDisplayStatus,
    getExpiryCountdown,
    getStatusTooltip,
    enrichVoucher,
};
