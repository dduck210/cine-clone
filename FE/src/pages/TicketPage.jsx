import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle } from "lucide-react";
import { EventSourcePolyfill } from "event-source-polyfill";
import axiosInstance from "../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import { usePushSubscription } from "../hooks/usePushSubscription";

const TicketPage = () => {
  const { bookingCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);

  const isPrinted = ticketStatus === "printed";
  usePushSubscription(isPrinted ? null : bookingCode);

  useEffect(() => {
    axiosInstance
      .get(`/tickets/view/${bookingCode}`)
      .then((res) => {
        setTicket(res.data);
        setTicketStatus(res.data.ticketStatus);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Không tìm thấy vé"),
      )
      .finally(() => setLoading(false));
  }, [bookingCode]);

  // SSE: auto-update khi admin scan
  useEffect(() => {
    if (!ticket?.bookingId || ticketStatus === "printed") return;

    const apiBase =
      import.meta.env.VITE_API_URL ||
      `http://${window.location.hostname}:5000/api`;
    const streamUrl = `${apiBase}/bookings/${ticket.bookingId}/stream`;

    const es = import.meta.env.VITE_API_URL
      ? new EventSourcePolyfill(streamUrl, {
          headers: { "ngrok-skip-browser-warning": "true" },
        })
      : new EventSource(streamUrl);

    es.addEventListener("ticket_printed", () => {
      setTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 5000 });
    });

    es.onerror = (err) => console.error("[SSE] error:", err);

    return () => es.close();
  }, [ticket, ticketStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#dc2626] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div>
          <p className="text-red-600 font-bold text-lg mb-2">
            Không tìm thấy vé
          </p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  if (isPrinted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-emerald-500 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white font-black text-xl">Vé hợp lệ</h2>
            <p className="text-white/80 text-sm mt-1">
              Chúc bạn xem phim vui vẻ!
            </p>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Mã vé
              </span>
              <span className="font-mono font-bold text-[#dc2626] text-sm">
                {ticket.bookingCode}
              </span>
            </div>
            <hr className="border-dashed border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Phim
              </span>
              <span className="font-bold text-gray-900 text-sm text-right max-w-[60%]">
                {ticket.movieTitle}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Rạp
              </span>
              <span className="text-gray-700 text-sm">{ticket.cinemaName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Suất chiếu
              </span>
              <span className="text-gray-700 text-sm">
                {ticket.showDate} — {ticket.showTime}
              </span>
            </div>
            {ticket.roomName && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                  Phòng
                </span>
                <span className="text-gray-700 text-sm">{ticket.roomName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Ghế
              </span>
              <span className="font-bold text-[#dc2626] text-sm">
                {ticket.seatNumbers?.join(", ")}
              </span>
            </div>
            <hr className="border-dashed border-gray-200" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                Tổng tiền
              </span>
              <span className="font-black text-[#dc2626] text-lg">
                {ticket.totalPrice?.toLocaleString()} đ
              </span>
            </div>
            <div className="flex flex-col items-center pt-3">
              <QRCodeSVG
                value={ticket.bookingCode}
                size={100}
                bgColor="transparent"
                fgColor="#111827"
                level="M"
              />
              <p className="text-[10px] text-gray-400 mt-2">
                {ticket.bookingCode}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-8 px-4">
      <Toaster position="top-center" />
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center gap-5">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-black text-center">
          Đưa mã QR này cho nhân viên rạp xác nhận
        </p>
        <QRCodeSVG
          value={`${window.location.origin}/ticket/${ticket.bookingCode}`}
          size={200}
          bgColor="transparent"
          fgColor="#111827"
          level="M"
        />
        <p className="font-mono font-bold text-gray-700 text-sm tracking-[0.2em] uppercase">
          {ticket.bookingCode}
        </p>
      </div>
    </div>
  );
};

export default TicketPage;
