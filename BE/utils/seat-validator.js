/**
 * Seat matrix validation utilities — shared business rules for room/seat management.
 *
 * These rules are the SINGLE SOURCE OF TRUTH for seat type validation.
 * Frontend and backend MUST use the same rule definitions.
 */

const ROOM_TYPE_RULES = {
  Standard: {
    allowedSeatTypes: ['normal', 'couple', 'aisle'],
    forbiddenSeatTypes: ['vip'],
    maxCoupleRows: 2,
    seatTypeLabels: { vip: 'VIP' },
    errors: {
      forbiddenSeat: (type) => `Phòng Standard không được chứa ghế ${type}`,
      maxCoupleRowsExceeded: (max) => `Phòng Standard chỉ được có tối đa ${max} hàng ghế Couple`,
    },
  },
  Premium: {
    allowedSeatTypes: ['normal', 'vip', 'couple', 'aisle'],
    forbiddenSeatTypes: [],
    maxCoupleRows: Infinity, // computed dynamically: >80 seats → 3, ≤80 → 2
    minCoupleRows: 2,
    maxVipRows: 2,
    errors: {
      minCoupleRows: (min) => `Phòng Premium cần có ít nhất ${min} hàng ghế Couple`,
      maxCoupleRowsExceeded: (max) => `Phòng Premium chỉ được có tối đa ${max} hàng ghế Couple`,
      maxVipRowsExceeded: (max) => `Phòng Premium chỉ được có tối đa ${max} hàng ghế VIP`,
    },
  },
  VIP: {
    allowedSeatTypes: ['vip', 'couple', 'aisle'],
    forbiddenSeatTypes: ['normal'],
    maxCoupleRows: Infinity, // computed dynamically: >80 seats → 3, ≤80 → 2
    seatTypeLabels: { normal: 'Thường' },
    errors: {
      forbiddenSeat: (type) => `Phòng VIP không được chứa ghế ${type}`,
      maxCoupleRowsExceeded: (max) => `Phòng VIP chỉ được tối đa ${max} hàng Couple`,
    },
  },
};

/**
 * Count non-aisle seats in a seat matrix.
 * @param {Array<Array<{type: string}>>} seatMatrix
 * @returns {number}
 */
function countActualSeats(seatMatrix) {
  if (!Array.isArray(seatMatrix)) return 0;
  let count = 0;
  for (const row of seatMatrix) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (cell && cell.type !== 'aisle') count++;
    }
  }
  return count;
}

/**
 * Validate seat types against room type business rules.
 * @param {Array<Array<{type: string}>>} seatMatrix
 * @param {string} roomType - 'Standard' | 'Premium' | 'VIP'
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRoomSeatRules(seatMatrix, roomType) {
  const rules = ROOM_TYPE_RULES[roomType];
  if (!rules) {
    return { valid: false, errors: [`Loại phòng không hợp lệ: ${roomType}`] };
  }

  const errors = [];
  const forbidden = new Set(rules.forbiddenSeatTypes);
  const coupleRows = new Set();
  const vipRows = new Set();
  let vipCount = 0;
  let coupleCount = 0;
  let totalSeats = 0;

  if (!Array.isArray(seatMatrix)) {
    return { valid: true, errors: [] };
  }

  for (let r = 0; r < seatMatrix.length; r++) {
    const row = seatMatrix[r];
    if (!Array.isArray(row)) continue;
    let rowHasCouple = false;
    let rowHasVip = false;

    for (const cell of row) {
      if (!cell || !cell.type || cell.type === 'aisle') continue;
      totalSeats++;

      if (forbidden.has(cell.type)) {
        const label = rules.seatTypeLabels?.[cell.type] || cell.type;
        errors.push(rules.errors.forbiddenSeat?.(label) || `Phòng ${roomType} không được chứa ghế ${label}`);
      }

      if (cell.type === 'couple') {
        rowHasCouple = true;
        coupleCount++;
      }
      if (cell.type === 'vip') {
        rowHasVip = true;
        vipCount++;
      }
    }

    if (rowHasCouple) coupleRows.add(r);
    if (rowHasVip) vipRows.add(r);
  }

  // Couple row limits
  if (coupleRows.size > rules.maxCoupleRows) {
    errors.push(
      rules.errors.maxCoupleRowsExceeded?.(rules.maxCoupleRows) ||
      `Phòng ${roomType} chỉ được có tối đa ${rules.maxCoupleRows} hàng ghế Couple`,
    );
  }

  if (rules.minCoupleRows && coupleRows.size < rules.minCoupleRows) {
    errors.push(
      rules.errors.minCoupleRows?.(rules.minCoupleRows) ||
      `Phòng ${roomType} cần có ít nhất ${rules.minCoupleRows} hàng ghế Couple`,
    );
  }

  // VIP row limits (Premium)
  if (rules.maxVipRows && vipRows.size > rules.maxVipRows) {
    errors.push(
      rules.errors.maxVipRowsExceeded?.(rules.maxVipRows) ||
      `Phòng ${roomType} chỉ được có tối đa ${rules.maxVipRows} hàng ghế VIP`,
    );
  }

  // Dynamic max couple rows for VIP & Premium: >80 seats → 3, ≤80 → 2
  if (roomType === 'Premium' || roomType === 'VIP') {
    const dynamicMax = totalSeats > 80 ? 3 : 2;
    if (coupleRows.size > dynamicMax) {
      errors.push(
        `Phòng ${roomType} (${totalSeats} ghế) chỉ được tối đa ${dynamicMax} hàng Couple. Hiện có ${coupleRows.size} hàng.`,
      );
    }
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * Full integrity check: actual seats must not exceed expected total,
 * and business rules must pass. Admin customization (aisles, deletions)
 * may reduce actual count below expected — that is valid.
 * @param {Array<Array<{type: string}>>} seatMatrix
 * @param {number} expectedTotalSeats - the configured maximum
 * @param {string} roomType
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSeatMatrixIntegrity(seatMatrix, expectedTotalSeats, roomType) {
  const errors = [];

  // Rule 1: Actual seat count must not exceed configured total
  // After admin customization (aisles, deletions), actual can be LESS than expected.
  const actual = countActualSeats(seatMatrix);
  if (actual > expectedTotalSeats) {
    errors.push(
      `Số ghế thực tế trong ma trận (${actual}) vượt quá totalSeats (${expectedTotalSeats}). Vượt: ${actual - expectedTotalSeats} ghế.`,
    );
  }

  // Rule 2: Seat types must comply with room type rules
  const ruleCheck = validateRoomSeatRules(seatMatrix, roomType);
  errors.push(...ruleCheck.errors);

  return { valid: errors.length === 0, errors };
}

module.exports = {
  ROOM_TYPE_RULES,
  countActualSeats,
  validateRoomSeatRules,
  validateSeatMatrixIntegrity,
};
