import React from "react";
import { X } from "lucide-react";

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

/**
 * ShowtimeDetailCard — modal displaying full showtime info including pricing.
 * Used by ShowtimesTab when a row is clicked.
 * @param {{ showtime: object, onClose: () => void }} props
 */
const ShowtimeDetailCard = ({ showtime: st, onClose }) => {
  const effectiveStatus = st.effectiveStatus || st.status || "active";
  const statusMeta = SHOWTIME_STATUS_META[effectiveStatus] || SHOWTIME_STATUS_META.cancelled;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">
              {st.movie?.title || "Suất chiếu"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Chi tiết suất chiếu</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Movie banner */}
          <div className="flex gap-4 items-center bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-100 dark:border-gray-600">
            {st.movie?.poster && (
              <img
                src={st.movie.poster}
                alt=""
                className="w-14 h-20 object-cover rounded-lg border border-slate-200 dark:border-gray-600 shrink-0"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            )}
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{st.movie?.title || "—"}</p>
              {st.movie?.duration && (
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{st.movie.duration} phút</p>
              )}
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

export default ShowtimeDetailCard;
