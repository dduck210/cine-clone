import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Plus, X, Save, ChevronDown, Calendar, Clock, Layers, AlertTriangle,
} from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import toast from "react-hot-toast";
import { isVietnameseHoliday } from "@/shared/utils/vietnamese-holidays";
import { TIME_SLOT_MULTS, DAY_TYPE_MULTS, SEAT_MULTS } from "@/shared/constants";

const DAYS_VI = [
  { label: "T2", value: 1 }, { label: "T3", value: 2 }, { label: "T4", value: 3 },
  { label: "T5", value: 4 }, { label: "T6", value: 5 }, { label: "T7", value: 6 }, { label: "CN", value: 0 },
];

function getTimeSlotFE(startTime) {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  if (hour < 22) return "evening";
  return "night";
}

function getDayTypeFE(dateStr) {
  if (!dateStr) return null;
  if (isVietnameseHoliday(dateStr)) return "holiday";
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

function computePreview(basePrice, startTime, dayType, dateStr) {
  const bp = Number(basePrice);
  if (!bp || bp < 1000 || !startTime) return null;
  const timeSlot = getTimeSlotFE(startTime);
  const effectiveDayType = dayType || getDayTypeFE(dateStr) || "weekday";
  const tsm = TIME_SLOT_MULTS[timeSlot] || 1.0;
  const dtm = DAY_TYPE_MULTS[effectiveDayType] || 1.0;
  return {
    normal: Math.round(bp * SEAT_MULTS.normal * tsm * dtm),
    vip: Math.round(bp * SEAT_MULTS.vip * tsm * dtm),
    couple: Math.round(bp * SEAT_MULTS.couple * tsm * dtm),
    timeSlot,
    dayType: effectiveDayType,
  };
}

function generateDateRange(from, to, allowedDays) {
  const result = [];
  const end = new Date(to);
  for (let d = new Date(from); d <= end; d.setDate(d.getDate() + 1)) {
    if (allowedDays.includes(d.getDay())) {
      result.push(new Date(d).toISOString().split("T")[0]);
    }
  }
  return result;
}

const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
);

const selectClass = "w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] appearance-none font-medium text-slate-700 dark:text-white cursor-pointer transition-colors disabled:opacity-50";
const inputClass = "w-full !bg-slate-50 dark:!bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 dark:text-white transition-all disabled:opacity-50";

export const ShowtimeModal = ({ movies, cinemas, onClose, onSaved }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { movieId: "", cinemaId: "", roomId: "", date: "", startTime: "", basePrice: "", dayType: "weekday", bookingLockMinutes: 5 },
  });

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createErrors, setCreateErrors] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6, 0]);
  const [bulkErrors, setBulkErrors] = useState({});
  const selectedMovie = watch("movieId");
  const selectedCinema = watch("cinemaId");
  const selectedRoom = watch("roomId");
  const watchedBasePrice = watch("basePrice");
  const watchedStartTime = watch("startTime");
  const watchedDayType = watch("dayType");
  const watchedDate = watch("date");

  useEffect(() => {
    if (!selectedCinema) { setRooms([]); return; }
    const ctrl = new AbortController();
    setLoadingRooms(true);
    axiosInstance.get(`/admin/cinemas/${selectedCinema}/rooms`, { signal: ctrl.signal })
      .then((res) => setRooms(res.data))
      .catch((err) => { if (err.name !== 'CanceledError') setRooms([]); })
      .finally(() => setLoadingRooms(false));
    return () => ctrl.abort();
  }, [selectedCinema]);

  // Auto-detect dayType from date: holiday > weekend > weekday
  useEffect(() => {
    if (!watchedDate || bulkMode) return;
    setValue("dayType", getDayTypeFE(watchedDate));
  }, [watchedDate, bulkMode]);

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      if (bulkErrors.days) setBulkErrors((p) => ({ ...p, days: "" }));
      return next;
    });
  };

  const formatConflictMsg = (e) => {
    const dateStr = e.date ? new Date(e.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';
    const prefix = dateStr ? `[${dateStr}] ` : '';
    if (e.conflicts?.length > 0) {
      const list = e.conflicts.map(c => {
        const m = c.conflictMovie ? `"${c.conflictMovie}" ` : '';
        return `${m}(${c.conflictStart} → ${c.conflictEnd})`;
      }).join(', ');
      return `${prefix}Suất ${e.startTime} bị trùng với: ${list} — phòng chưa trống.`;
    }
    return `${prefix}Suất ${e.startTime}: ${e.error}`;
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setCreateErrors([]);
    try {
      let payload;
      if (bulkMode) {
        const be = {};
        if (!dateFrom) be.dateFrom = "Chọn ngày bắt đầu";
        if (!dateTo) be.dateTo = "Chọn ngày kết thúc";
        if (dateFrom && dateTo && dateFrom > dateTo) be.dateTo = "Ngày kết thúc phải sau ngày bắt đầu";
        if (selectedDays.length === 0) be.days = "Chọn ít nhất 1 ngày trong tuần";
        if (Object.keys(be).length > 0) { setBulkErrors(be); setSaving(false); return; }
        const dates = generateDateRange(dateFrom, dateTo, selectedDays);
        if (dates.length === 0) { setBulkErrors({ dateFrom: "Không có ngày nào phù hợp trong khoảng đã chọn" }); setSaving(false); return; }
        if (dates.length > 60) { setBulkErrors({ dateTo: `Khoảng này tạo ra ${dates.length} suất (tối đa 60)` }); setSaving(false); return; }
        payload = dates.map((date) => ({
          movieId: data.movieId, cinemaId: data.cinemaId, roomId: data.roomId,
          date, startTime: data.startTime, basePrice: Number(data.basePrice),
          dayType: data.dayType || undefined,
          bookingLockMinutes: Number(data.bookingLockMinutes) || 5,
        }));
      } else {
        payload = {
          movieId: data.movieId, cinemaId: data.cinemaId, roomId: data.roomId,
          date: data.date, startTime: data.startTime, basePrice: Number(data.basePrice),
          dayType: data.dayType || undefined,
          bookingLockMinutes: Number(data.bookingLockMinutes) || 5,
        };
      }
      const res = await axiosInstance.post("/showtimes", payload);
      const created = res.data?.created?.length ?? (Array.isArray(payload) ? payload.length : 1);
      const partialErrors = res.data?.errors || [];
      if (partialErrors.length > 0) {
        toast.success(`Đã tạo được ${created} suất chiếu.`);
        setCreateErrors(partialErrors);
        onSaved();
      } else {
        toast.success(`Đã tạo ${created} suất chiếu thành công!`);
        onSaved();
        onClose();
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        setCreateErrors(data.errors);
      } else {
        toast.error(data?.message || "Thêm suất chiếu thất bại");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Thêm Suất Chiếu Mới</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Tạo lịch chiếu và tự động sinh ghế</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${bulkMode ? "bg-red-50 text-[#dc2626] border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"}`}
              title="Tạo suất chiếu cho nhiều ngày cùng lúc"
            >
              <Layers size={13} /> {bulkMode ? "Nhiều ngày" : "1 ngày"}
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-300 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Chọn phim */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Phim <span className="text-red-500">*</span></label>
            <div className="relative">
              <select {...register("movieId", { required: "Vui lòng chọn phim" })} className={selectClass}>
                <option value="">-- Chọn phim --</option>
                {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
            {errors.movieId && <ErrorMsg msg={errors.movieId.message} />}
          </div>

          {/* Chọn rạp */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Rạp chiếu <span className="text-red-500">*</span></label>
            <div className="relative">
              <select {...register("cinemaId", { required: "Vui lòng chọn rạp" })} className={`${selectClass} ${!selectedMovie ? "opacity-50 cursor-not-allowed" : ""}`} disabled={!selectedMovie}>
                <option value="">{!selectedMovie ? "Chọn phim trước" : "-- Chọn rạp --"}</option>
                {cinemas.map((c) => {
                  const isMaintenance = c.status === 'incident' || c.status === 'inactive';
                  return (
                    <option key={c._id} value={c._id} disabled={isMaintenance}>
                      {c.name}{isMaintenance ? ' (Đang bảo trì)' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
            {errors.cinemaId && <ErrorMsg msg={errors.cinemaId.message} />}
          </div>

          {/* Chọn phòng */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Phòng chiếu <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                {...register("roomId", { required: "Vui lòng chọn phòng" })}
                className={`${selectClass} ${loadingRooms ? "opacity-50" : ""}`}
                disabled={!selectedCinema || loadingRooms}
              >
                <option value="">{loadingRooms ? "Đang tải..." : selectedCinema ? "-- Chọn phòng --" : "Chọn rạp trước"}</option>
                {rooms.map((r) => {
                  const isMaintenance = r.status === 'maintenance';
                  return (
                    <option key={r._id} value={r._id} disabled={isMaintenance}>
                      {r.name} ({r.totalSeats} ghế){isMaintenance ? ' — Đang bảo trì' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
            </div>
            {errors.roomId && <ErrorMsg msg={errors.roomId.message} />}
          </div>

          {bulkMode ? (
            <div className={`space-y-4 ${!selectedRoom ? "pointer-events-none" : ""}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Từ ngày <span className="text-red-500">*</span></label>
                  <input type="date" value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setBulkErrors((p) => ({ ...p, dateFrom: "" })); }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${inputClass} ${bulkErrors.dateFrom ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}`} />
                  {bulkErrors.dateFrom && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.dateFrom}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Đến ngày <span className="text-red-500">*</span></label>
                  <input type="date" value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setBulkErrors((p) => ({ ...p, dateTo: "" })); }}
                    min={dateFrom || new Date().toISOString().split("T")[0]}
                    className={`${inputClass} ${bulkErrors.dateTo ? "border-red-400 bg-red-50 dark:bg-red-900/20" : ""}`} />
                  {bulkErrors.dateTo && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.dateTo}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Áp dụng cho các ngày <span className="text-red-500">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_VI.map((d) => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${selectedDays.includes(d.value) ? "bg-[#dc2626] text-white border-red-600 shadow-sm" : "bg-slate-50 dark:bg-gray-700 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                {bulkErrors.days && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.days}</p>}
                {dateFrom && dateTo && selectedDays.length > 0 && !bulkErrors.dateFrom && !bulkErrors.dateTo && (
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">
                    → Sẽ tạo <span className="font-bold text-[#dc2626]">{generateDateRange(dateFrom, dateTo, selectedDays).length}</span> suất chiếu
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Giờ bắt đầu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input type="time" {...register("startTime", { required: "Chọn giờ chiếu" })} className={`${inputClass} pl-9`} />
                </div>
                {errors.startTime && <ErrorMsg msg={errors.startTime.message} />}
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${!selectedRoom ? "pointer-events-none" : ""}`}>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Ngày chiếu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="date"
                    {...register("date", { required: "Chọn ngày chiếu" })}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${inputClass} pl-9`}
                    disabled={!selectedRoom}
                  />
                </div>
                {errors.date && <ErrorMsg msg={errors.date.message} />}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Giờ bắt đầu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="time"
                    {...register("startTime", { required: "Chọn giờ chiếu" })}
                    className={`${inputClass} pl-9`}
                    disabled={!selectedRoom}
                  />
                </div>
                {errors.startTime && <ErrorMsg msg={errors.startTime.message} />}
              </div>
            </div>
          )}

          {/* Giá vé cơ bản */}
          <div className={!selectedRoom ? "pointer-events-none" : ""}>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Giá vé cơ bản (VNĐ) <span className="text-red-500">*</span></label>
            <input
              type="number"
              {...register("basePrice", { required: "Nhập giá vé", min: { value: 1000, message: "Giá phải trên 1.000đ" } })}
              className={inputClass}
              placeholder="VD: 80000 (giá Thường, VIP × 1.5, Đôi × 2)"
              disabled={!selectedRoom}
            />
            {errors.basePrice && <ErrorMsg msg={errors.basePrice.message} />}
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Giá tự động tính theo loại ghế × khung giờ × loại ngày</p>
            {(() => {
              const preview = computePreview(watchedBasePrice, watchedStartTime, watchedDayType, watchedDate);
              if (!preview) return null;
              const timeLabel = { morning: "Sáng ×1.0", afternoon: "Chiều ×1.0", evening: "Tối ×1.1", night: "Đêm ×1.2" }[preview.timeSlot];
              const dayLabel = { weekday: "Ngày thường ×1.0", weekend: "Cuối tuần ×1.2", holiday: "Ngày lễ ×1.5" }[preview.dayType];
              return (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 dark:text-blue-400 mb-2">
                    Giá dự tính · {timeLabel} · {dayLabel}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Thường", key: "normal", cls: "text-slate-700 dark:text-gray-300" },
                      { label: "VIP ×1.5", key: "vip", cls: "text-amber-600" },
                      { label: "Đôi ×2.0", key: "couple", cls: "text-pink-600" },
                    ].map((p) => (
                      <div key={p.key} className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center border border-blue-100 dark:border-blue-800">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 mb-0.5">{p.label}</p>
                        <p className={`font-black text-xs ${p.cls}`}>{preview[p.key].toLocaleString()}đ</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Loại ngày (tùy chọn) */}
          <div className={!selectedRoom ? "pointer-events-none" : ""}>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Loại ngày</label>
            {getDayTypeFE(watchedDate) === "holiday" ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <span className="text-sm font-bold text-red-600 dark:text-red-400">Ngày lễ (×1.5)</span>
                <span className="text-xs text-red-400 dark:text-red-500">— Tự động phát hiện ngày lễ Việt Nam</span>
              </div>
            ) : getDayTypeFE(watchedDate) === "weekend" ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">Cuối tuần (×1.2)</span>
                <span className="text-xs text-amber-400 dark:text-amber-500">— Tự động theo ngày đã chọn</span>
              </div>
            ) : (
              <div className="relative">
                <select {...register("dayType")} className={selectClass} disabled={!selectedRoom}>
                  <option value="weekday">Ngày thường (×1.0)</option>
                  <option value="holiday">Ngày lễ (×1.5)</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 dark:text-gray-500 pointer-events-none" size={18} />
              </div>
            )}
          </div>

          {/* Khóa vé trước giờ chiếu */}
          <div className={!selectedRoom ? "pointer-events-none" : ""}>
            <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Khóa vé trước giờ chiếu (phút)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              {...register("bookingLockMinutes", { min: 0, max: 60 })}
              className={inputClass}
              disabled={!selectedRoom}
            />
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Hệ thống tự khóa đặt vé trước giờ chiếu N phút (mặc định: 5 phút)</p>
          </div>

          {createErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3.5">
              <div className="flex gap-2 items-start">
                <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1.5">
                    {createErrors.length === 1
                      ? "Không thể tạo suất chiếu — phòng chưa trống"
                      : `${createErrors.length} suất chiếu bị trùng giờ, không tạo được`}
                  </p>
                  <ul className="space-y-1">
                    {createErrors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{formatConflictMsg(e)}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-red-400 dark:text-red-500 mt-2">Vui lòng điều chỉnh giờ chiếu và thử lại.</p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold transition-all text-sm">
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 text-white rounded-xl font-bold shadow-lg transition-all text-sm flex items-center gap-2 ${saving ? "bg-red-400 cursor-not-allowed" : "bg-[#dc2626] hover:bg-red-700 shadow-red-200 hover:-translate-y-0.5"}`}
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <Save size={16} />}
              {saving ? "Đang tạo..." : bulkMode ? `Tạo Hàng Loạt` : "Tạo Suất Chiếu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShowtimeModal;
