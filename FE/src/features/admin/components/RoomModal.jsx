import React, { useState, useEffect } from "react";
import { X, Save, Grid, AlertTriangle } from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import toast from "react-hot-toast";
import { ROOM_TYPE_INFO } from "@/shared/constants";
import {
  countActualSeats,
  validateRoomSeatRules,
  generateMatrixFromTotalSeats,
} from "@/shared/utils";
import MatrixEditor from "@/features/admin/components/MatrixEditor";

const RoomModal = ({ room, cinemas, onClose, onSaved }) => {
  const [cinemaId, setCinemaId] = useState(room?.cinema?._id || room?.cinema || "");
  const [name, setName] = useState(room?.name || "");
  const [totalSeats, setTotalSeats] = useState(room?.totalSeats || 80);
  const [roomType, setRoomType] = useState(room?.roomType || "Standard");
  const [matrix, setMatrix] = useState(room?.seatMatrix?.length > 0 ? room.seatMatrix : null);
  const [rows, setRows] = useState(room?.rows || 0);
  const [cols, setCols] = useState(room?.cols || 0);
  const [saving, setSaving] = useState(false);
  const [showMatrix, setShowMatrix] = useState(!!(room?.seatMatrix?.length > 0));
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

  const runMatrixValidation = (m) => {
    if (!m || m.length === 0) { setMatrixErrors([]); return true; }
    const allErrors = [];
    const actual = countActualSeats(m);
    if (actual > totalSeats) {
      allErrors.push(`Số ghế thực tế (${actual}) vượt quá tổng số ghế cấu hình (${totalSeats}). Vui lòng giảm bớt ${actual - totalSeats} ghế.`);
    }
    const ruleCheck = validateRoomSeatRules(m, roomType);
    allErrors.push(...ruleCheck.errors);
    setMatrixErrors(allErrors);
    return allErrors.length === 0;
  };

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
    if (Object.keys(e).length > 0) { setErrors((p) => ({ ...p, ...e })); return; }
    const result = generateMatrixFromTotalSeats(totalSeats, roomType);
    setRows(result.rows);
    setCols(result.cols);
    setMatrix(result.matrix);
    setShowMatrix(true);
    runMatrixValidation(result.matrix);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!matrix) { toast.error("Vui lòng tạo ma trận ghế trước khi lưu"); return; }
    if (!runMatrixValidation(matrix)) { toast.error("Vui lòng sửa các lỗi ma trận ghế trước khi lưu"); return; }

    const actualTotal = countActualSeats(matrix);
    const payload = { cinema: cinemaId, name, rows: Number(rows), cols: Number(cols), roomType, totalSeats: actualTotal, seatMatrix: matrix };

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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{room ? "Chỉnh sửa phòng" : "Tạo phòng mới"}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Cấu hình ma trận ghế cho phòng chiếu</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-all duration-150 active:scale-90">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Rạp <span className="text-red-500">*</span>
              </label>
              <select
                value={cinemaId}
                onChange={(e) => { setCinemaId(e.target.value); setErrors((p) => ({ ...p, cinemaId: "" })); }}
                className={`w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 dark:text-white ${errors.cinemaId ? "border-red-400 focus:border-red-400" : "border-slate-200 dark:border-gray-600 focus:border-[#dc2626]"}`}
              >
                <option value="">-- Chọn rạp --</option>
                {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.cinemaId && <p className="text-red-500 text-xs mt-1 ml-1">{errors.cinemaId}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Tên phòng <span className="text-red-500">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                placeholder="VD: Phòng 1"
                className={`w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 dark:text-white ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 dark:border-gray-600 focus:border-[#dc2626]"}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Tổng số ghế <span className="text-slate-400 dark:text-gray-500 font-normal">(tối thiểu {ROOM_TYPE_INFO[roomType].minSeats})</span>
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
                className={`w-full bg-slate-50 dark:bg-gray-700 border rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 font-medium text-slate-700 dark:text-white ${errors.totalSeats ? "border-red-400 focus:border-red-400" : "border-slate-200 dark:border-gray-600 focus:border-[#dc2626]"}`}
              />
              {errors.totalSeats && <p className="text-red-500 text-xs mt-1 ml-1">{errors.totalSeats}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Loại phòng</label>
              <select
                value={roomType}
                onChange={(e) => { setRoomType(e.target.value); setShowMatrix(false); setMatrixErrors([]); setErrors((p) => ({ ...p, totalSeats: "" })); }}
                className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 dark:text-white"
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
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${info.accentBg} flex items-center justify-center text-lg shrink-0`}>{info.icon}</div>
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <h4 className={`text-sm font-extrabold ${info.accent} tracking-tight`}>{roomType}</h4>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${info.badge} shadow-sm`}>{info.seatTypes}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-4 pl-[52px]">{info.desc}</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  {[
                    { label: "Yêu cầu ghế", value: info.seatReq },
                    { label: "Màn chiếu", value: info.screen },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/80 dark:bg-gray-700/80 rounded-xl p-3 border border-white/60 dark:border-gray-600">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">{item.label}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-gray-200 leading-snug">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: "Âm thanh", value: info.sound },
                    { label: "Tiện ích thêm", value: info.amenities },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/80 dark:bg-gray-700/80 rounded-xl p-3 border border-white/60 dark:border-gray-600">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">{item.label}</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-gray-200 leading-snug">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className={`rounded-xl px-4 py-3 ${info.bg} border ${info.border} flex items-center gap-3`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 shrink-0">Kích thước tối thiểu</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-200">{info.minRows} hàng × {info.minCols} cột</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-200">Tổng ghế tối thiểu: {info.minSeats}</span>
                </div>
              </div>
            );
          })()}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Ma trận ghế</label>
              <button
                onClick={handleGenerateMatrix}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all duration-150 active:scale-95"
              >
                <Grid size={14} /> {matrix ? "Tạo lại ma trận" : "Tạo ma trận mặc định"}
              </button>
            </div>
            {!showMatrix || !matrix ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-gray-600 rounded-xl p-8 text-center text-slate-400 dark:text-gray-500 text-sm">
                Nhấn "Tạo ma trận mặc định" để cấu hình loại ghế
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-700">
                  <MatrixEditor matrix={matrix} onChange={updateMatrix} roomType={roomType} />
                </div>
                {matrixErrors.length > 0 && (
                  <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-1.5">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Lỗi ma trận ghế</p>
                    {matrixErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
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

        <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all duration-150 active:scale-95 text-sm">
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

export default RoomModal;
