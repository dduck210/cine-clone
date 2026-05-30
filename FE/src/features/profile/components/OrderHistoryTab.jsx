import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, MapPin, Calendar } from "lucide-react";
import { getUserBookings } from "@/api/services/booking-service";

const statusMap = {
  paid: { label: "Đã thanh toán", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  pending: { label: "Chờ thanh toán", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  cancelled: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500" },
  expired: { label: "Đã hết hạn", bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400" },
  refunded: { label: "Đã hoàn tiền", bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200", dot: "bg-rose-500" },
};

const methodMap = {
  momo: { label: "MoMo", color: "text-[#AE2070] bg-[#AE2070]/10" },
  qr: { label: "MB Bank", color: "text-[#004C97] bg-[#004C97]/10" },
  cash: { label: "Tiền mặt", color: "text-gray-600 bg-gray-100" },
};

const OrderHistoryTab = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserBookings()
      .then((data) => setBookings(data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetail = (booking) => {
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const cinema = showtime.cinema || {};
    const sharedState = {
      movieTitle: movie.title || "Phim",
      cinemaName: cinema.name || "5Cine",
      roomName: showtime.room?.name || "",
      showTime: showtime.startTime || "",
      showDate: showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : "",
      showAddress: cinema.address || "",
      selectedSeats: booking.seatNumbers || [],
      combos: booking.extraItems || [],
      finalTotalPrice: booking.totalPrice,
      poster: movie.poster || "",
      duration: movie.duration || 0,
    };
    if (booking.status === "pending") {
      navigate("/payment", { state: { ...sharedState, existingBookingId: booking._id, existingBookingCode: booking.bookingCode } });
      return;
    }
    navigate("/payment-success", {
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

  const paidBookings = bookings.filter((b) => b.status === "paid" || b.status === "refunded");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white border-l-4 border-red-600 pl-3">Lịch sử giao dịch</h2>
        {paidBookings.length > 0 && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {paidBookings.length} giao dịch
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
        </div>
      ) : paidBookings.length === 0 ? (
        <div className="text-center py-16">
          <Ticket size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Bạn chưa có giao dịch nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paidBookings.map((b) => {
            const showtime = b.showtime || {};
            const movie = showtime.movie || {};
            const cinema = showtime.cinema || {};
            const status = statusMap[b.status] || { label: b.status, bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200", dot: "bg-gray-400" };
            const dateStr = showtime.date ? new Date(showtime.date).toLocaleDateString("vi-VN") : null;
            return (
              <div
                key={b._id}
                onClick={() => handleViewDetail(b)}
                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 hover:bg-red-50/60 dark:hover:bg-red-900/20 border border-gray-100 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-700 rounded-2xl cursor-pointer transition-all group"
              >
                <div className="w-10 h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 shadow-sm">
                  {movie.poster
                    ? <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full flex items-center justify-center"><Ticket size={16} className="text-gray-400" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-white text-sm truncate group-hover:text-red-600 transition-colors">{movie.title || "—"}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} /> {cinema.name || "—"}</span>
                    {dateStr && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> {dateStr}{showtime.startTime ? ` · ${showtime.startTime}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-gray-300 dark:text-gray-500 mt-1 truncate">#{b.bookingCode || b._id?.toString().slice(-8)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {b.status === "refunded" ? (
                    <span className="font-black text-rose-600 text-sm">Đã hoàn {(b.refundAmount || Math.round(b.totalPrice * 0.8)).toLocaleString()}đ</span>
                  ) : (
                    <span className="font-black text-gray-800 dark:text-white text-sm">{b.totalPrice?.toLocaleString()}đ</span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[11px] font-bold ${status.bg} ${status.text} ${status.border}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />{status.label}
                  </span>
                  {b.paymentId?.method && methodMap[b.paymentId.method] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${methodMap[b.paymentId.method].color}`}>
                      {methodMap[b.paymentId.method].label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTab;
