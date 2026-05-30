import React, { useState, useEffect, useRef } from "react";
import usePagination from "@/shared/hooks/use-pagination";
import {
  X, ChevronDown, Calendar, Clock, Film, MapPin, Ban, Eye, Search, Square, CheckSquare, Grid,
} from "lucide-react";
import toast from "react-hot-toast";
import { ShowtimeModal } from "@/features/admin/components/ShowtimeModal";

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

const DAY_TYPE_LABEL = { weekday: "Ngày thường", weekend: "Cuối tuần", holiday: "Ngày lễ" };
const TIME_SLOT_LABEL = { morning: "Buổi sáng", afternoon: "Buổi chiều", evening: "Buổi tối", night: "Buổi đêm" };
const SHOWTIME_STATUS_META = {
  active: {
    label: "Đang chiếu",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    dot: "bg-emerald-500 animate-pulse",
  },
  expired: {
    label: "Đã hết hạn",
    badge: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "Đã hủy",
    badge: "bg-red-50 text-red-500 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    dot: "bg-red-400",
  },
};

const ShowtimeDetailModal = ({ showtime: st, onClose }) => {
  const effectiveStatus = getEffectiveShowtimeStatus(st);
  const statusMeta = SHOWTIME_STATUS_META[effectiveStatus] || SHOWTIME_STATUS_META.cancelled;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{st.movie?.title || "Suất chiếu"}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Chi tiết suất chiếu</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Movie banner */}
          <div className="flex gap-4 items-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-100 dark:border-gray-600">
            {st.movie?.poster && (
              <img src={st.movie.poster} alt="" className="w-14 h-20 object-cover rounded-lg border border-slate-200 dark:border-gray-600 shrink-0"
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{st.movie?.title || "—"}</p>
              {st.movie?.duration && <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{st.movie.duration} phút</p>}
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
              <div key={item.label} className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1">{item.label}</p>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Price config */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Giá vé</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Ghế thường", key: "normal", cls: "text-slate-700 dark:text-gray-300" },
                { label: "Ghế VIP", key: "vip", cls: "text-amber-600" },
                { label: "Ghế đôi", key: "couple", cls: "text-pink-600" },
              ].map((p) => (
                <div key={p.key} className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600 text-center">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 mb-1">{p.label}</p>
                  <p className={`font-black text-sm ${p.cls}`}>
                    {st.priceConfig?.[p.key] ? `${st.priceConfig[p.key].toLocaleString()}đ` : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Seats + status */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1">Ghế còn lại</p>
              <p className="font-black text-xl text-slate-800 dark:text-white">
                {st.availableSeats ?? "—"}
                <span className="text-sm font-medium text-slate-400 dark:text-gray-500"> / {st.totalSeats ?? "—"}</span>
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1.5">Trạng thái</p>
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

const SHOWTIMES_PAGE_SIZE = 6;

export const ShowtimesManager = ({ showtimes, loading, movies, cinemas, onAddNew, onCancel, onBulkCancel, isBulkActing }) => {
  const [search, setSearch] = useState("");
  const [filterMovie, setFilterMovie] = useState("");
  const [filterCinema, setFilterCinema] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const dateDropdownRef = useRef(null);

  // Click outside to close date dropdown
  useEffect(() => {
    const handler = (e) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
    };
    if (dateDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dateDropdownOpen]);
  const [filterStatus, setFilterStatus] = useState("active");
  const [detailShowtime, setDetailShowtime] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [bulkCancelOpen, setBulkCancelOpen] = useState(false);
  const { currentPage, totalPages, setTotalPages, paginationItems, goToPage, reset: resetPage } = usePagination();
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleSelect = (id) => { setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); };
  const toggleSelectAll = () => {
    if (selectedIds.size === pagedShowtimes.length && pagedShowtimes.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(pagedShowtimes.map((s) => s._id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkCancel = () => {
    if (selectedIds.size === 0) return;
    setBulkCancelOpen(true);
  };

  const handleConfirmBulkCancel = async () => {
    await onBulkCancel([...selectedIds]);
    setBulkCancelOpen(false);
    clearSelection();
  };

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

  // Extract unique rooms from showtimes, filtered by selected cinema
  const roomMap = new Map();
  if (filterCinema) {
    normalizedShowtimes.forEach(st => {
      if (!st.room?._id || roomMap.has(st.room._id)) return;
      if (st.cinema?._id !== filterCinema) return;
      roomMap.set(st.room._id, { _id: st.room._id, name: st.room.name, cinemaId: st.cinema?._id });
    });
  }
  const rooms = [...roomMap.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Extract unique dates from showtimes for date filter
  const dateSet = new Set();
  normalizedShowtimes.forEach(st => {
    if (st.date) dateSet.add(new Date(st.date).toISOString().split('T')[0]);
  });
  const dates = [...dateSet].sort();

  const filtered = normalizedShowtimes.filter((st) => {
    const movieOk = !filterMovie || st.movie?._id === filterMovie;
    const cinemaOk = !filterCinema || st.cinema?._id === filterCinema;
    const roomOk = !filterRoom || st.room?._id === filterRoom;
    const dateOk = !filterDate || (st.date && new Date(st.date).toISOString().split('T')[0] === filterDate);
    const statusOk = !filterStatus || st.effectiveStatus === filterStatus;
    const searchOk = !search.trim() || st.movie?.title?.toLowerCase().includes(search.trim().toLowerCase());
    return movieOk && cinemaOk && roomOk && dateOk && statusOk && searchOk;
  });

  const computedTotalPages = Math.ceil(filtered.length / SHOWTIMES_PAGE_SIZE);
  const pagedShowtimes = filtered.slice((currentPage - 1) * SHOWTIMES_PAGE_SIZE, currentPage * SHOWTIMES_PAGE_SIZE);

  useEffect(() => { setTotalPages(computedTotalPages); }, [computedTotalPages]);

  const handleSearch = (v) => { setSearch(v); resetPage(); };
  const handleFilterMovie = (v) => { setFilterMovie(v); resetPage(); };
  const handleFilterCinema = (v) => { setFilterCinema(v); setFilterRoom(''); resetPage(); };
  const handleFilterRoom = (v) => { setFilterRoom(v); resetPage(); };
  const handleFilterStatus = (v) => { setFilterStatus(v); resetPage(); };

  const statusCounts = normalizedShowtimes.reduce((acc, st) => {
    acc[st.effectiveStatus] = (acc[st.effectiveStatus] || 0) + 1;
    return acc;
  }, {});

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    await onCancel(cancelTarget);
    setCancelling(false);
    setCancelTarget(null);
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cancelIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Cancel confirm modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[28px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 dark:border-gray-700" style={{ animation: "cancelIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-7 pb-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30">
                <Ban className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black text-white mb-1">Xác nhận hủy suất chiếu</h2>
              <p className="text-red-100 text-sm">Hành động này không thể hoàn tác</p>
            </div>
            <div className="p-5 space-y-2">
              <div className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-4 border border-slate-100 dark:border-gray-600 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-medium">Phim</span>
                  <span className="font-bold text-slate-800 dark:text-white text-right max-w-[60%] line-clamp-1">{cancelTarget.movie?.title || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-medium">Suất chiếu</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.startTime} — {cancelTarget.endTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-medium">Ngày</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.date ? new Date(cancelTarget.date).toLocaleDateString("vi-VN") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 dark:text-gray-500 font-medium">Rạp</span>
                  <span className="font-bold text-slate-800 dark:text-white">{cancelTarget.cinema?.name || "—"}</span>
                </div>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-3 py-2 font-medium">
                Tất cả vé đã đặt sẽ được hoàn tiền tự động.
              </p>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                Không hủy
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang hủy...</>
                ) : "Xác nhận hủy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk cancel confirm modal */}
      {bulkCancelOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[28px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 dark:border-gray-700" style={{ animation: "cancelIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 px-6 pt-7 pb-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-white/30">
                <Ban className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-black text-white mb-1">Hủy hàng loạt suất chiếu</h2>
              <p className="text-orange-100 text-sm">Hành động này không thể hoàn tác</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-slate-50 dark:bg-gray-700 rounded-2xl p-4 border border-slate-100 dark:border-gray-600 text-center">
                <p className="text-slate-500 dark:text-gray-400 text-sm mb-1">Số suất chiếu bị hủy</p>
                <p className="text-4xl font-black text-red-600">{selectedIds.size}</p>
                <p className="text-slate-400 dark:text-gray-500 text-xs mt-1">suất chiếu được chọn</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3 space-y-1.5">
                <p className="text-xs text-amber-800 dark:text-amber-400 font-bold">Lưu ý quan trọng:</p>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                  <li>Tất cả vé đã đặt sẽ được hoàn tiền tự động</li>
                  <li>Khách hàng sẽ nhận được thông báo hủy</li>
                  <li>Dữ liệu suất chiếu sẽ bị xóa vĩnh viễn</li>
                </ul>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setBulkCancelOpen(false)}
                disabled={isBulkActing}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
              >
                Không hủy
              </button>
              <button
                onClick={handleConfirmBulkCancel}
                disabled={isBulkActing}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBulkActing ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang hủy...</>
                ) : `Hủy ${selectedIds.size} suất chiếu`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản Lý Suất Chiếu</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">Thêm và theo dõi lịch chiếu phim</p>
        </div>
        <button
          onClick={onAddNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0"
        >
          <span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm suất chiếu</span>
        </button>
      </div>

      {/* Filter */}
      <div className="space-y-3">
        {/* Status toggle */}
        <div className="flex items-center gap-2">
          {[
            { value: "active", label: `Đang chiếu${statusCounts.active ? ` (${statusCounts.active})` : ""}`, cls: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" },
            { value: "expired", label: `Đã hết hạn${statusCounts.expired ? ` (${statusCounts.expired})` : ""}`, cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" },
            { value: "cancelled", label: `Đã hủy${statusCounts.cancelled ? ` (${statusCounts.cancelled})` : ""}`, cls: "bg-red-50 text-red-500 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" },
            { value: "", label: "Tất cả", cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-150 active:scale-95 ${filterStatus === opt.value ? opt.cls : "bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400 dark:text-gray-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm theo tên phim..."
              className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-[#dc2626] transition-all"
            />
          </div>
          <div className="relative">
            <Film className="absolute left-3 top-3 text-slate-400 dark:text-gray-500" size={16} />
            <select value={filterMovie} onChange={(e) => handleFilterMovie(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white appearance-none outline-none focus:border-[#dc2626] cursor-pointer">
              <option value="">Tất cả phim</option>
              {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-slate-400 dark:text-gray-500" size={16} />
            <select value={filterCinema} onChange={(e) => handleFilterCinema(e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white appearance-none outline-none focus:border-[#dc2626] cursor-pointer">
              <option value="">Tất cả rạp</option>
              {cinemas.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>
          <div className="relative">
            <Grid className="absolute left-3 top-3 text-slate-400 dark:text-gray-500" size={16} />
            <select value={filterRoom} onChange={(e) => handleFilterRoom(e.target.value)} disabled={!filterCinema} className={`w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white appearance-none outline-none focus:border-[#dc2626] ${!filterCinema ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <option value="">{filterCinema ? 'Tất cả phòng' : 'Chọn rạp trước'}</option>
              {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-slate-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => setDateDropdownOpen(v => !v)}
              className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-[#dc2626] cursor-pointer text-left flex items-center justify-between"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={16} />
              <span className={filterDate ? '' : 'text-slate-400 dark:text-gray-500'}>
                {filterDate ? new Date(filterDate).toLocaleDateString('vi-VN') : 'Tất cả ngày'}
              </span>
              <ChevronDown size={14} className={`text-slate-400 dark:text-gray-500 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dateDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setFilterDate(''); setDateDropdownOpen(false); resetPage(); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors ${!filterDate ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-gray-300'}`}
                >
                  Tất cả ngày
                </button>
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setFilterDate(d); setDateDropdownOpen(false); resetPage(); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors ${filterDate === d ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-gray-300'}`}
                  >
                    {new Date(d).toLocaleDateString('vi-VN')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 animate-[fadeIn_0.2s_ease_forwards]">
          <span className="text-sm font-bold text-red-700 dark:text-red-400">Đã chọn {selectedIds.size} suất chiếu</span>
          <div className="flex items-center gap-2">
            <button onClick={clearSelection} disabled={isBulkActing} className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">Bỏ chọn</button>
            <button onClick={handleBulkCancel} disabled={isBulkActing} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50">
              {isBulkActing ? (
                <><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang xử lý...</>
              ) : (
                <><Ban size={14} /> Hủy {selectedIds.size} suất chiếu</>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-700 text-[13px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
                  <th className="p-5 pl-6 w-12">
                    <button onClick={toggleSelectAll} className="hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
                      {selectedIds.size === pagedShowtimes.length && pagedShowtimes.length > 0 ? <CheckSquare size={16} className="text-red-600" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="p-5">Phim</th>
                  <th className="p-5">Rạp · Phòng</th>
                  <th className="p-5">Ngày chiếu</th>
                  <th className="p-5">Giờ</th>
                  <th className="p-5">Thời lượng</th>
                  <th className="p-5">Giá (Thường/VIP/Đôi)</th>
                  <th className="p-5">Ghế còn</th>
                  <th className="p-5 text-center">Trạng thái</th>
                  <th className="p-5 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody key={currentPage} className="divide-y divide-slate-100 dark:divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan="10" className="p-12 text-center text-slate-400 dark:text-gray-500 italic">Chưa có suất chiếu nào.</td></tr>
                ) : (
                  pagedShowtimes.map((st, idx) => {
                    const statusMeta = SHOWTIME_STATUS_META[st.effectiveStatus] || SHOWTIME_STATUS_META.cancelled;

                    return (
                      <tr key={st._id} onClick={() => setDetailShowtime(st)} className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all duration-150 group cursor-pointer" style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}>
                        <td className="p-5 pl-6">
                          <button onClick={(e) => { e.stopPropagation(); toggleSelect(st._id); }} className="hover:text-red-600 transition-colors">
                            {selectedIds.has(st._id) ? <CheckSquare size={16} className="text-red-600" /> : <Square size={16} className="text-slate-300 dark:text-gray-600 group-hover:text-slate-500 dark:group-hover:text-gray-400" />}
                          </button>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            {st.movie?.poster && (
                              <img src={st.movie.poster} alt="" className="w-14 h-[76px] object-cover rounded-xl border border-slate-100 dark:border-gray-600 shrink-0"
                                onError={(e) => { e.target.style.display = "none"; }} />
                            )}
                            <span className="font-bold text-slate-800 dark:text-white text-[16px] line-clamp-2">{st.movie?.title || "—"}</span>
                          </div>
                        </td>
                        <td className="p-5 text-[15px] text-slate-600 dark:text-gray-400">
                          <p className="font-medium">{st.cinema?.name || "—"}</p>
                          <p className="text-[13px] text-slate-400 dark:text-gray-500 mt-0.5">{st.room?.name || "—"}</p>
                        </td>
                        <td className="p-5 text-[15px] text-slate-600 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400 dark:text-gray-500" />
                            {st.date ? new Date(st.date).toLocaleDateString("vi-VN") : "—"}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white text-[16px]">
                            <Clock size={15} className="text-[#dc2626]" /> {st.startTime}
                          </span>
                        </td>
                        <td className="p-5 text-[15px] text-slate-500 dark:text-gray-400">
                          {st.movie?.duration ? `${st.movie.duration} phút` : "—"}
                        </td>
                        <td className="p-5 text-[13px] text-slate-600 dark:text-gray-400 space-y-1">
                          <p><span className="font-medium text-slate-400 dark:text-gray-500">T:</span> <span className="font-bold text-slate-700 dark:text-gray-300">{st.priceConfig?.normal?.toLocaleString() || st.basePrice?.toLocaleString() || "—"}đ</span></p>
                          <p><span className="font-medium text-amber-500">V:</span> <span className="font-bold text-amber-600">{st.priceConfig?.vip?.toLocaleString() || "—"}đ</span></p>
                          <p><span className="font-medium text-pink-400">Đ:</span> <span className="font-bold text-slate-700 dark:text-gray-300">{st.priceConfig?.couple?.toLocaleString() || "—"}đ</span></p>
                        </td>
                        <td className="p-5 text-[15px] font-medium text-slate-600 dark:text-gray-400">
                          {st.availableSeats ?? "—"} / {st.totalSeats ?? "—"}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusMeta.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`}></span>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setDetailShowtime(st)}
                              className="p-2.5 text-slate-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                              title="Xem chi tiết">
                              <Eye size={18} />
                            </button>
                            {st.effectiveStatus === "active" && (
                              <button onClick={(e) => { e.stopPropagation(); setCancelTarget(st); }}
                                className="p-2.5 text-slate-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                title="Hủy suất chiếu">
                                <Ban size={18} />
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

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-[15px] text-slate-500 dark:text-gray-400">
          Hiển thị <span className="font-bold text-slate-700 dark:text-gray-300">
            {filtered.length === 0 ? 0 : (currentPage - 1) * SHOWTIMES_PAGE_SIZE + 1}–{Math.min(currentPage * SHOWTIMES_PAGE_SIZE, filtered.length)}
          </span> / <span className="font-bold text-slate-700 dark:text-gray-300">{filtered.length}</span> suất chiếu
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            ‹ Trước
          </button>
          {paginationItems.map((p, i) => p === null ? (
            <span key={`d${i}`} className="px-2 text-slate-400 dark:text-gray-600 text-[15px]">…</span>
          ) : (
            <button key={p} onClick={() => goToPage(p)}
              className={`w-10 h-10 rounded-lg text-[15px] font-bold transition-all duration-150 active:scale-95 ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm" : "border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            Sau ›
          </button>
        </div>
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

// Re-export ShowtimeModal for backward compatibility with Dashboard.jsx
export { ShowtimeModal };
