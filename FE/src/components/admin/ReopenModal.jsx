import React, { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";

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
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 dark:border-emerald-900 overflow-hidden"
        style={{ animation: "modalIn 0.28s cubic-bezier(0.22,1,0.36,1) both" }}
      >
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
          <div className="bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">
              Phòng sẽ được mở
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedRooms.map((room) => (
                <span
                  key={room._id}
                  className="px-2.5 py-1 bg-white dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-full text-xs font-bold text-slate-700 dark:text-gray-200"
                >
                  {room.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex gap-3">
            <RotateCcw size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium leading-relaxed">
              Các phòng đã chọn sẽ được chuyển về trạng thái{" "}
              <strong>hoạt động</strong>. Nếu tất cả phòng của rạp đều hoạt
              động, rạp cũng sẽ được khôi phục tự động.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
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

export default ReopenModal;
