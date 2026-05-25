import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  Save,
  Grid,
  Eye,
  Settings,
  AlertTriangle,
  Zap,
  Calendar,
  Ticket,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";

const ROOM_TYPE_STYLE = {
  Standard: "bg-blue-50 text-blue-700 border border-blue-200",
  Premium: "bg-purple-50 text-purple-700 border border-purple-200",
  VIP: "bg-amber-50 text-amber-700 border border-amber-200",
};

const ROOM_TYPE_INFO = {
  Standard: {
    seatTypes: "Thường, Couple",
    minSeats: 40,
    minRows: 5,
    minCols: 8,
    screen: "Màn chiếu 2K, kích thước tiêu chuẩn.",
    sound: "Âm thanh Dolby 5.1 hoặc 7.1.",
    amenities: "Không yêu cầu tiện ích đặc biệt.",
    desc: "Phòng chiếu tiêu chuẩn — đáp ứng nhu cầu xem phim cơ bản với chất lượng ổn định.",
    seatReq: "Tối thiểu 80% ghế thường, có thể có 1-2 hàng ghế Couple.",
    icon: "🎬",
    border: "border-blue-200",
    bg: "bg-blue-50/60",
    accent: "text-blue-700",
    accentBg: "bg-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  Premium: {
    seatTypes: "Thường, VIP, Đôi",
    minSeats: 60,
    minRows: 6,
    minCols: 10,
    screen: "Màn chiếu 2K/4K, kích thước lớn hơn 20% so với Standard.",
    sound: "Âm thanh Dolby Atmos hoặc DTS:X.",
    amenities: "Có ít nhất 1 tiện ích: bắp nước phục vụ tận ghế, cổng sạc USB.",
    desc: "Phòng chiếu cao cấp — trải nghiệm nâng cao với ghế ngồi rộng hơn, màn hình lớn hơn.",
    seatReq: "Tối thiểu 2 hàng ghế VIP, 1 hàng Couple, ghế bọc da, khoảng cách hàng rộng.",
    icon: "✨",
    border: "border-purple-200",
    bg: "bg-purple-50/60",
    accent: "text-purple-700",
    accentBg: "bg-purple-100",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  VIP: {
    seatTypes: "VIP, Đôi",
    minSeats: 30,
    minRows: 5,
    minCols: 6,
    screen: "Màn chiếu 4K Laser, kích thước lớn nhất.",
    sound: "Âm thanh Dolby Atmos toàn diện.",
    amenities: "Phòng chờ VIP riêng, phục vụ đồ ăn tại ghế, menu premium, chăn/gối miễn phí.",
    desc: "Phòng chiếu hạng sang — không gian riêng tư, dịch vụ đẳng cấp nhất.",
    seatReq: "Tối thiểu 60% ghế VIP, 20% ghế Couple. Ghế da cao cấp, ngả điện, tích hợp massage.",
    icon: "👑",
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    accent: "text-amber-700",
    accentBg: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

const SEAT_TYPES = [
  {
    value: "normal",
    label: "Thường",
    color: "bg-slate-200 text-slate-700 border-slate-300",
    editColor: "bg-slate-100 hover:bg-slate-200",
  },
  {
    value: "vip",
    label: "VIP",
    color: "bg-amber-200 text-amber-800 border-amber-300",
    editColor: "bg-amber-50 hover:bg-amber-100",
  },
  {
    value: "couple",
    label: "Đôi",
    color: "bg-pink-200 text-pink-800 border-pink-300",
    editColor: "bg-pink-50 hover:bg-pink-100",
  },
  {
    value: "aisle",
    label: "Lối",
    color: "bg-transparent text-transparent border-transparent",
    editColor: "",
  },
];

const typeColor = (type) =>
  SEAT_TYPES.find((t) => t.value === type)?.color || "bg-slate-200";

// ---------------------------------------------------------------------------
// Shared validation utilities (mirrors BE/utils/seat-validator.js rules)
// ---------------------------------------------------------------------------
const countActualSeats = (matrix) => {
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

const validateRoomSeatRules = (matrix, roomType) => {
  const errors = [];
  if (!Array.isArray(matrix) || matrix.length === 0) return { valid: true, errors: [] };

  let vipCount = 0;
  const coupleRows = new Set();

  for (let r = 0; r < matrix.length; r++) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;
    let rowHasCouple = false;

    for (const cell of row) {
      if (!cell || !cell.type || cell.type === "aisle") continue;
      if (cell.type === "vip") vipCount++;
      if (cell.type === "couple") rowHasCouple = true;
    }

    if (rowHasCouple) coupleRows.add(r);
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
    // VIP rooms should not have normal seats (per business rules)
    // This is a soft rule — we warn but don't block
  }

  return { valid: errors.length === 0, errors };
};

// ---------------------------------------------------------------------------
// Matrix generation — exact totalSeats, flexible last row
// ---------------------------------------------------------------------------

/**
 * Determine seat type for a row based on room type and row position.
 * Pure function, no side effects.
 */
function determineRowSeatType(rowIndex, totalRows, roomType) {
  if (roomType === "Standard") {
    const coupleRows = totalRows >= 8 ? 2 : totalRows >= 4 ? 1 : 0;
    return coupleRows > 0 && rowIndex >= totalRows - coupleRows ? "couple" : "normal";
  }

  if (roomType === "Premium") {
    if (totalRows >= 6) {
      if (rowIndex === totalRows - 1) return "couple";
      if (rowIndex >= totalRows - 3) return "vip";
      return "normal";
    }
    if (totalRows >= 3) {
      if (rowIndex === totalRows - 1) return "couple";
      if (rowIndex === totalRows - 2) return "vip";
      return "normal";
    }
    return totalRows >= 2 && rowIndex === totalRows - 1 ? "couple" : "normal";
  }

  if (roomType === "VIP") {
    const coupleRows = Math.max(1, Math.round(totalRows * 0.2));
    const vipRows = Math.max(1, Math.round(totalRows * 0.6));
    const normalRows = totalRows - coupleRows - vipRows;
    if (rowIndex >= totalRows - coupleRows) return "couple";
    if (rowIndex >= Math.max(0, normalRows)) return "vip";
    return "normal";
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
function generateMatrixFromTotalSeats(totalSeats, roomType = "Standard") {
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

    const seatType = determineRowSeatType(r, rows, roomType);
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
function generateMatrixFallback(totalSeats, roomType) {
  const cols = Math.min(16, Math.max(6, Math.round(Math.sqrt(totalSeats * 1.6))));
  const rows = Math.ceil(totalSeats / cols);
  const matrix = [];
  let placed = 0;

  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const seatsInRow = Math.min(cols, totalSeats - placed);
    if (seatsInRow <= 0) break;
    const seatType = determineRowSeatType(r, rows, roomType);
    const rowArr = [];
    for (let c = 1; c <= seatsInRow; c++) {
      rowArr.push({ label: `${rowLetter}${c}`, type: seatType });
    }
    matrix.push(rowArr);
    placed += seatsInRow;
  }

  return { matrix, rows, cols };
}

// Matrix editor: click a cell to cycle through types
// roomType controls which seat types are available for cycling
const MatrixEditor = ({ matrix, onChange, roomType = "Standard" }) => {
  const cycleType = (ri, ci) => {
    // Build cycle order based on room type rules
    const allTypes = ["normal", "vip", "couple", "aisle"];
    const forbidden = roomType === "Standard" ? new Set(["vip"]) : new Set();
    const order = allTypes.filter((t) => !forbidden.has(t));

    const current = matrix[ri][ci]?.type || "normal";
    const idx = order.indexOf(current);
    const next = idx >= 0 ? order[(idx + 1) % order.length] : order[0];

    const updated = matrix.map((row, r) => {
      if (r !== ri) return row;
      const newRow = row.map((cell, c) =>
        c === ci ? { ...cell, type: next } : cell,
      );
      // Relabel: non-aisle seats get sequential numbers, aisle cells keep row letter only
      const rowLetter = String.fromCharCode(65 + r);
      let seatNum = 1;
      return newRow.map((cell) => ({
        ...cell,
        label: cell.type === "aisle" ? rowLetter : `${rowLetter}${seatNum++}`,
      }));
    });
    onChange(updated);
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Screen indicator */}
        <div className="w-full h-6 bg-slate-200 rounded mb-4 flex items-center justify-center text-slate-400 text-xs font-bold tracking-widest uppercase">
          Màn hình
        </div>
        {matrix.map((row, ri) => (
          <div key={ri} className="flex gap-1 mb-1 items-center">
            <span className="w-5 text-xs text-slate-400 font-bold text-center">
              {row[0]?.label?.[0] || ""}
            </span>
            {row.map((cell, ci) => (
              <button
                key={ci}
                onClick={() => cycleType(ri, ci)}
                title={`${cell.label} → click để đổi loại`}
                className={`w-9 h-9 rounded text-[10px] font-bold border transition-all ${typeColor(cell.type)}`}
              >
                {cell.type === "aisle" ? "" : cell.label.replace(/^[A-Z]/, "")}
              </button>
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
          {SEAT_TYPES.map((t) => (
            <div
              key={t.value}
              className="flex items-center gap-1.5 text-xs text-slate-600"
            >
              <div className={`w-5 h-5 rounded border ${t.color}`} />
              {t.label}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">
            Click vào ghế để đổi loại
          </span>
        </div>
      </div>
    </div>
  );
};

// Read-only matrix preview
const MatrixView = ({ matrix }) => (
  <div className="overflow-x-auto">
    <div className="inline-block">
      <div className="h-5 bg-slate-200 rounded mb-3 flex items-center justify-center text-slate-400 text-[10px] font-bold tracking-widest uppercase">
        Màn hình
      </div>
      {matrix.map((row, ri) => (
        <div key={ri} className="flex gap-1 mb-1 items-center">
          <span className="w-5 text-xs text-slate-400 font-bold text-center shrink-0">
            {row[0]?.label?.[0] || ""}
          </span>
          {row.map((cell, ci) => (
            <div
              key={ci}
              title={cell.label}
              className={`w-8 h-8 rounded text-[9px] font-bold border flex items-center justify-center select-none ${typeColor(cell.type)}`}
            >
              {cell.type === "aisle" ? "" : cell.label.replace(/^[A-Z]/, "")}
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
        {SEAT_TYPES.filter((t) => t.value !== "aisle").map((t) => (
          <div
            key={t.value}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <div className={`w-4 h-4 rounded border ${t.color}`} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Detail modal — read-only view of room + seat map
const RoomDetailModal = ({ room, onClose, onEdit }) => {
  const hasMatrix = room.seatMatrix?.length > 0;
  const matrix = hasMatrix
    ? room.seatMatrix
    : generateMatrixFromTotalSeats(room.totalSeats || 80).matrix;
  const typeCount = { normal: 0, vip: 0, couple: 0 };
  for (const r of matrix)
    for (const cell of r)
      if (cell?.type && typeCount[cell.type] !== undefined)
        typeCount[cell.type]++;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chi tiết phòng chiếu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 shadow-md shadow-red-200"
            >
              <Settings size={14} /> Cấu hình ghế
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all duration-150 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Loại phòng", isRoomType: true },
              {
                label: "Kích thước",
                value: `${matrix.length} hàng × ${matrix[0]?.length || 0} cột`,
              },
              { label: "Tổng ghế", value: `${room.totalSeats} ghế` },
              {
                label: "Trạng thái",
                value: room.status === "active" ? "Hoạt động" : "Bảo trì",
                isStatus: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {item.label}
                </p>
                {item.isRoomType ? (
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}
                  >
                    {room.roomType}
                  </span>
                ) : item.isStatus ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                    />
                    {item.value}
                  </span>
                ) : (
                  <p className="font-bold text-slate-800">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Seat type breakdown */}
          {typeCount && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Ghế Thường
                </p>
                <p className="text-2xl font-black text-slate-700">
                  {typeCount.normal}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Ghế VIP
                </p>
                <p className="text-2xl font-black text-amber-600">
                  {typeCount.vip}
                </p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 mb-1">
                  Ghế Đôi
                </p>
                <p className="text-2xl font-black text-pink-600">
                  {typeCount.couple}
                </p>
              </div>
            </div>
          )}

          {/* Seat map */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Sơ đồ ghế
              </p>
              {!hasMatrix && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                  Mặc định · chưa cấu hình loại ghế
                </span>
              )}
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 overflow-auto">
              <MatrixView matrix={matrix} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Room form modal (create or edit)
const RoomModal = ({ room, cinemas, onClose, onSaved }) => {
  const [cinemaId, setCinemaId] = useState(
    room?.cinema?._id || room?.cinema || "",
  );
  const [name, setName] = useState(room?.name || "");
  const [totalSeats, setTotalSeats] = useState(room?.totalSeats || 80);
  const [roomType, setRoomType] = useState(room?.roomType || "Standard");
  const [matrix, setMatrix] = useState(
    room?.seatMatrix?.length > 0 ? room.seatMatrix : null,
  );
  const [rows, setRows] = useState(room?.rows || 0);
  const [cols, setCols] = useState(room?.cols || 0);
  const [saving, setSaving] = useState(false);
  const [showMatrix, setShowMatrix] = useState(
    !!(room?.seatMatrix?.length > 0),
  );
  const [errors, setErrors] = useState({});
  const [matrixErrors, setMatrixErrors] = useState([]);

  // Validate existing matrix on mount (for edit mode)
  useEffect(() => {
    if (matrix && matrix.length > 0) {
      runMatrixValidation(matrix);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validate = () => {
    const e = {};
    const info = ROOM_TYPE_INFO[roomType];
    if (!cinemaId) e.cinemaId = "Vui lòng chọn rạp";
    if (!name.trim()) e.name = "Tên phòng không được để trống";
    if (!totalSeats || totalSeats < 1) e.totalSeats = "Số ghế phải lớn hơn 0";
    if (totalSeats < info.minSeats) e.totalSeats = `${roomType} yêu cầu tối thiểu ${info.minSeats} ghế`;
    if (totalSeats > 416) e.totalSeats = "Tối đa 416 ghế (26 hàng × 16 cột)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Real-time matrix validation — runs whenever matrix or roomType changes
  const runMatrixValidation = (m) => {
    if (!m || m.length === 0) {
      setMatrixErrors([]);
      return true;
    }
    const allErrors = [];

    // Rule 1: Exact seat count must match totalSeats
    const actual = countActualSeats(m);
    if (actual !== totalSeats) {
      allErrors.push(
        `Số ghế thực tế (${actual}) không khớp với tổng số ghế (${totalSeats}). Chênh lệch: ${actual > totalSeats ? "+" : ""}${actual - totalSeats}`,
      );
    }

    // Rule 2: Room type business rules
    const ruleCheck = validateRoomSeatRules(m, roomType);
    allErrors.push(...ruleCheck.errors);

    setMatrixErrors(allErrors);
    return allErrors.length === 0;
  };

  // Wrap setMatrix to always run validation
  const updateMatrix = (newMatrix) => {
    setMatrix(newMatrix);
    runMatrixValidation(newMatrix);
  };

  const handleGenerateMatrix = () => {
    const e = {};
    const info = ROOM_TYPE_INFO[roomType];
    if (!totalSeats || totalSeats < 1) e.totalSeats = "Nhập số ghế trước";
    if (totalSeats < info.minSeats) e.totalSeats = `${roomType} yêu cầu tối thiểu ${info.minSeats} ghế`;
    if (totalSeats > 416) e.totalSeats = "Tối đa 416 ghế";
    if (Object.keys(e).length > 0) {
      setErrors((p) => ({ ...p, ...e }));
      return;
    }
    const result = generateMatrixFromTotalSeats(totalSeats, roomType);
    setRows(result.rows);
    setCols(result.cols);
    setMatrix(result.matrix);
    setShowMatrix(true);
    // Validate the generated matrix
    runMatrixValidation(result.matrix);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!matrix) {
      toast.error("Vui lòng tạo ma trận ghế trước khi lưu");
      return;
    }

    // Frontend gate: block save if matrix has validation errors
    if (!runMatrixValidation(matrix)) {
      toast.error("Vui lòng sửa các lỗi ma trận ghế trước khi lưu");
      return;
    }

    // Use actual non-aisle seat count, not rows×cols
    const actualTotal = countActualSeats(matrix);
    const payload = {
      cinema: cinemaId,
      name,
      rows: Number(rows),
      cols: Number(cols),
      roomType,
      totalSeats: actualTotal,
    };
    payload.seatMatrix = matrix;

    setSaving(true);
    try {
      if (room?._id) {
        await axiosInstance.put(`/admin/rooms/${room._id}`, payload);
        toast.success("Cập nhật phòng thành công!");
      } else {
        await axiosInstance.post("/admin/rooms", payload);
        toast.success("Tạo phòng thành công!");
      }
      onSaved();
      onClose();
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        // Display server-side validation errors
        setMatrixErrors(serverErrors);
        toast.error(err.response?.data?.message || "Lỗi khi lưu phòng");
      } else {
        toast.error(err.response?.data?.message || "Lỗi khi lưu phòng");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              {room ? "Chỉnh sửa phòng" : "Tạo phòng mới"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấu hình ma trận ghế cho phòng chiếu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all duration-150 active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Rạp <span className="text-red-500">*</span>
              </label>
              <select
                value={cinemaId}
                onChange={(e) => {
                  setCinemaId(e.target.value);
                  setErrors((p) => ({ ...p, cinemaId: "" }));
                }}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.cinemaId ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`}
              >
                <option value="">-- Chọn rạp --</option>
                {cinemas.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.cinemaId && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  {errors.cinemaId}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Tên phòng <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="VD: Phòng 1"
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Tổng số ghế{" "}
                <span className="text-slate-400 font-normal">(tối thiểu {ROOM_TYPE_INFO[roomType].minSeats})</span>
              </label>
              <input
                type="number"
                value={totalSeats}
                onChange={(e) => {
                  const v = Math.min(416, Math.max(0, Number(e.target.value) || 0));
                  setTotalSeats(v);
                  setShowMatrix(false);
                  setErrors((p) => ({ ...p, totalSeats: "" }));
                }}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.totalSeats ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`}
              />
              {errors.totalSeats && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.totalSeats}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                Loại phòng
              </label>
              <select
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value);
                  setShowMatrix(false);
                  setMatrixErrors([]);
                  setErrors((p) => ({ ...p, totalSeats: "" }));
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700"
              >
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>

          {/* Room type info card */}
          {(() => {
            const info = ROOM_TYPE_INFO[roomType];
            return (
              <div className={`rounded-2xl border ${info.border} ${info.bg} p-5 shadow-sm transition-all duration-300`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${info.accentBg} flex items-center justify-center text-lg shrink-0`}>
                    {info.icon}
                  </div>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <h4 className={`text-sm font-extrabold ${info.accent} tracking-tight`}>
                      {roomType}
                    </h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${info.badge} shadow-sm`}>
                      {info.seatTypes}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed mb-4 pl-[52px]">
                  {info.desc}
                </p>

                {/* Specs: row 1 */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-white/80 rounded-xl p-3 border border-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Yêu cầu ghế
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {info.seatReq}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Màn chiếu
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {info.screen}
                    </p>
                  </div>
                </div>

                {/* Specs: row 2 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/80 rounded-xl p-3 border border-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Âm thanh
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {info.sound}
                    </p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                      Tiện ích thêm
                    </p>
                    <p className="text-xs font-bold text-slate-700 leading-snug">
                      {info.amenities}
                    </p>
                  </div>
                </div>

                {/* Minimum dimensions bar */}
                <div className={`rounded-xl px-4 py-3 ${info.bg} border ${info.border} flex items-center gap-3`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                    Kích thước tối thiểu
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {info.minRows} hàng × {info.minCols} cột
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="text-xs font-bold text-slate-700">
                    Tổng ghế tối thiểu: {info.minSeats}
                  </span>
                </div>
              </div>
            );
          })()}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ma trận ghế
              </label>
              <button
                onClick={handleGenerateMatrix}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95"
              >
                <Grid size={14} />{" "}
                {matrix ? "Tạo lại ma trận" : "Tạo ma trận mặc định"}
              </button>
            </div>
            {!showMatrix || !matrix ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                Nhấn "Tạo ma trận mặc định" để cấu hình loại ghế
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <MatrixEditor matrix={matrix} onChange={updateMatrix} roomType={roomType} />
                </div>
                {/* Real-time matrix validation errors */}
                {matrixErrors.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-1.5">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                      Lỗi ma trận ghế
                    </p>
                    {matrixErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all duration-150 active:scale-95 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (matrix && matrixErrors.length > 0)}
            className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all duration-150 active:scale-95 text-sm flex items-center gap-2 ${saving || (matrix && matrixErrors.length > 0) ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 hover:-translate-y-0.5 shadow-red-200"}`}
          >
            <Save size={16} /> {saving ? "Đang lưu..." : "Lưu phòng"}
          </button>
        </div>
      </div>
    </div>
  );
};

const CINEMA_STATUS_META = {
  active: {
    label: "Đang hoạt động",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    description: "Rạp đang hoạt động bình thường.",
  },
  incident: {
    label: "Bảo trì",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Rạp đang có sự cố cần xử lý.",
  },
};

const EmergencyCloseModal = ({
  cinemaId,
  cinemaName,
  selectedRooms,
  onClose,
  onDone,
}) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [closing, setClosing] = useState(false);

  // Stable string key — prevents useEffect from re-firing on every render due to new array reference
  const roomIdsKey = selectedRooms.map((r) => r._id).join(",");

  useEffect(() => {
    const roomIds = roomIdsKey.split(",").filter(Boolean);
    if (!cinemaId || roomIds.length === 0) {
      setPreview(null);
      setLoading(false);
      setFetchError("Chưa chọn phòng để đóng khẩn cấp");
      return;
    }

    setLoading(true);
    setFetchError(null);
    axiosInstance
      .post("/admin/emergency-close/rooms/preview", {
        cinemaId,
        roomIds,
      })
      .then((res) => setPreview(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "Lỗi kết nối";
        setFetchError(msg);
        toast.error(`Không tải được dữ liệu: ${msg}`);
      })
      .finally(() => setLoading(false));
  }, [cinemaId, roomIdsKey]);

  const handleClose = async () => {
    setClosing(true);
    const roomIds = roomIdsKey.split(",").filter(Boolean);
    try {
      const res = await axiosInstance.post("/admin/emergency-close/rooms", {
        cinemaId,
        roomIds,
      });
      toast.success(
        `Đã hủy ${res.data.cancelledShowtimes} suất · Hoàn tiền ${res.data.refundedBookings} đơn`,
      );
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-red-200 overflow-hidden" style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base">
              Đóng phòng khẩn cấp
            </h3>
            <p className="text-red-200 text-xs font-medium truncate">
              {cinemaName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
            </div>
          ) : fetchError ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-bold text-sm mb-1">
                Không thể tải dữ liệu
              </p>
              <p className="text-red-500 text-xs font-mono">{fetchError}</p>
              <button
                onClick={() => {
                  const retryRoomIds = roomIdsKey.split(",").filter(Boolean);
                  setLoading(true);
                  setFetchError(null);
                  axiosInstance
                    .post("/admin/emergency-close/rooms/preview", {
                      cinemaId,
                      roomIds: retryRoomIds,
                    })
                    .then((r) => setPreview(r.data))
                    .catch((e) =>
                      setFetchError(e.response?.data?.message || e.message),
                    )
                    .finally(() => setLoading(false));
                }}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Phòng được chọn
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRooms.map((room) => (
                    <span
                      key={room._id}
                      className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700"
                    >
                      {room.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Impact summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Suất chiếu bị hủy",
                    value: preview.totalShowtimes,
                    icon: Calendar,
                    color: "text-red-600 bg-red-50 border-red-100",
                  },
                  {
                    label: "Đơn bị hủy",
                    value: preview.totalBookings,
                    icon: Ticket,
                    color: "text-amber-600 bg-amber-50 border-amber-100",
                  },
                  {
                    label: "Đơn hoàn tiền",
                    value: preview.totalRefunds,
                    icon: Ticket,
                    color: "text-emerald-600 bg-emerald-50 border-emerald-100",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-xl p-3 border text-center ${item.color}`}
                  >
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="text-[10px] font-bold mt-0.5 leading-tight">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Showtime list */}
              {preview.showtimes.length > 0 ? (
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                  {preview.showtimes.map((st) => (
                    <div
                      key={st._id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">
                          {st.movieTitle}
                        </p>
                        <p className="text-xs text-slate-400">
                          {st.roomName} ·{" "}
                          {new Date(st.date).toLocaleDateString("vi-VN")}{" "}
                          {st.startTime}
                        </p>
                      </div>
                      {st.totalBookings > 0 && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                          {st.totalBookings} đơn
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400 text-sm italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Không có suất chiếu nào sắp tới cần hủy.
                </div>
              )}

              {/* Warning + confirm checkbox */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle
                  size={18}
                  className="text-amber-500 shrink-0 mt-0.5"
                />
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  Thao tác này <strong>không thể hoàn tác</strong>. Tất cả suất
                  chiếu sắp tới trong các phòng đã chọn sẽ bị hủy và các đơn đã
                  thanh toán sẽ được hoàn tiền tự động.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Tôi hiểu và xác nhận đóng khẩn cấp các phòng đã chọn
                </span>
              </label>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleClose}
            disabled={
              !confirmed ||
              closing ||
              loading ||
              !!fetchError ||
              preview?.totalShowtimes === 0
            }
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200"
          >
            {closing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />{" "}
                Đang xử lý...
              </>
            ) : (
              <>
                <Zap size={16} /> Xác nhận đóng phòng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReopenModal = ({
  cinemaId,
  cinemaName,
  selectedRooms,
  onClose,
  onDone,
}) => {
  const [reopening, setReopening] = useState(false);
  const roomIds = selectedRooms.map((r) => r._id);

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await axiosInstance.post("/admin/rooms/reopen", {
        cinemaId,
        roomIds,
      });
      const msg = res.data.cinemaRestored
        ? `Đã mở ${res.data.reopenedCount} phòng · Rạp đã khôi phục hoạt động`
        : `Đã mở ${res.data.reopenedCount} phòng`;
      toast.success(msg);
      onDone(res.data.cinemaRestored);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 overflow-hidden" style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <RotateCcw size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base">Mở phòng chiếu</h3>
            <p className="text-emerald-200 text-xs font-medium truncate">
              {cinemaName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Phòng sẽ được mở
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedRooms.map((room) => (
                <span
                  key={room._id}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700"
                >
                  {room.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <RotateCcw size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
              Các phòng đã chọn sẽ được chuyển về trạng thái{" "}
              <strong>hoạt động</strong>. Nếu tất cả phòng của rạp đều hoạt
              động, rạp cũng sẽ được khôi phục tự động.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleReopen}
            disabled={reopening}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-200"
          >
            {reopening ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />{" "}
                Đang mở...
              </>
            ) : (
              <>
                <RotateCcw size={16} /> Xác nhận mở phòng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const CinemaStatusConfirmDialog = ({
  status,
  cinemaName,
  onConfirm,
  onCancel,
}) => {
  const isIncident = status === "incident";
  const theme = isIncident
    ? {
      header: "bg-amber-500",
      icon: AlertTriangle,
      iconBg: "bg-white/20",
      border: "border-amber-200",
      btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-200",
      dot: "bg-amber-400",
    }
    : {
      header: "bg-emerald-600",
      icon: CheckCircle,
      iconBg: "bg-white/20",
      border: "border-emerald-200",
      btn: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      dot: "bg-emerald-500",
    };
  const Icon = theme.icon;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border ${theme.border} overflow-hidden`}
        style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className={`${theme.header} px-6 py-4 flex items-center gap-3`}>
          <div
            className={`w-9 h-9 ${theme.iconBg} rounded-xl flex items-center justify-center shrink-0`}
          >
            <Icon size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-sm">
              {isIncident
                ? "Chuyển rạp sang bảo trì?"
                : "Mở lại rạp hoạt động?"}
            </h3>
            <p className="text-white/70 text-xs truncate">{cinemaName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {isIncident ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle
                size={17}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-bold">Thao tác này sẽ:</p>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  <li>
                    Chuyển <strong>tất cả phòng</strong> sang Bảo trì
                  </li>
                  <li>
                    Huỷ <strong>toàn bộ suất chiếu</strong> sắp tới
                  </li>
                  <li>Hoàn tiền tự động các đơn đã thanh toán</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
              <CheckCircle
                size={17}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <div className="text-sm text-emerald-800 space-y-1">
                <p className="font-bold">Thao tác này sẽ:</p>
                <ul className="list-disc list-inside space-y-0.5 font-medium">
                  <li>
                    Chuyển <strong>tất cả phòng</strong> về Hoạt động
                  </li>
                  <li>Rạp trở lại trạng thái bình thường</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 ${theme.btn} text-white rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 shadow-md flex items-center gap-1.5`}
          >
            <Icon size={14} />
            {isIncident ? "Xác nhận bảo trì" : "Xác nhận mở rạp"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Rooms Manager tab
export const RoomsManager = ({ cinemas }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState("");
  const [cinemaStatus, setCinemaStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showReopen, setShowReopen] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [statusConfirm, setStatusConfirm] = useState(null); // pending status string

  const selectedCinemaData =
    cinemas.find((cinema) => cinema._id === selectedCinema) || null;
  const visibleSelectedRooms = rooms.filter((room) =>
    selectedRoomIds.includes(room._id),
  );
  const selectedActiveRooms = visibleSelectedRooms.filter(
    (r) => r.status === "active",
  );
  const selectedMaintenanceRooms = visibleSelectedRooms.filter(
    (r) => r.status !== "active",
  );

  const getRoomCinemaId = (room) =>
    room?.cinema?._id || (typeof room?.cinema === "string" ? room.cinema : "") || "";
  const activeCinemaId = selectedCinema || getRoomCinemaId(selectedActiveRooms[0]);
  const activeCinemaName =
    selectedCinemaData?.name ||
    cinemas.find((c) => c._id === activeCinemaId)?.name ||
    "Rạp";
  const maintenanceCinemaId = selectedCinema || getRoomCinemaId(selectedMaintenanceRooms[0]);
  const maintenanceCinemaName =
    selectedCinemaData?.name ||
    cinemas.find((c) => c._id === maintenanceCinemaId)?.name ||
    "Rạp";

  const loadRooms = async (cinemaId) => {
    setLoading(true);
    try {
      const url = cinemaId
        ? `/admin/cinemas/${cinemaId}/rooms`
        : `/admin/rooms`;
      const res = await axiosInstance.get(url);
      setRooms(res.data);
      setSelectedRoomIds((prev) =>
        prev.filter((id) => res.data.some((room) => room._id === id)),
      );
      if (cinemaId && res.data.length > 0) {
        setCinemaStatus(
          res.data.some((r) => r.status === "active") ? "active" : "incident",
        );
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(selectedCinema);
  }, [selectedCinema]);

  useEffect(() => {
    setCinemaStatus(selectedCinemaData?.status || "");
    setSelectedRoomIds([]);
  }, [selectedCinemaData?._id, selectedCinemaData?.status]);

  useEffect(() => {
    setCinemaStatus(selectedCinemaData?.status || "");
    setSelectedRoomIds([]);
  }, [selectedCinemaData?._id, selectedCinemaData?.status]);

  const handleOpenEdit = (room) => {
    setEditRoom(room);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditRoom(null);
    setShowModal(true);
  };

  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const toggleSelectAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
      return;
    }
    setSelectedRoomIds(rooms.map((room) => room._id));
  };

  const handleCinemaStatusChange = (status) => {
    if (!selectedCinema || status === cinemaStatus) return;
    setStatusConfirm(status);
  };

  const executeStatusChange = async () => {
    const status = statusConfirm;
    setStatusConfirm(null);
    try {
      const res = await axiosInstance.patch(
        `/admin/cinemas/${selectedCinema}/status`,
        { status },
      );
      setCinemaStatus(status);
      let msg = "Đã cập nhật trạng thái rạp";
      if (status === "active") {
        msg = "Đã mở lại rạp · Tất cả phòng đã hoạt động";
      } else if (status === "incident") {
        const cancelled = res.data.cancelledShowtimes;
        msg =
          cancelled > 0
            ? `Rạp chuyển bảo trì · Đã huỷ ${cancelled} suất chiếu`
            : "Rạp chuyển bảo trì · Không có suất chiếu nào bị ảnh hưởng";
      }
      toast.success(msg);
      loadRooms(selectedCinema);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái rạp",
      );
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Quản Lý Phòng Chiếu
          </h2>
          <p className="text-sm text-slate-500">
            Cấu hình ma trận ghế và loại ghế cho từng phòng
          </p>
        </div>
        <div className="flex gap-2">
          {selectedMaintenanceRooms.length > 0 && (
            <button
              onClick={() => setShowReopen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-emerald-200 shrink-0 text-sm"
            >
              <RotateCcw size={16} /> Mở {selectedMaintenanceRooms.length} phòng
            </button>
          )}
          {selectedActiveRooms.length > 0 && (
            <button
              onClick={() => setShowEmergency(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-amber-200 shrink-0 text-sm"
            >
              <Zap size={16} /> Đóng {selectedActiveRooms.length} phòng
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-red-200 shrink-0"
          >
            <Plus size={20} /> Thêm phòng
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
          Lọc theo rạp
        </label>
        <select
          value={selectedCinema}
          onChange={(e) => setSelectedCinema(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 min-w-[240px]"
        >
          <option value="">Tất cả rạp</option>
          {cinemas.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCinemaData && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4" style={{ animation: "panelIn 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Trạng thái rạp
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedCinemaData.name}
                </h3>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).badge}`}
                >
                  {
                    (
                      CINEMA_STATUS_META[cinemaStatus] ||
                      CINEMA_STATUS_META.active
                    ).label
                  }
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {
                  (
                    CINEMA_STATUS_META[cinemaStatus] ||
                    CINEMA_STATUS_META.active
                  ).description
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CINEMA_STATUS_META).map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => handleCinemaStatusChange(value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95 ${cinemaStatus === value
                    ? meta.badge
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">
            {selectedCinema ? "Rạp này chưa có phòng nào" : "Chưa có phòng chiếu nào trong hệ thống"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6 w-14">
                    <input
                      type="checkbox"
                      checked={
                        rooms.length > 0 &&
                        selectedRoomIds.length === rooms.length
                      }
                      onChange={toggleSelectAllRooms}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 pl-6">Tên phòng</th>
                  <th className="p-4">Rạp</th>
                  <th className="p-4">Kích thước</th>
                  <th className="p-4">Tổng ghế</th>
                  <th className="p-4">Loại phòng</th>
                  <th className="p-4">Ma trận ghế</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody key={selectedCinema} className="divide-y divide-slate-100">
                {rooms.map((room, idx) => {
                  const hasMatrix =
                    room.seatMatrix && room.seatMatrix.length > 0;
                  const typeCount = hasMatrix
                    ? { normal: 0, vip: 0, couple: 0 }
                    : null;
                  if (typeCount) {
                    for (const row of room.seatMatrix) {
                      for (const cell of row) {
                        if (cell?.type && typeCount[cell.type] !== undefined)
                          typeCount[cell.type]++;
                      }
                    }
                  }
                  return (
                    <tr
                      key={room._id}
                      className="hover:bg-slate-50/80 transition-all duration-150 cursor-pointer"
                      style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}
                      onClick={() => setDetailRoom(room)}
                    >
                      <td
                        className="p-4 pl-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room._id)}
                          onChange={() => toggleRoomSelection(room._id)}
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 pl-6 font-bold text-slate-800">
                        {room.name}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {room.cinema?.name
                          || cinemas.find((c) => c._id === (room.cinema?._id || room.cinema))?.name
                          || "—"}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {room.rows} hàng × {room.cols} cột
                      </td>
                      <td className="p-4 font-bold text-slate-700">
                        {room.totalSeats} ghế
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}
                        >
                          {room.roomType}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {hasMatrix ? (
                          <div className="space-y-0.5">
                            <p>
                              <span className="text-slate-400">T:</span>{" "}
                              {typeCount.normal} ·{" "}
                              <span className="text-amber-500">V:</span>{" "}
                              {typeCount.vip} ·{" "}
                              <span className="text-pink-400">Đ:</span>{" "}
                              {typeCount.couple}
                            </p>
                          </div>
                        ) : (
                          <span className="text-orange-400 font-medium">
                            Chưa cấu hình
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                          ></span>
                          {room.status === "active" ? "Hoạt động" : "Bảo trì"}
                        </span>
                      </td>
                      <td
                        className="p-4 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setDetailRoom(room)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150 active:scale-90"
                            title="Xem chi tiết phòng"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(room)}
                            className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all duration-150 active:scale-90"
                            title="Cấu hình ghế"
                          >
                            <Settings size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailRoom && createPortal(
        <RoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onEdit={() => {
            handleOpenEdit(detailRoom);
            setDetailRoom(null);
          }}
        />,
        document.body
      )}

      {showModal && createPortal(
        <RoomModal
          room={editRoom}
          cinemas={cinemas}
          onClose={() => setShowModal(false)}
          onSaved={() => loadRooms(selectedCinema)}
        />,
        document.body
      )}

      {showEmergency && createPortal(
        <EmergencyCloseModal
          cinemaId={activeCinemaId}
          cinemaName={activeCinemaName}
          selectedRooms={selectedActiveRooms}
          onClose={() => setShowEmergency(false)}
          onDone={() => {
            if (selectedCinema) setCinemaStatus("incident");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />,
        document.body
      )}

      {showReopen && createPortal(
        <ReopenModal
          cinemaId={maintenanceCinemaId}
          cinemaName={maintenanceCinemaName}
          selectedRooms={selectedMaintenanceRooms}
          onClose={() => setShowReopen(false)}
          onDone={(cinemaRestored) => {
            if (cinemaRestored && selectedCinema) setCinemaStatus("active");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />,
        document.body
      )}

      {statusConfirm && createPortal(
        <CinemaStatusConfirmDialog
          status={statusConfirm}
          cinemaName={selectedCinemaData?.name || "Rạp"}
          onConfirm={executeStatusChange}
          onCancel={() => setStatusConfirm(null)}
        />,
        document.body
      )}
    </div>
  );
};
