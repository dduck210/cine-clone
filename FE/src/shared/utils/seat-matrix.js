// Pure seat-matrix utilities — mirrors BE/utils/seat-validator.js rules.
// No React imports. Safe to use in both browser and Node contexts.

export const countActualSeats = (matrix) => {
  if (!Array.isArray(matrix)) return 0;
  let count = 0;
  for (const row of matrix) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (cell && cell.type !== "aisle") count++;
    }
  }
  return count;
};

export const validateRoomSeatRules = (matrix, roomType) => {
  const errors = [];
  if (!Array.isArray(matrix) || matrix.length === 0) return { valid: true, errors: [] };

  let vipCount = 0;
  let coupleCount = 0;
  let totalSeats = 0;
  const coupleRows = new Set();
  const vipRows = new Set();

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;
    let rowHasCouple = false;
    let rowHasVip = false;

    for (const cell of row) {
      if (!cell || !cell.type || cell.type === "aisle") continue;
      totalSeats++;
      if (cell.type === "vip") { vipCount++; rowHasVip = true; }
      if (cell.type === "couple") { coupleCount++; rowHasCouple = true; }
    }

    if (rowHasCouple) coupleRows.add(r);
    if (rowHasVip) vipRows.add(r);
  }

  if (roomType === "Standard") {
    if (vipCount > 0) {
      errors.push("Phòng Standard không được chứa ghế VIP");
    }
    if (coupleRows.size > 2) {
      errors.push("Phòng Standard chỉ được có tối đa 2 hàng ghế Couple");
    }
  }

  if (roomType === "VIP") {
    // VIP rooms MUST NOT contain normal seats
    for (let r = 0; r < matrix.length; r++) {
      const row = matrix[r];
      if (!Array.isArray(row)) continue;
      for (const cell of row) {
        if (!cell || !cell.type || cell.type === "aisle") continue;
        if (cell.type === "normal") {
          errors.push("Phòng VIP không được chứa ghế Thường — chỉ được dùng ghế VIP và Đôi");
          break;
        }
      }
    }
    // Dynamic max couple rows: >80 seats → 3, ≤80 → 2
    const maxCouple = totalSeats > 80 ? 3 : 2;
    if (coupleRows.size > maxCouple) {
      errors.push(`Phòng VIP (${totalSeats} ghế) chỉ được tối đa ${maxCouple} hàng Couple. Hiện có ${coupleRows.size} hàng.`);
    }
  }

  if (roomType === "Premium") {
    const maxCouple = totalSeats > 80 ? 3 : 2;
    if (coupleRows.size < 2) {
      errors.push("Phòng Premium cần có ít nhất 2 hàng ghế Đôi (Couple)");
    }
    if (coupleRows.size > maxCouple) {
      errors.push(`Phòng Premium (${totalSeats} ghế) chỉ được tối đa ${maxCouple} hàng Couple. Hiện có ${coupleRows.size} hàng.`);
    }
    if (vipRows.size > 2) {
      errors.push("Phòng Premium chỉ được có tối đa 2 hàng ghế VIP");
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Determine seat type for a row based on room type and row position.
 * Pure function, no side effects.
 */
export function determineRowSeatType(rowIndex, totalRows, roomType, totalSeats = 0) {
  if (roomType === "Standard") {
    const coupleRows = totalRows >= 8 ? 2 : totalRows >= 4 ? 1 : 0;
    return coupleRows > 0 && rowIndex >= totalRows - coupleRows ? "couple" : "normal";
  }

  if (roomType === "Premium") {
    // Dynamic: >80 seats → 3 couple rows, ≤80 → 2 couple rows. Max 2 VIP rows.
    const coupleRows = totalSeats > 80 ? 3 : 2;
    const vipRows = Math.min(2, totalRows - coupleRows);
    if (rowIndex >= totalRows - coupleRows) return "couple";
    if (rowIndex >= totalRows - coupleRows - vipRows) return "vip";
    return "normal";
  }

  if (roomType === "VIP") {
    // VIP rooms: NO normal seats — only VIP + Couple
    // Bottom ~30% rows are couple, rest are VIP
    const coupleRows = Math.max(1, Math.min(Math.round(totalRows * 0.4), 3));
    if (rowIndex >= totalRows - coupleRows) return "couple";
    return "vip";
  }

  return "normal";
}

/**
 * Generate a seat matrix with EXACTLY totalSeats non-aisle seats.
 *
 * Algorithm:
 *   1. Calculate optimal column count from cinema aspect ratio sqrt(totalSeats × 1.6)
 *   2. Calculate rows = ceil(totalSeats / cols)
 *   3. If last row would be too sparse (< ceil(cols/3)), reduce cols and retry
 *   4. Build matrix row by row, last row truncated to hit exact totalSeats
 *   5. Post-validate: actual seat count MUST equal totalSeats
 *
 * Returns { matrix, rows, cols } where matrix is a 2D array of { label, type }.
 */
export function generateMatrixFromTotalSeats(totalSeats, roomType = "Standard") {
  if (!totalSeats || totalSeats < 1) return { matrix: [], rows: 0, cols: 0 };

  // Step 1: Calculate optimal column count
  let cols = Math.round(Math.sqrt(totalSeats * 1.6));
  cols = Math.min(16, Math.max(6, cols));

  // Step 2: Find best row/col distribution
  // Ensure last row has at least ceil(cols/3) seats (unless it's a single-row room)
  let rows = Math.ceil(totalSeats / cols);
  let lastRowSeats = totalSeats - (rows - 1) * cols;

  if (lastRowSeats === 0) {
    // Perfect fit — all rows full
    lastRowSeats = cols;
  } else if (lastRowSeats < Math.ceil(cols / 3) && rows > 1) {
    // Last row too sparse — try narrower columns for better distribution
    for (let tryCols = cols - 1; tryCols >= 6; tryCols--) {
      const tryRows = Math.ceil(totalSeats / tryCols);
      const tryLast = totalSeats - (tryRows - 1) * tryCols;
      const effectiveLast = tryLast === 0 ? tryCols : tryLast;
      if (effectiveLast >= Math.ceil(tryCols / 3) || tryCols === 6) {
        cols = tryCols;
        rows = tryRows;
        lastRowSeats = effectiveLast;
        break;
      }
    }
  }

  // Cap rows at 26 (A-Z)
  if (rows > 26) {
    rows = 26;
    cols = Math.ceil(totalSeats / 26);
    cols = Math.min(16, Math.max(6, cols));
    lastRowSeats = totalSeats - 25 * cols;
  }

  // Step 3: Build matrix with exact totalSeats
  const matrix = [];
  let placed = 0;
  const fullRows = lastRowSeats === cols ? rows : rows - 1;

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const seatsInThisRow = r < fullRows ? cols : Math.min(cols, totalSeats - placed);
    if (seatsInThisRow <= 0) break; // Shouldn't happen, but safety

    const seatType = determineRowSeatType(r, rows, roomType, totalSeats);
    const rowArr = [];
    for (let c = 1; c <= seatsInThisRow; c++) {
      rowArr.push({ label: `${rowLetter}${c}`, type: seatType });
    }
    matrix.push(rowArr);
    placed += seatsInThisRow;
  }

  // Step 4: Post-validation — MUST match exactly
  if (placed !== totalSeats) {
    console.error(
      `[generateMatrixFromTotalSeats] FATAL: placed ${placed} seats, expected ${totalSeats}. ` +
      `cols=${cols} rows=${rows} lastRowSeats=${lastRowSeats}`,
    );
    // Emergency fallback: simple row-by-row fill with consistent cols
    return generateMatrixFallback(totalSeats, roomType);
  }

  return { matrix, rows, cols };
}

/** Emergency fallback — simple distribution, guaranteed correct count. */
export function generateMatrixFallback(totalSeats, roomType) {
  const cols = Math.min(16, Math.max(6, Math.round(Math.sqrt(totalSeats * 1.6))));
  const rows = Math.ceil(totalSeats / cols);
  const matrix = [];
  let placed = 0;

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const seatsInRow = Math.min(cols, totalSeats - placed);
    if (seatsInRow <= 0) break;
    const seatType = determineRowSeatType(r, rows, roomType, totalSeats);
    const rowArr = [];
    for (let c = 1; c <= seatsInRow; c++) {
      rowArr.push({ label: `${rowLetter}${c}`, type: seatType });
    }
    matrix.push(rowArr);
    placed += seatsInRow;
  }

  return { matrix, rows, cols };
}
