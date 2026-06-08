/**
 * Voucher Status Service — Single Source of Truth (SSOT)
 * Aligned with log.md Principal Engineering Standards.
 */

/**
 * Core Status Logic — MUST match log.md exactly.
 * Returns: 'active' | 'inactive' | 'used-up' | 'upcoming' | 'expired'
 */
const getVoucherStatus = (voucher) => {
    const now = new Date();

    // Helper to parse date safely
    const parseDate = (d) => {
        if (!d) return null;
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
    };

    const startDate = parseDate(voucher.startsAt || voucher.startDate);
    const endDate = parseDate(voucher.expiresAt || voucher.endDate);
    
    // Normalize usageLimit: -1 is unlimited
    let usageLimit = -1;
    // Senior: Priority order for usage limit source
    if (voucher.totalUsageLimit !== undefined && voucher.totalUsageLimit !== null) {
        usageLimit = Number(voucher.totalUsageLimit);
    } else if (voucher.usageLimit !== undefined && voucher.usageLimit !== null) {
        usageLimit = Number(voucher.usageLimit);
    }
    if (isNaN(usageLimit)) usageLimit = -1;

    // Senior: Priority order for used count source
    const usedCount = Math.max(
        Number(voucher.totalUsedCount) || 0, 
        Number(voucher.usedCount) || 0,
        Array.isArray(voucher.usedBy) ? voucher.usedBy.length : 0
    );

    // 1. Inactive check (Admin toggle)
    if (voucher.isActive === false || voucher.status === 'inactive' || voucher.status === 'archived') {
        return 'inactive';
    }

    // 2. Usage limit check
    if (usageLimit !== -1 && usedCount >= usageLimit) {
        return 'used-up';
    }

    // 3. Upcoming check
    if (startDate && now < startDate) {
        return 'upcoming';
    }

    // 4. Expired check
    if (endDate && now > endDate) {
        return 'expired';
    }

    // 5. Default Active
    return 'active';
};

/**
 * Display Metadata for UI
 */
const getStatusMeta = (status) => {
    switch (status) {
        case 'active':
            return { label: 'Còn hiệu lực', color: 'emerald', icon: '🟢' };
        case 'upcoming':
            return { label: 'Sắp diễn ra', color: 'amber', icon: '🟡' };
        case 'expired':
        case 'used-up':
        case 'inactive':
            return { label: 'Hết hiệu lực', color: 'red', icon: '🔴' };
        default:
            return { label: 'Không xác định', color: 'slate', icon: '⚪' };
    }
};

/**
 * Enrichment for API Response
 */
const enrichVoucher = (voucher) => {
    const obj = voucher.toObject ? voucher.toObject() : voucher;
    
    // SSOT Status - MUST use the same normalization logic
    const status = getVoucherStatus(obj);
    const meta = getStatusMeta(status);

    // Principal: Consistent normalization for derived stats
    let usageLimit = -1;
    if (obj.totalUsageLimit !== undefined && obj.totalUsageLimit !== null) {
        usageLimit = Number(obj.totalUsageLimit);
    } else if (obj.usageLimit !== undefined && obj.usageLimit !== null) {
        usageLimit = Number(obj.usageLimit);
    }
    if (isNaN(usageLimit)) usageLimit = -1;

    const usedCount = Math.max(
        Number(obj.totalUsedCount) || 0, 
        Number(obj.usedCount) || 0,
        Array.isArray(obj.usedBy) ? obj.usedBy.length : 0
    );

    const usagePercent = (usageLimit !== -1 && usageLimit > 0) ? Math.round((usedCount / usageLimit) * 100) : 0;

    return {
        ...obj,
        // Normalized fields for FE (Final Source of Truth)
        startDate: obj.startsAt || obj.startDate || null,
        endDate: obj.expiresAt || obj.endDate || null,
        usageLimit,
        usedCount,
        isActive: obj.status === 'active',
        
        // Computed Status
        computedStatus: status,
        displayStatus: meta,
        usagePercent,

        // Countdown logic
        expiryCountdown: getExpiryCountdown(obj.expiresAt || obj.endDate),
    };
};

const getExpiryCountdown = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const end = new Date(expiresAt);
    const diffMs = end - now;
    
    if (diffMs <= 0) return { days: 0, hours: 0, urgency: 'expired' };
    
    const diffHours = diffMs / (1000 * 60 * 60);
    const days = Math.floor(diffHours / 24);
    const hours = Math.floor(diffHours % 24);
    
    let urgency = 'normal';
    if (days <= 1) urgency = 'critical';
    else if (days <= 3) urgency = 'warning';
    
    return { days, hours, urgency };
};

module.exports = {
    getVoucherStatus,
    getStatusMeta,
    enrichVoucher,
};
