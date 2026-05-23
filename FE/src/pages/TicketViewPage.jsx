import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Home, Ticket, Clock, CheckCircle, Camera } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../api/axiosConfig";

const TicketViewPage = () => {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!code) { setError("Thiếu mã vé"); setLoading(false); return; }

    axiosInstance.get(`/tickets/code/${code}`)
      .then((res) => {
        setTicket(res.data);
        setTicketStatus(res.data.ticketStatus);
      })
      .catch((err) => setError(err.response?.data?.message || "Không tìm thấy vé"))
      .finally(() => setLoading(false));
  }, [code]);

  // SSE listener: auto-update when admin scans at kiosk
  useEffect(() => {
    if (!ticket || ticketStatus === "printed") return;
    const bookingId = ticket._id;
    if (!bookingId) return;

    const streamUrl = `http://${window.location.hostname}:5000/api/bookings/${bookingId}/stream`;
    const es = new EventSource(streamUrl);

    es.addEventListener("ticket_printed", () => {
      setTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 2000 });
    });

    es.onerror = () => { };

    return () => es.close();
  }, [ticket, ticketStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#dc2626] border-t-transparent" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Không tìm thấy vé</h2>
          <p className="text-gray-500 mb-4">{error || "Mã vé không hợp lệ"}</p>
          <Link to="/" className="text-[#dc2626] font-bold hover:underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const isPaid = ticket.status === "paid";
  const isPrinted = ticketStatus === "printed";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="text-center mb-6">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isPrinted ? "bg-emerald-100" : isPaid ? "bg-amber-100" : "bg-red-100"
          }`}>
          {isPrinted ? <CheckCircle className="w-8 h-8 text-emerald-600" /> :
            isPaid ? <Clock className="w-8 h-8 text-amber-600" /> :
              <Ticket className="w-8 h-8 text-red-500" />}
        </div>
        <h1 className="text-2xl font-black text-gray-900">
          {isPrinted ? "Vé điện tử" : "Chi tiết đơn vé"}
        </h1>
        {isPaid && !isPrinted && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold">
            <Clock size={14} /> Vé điện tử đang chờ nhân viên rạp xác nhận
          </div>
        )}
        {isPrinted && (
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-bold">
            <CheckCircle size={14} /> Vé đã được xác nhận — chúc bạn xem phim vui vẻ!
          </div>
        )}
      </div>

      {/* Ticket Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-4">
        {/* Top stripe */}
        <div className="bg-gray-900 px-5 py-4 flex justify-between items-center">
          <div>
            <p className="text-white font-black text-lg">{ticket.cinemaName}</p>
            <p className="text-gray-400 text-xs">{ticket.roomName}</p>
          </div>
          <p className="font-mono font-bold text-[#dc2626] text-sm bg-white px-3 py-1 rounded-lg">{ticket.bookingCode}</p>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Phim</p>
            <p className="font-bold text-gray-900 text-lg">{ticket.movieTitle}</p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ngày</p>
              <p className="font-bold text-gray-800">{ticket.showDate ? new Date(ticket.showDate).toLocaleDateString("vi-VN") : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Giờ</p>
              <p className="font-bold text-gray-800">{ticket.showTime}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Ghế</p>
              <p className="font-bold text-[#dc2626]">{ticket.seatNumbers?.join(", ")}</p>
            </div>
          </div>
          {ticket.combos?.length > 0 && (
            <div className="border-t border-dashed border-gray-200 pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Combo</p>
              {ticket.combos.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} ×{item.quantity}</span>
                  <span className="font-bold text-gray-800">{(item.price * item.quantity).toLocaleString()}đ</span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Tổng tiền</span>
            <span className="font-black text-[#dc2626] text-xl">{ticket.totalPrice?.toLocaleString()} đ</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="border-t-2 border-dashed border-gray-300 px-5 py-4 flex flex-col items-center gap-2 bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Quét mã này tại quầy</p>
          <QRCodeSVG value={`${window.location.origin}/ticket/${ticket.bookingCode}`} size={120} bgColor="#ffffff" fgColor="#111827" level="M" />
          <p className="font-mono font-bold text-gray-500 text-[11px] tracking-[0.25em]">{ticket.bookingCode}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Home size={16} /> Trang chủ
        </Link>
        <Link to="/scan" className="flex-1 bg-[#dc2626] hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Camera size={16} /> Quét vé tại quầy
        </Link>
      </div>
    </div>
  );
};

export default TicketViewPage;
