import React, { useState, useEffect } from "react";
import axiosInstance from "../../api/axiosConfig";
import { Calendar, Clock, ChevronDown } from "lucide-react";

const STATUS = {
  available: { label: "Trống",    cls: "bg-emerald-50 border-emerald-300 text-emerald-700" },
  reserved:  { label: "Đang giữ", cls: "bg-amber-100 border-amber-400 text-amber-700" },
  booked:    { label: "Đã đặt",   cls: "bg-slate-700 border-slate-700 text-white" },
  locked:    { label: "Bảo trì",  cls: "bg-slate-200 border-slate-300 text-slate-400 opacity-50" },
};

export const SeatStatusViewer = ({ roomId, seatMatrix }) => {
  const [showtimes, setShowtimes] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [seats, setSeats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get(`/admin/rooms/${roomId}/showtimes`)
      .then((r) => setShowtimes(r.data))
      .catch(() => setShowtimes([]));
  }, [roomId]);

  const handleSelect = async (id) => {
    setSelectedId(id);
    if (!id) { setSeats(null); return; }
    setLoading(true);
    try {
      const r = await axiosInstance.get(`/showtimes/${id}`);
      const seatList = r.data.seats || [];
      const map = {};
      for (const s of seatList) map[s.seatNumber] = s;
      setSeats(map);
    } catch {
      setSeats(null);
    } finally {
      setLoading(false);
    }
  };

  const cellClass = (cell) => {
    if (!seats) return "bg-white dark:bg-gray-600 border-slate-200 dark:border-gray-500 text-slate-500 dark:text-gray-300";
    const s = seats[cell.label];
    if (!s) return "bg-white dark:bg-gray-600 border-slate-200 dark:border-gray-500 text-slate-400 dark:text-gray-400";
    if (s.isLocked) return STATUS.locked.cls;
    return STATUS[s.status]?.cls || STATUS.available.cls;
  };

  const counts = seats
    ? Object.values(seats).reduce((acc, s) => {
        const key = s.isLocked ? "locked" : (s.status || "available");
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    : null;

  if (!seatMatrix?.length) return null;

  return (
    <div className="space-y-4 mt-2">
      {/* Showtime selector */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <select
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-50 appearance-none cursor-pointer"
          >
            <option value="">-- Chọn suất chiếu --</option>
            {showtimes.map((st) => (
              <option key={st._id} value={st._id}>
                {st.movie?.title} · {new Date(st.date).toLocaleDateString("vi-VN")} {st.startTime}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 dark:text-gray-500 pointer-events-none" />
        </div>
        {showtimes.length === 0 && (
          <span className="text-xs text-slate-400 dark:text-gray-400">Không có suất chiếu nào sắp tới</span>
        )}
      </div>

      {/* Legend */}
      {seats && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-gray-400">
              <div className={`w-5 h-5 rounded border ${val.cls}`} />
              <span>{val.label}</span>
              {counts?.[key] !== undefined && (
                <span className="font-bold text-slate-800 dark:text-gray-200">({counts[key]})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Seat map */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-red-600 border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-auto border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-800">
          <div className="inline-block min-w-full">
            <div className="h-5 bg-slate-200 dark:bg-gray-600 rounded mb-3 flex items-center justify-center text-slate-400 dark:text-gray-400 text-[10px] font-bold tracking-widest uppercase">
              Màn hình
            </div>
            {seatMatrix.map((row, ri) => (
              <div key={ri} className="flex gap-1 mb-1 items-center">
                <span className="w-5 text-xs text-slate-400 dark:text-gray-400 font-bold text-center shrink-0">
                  {row[0]?.label?.[0] || ""}
                </span>
                {row.map((cell, ci) => (
                  cell.type === "aisle" ? (
                    <div key={ci} className="w-8 h-8" />
                  ) : (
                    <div
                      key={ci}
                      title={seats ? `${cell.label} · ${seats[cell.label] ? STATUS[seats[cell.label].isLocked ? "locked" : seats[cell.label].status]?.label : "Trống"}` : cell.label}
                      className={`w-8 h-8 rounded text-[9px] font-bold border flex items-center justify-center select-none transition-colors ${cellClass(cell)}`}
                    >
                      {cell.label.replace(/^[A-Z]/, "")}
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
