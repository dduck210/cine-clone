import React, { useState, useEffect } from "react";
import { Plus, X, Save, Grid, Eye, Settings, AlertTriangle, Zap, Calendar, Ticket, RotateCcw } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";

const ROOM_TYPE_STYLE = {
  Standard: "bg-blue-50 text-blue-700 border border-blue-200",
  Premium:  "bg-purple-50 text-purple-700 border border-purple-200",
  VIP:      "bg-amber-50 text-amber-700 border border-amber-200",
};

const SEAT_TYPES = [
  { value: "normal", label: "Thường", color: "bg-slate-200 text-slate-700 border-slate-300", editColor: "bg-slate-100 hover:bg-slate-200" },
  { value: "vip", label: "VIP", color: "bg-amber-200 text-amber-800 border-amber-300", editColor: "bg-amber-50 hover:bg-amber-100" },
  { value: "couple", label: "Đôi", color: "bg-pink-200 text-pink-800 border-pink-300", editColor: "bg-pink-50 hover:bg-pink-100" },
  { value: "aisle", label: "Lối", color: "bg-transparent text-transparent border-transparent", editColor: "" },
];

const typeColor = (type) => SEAT_TYPES.find((t) => t.value === type)?.color || "bg-slate-200";

// Generate default matrix matching seed logic:
// rooms with 6+ rows: last row = couple, second-to-last = VIP, rest = normal
function generateDefaultMatrix(rows, cols) {
  const matrix = [];
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    const isCouple = rows >= 6 && r === rows - 1;
    const isVip    = rows >= 6 && r === rows - 2;
    const seatType = isCouple ? "couple" : isVip ? "vip" : "normal";
    const rowArr = [];
    for (let c = 1; c <= cols; c++) {
      rowArr.push({ label: `${rowLetter}${c}`, type: seatType });
    }
    matrix.push(rowArr);
  }
  return matrix;
}

// Matrix editor: click a cell to cycle through types
const MatrixEditor = ({ matrix, onChange }) => {
  const cycleType = (ri, ci) => {
    const order = ["normal", "vip", "couple", "aisle"];
    const current = matrix[ri][ci]?.type || "normal";
    const next = order[(order.indexOf(current) + 1) % order.length];
    const updated = matrix.map((row, r) =>
      row.map((cell, c) => (r === ri && c === ci ? { ...cell, type: next } : cell))
    );
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
            <span className="w-5 text-xs text-slate-400 font-bold text-center">{row[0]?.label?.[0] || ""}</span>
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
            <div key={t.value} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className={`w-5 h-5 rounded border ${t.color}`} />
              {t.label}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-2">Click vào ghế để đổi loại</span>
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
          <span className="w-5 text-xs text-slate-400 font-bold text-center shrink-0">{row[0]?.label?.[0] || ""}</span>
          {row.map((cell, ci) => (
            <div key={ci} title={cell.label}
              className={`w-8 h-8 rounded text-[9px] font-bold border flex items-center justify-center select-none ${typeColor(cell.type)}`}>
              {cell.type === "aisle" ? "" : cell.label.replace(/^[A-Z]/, "")}
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
        {SEAT_TYPES.filter((t) => t.value !== "aisle").map((t) => (
          <div key={t.value} className="flex items-center gap-1.5 text-xs text-slate-600">
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
  const matrix = hasMatrix ? room.seatMatrix : generateDefaultMatrix(room.rows || 8, room.cols || 10);
  const typeCount = { normal: 0, vip: 0, couple: 0 };
  for (const r of matrix)
    for (const cell of r)
      if (cell?.type && typeCount[cell.type] !== undefined) typeCount[cell.type]++;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{room.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Chi tiết phòng chiếu</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-200">
              <Settings size={14} /> Cấu hình ghế
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Loại phòng", isRoomType: true },
              { label: "Kích thước", value: `${room.rows} hàng × ${room.cols} cột` },
              { label: "Tổng ghế", value: `${room.totalSeats} ghế` },
              { label: "Trạng thái", value: room.status === "active" ? "Hoạt động" : "Bảo trì", isStatus: true },
            ].map((item) => (
              <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                {item.isRoomType ? (
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                    {room.roomType}
                  </span>
                ) : item.isStatus ? (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ghế Thường</p>
                <p className="text-2xl font-black text-slate-700">{typeCount.normal}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">Ghế VIP</p>
                <p className="text-2xl font-black text-amber-600">{typeCount.vip}</p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 mb-1">Ghế Đôi</p>
                <p className="text-2xl font-black text-pink-600">{typeCount.couple}</p>
              </div>
            </div>
          )}

          {/* Seat map */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sơ đồ ghế</p>
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
  const [cinemaId, setCinemaId] = useState(room?.cinema?._id || room?.cinema || "");
  const [name, setName] = useState(room?.name || "");
  const [rows, setRows] = useState(room?.rows || 8);
  const [cols, setCols] = useState(room?.cols || 10);
  const [roomType, setRoomType] = useState(room?.roomType || "Standard");
  const [matrix, setMatrix] = useState(room?.seatMatrix?.length > 0 ? room.seatMatrix : null);
  const [saving, setSaving] = useState(false);
  const [showMatrix, setShowMatrix] = useState(!!room);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!cinemaId) e.cinemaId = "Vui lòng chọn rạp";
    if (!name.trim()) e.name = "Tên phòng không được để trống";
    if (rows < 1 || rows > 26) e.rows = "Số hàng phải từ 1–26";
    if (cols < 1 || cols > 30) e.cols = "Số cột phải từ 1–30";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerateMatrix = () => {
    const e = {};
    if (rows < 1 || rows > 26) e.rows = "Số hàng phải từ 1–26";
    if (cols < 1 || cols > 30) e.cols = "Số cột phải từ 1–30";
    if (Object.keys(e).length > 0) { setErrors((p) => ({ ...p, ...e })); return; }
    setMatrix(generateDefaultMatrix(rows, cols));
    setShowMatrix(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = { cinema: cinemaId, name, rows: Number(rows), cols: Number(cols), roomType, totalSeats: rows * cols };
    if (matrix) payload.seatMatrix = matrix;

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
      toast.error(err.response?.data?.message || "Lỗi khi lưu phòng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800">{room ? "Chỉnh sửa phòng" : "Tạo phòng mới"}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cấu hình ma trận ghế cho phòng chiếu</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Rạp <span className="text-red-500">*</span></label>
              <select value={cinemaId}
                onChange={(e) => { setCinemaId(e.target.value); setErrors((p) => ({ ...p, cinemaId: "" })); }}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.cinemaId ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`}>
                <option value="">-- Chọn rạp --</option>
                {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.cinemaId && <p className="text-red-500 text-xs mt-1 ml-1">{errors.cinemaId}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tên phòng <span className="text-red-500">*</span></label>
              <input value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                placeholder="VD: Phòng 1"
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`} />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Số hàng <span className="text-slate-400 font-normal">(1–26)</span></label>
              <input type="number" value={rows}
                onChange={(e) => { setRows(Math.min(26, Math.max(1, Number(e.target.value) || 1))); setErrors((p) => ({ ...p, rows: "" })); }}
                min={1} max={26}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.rows ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`} />
              {errors.rows && <p className="text-red-500 text-xs mt-1 ml-1">{errors.rows}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Số cột <span className="text-slate-400 font-normal">(1–30)</span></label>
              <input type="number" value={cols}
                onChange={(e) => { setCols(Math.min(30, Math.max(1, Number(e.target.value) || 1))); setErrors((p) => ({ ...p, cols: "" })); }}
                min={1} max={30}
                className={`w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 ${errors.cols ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-[#dc2626]"}`} />
              {errors.cols && <p className="text-red-500 text-xs mt-1 ml-1">{errors.cols}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Loại phòng</label>
              <select value={roomType} onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700">
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ma trận ghế</label>
              <button onClick={handleGenerateMatrix} type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all">
                <Grid size={14} /> {matrix ? "Tạo lại ma trận" : "Tạo ma trận mặc định"}
              </button>
            </div>
            {!showMatrix || !matrix ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
                Nhấn "Tạo ma trận mặc định" để cấu hình loại ghế
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <MatrixEditor matrix={matrix} onChange={setMatrix} />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all text-sm">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all text-sm flex items-center gap-2 ${saving ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 shadow-red-200"}`}>
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
    label: "Sự cố",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Rạp đang có sự cố cần xử lý.",
  },
  inactive: {
    label: "Tạm ngưng",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    description: "Rạp đang tạm ngưng khai thác.",
  },
};

const EmergencyCloseModal = ({ cinemaId, cinemaName, selectedRooms, onClose, onDone }) => {
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
    axiosInstance.post("/admin/emergency-close/rooms/preview", {
      cinemaId,
      roomIds,
    })
      .then((res) => setPreview(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || 'Lỗi kết nối';
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
      toast.success(`Đã hủy ${res.data.cancelledShowtimes} suất · Hoàn tiền ${res.data.refundedBookings} đơn`);
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
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Zap size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base">Đóng phòng khẩn cấp</h3>
            <p className="text-red-200 text-xs font-medium truncate">{cinemaName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all">
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
              <p className="text-red-700 font-bold text-sm mb-1">Không thể tải dữ liệu</p>
              <p className="text-red-500 text-xs font-mono">{fetchError}</p>
              <button
                onClick={() => {
                  const retryRoomIds = roomIdsKey.split(",").filter(Boolean);
                  setLoading(true);
                  setFetchError(null);
                  axiosInstance.post("/admin/emergency-close/rooms/preview", {
                    cinemaId,
                    roomIds: retryRoomIds,
                  }).then((r) => setPreview(r.data)).catch((e) => setFetchError(e.response?.data?.message || e.message)).finally(() => setLoading(false));
                }}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Phòng được chọn</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRooms.map((room) => (
                    <span key={room._id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                      {room.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Impact summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Suất chiếu bị hủy", value: preview.totalShowtimes, icon: Calendar, color: "text-red-600 bg-red-50 border-red-100" },
                  { label: "Đơn bị hủy", value: preview.totalBookings, icon: Ticket, color: "text-amber-600 bg-amber-50 border-amber-100" },
                  { label: "Đơn hoàn tiền", value: preview.totalRefunds, icon: Ticket, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-3 border text-center ${item.color}`}>
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="text-[10px] font-bold mt-0.5 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Showtime list */}
              {preview.showtimes.length > 0 ? (
                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50">
                  {preview.showtimes.map((st) => (
                    <div key={st._id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800 line-clamp-1">{st.movieTitle}</p>
                        <p className="text-xs text-slate-400">{st.roomName} · {new Date(st.date).toLocaleDateString("vi-VN")} {st.startTime}</p>
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
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium leading-relaxed">
                  Thao tác này <strong>không thể hoàn tác</strong>. Tất cả suất chiếu sắp tới trong các phòng đã chọn sẽ bị hủy và các đơn đã thanh toán sẽ được hoàn tiền tự động.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer" />
                <span className="text-sm font-semibold text-slate-700">Tôi hiểu và xác nhận đóng khẩn cấp các phòng đã chọn</span>
              </label>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all">
            Hủy bỏ
          </button>
          <button
            onClick={handleClose}
            disabled={!confirmed || closing || loading || !!fetchError || preview?.totalShowtimes === 0}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200"
          >
            {closing ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Đang xử lý...</> : <><Zap size={16} /> Xác nhận đóng phòng</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReopenModal = ({ cinemaId, cinemaName, selectedRooms, onClose, onDone }) => {
  const [reopening, setReopening] = useState(false);
  const roomIds = selectedRooms.map((r) => r._id);

  const handleReopen = async () => {
    setReopening(true);
    try {
      const res = await axiosInstance.post("/admin/rooms/reopen", { cinemaId, roomIds });
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
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 overflow-hidden">
        <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <RotateCcw size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-white text-base">Mở phòng chiếu</h3>
            <p className="text-emerald-200 text-xs font-medium truncate">{cinemaName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Phòng sẽ được mở</p>
            <div className="flex flex-wrap gap-2">
              {selectedRooms.map((room) => (
                <span key={room._id} className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                  {room.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3">
            <RotateCcw size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 font-medium leading-relaxed">
              Các phòng đã chọn sẽ được chuyển về trạng thái <strong>hoạt động</strong>.
              Nếu tất cả phòng của rạp đều hoạt động, rạp cũng sẽ được khôi phục tự động.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold text-sm transition-all">
            Hủy bỏ
          </button>
          <button
            onClick={handleReopen}
            disabled={reopening}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
          >
            {reopening
              ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Đang mở...</>
              : <><RotateCcw size={16} /> Xác nhận mở phòng</>}
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

  const selectedCinemaData = cinemas.find((cinema) => cinema._id === selectedCinema) || null;
  const visibleSelectedRooms = rooms.filter((room) => selectedRoomIds.includes(room._id));
  const selectedActiveRooms = visibleSelectedRooms.filter((r) => r.status === "active");
  const selectedMaintenanceRooms = visibleSelectedRooms.filter((r) => r.status !== "active");

  const loadRooms = async (cinemaId) => {
    if (!cinemaId) { setRooms([]); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/cinemas/${cinemaId}/rooms`);
      setRooms(res.data);
      setSelectedRoomIds((prev) => prev.filter((id) => res.data.some((room) => room._id === id)));
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(selectedCinema); }, [selectedCinema]);

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
    setSelectedRoomIds((prev) => (
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    ));
  };

  const toggleSelectAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
      return;
    }
    setSelectedRoomIds(rooms.map((room) => room._id));
  };

  const handleCinemaStatusChange = async (status) => {
    if (!selectedCinema || status === cinemaStatus) return;

    try {
      await axiosInstance.patch(`/admin/cinemas/${selectedCinema}/status`, { status });
      setCinemaStatus(status);
      const msg = status === "active"
        ? "Đã mở lại rạp · Tất cả phòng đã hoạt động"
        : "Đã cập nhật trạng thái rạp";
      toast.success(msg);
      loadRooms(selectedCinema);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái rạp");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản Lý Phòng Chiếu</h2>
          <p className="text-sm text-slate-500">Cấu hình ma trận ghế và loại ghế cho từng phòng</p>
        </div>
        <div className="flex gap-2">
          {selectedCinema && selectedMaintenanceRooms.length > 0 && (
            <button onClick={() => setShowReopen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md shadow-emerald-200 shrink-0 text-sm">
              <RotateCcw size={16} /> Mở {selectedMaintenanceRooms.length} phòng
            </button>
          )}
          {selectedCinema && selectedActiveRooms.length > 0 && (
            <button onClick={() => setShowEmergency(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-md shadow-amber-200 shrink-0 text-sm">
              <Zap size={16} /> Đóng {selectedActiveRooms.length} phòng
            </button>
          )}
          <button onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0">
            <Plus size={20} /> Thêm phòng
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Chọn rạp để xem phòng</label>
        <select value={selectedCinema} onChange={(e) => setSelectedCinema(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 min-w-[240px]">
          <option value="">-- Chọn rạp --</option>
          {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {selectedCinemaData && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Trạng thái rạp</p>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">{selectedCinemaData.name}</h3>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).badge}`}>
                  {(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).label}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                {(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CINEMA_STATUS_META).map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => handleCinemaStatusChange(value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    cinemaStatus === value
                      ? meta.badge
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-700">Đóng khẩn cấp theo phòng</p>
              <p className="text-xs text-slate-500 mt-1">
                Chọn một hoặc nhiều phòng để preview các suất chiếu bị ảnh hưởng trước khi hủy.
              </p>
            </div>
            <div className="text-sm font-medium text-slate-600">
              {selectedRoomIds.length > 0 ? `Đã chọn ${selectedRoomIds.length} phòng` : "Chưa chọn phòng nào"}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {!selectedCinema ? (
          <div className="p-12 text-center text-slate-400 italic">Chọn rạp để xem danh sách phòng</div>
        ) : loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" /></div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">Rạp này chưa có phòng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6 w-14">
                    <input
                      type="checkbox"
                      checked={rooms.length > 0 && selectedRoomIds.length === rooms.length}
                      onChange={toggleSelectAllRooms}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 pl-6">Tên phòng</th>
                  <th className="p-4">Kích thước</th>
                  <th className="p-4">Tổng ghế</th>
                  <th className="p-4">Loại phòng</th>
                  <th className="p-4">Ma trận ghế</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((room) => {
                  const hasMatrix = room.seatMatrix && room.seatMatrix.length > 0;
                  const typeCount = hasMatrix ? { normal: 0, vip: 0, couple: 0 } : null;
                  if (typeCount) {
                    for (const row of room.seatMatrix) {
                      for (const cell of row) {
                        if (cell?.type && typeCount[cell.type] !== undefined) typeCount[cell.type]++;
                      }
                    }
                  }
                  return (
                    <tr key={room._id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setDetailRoom(room)}>
                      <td className="p-4 pl-6" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room._id)}
                          onChange={() => toggleRoomSelection(room._id)}
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 pl-6 font-bold text-slate-800">{room.name}</td>
                      <td className="p-4 text-sm text-slate-600">{room.rows} hàng × {room.cols} cột</td>
                      <td className="p-4 font-bold text-slate-700">{room.totalSeats} ghế</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {room.roomType}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        {hasMatrix ? (
                          <div className="space-y-0.5">
                            <p><span className="text-slate-400">T:</span> {typeCount.normal} · <span className="text-amber-500">V:</span> {typeCount.vip} · <span className="text-pink-400">Đ:</span> {typeCount.couple}</p>
                          </div>
                        ) : (
                          <span className="text-orange-400 font-medium">Chưa cấu hình</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                          {room.status === "active" ? "Hoạt động" : "Bảo trì"}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setDetailRoom(room)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Xem chi tiết phòng">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => handleOpenEdit(room)}
                            className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 rounded-lg transition-all"
                            title="Cấu hình ghế">
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

      {detailRoom && (
        <RoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onEdit={() => { handleOpenEdit(detailRoom); setDetailRoom(null); }}
        />
      )}

      {showModal && (
        <RoomModal
          room={editRoom}
          cinemas={cinemas}
          onClose={() => setShowModal(false)}
          onSaved={() => loadRooms(selectedCinema)}
        />
      )}

      {showEmergency && selectedCinema && (
        <EmergencyCloseModal
          cinemaId={selectedCinema}
          cinemaName={selectedCinemaData?.name || "Rạp"}
          selectedRooms={selectedActiveRooms}
          onClose={() => setShowEmergency(false)}
          onDone={() => {
            setCinemaStatus("incident");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />
      )}

      {showReopen && selectedCinema && (
        <ReopenModal
          cinemaId={selectedCinema}
          cinemaName={selectedCinemaData?.name || "Rạp"}
          selectedRooms={selectedMaintenanceRooms}
          onClose={() => setShowReopen(false)}
          onDone={(cinemaRestored) => {
            if (cinemaRestored) setCinemaStatus("active");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />
      )}
    </div>
  );
};
