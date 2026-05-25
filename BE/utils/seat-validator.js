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
    maxCoupleRows: Infinity,
    errors: {},
  },
  VIP: {
    allowedSeatTypes: ['vip', 'couple', 'aisle'],
    forbiddenSeatTypes: ['normal'],
    maxCoupleRows: Infinity,
    seatTypeLabels: { normal: 'Thường' },
    errors: {
      forbiddenSeat: (type) => `Phòng VIP không được chứa ghế ${type}`,
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

  if (!Array.isArray(seatMatrix)) {
    return { valid: true, errors: [] };
  }

  for (let r = 0; r < seatMatrix.length; r++) {
    const row = seatMatrix[r];
    if (!Array.isArray(row)) continue;
    let rowHasCouple = false;

    for (const cell of row) {
      if (!cell || !cell.type || cell.type === 'aisle') continue;

      if (forbidden.has(cell.type)) {
        const label = rules.seatTypeLabels?.[cell.type] || cell.type;
        errors.push(rules.errors.forbiddenSeat?.(label) || `Phòng ${roomType} không được chứa ghế ${label}`);
      }

      if (cell.type === 'couple') {
        rowHasCouple = true;
      }
    }

    if (rowHasCouple) {
      coupleRows.add(r);
    }
  }

  if (coupleRows.size > rules.maxCoupleRows) {
    errors.push(
      rules.errors.maxCoupleRowsExceeded?.(rules.maxCoupleRows) ||
      `Phòng ${roomType} chỉ được có tối đa ${rules.maxCoupleRows} hàng ghế Couple`,
    );
  }

  return { valid: errors.length === 0, errors: [...new Set(errors)] };
}

/**
 * Full integrity check: counts must match and business rules must pass.
 * @param {Array<Array<{type: string}>>} seatMatrix
 * @param {number} expectedTotalSeats
 * @param {string} roomType
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSeatMatrixIntegrity(seatMatrix, expectedTotalSeats, roomType) {
  const errors = [];

  // Rule 1: Actual seat count must match expected
  const actual = countActualSeats(seatMatrix);
  if (actual !== expectedTotalSeats) {
    errors.push(
      `Số ghế thực tế trong ma trận (${actual}) không khớp với totalSeats (${expectedTotalSeats}). Chênh lệch: ${actual - expectedTotalSeats}`,
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
