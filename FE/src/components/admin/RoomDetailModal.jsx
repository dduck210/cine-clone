import React from "react";
import { X, Settings } from "lucide-react";
import { ROOM_TYPE_STYLE } from "../../shared/constants";
import { generateMatrixFromTotalSeats } from "../../shared/utils";
import { MatrixView } from "./MatrixEditor";

const RoomDetailModal = ({ room, onClose, onEdit }) => {
  const hasMatrix = room.seatMatrix?.length > 0;
  const matrix = hasMatrix
    ? room.seatMatrix
    : generateMatrixFromTotalSeats(room.totalSeats || 80).matrix;
  const typeCount = { normal: 0, vip: 0, couple: 0 };
  for (const r of matrix)
    for (const cell of r)
      if (cell?.type && typeCount[cell.type] !== undefined)
        typeCount[cell.type]++;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{room.name}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
              Chi tiết phòng chiếu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 shadow-md shadow-red-200"
            >
              <Settings size={14} /> Cấu hình ghế
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-all duration-150 active:scale-90"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Info row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Loại phòng", isRoomType: true },
              {
                label: "Kích thước",
                value: `${matrix.length} hàng × ${matrix[0]?.length || 0} cột`,
              },
              { label: "Tổng ghế", value: `${room.totalSeats} ghế` },
              {
                label: "Trạng thái",
                value: room.status === "active" ? "Hoạt động" : "Bảo trì",
                isStatus: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-100 dark:border-gray-600"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1">
                  {item.label}
                </p>
                {item.isRoomType ? (
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}
                  >
                    {room.roomType}
                  </span>
                ) : item.isStatus ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                    />
                    {item.value}
                  </span>
                ) : (
                  <p className="font-bold text-slate-800 dark:text-white">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Seat type breakdown */}
          {typeCount && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-200 dark:border-gray-600 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1">
                  Ghế Thường
                </p>
                <p className="text-2xl font-black text-slate-700 dark:text-gray-200">
                  {typeCount.normal}
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                  Ghế VIP
                </p>
                <p className="text-2xl font-black text-amber-600">
                  {typeCount.vip}
                </p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 mb-1">
                  Ghế Đôi
                </p>
                <p className="text-2xl font-black text-pink-600">
                  {typeCount.couple}
                </p>
              </div>
            </div>
          )}

          {/* Seat map */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                Sơ đồ ghế
              </p>
              {!hasMatrix && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-full">
                  Mặc định · chưa cấu hình loại ghế
                </span>
              )}
            </div>
            <div className="border border-slate-200 dark:border-gray-700 rounded-xl p-4 bg-slate-50 dark:bg-gray-700 overflow-auto">
              <MatrixView matrix={matrix} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetailModal;
