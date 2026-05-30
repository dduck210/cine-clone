import React from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

const CinemaStatusDialog = ({ status, cinemaName, onConfirm, onCancel }) => {
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
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm border ${theme.border} overflow-hidden`}
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
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 flex gap-3">
              <AlertTriangle
                size={17}
                className="text-amber-500 shrink-0 mt-0.5"
              />
              <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
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
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex gap-3">
              <CheckCircle
                size={17}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <div className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
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
            className="px-4 py-2 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95"
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

export default CinemaStatusDialog;
