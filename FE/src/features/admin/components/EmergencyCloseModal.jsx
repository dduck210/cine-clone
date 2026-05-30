import React, { useState, useEffect } from "react";
import { X, Zap, AlertTriangle, Calendar, Ticket } from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import toast from "react-hot-toast";

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
    axiosInstance
      .post("/admin/emergency-close/rooms/preview", { cinemaId, roomIds })
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
      const res = await axiosInstance.post("/admin/emergency-close/rooms", { cinemaId, roomIds });
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
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-red-200 dark:border-red-900 overflow-hidden"
        style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}
      >
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
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-700 dark:text-red-400 font-bold text-sm mb-1">Không thể tải dữ liệu</p>
              <p className="text-red-500 dark:text-red-400 text-xs font-mono">{fetchError}</p>
              <button
                onClick={() => {
                  const retryRoomIds = roomIdsKey.split(",").filter(Boolean);
                  setLoading(true);
                  setFetchError(null);
                  axiosInstance
                    .post("/admin/emergency-close/rooms/preview", { cinemaId, roomIds: retryRoomIds })
                    .then((r) => setPreview(r.data))
                    .catch((e) => setFetchError(e.response?.data?.message || e.message))
                    .finally(() => setLoading(false));
                }}
                className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">Phòng được chọn</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRooms.map((room) => (
                    <span key={room._id} className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-full text-xs font-bold text-slate-700 dark:text-gray-200">
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
                <div className="max-h-48 overflow-y-auto border border-slate-100 dark:border-gray-700 rounded-xl divide-y divide-slate-50 dark:divide-gray-700">
                  {preview.showtimes.map((st) => (
                    <div key={st._id} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-gray-700">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-gray-100 line-clamp-1">{st.movieTitle}</p>
                        <p className="text-xs text-slate-400 dark:text-gray-500">
                          {st.roomName} · {new Date(st.date).toLocaleDateString("vi-VN")} {st.startTime}
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
                <div className="text-center py-4 text-slate-400 dark:text-gray-500 text-sm italic bg-slate-50 dark:bg-gray-700 rounded-xl border border-dashed border-slate-200 dark:border-gray-600">
                  Không có suất chiếu nào sắp tới cần hủy.
                </div>
              )}

              {/* Warning + confirm checkbox */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  Thao tác này <strong>không thể hoàn tác</strong>. Tất cả suất chiếu sắp tới trong các phòng đã chọn sẽ bị hủy và các đơn đã thanh toán sẽ được hoàn tiền tự động.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="w-4 h-4 accent-red-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                  Tôi hiểu và xác nhận đóng khẩn cấp các phòng đã chọn
                </span>
              </label>
            </>
          )}
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95">
            Hủy bỏ
          </button>
          <button
            onClick={handleClose}
            disabled={!confirmed || closing || loading || !!fetchError || preview?.totalShowtimes === 0}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-200"
          >
            {closing ? (
              <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Đang xử lý...</>
            ) : (
              <><Zap size={16} /> Xác nhận đóng phòng</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyCloseModal;
