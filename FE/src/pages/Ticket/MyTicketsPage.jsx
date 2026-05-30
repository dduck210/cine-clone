import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import { Calendar, MapPin, Clock, Ticket, ChevronRight, CreditCard, Printer, X, AlertTriangle, Ban, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

const BOOKING_STATUS = {
  pending: { label: "Chờ thanh toán", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" },
  paid: { label: "Đã thanh toán", bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" },
  cancelled: { label: "Đã hủy", bg: "bg-red-100", text: "text-red-500", border: "border-red-300", dot: "bg-red-400" },
  expired: { label: "Hết hạn", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-300", dot: "bg-slate-400" },
  refunded: { label: "Đã hoàn tiền", bg: "bg-rose-100", text: "text-rose-600", border: "border-rose-300", dot: "bg-rose-500" },
};

// Payment status (separate from booking status for refund granularity)
const PAYMENT_STATUS = {
  paid: { label: "Đã thanh toán", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: CreditCard },
  refunded: { label: "Đã hoàn tiền", bg: "bg-rose-100", text: "text-rose-600", border: "border-rose-300", dot: "bg-rose-500", icon: Undo2 },
  refund_pending: { label: "Đang hoàn tiền", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500 animate-pulse", icon: Clock },
  refund_failed: { label: "Hoàn tiền thất bại", bg: "bg-red-100", text: "text-red-600", border: "border-red-300", dot: "bg-red-500", icon: Ban },
};

const TICKET_STATUS = {
  not_printed: { label: "Chưa in vé", bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-300", dot: "bg-orange-400" },
  printed: { label: "Đã in vé", bg: "bg-teal-100", text: "text-teal-600", border: "border-teal-300", dot: "bg-teal-500" },
};

const tabs = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Chờ thanh toán" },
  { id: "paid", label: "Đã thanh toán" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "expired", label: "Hết hạn" },
  { id: "refunded", label: "Đã hoàn" },
];

const StatusBadge = ({ config, icon: Icon }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${config.bg} ${config.text} ${config.border}`}>
    {Icon && <Icon size={12} />}
    {config.label}
  </div>
);

// Compute showtime datetime
function getShowtimeDateTime(showtime) {
  if (!showtime?.date || !showtime?.startTime) return null;
  const [h, m] = showtime.startTime.split(':').map(Number);
  const d = new Date(showtime.date);
  d.setHours(h, m, 0, 0);
  return d;
}

// Detail page: only paid bookings (printed or not_printed)
function canViewDetail(booking) {
  if (booking.status !== 'paid') {
    const reasons = {
      pending: 'Vui lòng thanh toán để xem chi tiết',
      expired: 'Đơn đã hết hạn',
      cancelled: 'Đơn đã bị hủy',
      refunded: 'Vé đã được hoàn tiền',
    };
    return { allowed: false, reason: reasons[booking.status] || 'Không thể xem chi tiết' };
  }
  return { allowed: true };
}

// Refund: paid + not_printed + 2+ hours before showtime
function canRefund(booking) {
  if (booking.status !== 'paid') return { allowed: false, reason: '' };
  if (booking.ticketStatus === 'printed') return { allowed: false, reason: 'Vé đã được in' };

  const st = getShowtimeDateTime(booking.showtime);
  if (!st) return { allowed: false, reason: '' };

  const now = new Date();
  if (now >= st) return { allowed: false, reason: 'Suất chiếu đã bắt đầu' };

  const deadline = new Date(st.getTime() - 2 * 60 * 60 * 1000);
  if (now > deadline) {
    const minsLeft = Math.round((st - now) / 60000);
    return { allowed: false, reason: `Còn ${minsLeft} phút trước giờ chiếu (cần trước 2h)` };
  }

  return { allowed: true, reason: '' };
}

// Print: paid + not_printed only
function canPrint(booking) {
  if (booking.status !== 'paid') return { allowed: false };
  if (booking.ticketStatus === 'printed') return { allowed: false };
  return { allowed: true };
}

// ── Confirm Modal ──
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose, loading, children }) =>
  createPortal(
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 dark:border-gray-700" style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full text-slate-400 dark:text-gray-400"><X size={18} /></button>
        </div>
        {children || <p className="text-slate-500 dark:text-gray-400 text-sm mb-5">{message}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-600 dark:text-gray-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">Hủy</button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50 ${confirmClass}`}>
            {loading ? "Đang xử lý..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [confirmCancel, setConfirmCancel] = useState(null); // { booking, type: 'cancel'|'refund' }
  const [acting, setActing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchBookings();
  }, [navigate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/bookings/user/all");
      setBookings(res.data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  // ── Cancel pending booking ──
  const handleCancelPending = async () => {
    if (!confirmCancel) return;
    setActing(true);
    try {
      await axiosInstance.put(`/bookings/${confirmCancel.booking._id}/cancel`);
      toast.success("Đã hủy đơn hàng");
      setConfirmCancel(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Hủy thất bại");
    } finally {
      setActing(false);
    }
  };

  // ── Refund paid booking ──
  const handleRefund = async () => {
    if (!confirmCancel) return;
    setActing(true);
    try {
      const res = await axiosInstance.put(`/bookings/${confirmCancel.booking._id}/cancel`);
      toast.success(res.data?.message || "Đã hoàn vé");
      setConfirmCancel(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Hoàn vé thất bại");
    } finally {
      setActing(false);
    }
  };

  const handleViewDetail = async (booking) => {
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const cinema = showtime.cinema || {};

    let roomName = showtime.room?.name || "";
    if (!roomName && showtime._id) {
      try {
        const res = await axiosInstance.get(`/showtimes/${showtime._id}`);
        roomName = res.data?.data?.room?.name || "";
      } catch { }
    }

    const sharedState = {
      movieTitle: movie.title || "Phim",
      cinemaName: cinema.name || "5Cine",
      roomName,
      showTime: showtime.startTime || "",
      showDate: showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "",
      showAddress: cinema.address || "",
      selectedSeats: booking.seatNumbers || [],
      finalTotalPrice: booking.totalPrice,
      poster: movie.poster || "",
      combos: booking.extraItems || [],
      duration: movie.duration || 0,
    };

    if (booking.status === "pending") {
      navigate("/payment", {
        state: { ...sharedState, existingBookingId: booking._id, existingBookingCode: booking.bookingCode },
      });
      return;
    }

    navigate("/ticket-detail", {
      state: {
        ...sharedState,
        orderId: booking.bookingCode,
        bookingId: booking._id,
        isHistoryMode: true,
        bookingStatus: booking.status,
        ticketStatus: booking.ticketStatus || "not_printed",
        paymentMethod: booking.paymentId?.method || "",
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 font-sans text-gray-900 dark:text-white">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <Navbar />

      {/* Cancel modal */}
      {confirmCancel?.type === 'cancel' && (
        <ConfirmModal
          title="Xác nhận hủy đơn hàng"
          confirmLabel="Hủy đơn"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleCancelPending}
          onClose={() => setConfirmCancel(null)}
          loading={acting}
        >
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-5">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm font-bold text-amber-800">Bạn có chắc muốn hủy đơn này?</p>
            </div>
            <p className="text-xs text-amber-600">Ghế đã giữ sẽ được trả lại hệ thống.</p>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600 dark:text-gray-300 mb-2">
            <p><span className="font-medium">Mã đơn:</span> {confirmCancel.booking.bookingCode}</p>
            <p><span className="font-medium">Phim:</span> {confirmCancel.booking.showtime?.movie?.title || "—"}</p>
            <p><span className="font-medium">Tổng tiền:</span> <span className="font-bold text-red-600">{confirmCancel.booking.totalPrice?.toLocaleString()}đ</span></p>
          </div>
        </ConfirmModal>
      )}

      {/* Refund modal */}
      {confirmCancel?.type === 'refund' && (
        <ConfirmModal
          title="Xác nhận hoàn vé"
          confirmLabel="Xác nhận hoàn"
          confirmClass="bg-blue-600 hover:bg-blue-700"
          onConfirm={handleRefund}
          onClose={() => setConfirmCancel(null)}
          loading={acting}
        >
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-5">
            <div className="flex items-start gap-2 mb-2">
              <Undo2 size={16} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-sm font-bold text-blue-800">Điều kiện hoàn vé</p>
            </div>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
              <li>Hoàn vé trước giờ chiếu ít nhất 2 tiếng</li>
              <li>Hoàn 80% giá trị đơn hàng</li>
              <li>Sau khi hoàn, ghế sẽ được trả lại hệ thống</li>
            </ul>
          </div>
          <div className="space-y-1.5 text-sm text-slate-600 dark:text-gray-300 mb-2">
            <p><span className="font-medium">Mã đơn:</span> {confirmCancel.booking.bookingCode}</p>
            <p><span className="font-medium">Phim:</span> {confirmCancel.booking.showtime?.movie?.title || "—"}</p>
            <p>
              <span className="font-medium">Hoàn lại (80%):</span>{" "}
              <span className="font-bold text-blue-600">{Math.round(confirmCancel.booking.totalPrice * 0.8).toLocaleString()}đ</span>
              {" "}/{" "}
              <span className="text-slate-400 dark:text-gray-500 line-through">{confirmCancel.booking.totalPrice?.toLocaleString()}đ</span>
            </p>
          </div>
        </ConfirmModal>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 border-l-4 border-red-600 pl-4">Vé của tôi</h1>
          <p className="text-gray-500 dark:text-gray-400 pl-5">Quản lý và xem lại lịch sử đặt vé của bạn.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                ? "bg-red-600 text-white shadow-md shadow-red-200"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-6 flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
              <CreditCard size={10} /> Trạng thái đơn hàng
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(BOOKING_STATUS).map(([key, val]) => (
                <span key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${val.bg} ${val.text} ${val.border}`}>
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />{val.label}
                </span>
              ))}
            </div>
          </div>
          <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
              <Printer size={10} /> Trạng thái vé (chỉ khi đã thanh toán)
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TICKET_STATUS).map(([key, val]) => (
                <span key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${val.bg} ${val.text} ${val.border}`}>
                  <span className={`w-2 h-2 rounded-full ${val.dot}`} />{val.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse flex gap-6">
                <div className="w-24 h-36 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.length > 0 ? filteredBookings.map((booking) => {
              const showtime = booking.showtime || {};
              const movie = showtime.movie || {};
              const cinema = showtime.cinema || {};
              const room = showtime.room?.name || "";
              const date = showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "";
              const bStatus = BOOKING_STATUS[booking.status] || BOOKING_STATUS.expired;
              const tStatus = booking.status === "paid" ? (TICKET_STATUS[booking.ticketStatus] || TICKET_STATUS.not_printed) : null;
              const refundCheck = canRefund(booking);
              const detailCheck = canViewDetail(booking);

              return (
                <div
                  key={booking._id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all group relative overflow-hidden ${detailCheck.allowed ? 'hover:shadow-lg hover:border-red-200 dark:hover:border-red-700' : 'opacity-70'}`}
                >
                  <div className="absolute right-0 top-0 w-2 h-full bg-red-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

                  {/* Status bar */}
                  <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-dashed border-gray-100 dark:border-gray-700">
                    <div className="flex flex-wrap items-center gap-2 gap-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <CreditCard size={10} /> Đơn hàng
                      </span>
                      <StatusBadge config={bStatus} />
                      {tStatus && (
                        <>
                          <span className="text-gray-200 text-lg">|</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Printer size={10} /> Vé
                          </span>
                          <StatusBadge config={tStatus} icon={tStatus === TICKET_STATUS.printed ? Printer : undefined} />
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono hidden sm:block">
                      #{booking.bookingCode || booking._id?.slice(-8)}
                    </p>
                  </div>

                  {/* Card body — detail click area */}
                  <div
                    onClick={() => detailCheck.allowed && handleViewDetail(booking)}
                    title={!detailCheck.allowed ? detailCheck.reason : ''}
                    className={`sm:flex sm:flex-row sm:gap-4 sm:p-6 ${detailCheck.allowed ? 'cursor-pointer' : ''}`}
                  >
                    <div className="w-full aspect-[2/3] sm:w-20 sm:h-28 sm:aspect-auto flex-shrink-0 overflow-hidden bg-gray-200 dark:bg-gray-600 sm:rounded-xl shadow-sm">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <Ticket size={28} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between p-4 sm:p-0">
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-red-600 transition-colors mb-3">
                        {movie.title || "Phim"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-red-600 shrink-0" />
                          <span className="truncate">{cinema.name || "5Cine"}{room ? ` — ${room}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={14} className="text-red-600 shrink-0" />
                          Ghế: <span className="font-bold text-gray-900 dark:text-white">{booking.seatNumbers?.join(", ")}</span>
                        </div>
                        {date && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-red-600 shrink-0" /> {date}
                          </div>
                        )}
                        {showtime.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-red-600 shrink-0" /> {showtime.startTime}
                          </div>
                        )}
                      </div>

                      {/* Refund info bar */}
                      {booking.status === "refunded" && (
                        <div className="mt-3 pt-2 border-t border-dashed border-rose-200 dark:border-rose-900/40">
                          <div className="flex items-center gap-4 text-xs text-rose-600">
                            <span className="flex items-center gap-1">
                              <Undo2 size={11} /> Đã hoàn {booking.refundAmount?.toLocaleString() || Math.round(booking.totalPrice * 0.8).toLocaleString()}đ
                            </span>
                            {booking.refundedAt && (
                              <span className="flex items-center gap-1 text-rose-400">
                                <Clock size={11} />
                                {new Date(booking.refundedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                {" — "}
                                {new Date(booking.refundedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                          {booking.refundReason && (
                            <p className="text-[11px] text-rose-400 mt-1">{booking.refundReason}</p>
                          )}
                        </div>
                      )}

                      {/* Action buttons & price */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {/* Pending: Pay + Cancel */}
                          {booking.status === "pending" && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(booking); }}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Thanh toán
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmCancel({ booking, type: 'cancel' }); }}
                                className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 hover:text-red-600 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold transition-colors"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {/* Paid: Refund if allowed */}
                          {booking.status === "paid" && refundCheck.allowed && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmCancel({ booking, type: 'refund' }); }}
                              className="px-3 py-1.5 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Undo2 size={12} /> Yêu cầu hoàn vé
                            </button>
                          )}

                          {/* Paid but can't refund → show reason */}
                          {booking.status === "paid" && !refundCheck.allowed && refundCheck.reason && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                              <Ban size={11} /> {refundCheck.reason}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 font-bold ml-auto">
                          {booking.status === "refunded" ? (
                            <span className="text-blue-600">
                              Đã hoàn {booking.refundAmount?.toLocaleString() || Math.round(booking.totalPrice * 0.8).toLocaleString()} đ
                            </span>
                          ) : (
                            <span className="text-red-600">
                              {booking.totalPrice?.toLocaleString()} đ
                            </span>
                          )}
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <Ticket size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có vé nào ở mục này.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyTicketsPage;
