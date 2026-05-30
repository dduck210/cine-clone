import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Eye,
  Settings,
  Zap,
  RotateCcw,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast from "react-hot-toast";
import { ROOM_TYPE_STYLE } from "../../shared/constants";
import RoomDetailModal from "./RoomDetailModal";
import RoomModal from "./RoomModal";
import EmergencyCloseModal from "./EmergencyCloseModal";
import ReopenModal from "./ReopenModal";
import CinemaStatusDialog from "./CinemaStatusDialog";

const CINEMA_STATUS_META = {
  active: {
    label: "Đang hoạt động",
    badge: "bg-emerald-50 text-emerald-600 border-emerald-200",
    description: "Rạp đang hoạt động bình thường.",
  },
  incident: {
    label: "Bảo trì",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    description: "Rạp đang có sự cố cần xử lý.",
  },
};

// Main Rooms Manager tab
export const RoomsManager = ({ cinemas }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCinema, setSelectedCinema] = useState("");
  const [cinemaStatus, setCinemaStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showReopen, setShowReopen] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [statusConfirm, setStatusConfirm] = useState(null); // pending status string

  const selectedCinemaData =
    cinemas.find((cinema) => cinema._id === selectedCinema) || null;
  const visibleSelectedRooms = rooms.filter((room) =>
    selectedRoomIds.includes(room._id),
  );
  const selectedActiveRooms = visibleSelectedRooms.filter(
    (r) => r.status === "active",
  );
  const selectedMaintenanceRooms = visibleSelectedRooms.filter(
    (r) => r.status !== "active",
  );

  const getRoomCinemaId = (room) =>
    room?.cinema?._id || (typeof room?.cinema === "string" ? room.cinema : "") || "";
  const activeCinemaId = selectedCinema || getRoomCinemaId(selectedActiveRooms[0]);
  const activeCinemaName =
    selectedCinemaData?.name ||
    cinemas.find((c) => c._id === activeCinemaId)?.name ||
    "Rạp";
  const maintenanceCinemaId = selectedCinema || getRoomCinemaId(selectedMaintenanceRooms[0]);
  const maintenanceCinemaName =
    selectedCinemaData?.name ||
    cinemas.find((c) => c._id === maintenanceCinemaId)?.name ||
    "Rạp";

  const loadRooms = async (cinemaId) => {
    setLoading(true);
    try {
      const url = cinemaId
        ? `/admin/cinemas/${cinemaId}/rooms`
        : `/admin/rooms`;
      const res = await axiosInstance.get(url);
      setRooms(res.data);
      setSelectedRoomIds((prev) =>
        prev.filter((id) => res.data.some((room) => room._id === id)),
      );
      if (cinemaId && res.data.length > 0) {
        setCinemaStatus(
          res.data.some((r) => r.status === "active") ? "active" : "incident",
        );
      }
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(selectedCinema);
  }, [selectedCinema]);

  useEffect(() => {
    setCinemaStatus(selectedCinemaData?.status || "");
    setSelectedRoomIds([]);
  }, [selectedCinemaData?._id, selectedCinemaData?.status]);

  const handleOpenEdit = (room) => {
    setEditRoom(room);
    setShowModal(true);
  };

  const handleOpenCreate = () => {
    setEditRoom(null);
    setShowModal(true);
  };

  const toggleRoomSelection = (roomId) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const toggleSelectAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
      return;
    }
    setSelectedRoomIds(rooms.map((room) => room._id));
  };

  const handleCinemaStatusChange = (status) => {
    if (!selectedCinema || status === cinemaStatus) return;
    setStatusConfirm(status);
  };

  const executeStatusChange = async () => {
    const status = statusConfirm;
    setStatusConfirm(null);
    try {
      const res = await axiosInstance.patch(
        `/admin/cinemas/${selectedCinema}/status`,
        { status },
      );
      setCinemaStatus(status);
      let msg = "Đã cập nhật trạng thái rạp";
      if (status === "active") {
        msg = "Đã mở lại rạp · Tất cả phòng đã hoạt động";
      } else if (status === "incident") {
        const cancelled = res.data.cancelledShowtimes;
        msg =
          cancelled > 0
            ? `Rạp chuyển bảo trì · Đã huỷ ${cancelled} suất chiếu`
            : "Rạp chuyển bảo trì · Không có suất chiếu nào bị ảnh hưởng";
      }
      toast.success(msg);
      loadRooms(selectedCinema);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái rạp",
      );
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Quản Lý Phòng Chiếu
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Cấu hình ma trận ghế và loại ghế cho từng phòng
          </p>
        </div>
        <div className="flex gap-2">
          {selectedMaintenanceRooms.length > 0 && (
            <button
              onClick={() => setShowReopen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-emerald-200 shrink-0 text-sm"
            >
              <RotateCcw size={16} /> Mở {selectedMaintenanceRooms.length} phòng
            </button>
          )}
          {selectedActiveRooms.length > 0 && (
            <button
              onClick={() => setShowEmergency(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-amber-200 shrink-0 text-sm"
            >
              <Zap size={16} /> Đóng {selectedActiveRooms.length} phòng
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all duration-150 active:scale-95 hover:-translate-y-0.5 shadow-md shadow-red-200 shrink-0"
          >
            <Plus size={20} /> Thêm phòng
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
          Lọc theo rạp
        </label>
        <select
          value={selectedCinema}
          onChange={(e) => setSelectedCinema(e.target.value)}
          className="bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-red-50 focus:border-[#dc2626] font-medium text-slate-700 dark:text-white min-w-[240px]"
        >
          <option value="">Tất cả rạp</option>
          {cinemas.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCinemaData && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-4 space-y-4" style={{ animation: "panelIn 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-1">
                Trạng thái rạp
              </p>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedCinemaData.name}
                </h3>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).badge}`}
                >
                  {(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).label}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                {(CINEMA_STATUS_META[cinemaStatus] || CINEMA_STATUS_META.active).description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CINEMA_STATUS_META).map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => handleCinemaStatusChange(value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95 ${cinemaStatus === value
                    ? meta.badge
                    : "bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-400 hover:border-slate-300 dark:hover:border-gray-500"
                    }`}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-gray-500 italic">
            {selectedCinema ? "Rạp này chưa có phòng nào" : "Chưa có phòng chiếu nào trong hệ thống"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-gray-700/80 border-b border-slate-200 dark:border-gray-700 text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
                  <th className="p-4 pl-6 w-14">
                    <input
                      type="checkbox"
                      checked={
                        rooms.length > 0 &&
                        selectedRoomIds.length === rooms.length
                      }
                      onChange={toggleSelectAllRooms}
                      className="w-4 h-4 accent-red-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 pl-6">Tên phòng</th>
                  <th className="p-4">Rạp</th>
                  <th className="p-4">Kích thước</th>
                  <th className="p-4">Tổng ghế</th>
                  <th className="p-4">Loại phòng</th>
                  <th className="p-4">Ma trận ghế</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody key={selectedCinema} className="divide-y divide-slate-100 dark:divide-gray-700">
                {rooms.map((room, idx) => {
                  const hasMatrix =
                    room.seatMatrix && room.seatMatrix.length > 0;
                  const typeCount = hasMatrix
                    ? { normal: 0, vip: 0, couple: 0 }
                    : null;
                  if (typeCount) {
                    for (const row of room.seatMatrix) {
                      for (const cell of row) {
                        if (cell?.type && typeCount[cell.type] !== undefined)
                          typeCount[cell.type]++;
                      }
                    }
                  }
                  return (
                    <tr
                      key={room._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all duration-150 cursor-pointer"
                      style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}
                      onClick={() => setDetailRoom(room)}
                    >
                      <td
                        className="p-4 pl-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoomIds.includes(room._id)}
                          onChange={() => toggleRoomSelection(room._id)}
                          className="w-4 h-4 accent-red-600 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 pl-6 font-bold text-slate-800 dark:text-white">
                        {room.name}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-gray-400">
                        {room.cinema?.name
                          || cinemas.find((c) => c._id === (room.cinema?._id || room.cinema))?.name
                          || "—"}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-gray-400">
                        {room.rows} hàng × {room.cols} cột
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-gray-200">
                        {room.totalSeats} ghế
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${ROOM_TYPE_STYLE[room.roomType] || "bg-slate-100 text-slate-600 border border-slate-200"}`}
                        >
                          {room.roomType}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-gray-400">
                        {hasMatrix ? (
                          <div className="space-y-0.5">
                            <p>
                              <span className="text-slate-400 dark:text-gray-500">T:</span>{" "}
                              {typeCount.normal} ·{" "}
                              <span className="text-amber-500">V:</span>{" "}
                              {typeCount.vip} ·{" "}
                              <span className="text-pink-400">Đ:</span>{" "}
                              {typeCount.couple}
                            </p>
                          </div>
                        ) : (
                          <span className="text-orange-400 font-medium">
                            Chưa cấu hình
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${room.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${room.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}
                          ></span>
                          {room.status === "active" ? "Hoạt động" : "Bảo trì"}
                        </span>
                      </td>
                      <td
                        className="p-4 pr-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setDetailRoom(room)}
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-150 active:scale-90"
                            title="Xem chi tiết phòng"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(room)}
                            className="p-2 text-slate-400 dark:text-gray-500 hover:text-[#dc2626] hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-150 active:scale-90"
                            title="Cấu hình ghế"
                          >
                            <Settings size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailRoom && createPortal(
        <RoomDetailModal
          room={detailRoom}
          onClose={() => setDetailRoom(null)}
          onEdit={() => {
            handleOpenEdit(detailRoom);
            setDetailRoom(null);
          }}
        />,
        document.body
      )}

      {showModal && createPortal(
        <RoomModal
          room={editRoom}
          cinemas={cinemas}
          onClose={() => setShowModal(false)}
          onSaved={() => loadRooms(selectedCinema)}
        />,
        document.body
      )}

      {showEmergency && createPortal(
        <EmergencyCloseModal
          cinemaId={activeCinemaId}
          cinemaName={activeCinemaName}
          selectedRooms={selectedActiveRooms}
          onClose={() => setShowEmergency(false)}
          onDone={() => {
            if (selectedCinema) setCinemaStatus("incident");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />,
        document.body
      )}

      {showReopen && createPortal(
        <ReopenModal
          cinemaId={maintenanceCinemaId}
          cinemaName={maintenanceCinemaName}
          selectedRooms={selectedMaintenanceRooms}
          onClose={() => setShowReopen(false)}
          onDone={(cinemaRestored) => {
            if (cinemaRestored && selectedCinema) setCinemaStatus("active");
            setSelectedRoomIds([]);
            loadRooms(selectedCinema);
          }}
        />,
        document.body
      )}

      {statusConfirm && createPortal(
        <CinemaStatusDialog
          status={statusConfirm}
          cinemaName={selectedCinemaData?.name || "Rạp"}
          onConfirm={executeStatusChange}
          onCancel={() => setStatusConfirm(null)}
        />,
        document.body
      )}
    </div>
  );
};
