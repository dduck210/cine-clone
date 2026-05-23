import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import { Calendar, MapPin, Clock, Ticket, ChevronRight, CreditCard, Printer } from "lucide-react";

const BOOKING_STATUS = {
  pending:   { label: "Chờ thanh toán", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "bg-amber-500" },
  paid:      { label: "Đã thanh toán",  bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "bg-green-500" },
  cancelled: { label: "Đã hủy",         bg: "bg-red-100",   text: "text-red-600",   border: "border-red-300",   dot: "bg-red-500" },
  expired:   { label: "Hết hạn",        bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-300", dot: "bg-slate-400" },
  refunded:  { label: "Đã hoàn tiền",   bg: "bg-blue-100",  text: "text-blue-600",  border: "border-blue-300",  dot: "bg-blue-500" },
};

const TICKET_STATUS = {
  not_printed: { label: "Chưa in vé", bg: "bg-orange-100", text: "text-orange-600", border: "border-orange-300", dot: "bg-orange-400" },
  printed:     { label: "Đã in vé",   bg: "bg-teal-100",   text: "text-teal-600",   border: "border-teal-300",   dot: "bg-teal-500" },
};

const tabs = [
  { id: "all",       label: "Tất cả" },
  { id: "pending",   label: "Chờ thanh toán" },
  { id: "paid",      label: "Đã thanh toán" },
  { id: "cancelled", label: "Đã hủy" },
  { id: "expired",   label: "Hết hạn" },
  { id: "refunded",  label: "Đã hoàn" },
];

const StatusBadge = ({ config, label, icon: Icon }) => (
  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${config.bg} ${config.text} ${config.border}`}>
    {Icon && <Icon size={12} />}
    {label || config.label}
  </div>
);

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    axiosInstance.get("/bookings/user/all")
      .then((res) => setBookings(res.data))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filteredBookings = activeTab === "all"
    ? bookings
    : bookings.filter((b) => b.status === activeTab);

  const handleViewDetail = async (booking) => {
    const showtime = booking.showtime || {};
    const movie = showtime.movie || {};
    const cinema = showtime.cinema || {};

    let roomName = showtime.room?.name || "";
    if (!roomName && showtime._id) {
      try {
        const res = await axiosInstance.get(`/showtimes/${showtime._id}`);
        roomName = res.data?.data?.room?.name || "";
      } catch {}
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
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 border-l-4 border-red-600 pl-4">Vé của tôi</h1>
          <p className="text-gray-500 pl-5">Quản lý và xem lại lịch sử đặt vé của bạn.</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
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
          <div className="border-l border-gray-100 pl-6">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
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
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse flex gap-6">
                <div className="w-24 h-36 bg-gray-200 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
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
              const bStatus = BOOKING_STATUS[booking.status] || BOOKING_STATUS.cancelled;
              const tStatus = booking.status === "paid" ? (TICKET_STATUS[booking.ticketStatus] || TICKET_STATUS.not_printed) : null;

              return (
                <div
                  key={booking._id}
                  onClick={() => handleViewDetail(booking)}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-red-200 transition-all cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute right-0 top-0 w-2 h-full bg-red-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

                  {/* Status bar on top */}
                  <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b border-dashed border-gray-100">
                    <div className="flex items-center gap-3">
                      {/* Booking status */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                          <CreditCard size={10} /> Đơn hàng
                        </span>
                        <StatusBadge config={bStatus} />
                      </div>

                      {/* Ticket status — only for paid */}
                      {tStatus && (
                        <>
                          <span className="text-gray-200 text-lg">|</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                              <Printer size={10} /> Vé
                            </span>
                            <StatusBadge config={tStatus} icon={tStatus === TICKET_STATUS.printed ? Printer : undefined} />
                          </div>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 font-mono hidden sm:block">
                      #{booking.bookingCode || booking._id?.slice(-8)}
                    </p>
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6">
                    <div className="w-full sm:w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-200 shadow-sm">
                      {movie.poster ? (
                        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <Ticket size={28} className="text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-red-600 transition-colors mb-3">
                        {movie.title || "Phim"}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-red-600 shrink-0" />
                          <span className="truncate">{cinema.name || "5Cine"}{room ? ` — ${room}` : ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket size={14} className="text-red-600 shrink-0" />
                          Ghế: <span className="font-bold text-gray-900">{booking.seatNumbers?.join(", ")}</span>
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

                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-400 font-mono sm:hidden">
                          #{booking.bookingCode || booking._id?.slice(-8)}
                        </p>
                        <div className="flex items-center gap-2 text-red-600 font-bold ml-auto">
                          {booking.totalPrice?.toLocaleString()} đ
                          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <Ticket size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Chưa có vé nào ở mục này.</p>
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
