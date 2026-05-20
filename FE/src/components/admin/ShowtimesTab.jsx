import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Plus, X, Save, ChevronDown, Calendar, Clock, Film, MapPin, Ban, Layers, Eye,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";

const DAYS_VI = [
  { label: "T2", value: 1 }, { label: "T3", value: 2 }, { label: "T4", value: 3 },
  { label: "T5", value: 4 }, { label: "T6", value: 5 }, { label: "T7", value: 6 }, { label: "CN", value: 0 },
];

const TIME_SLOT_MULTS = { morning: 1.0, evening: 1.1, night: 1.2 };
const DAY_TYPE_MULTS = { weekday: 1.0, weekend: 1.2, holiday: 1.5 };
const SEAT_MULTS = { normal: 1.0, vip: 1.5, couple: 2.0 };

function getTimeSlotFE(startTime) {
  if (!startTime) return null;
  const hour = parseInt(startTime.split(":")[0], 10);
  if (hour < 12) return "morning";
  if (hour < 18) return "evening";
  return "night";
}

function getDayTypeFE(dateStr) {
  if (!dateStr) return null;
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

function parseTimeValue(value) {
  if (!value || typeof value !== "string") return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return { hours, minutes };
}

function getShowtimeDateTime(showtime, useEndTime = true) {
  if (!showtime?.date) return null;

  const date = new Date(showtime.date);
  const timeValue = useEndTime ? (showtime.endTime || showtime.startTime) : showtime.startTime;
  const parsed = parseTimeValue(timeValue);

  if (!parsed) return date;

  date.setHours(parsed.hours, parsed.minutes, 0, 0);

  if (
    useEndTime &&
    showtime.endTime &&
    showtime.startTime &&
    showtime.endTime < showtime.startTime
  ) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function getEffectiveShowtimeStatus(showtime, now = new Date()) {
  if (!showtime) return "cancelled";
  if (showtime.status === "cancelled" || showtime.status === "expired") return showtime.status;

  const endDateTime = getShowtimeDateTime(showtime, true);
  if (!endDateTime) return showtime.status || "active";

  return endDateTime < now ? "expired" : (showtime.status || "active");
}

const ErrorMsg = ({ msg }) => (
  <p className="text-red-500 text-xs mt-1 ml-1">{msg}</p>
);

const DAY_TYPE_LABEL = { weekday: "Ngày thường", weekend: "Cuối tuần", holiday: "Ngày lễ" };
const TIME_SLOT_LABEL = { morning: "Buổi sáng", evening: "Buổi chiều/tối", night: "Buổi đêm" };
const SHOWTIME_STATUS_META = {
  active: {
    label: "Đang chiếu",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100",
    dot: "bg-emerald-500 animate-pulse",
  },
  expired: {
    label: "Đã hết hạn",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-red-50 text-red-500 border-red-100",
    dot: "bg-red-400",
  },
};

const ShowtimeDetailModal = ({ showtime: st, onClose }) => {
  const effectiveStatus = getEffectiveShowtimeStatus(st);
  const statusMeta = SHOWTIME_STATUS_META[effectiveStatus] || SHOWTIME_STATUS_META.cancelled;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{st.movie?.title || "Suất chiếu"}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Chi tiết suất chiếu</p>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-4">
        {/* Movie banner */}
        <div className="flex gap-4 items-center bg-slate-50 rounded-xl p-4 border border-slate-100">
          {st.movie?.poster && (
            <img src={st.movie.poster} alt="" className="w-14 h-20 object-cover rounded-lg border border-slate-200 shrink-0"
              onError={(e) => { e.target.style.display = "none"; }} />
          )}
          <div>
            <p className="font-bold text-slate-800">{st.movie?.title || "—"}</p>
            {st.movie?.duration && <p className="text-xs text-slate-400 mt-0.5">{st.movie.duration} phút</p>}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Rạp chiếu", value: st.cinema?.name || "—" },
            { label: "Phòng chiếu", value: st.room?.name || "—" },
            { label: "Ngày chiếu", value: st.date ? new Date(st.date).toLocaleDateString("vi-VN") : "—" },
            { label: "Giờ chiếu", value: st.endTime ? `${st.startTime} → ${st.endTime}` : st.startTime || "—" },
            { label: "Loại ngày", value: DAY_TYPE_LABEL[st.dayType] || "—" },
            { label: "Khung giờ", value: TIME_SLOT_LABEL[st.timeSlot] || st.timeSlot || "—" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
              <p className="font-bold text-slate-800 text-sm">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Price config */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Giá vé</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Ghế thường", key: "normal", cls: "text-slate-700" },
              { label: "Ghế VIP", key: "vip", cls: "text-amber-600" },
              { label: "Ghế đôi", key: "couple", cls: "text-pink-600" },
            ].map((p) => (
              <div key={p.key} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                <p className="text-[10px] font-bold text-slate-400 mb-1">{p.label}</p>
                <p className={`font-black text-sm ${p.cls}`}>
                  {st.priceConfig?.[p.key] ? `${st.priceConfig[p.key].toLocaleString()}đ` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Seats + status */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Ghế còn lại</p>
            <p className="font-black text-xl text-slate-800">
              {st.availableSeats ?? "—"}
              <span className="text-sm font-medium text-slate-400"> / {st.totalSeats ?? "—"}</span>
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Trạng thái</p>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

const selectClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] appearance-none font-medium text-slate-700 cursor-pointer transition-colors";
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 transition-all";

export const ShowtimeModal = ({ movies, cinemas, onClose, onSaved }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { movieId: "", cinemaId: "", roomId: "", date: "", startTime: "", basePrice: "", dayType: "" },
  });

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
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
    setLoadingRooms(true);
    axiosInstance.get(`/admin/cinemas/${selectedCinema}/rooms`)
      .then((res) => setRooms(res.data))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, [selectedCinema]);

  // Lock dayType to "weekend" for Sat/Sun; default to "weekday" for T2-T6
  useEffect(() => {
    if (!watchedDate || bulkMode) return;
    setValue("dayType", getDayTypeFE(watchedDate) === "weekend" ? "weekend" : "weekday");
  }, [watchedDate, bulkMode]);

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      if (bulkErrors.days) setBulkErrors((p) => ({ ...p, days: "" }));
      return next;
    });
  };

  const onSubmit = async (data) => {
    setSaving(true);
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
        }));
      } else {
        payload = {
          movieId: data.movieId, cinemaId: data.cinemaId, roomId: data.roomId,
          date: data.date, startTime: data.startTime, basePrice: Number(data.basePrice),
          dayType: data.dayType || undefined,
        };
      }
      await axiosInstance.post("/showtimes", payload);
      const count = Array.isArray(payload) ? payload.length : 1;
      toast.success(`Đã tạo ${count} suất chiếu thành công!`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thêm suất chiếu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-in border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-lg text-slate-800">Thêm Suất Chiếu Mới</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tạo lịch chiếu và tự động sinh ghế</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${bulkMode ? "bg-red-50 text-[#dc2626] border-red-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}
              title="Tạo suất chiếu cho nhiều ngày cùng lúc"
            >
              <Layers size={13} /> {bulkMode ? "Nhiều ngày" : "1 ngày"}
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          {/* Chọn phim */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Phim <span className="text-red-500">*</span></label>
            <div className="relative">
              <select {...register("movieId", { required: "Vui lòng chọn phim" })} className={selectClass}>
                <option value="">-- Chọn phim --</option>
                {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            </div>
            {errors.movieId && <ErrorMsg msg={errors.movieId.message} />}
          </div>

          {/* Chọn rạp */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Rạp chiếu <span className="text-red-500">*</span></label>
            <div className="relative">
              <select {...register("cinemaId", { required: "Vui lòng chọn rạp" })} className={`${selectClass} ${!selectedMovie ? "opacity-50 cursor-not-allowed" : ""}`} disabled={!selectedMovie}>
                <option value="">{!selectedMovie ? "Chọn phim trước" : "-- Chọn rạp --"}</option>
                {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            </div>
            {errors.cinemaId && <ErrorMsg msg={errors.cinemaId.message} />}
          </div>

          {/* Chọn phòng */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Phòng chiếu <span className="text-red-500">*</span></label>
            <div className="relative">
              <select
                {...register("roomId", { required: "Vui lòng chọn phòng" })}
                className={`${selectClass} ${loadingRooms ? "opacity-50" : ""}`}
                disabled={!selectedCinema || loadingRooms}
              >
                <option value="">{loadingRooms ? "Đang tải..." : selectedCinema ? "-- Chọn phòng --" : "Chọn rạp trước"}</option>
                {rooms.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.totalSeats} ghế)</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
            </div>
            {errors.roomId && <ErrorMsg msg={errors.roomId.message} />}
          </div>

          {bulkMode ? (
            <div className={`space-y-4 ${!selectedRoom ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Từ ngày <span className="text-red-500">*</span></label>
                  <input type="date" value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setBulkErrors((p) => ({ ...p, dateFrom: "" })); }}
                    min={new Date().toISOString().split("T")[0]}
                    className={`${inputClass} ${bulkErrors.dateFrom ? "border-red-400 bg-red-50" : ""}`} />
                  {bulkErrors.dateFrom && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.dateFrom}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Đến ngày <span className="text-red-500">*</span></label>
                  <input type="date" value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setBulkErrors((p) => ({ ...p, dateTo: "" })); }}
                    min={dateFrom || new Date().toISOString().split("T")[0]}
                    className={`${inputClass} ${bulkErrors.dateTo ? "border-red-400 bg-red-50" : ""}`} />
                  {bulkErrors.dateTo && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.dateTo}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Áp dụng cho các ngày <span className="text-red-500">*</span></label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_VI.map((d) => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border transition-all ${selectedDays.includes(d.value) ? "bg-[#dc2626] text-white border-red-600 shadow-sm" : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"}`}>
                      {d.label}
                    </button>
                  ))}
                </div>
                {bulkErrors.days && <p className="text-red-500 text-xs mt-1 ml-1">{bulkErrors.days}</p>}
                {dateFrom && dateTo && selectedDays.length > 0 && !bulkErrors.dateFrom && !bulkErrors.dateTo && (
                  <p className="text-xs text-slate-400 mt-2">
                    → Sẽ tạo <span className="font-bold text-[#dc2626]">{generateDateRange(dateFrom, dateTo, selectedDays).length}</span> suất chiếu
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Giờ bắt đầu <span className="text-red-500">*</span></label>
                <input type="time" {...register("startTime", { required: "Chọn giờ chiếu" })} className={inputClass} />
                {errors.startTime && <ErrorMsg msg={errors.startTime.message} />}
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-5 ${!selectedRoom ? "opacity-50 pointer-events-none" : ""}`}>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ngày chiếu <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  {...register("date", { required: "Chọn ngày chiếu" })}
                  min={new Date().toISOString().split("T")[0]}
                  className={inputClass}
                  disabled={!selectedRoom}
                />
                {errors.date && <ErrorMsg msg={errors.date.message} />}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Giờ bắt đầu <span className="text-red-500">*</span></label>
                <input
                  type="time"
                  {...register("startTime", { required: "Chọn giờ chiếu" })}
                  className={inputClass}
                  disabled={!selectedRoom}
                />
                {errors.startTime && <ErrorMsg msg={errors.startTime.message} />}
              </div>
            </div>
          )}

          {/* Giá vé cơ bản */}
          <div className={!selectedRoom ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Giá vé cơ bản (VNĐ) <span className="text-red-500">*</span></label>
            <input
              type="number"
              {...register("basePrice", { required: "Nhập giá vé", min: { value: 1000, message: "Giá phải trên 1.000đ" } })}
              className={inputClass}
              placeholder="VD: 80000 (giá Thường, VIP × 1.5, Đôi × 2)"
              disabled={!selectedRoom}
            />
            {errors.basePrice && <ErrorMsg msg={errors.basePrice.message} />}
            <p className="text-xs text-slate-400 mt-1">Giá tự động tính theo loại ghế × khung giờ × loại ngày</p>
            {(() => {
              const preview = computePreview(watchedBasePrice, watchedStartTime, watchedDayType, watchedDate);
              if (!preview) return null;
              const timeLabel = { morning: "Sáng ×1.0", evening: "Chiều/Tối ×1.1", night: "Đêm ×1.2" }[preview.timeSlot];
              const dayLabel = { weekday: "Ngày thường ×1.0", weekend: "Cuối tuần ×1.2", holiday: "Ngày lễ ×1.5" }[preview.dayType];
              return (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">
                    Giá dự tính · {timeLabel} · {dayLabel}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Thường", key: "normal", cls: "text-slate-700" },
                      { label: "VIP ×1.5", key: "vip", cls: "text-amber-600" },
                      { label: "Đôi ×2.0", key: "couple", cls: "text-pink-600" },
                    ].map((p) => (
                      <div key={p.key} className="bg-white rounded-lg p-2 text-center border border-blue-100">
                        <p className="text-[9px] font-bold text-slate-400 mb-0.5">{p.label}</p>
                        <p className={`font-black text-xs ${p.cls}`}>{preview[p.key].toLocaleString()}đ</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Loại ngày (tùy chọn) */}
          <div className={!selectedRoom ? "opacity-50 pointer-events-none" : ""}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Loại ngày</label>
            {getDayTypeFE(watchedDate) === "weekend" ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-sm font-bold text-amber-600">Cuối tuần (×1.2)</span>
                <span className="text-xs text-amber-400">— Tự động theo ngày đã chọn</span>
              </div>
            ) : (
              <div className="relative">
                <select {...register("dayType")} className={selectClass} disabled={!selectedRoom}>
                  <option value="weekday">Ngày thường (×1.0)</option>
                  <option value="holiday">Ngày lễ (×1.5)</option>
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-all text-sm">
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

export const ShowtimesManager = ({ showtimes, loading, movies, cinemas, onAddNew, onCancel }) => {
  const [filterMovie, setFilterMovie] = useState("");
  const [filterCinema, setFilterCinema] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [detailShowtime, setDetailShowtime] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentTime = new Date(nowTick);
  const normalizedShowtimes = showtimes.map((st) => ({
    ...st,
    effectiveStatus: getEffectiveShowtimeStatus(st, currentTime),
  }));

  const filtered = normalizedShowtimes.filter((st) => {
    const movieOk = !filterMovie || st.movie?._id === filterMovie;
    const cinemaOk = !filterCinema || st.cinema?._id === filterCinema;
    const statusOk = !filterStatus || st.effectiveStatus === filterStatus;
    return movieOk && cinemaOk && statusOk;
  });

  const statusCounts = normalizedShowtimes.reduce((acc, st) => {
    acc[st.effectiveStatus] = (acc[st.effectiveStatus] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Quản Lý Suất Chiếu</h2>
          <p className="text-sm text-slate-500">Thêm và theo dõi lịch chiếu phim</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0"
        >
          <Plus size={20} /> Thêm suất chiếu
        </button>
      </div>

      {/* Filter */}
      <div className="space-y-3">
        {/* Status toggle */}
        <div className="flex items-center gap-2">
          {[
            { value: "active", label: `Đang chiếu${statusCounts.active ? ` (${statusCounts.active})` : ""}`, cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
            { value: "expired", label: `Đã hết hạn${statusCounts.expired ? ` (${statusCounts.expired})` : ""}`, cls: "bg-slate-100 text-slate-600 border-slate-200" },
            { value: "cancelled", label: `Đã hủy${statusCounts.cancelled ? ` (${statusCounts.cancelled})` : ""}`, cls: "bg-red-50 text-red-500 border-red-200" },
            { value: "", label: "Tất cả", cls: "bg-slate-100 text-slate-600 border-slate-200" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterStatus === opt.value ? opt.cls : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Film className="absolute left-3 top-3 text-slate-400" size={16} />
            <select value={filterMovie} onChange={(e) => setFilterMovie(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 appearance-none outline-none focus:border-[#dc2626] cursor-pointer">
              <option value="">Tất cả phim</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
            <select value={filterCinema} onChange={(e) => setFilterCinema(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 appearance-none outline-none focus:border-[#dc2626] cursor-pointer">
              <option value="">Tất cả rạp</option>
              {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6">Phim</th>
                  <th className="p-4">Rạp · Phòng</th>
                  <th className="p-4">Ngày chiếu</th>
                  <th className="p-4">Giờ</th>
                  <th className="p-4">Giá (Thường/VIP/Đôi)</th>
                  <th className="p-4">Ghế còn</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" className="p-12 text-center text-slate-400 italic">Chưa có suất chiếu nào.</td></tr>
                ) : (
                  filtered.map((st) => {
                    const statusMeta = SHOWTIME_STATUS_META[st.effectiveStatus] || SHOWTIME_STATUS_META.cancelled;

                    return (
                      <tr key={st._id} onClick={() => setDetailShowtime(st)} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {st.movie?.poster && (
                            <img src={st.movie.poster} alt="" className="w-9 h-12 object-cover rounded-lg border border-slate-100 shrink-0"
                              onError={(e) => { e.target.style.display = "none"; }} />
                          )}
                          <span className="font-bold text-slate-800 text-sm line-clamp-2">{st.movie?.title || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <p className="font-medium">{st.cinema?.name || "—"}</p>
                        <p className="text-xs text-slate-400">{st.room?.name || "—"}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {st.date ? new Date(st.date).toLocaleDateString("vi-VN") : "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                          <Clock size={13} className="text-[#dc2626]" /> {st.startTime}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600 space-y-0.5">
                        <p><span className="font-medium text-slate-400">T:</span> <span className="font-bold text-slate-700">{st.priceConfig?.normal?.toLocaleString() || st.basePrice?.toLocaleString() || "—"}đ</span></p>
                        <p><span className="font-medium text-amber-400">V:</span> <span className="font-bold text-slate-700">{st.priceConfig?.vip?.toLocaleString() || "—"}đ</span></p>
                        <p><span className="font-medium text-pink-400">Đ:</span> <span className="font-bold text-slate-700">{st.priceConfig?.couple?.toLocaleString() || "—"}đ</span></p>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">
                        {st.availableSeats ?? "—"} / {st.totalSeats ?? "—"}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusMeta.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`}></span>
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setDetailShowtime(st)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Xem chi tiết">
                            <Eye size={16} />
                          </button>
                          {st.effectiveStatus === "active" && (
                            <button onClick={() => onCancel(st)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Hủy suất chiếu">
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailShowtime && (
        <ShowtimeDetailModal
          showtime={detailShowtime}
          onClose={() => setDetailShowtime(null)}
        />
      )}
    </div>
  );
};
