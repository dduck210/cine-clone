import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { EventSourcePolyfill } from "event-source-polyfill";
import axiosInstance from "../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import { usePushSubscription } from "../hooks/usePushSubscription";
import TicketCard from "../components/ticket/TicketCard";

const TicketPage = () => {
  const { bookingCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ticketStatus, setTicketStatus] = useState(null);
  const [sseConnected, setSseConnected] = useState(false);

  const isPaid = ticket?.status === "paid";
  const isPrinted = ticketStatus === "printed" && isPaid;
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
    console.log('[SSE] connecting to:', streamUrl);

    const es = import.meta.env.VITE_API_URL
      ? new EventSourcePolyfill(streamUrl, {
        headers: { "ngrok-skip-browser-warning": "true" },
      })
      : new EventSource(streamUrl);

    es.onopen = () => { console.log('[SSE] connected'); setSseConnected(true); };
    es.addEventListener("ticket_printed", () => {
      setTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 2000 });
    });
    es.onerror = (err) => {
      console.error('[SSE] error:', streamUrl, err);
      setSseConnected(false);
    };

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
        <TicketCard
          bookingCode={ticket.bookingCode}
          movieTitle={ticket.movieTitle}
          cinemaName={ticket.cinemaName}
          roomName={ticket.roomName}
          showDate={ticket.showDate}
          showTime={ticket.showTime}
          seats={ticket.seatNumbers}
          totalPrice={ticket.totalPrice}
          combos={ticket.extraItems}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-8 px-4">
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
        <p className={`text-xs font-bold ${sseConnected ? 'text-emerald-500' : 'text-red-400'}`}>
          {sseConnected ? '● Đã kết nối — vé sẽ tự cập nhật' : '○ Đang kết nối real-time...'}
        </p>
      </div>
    </div>
  );
};

export default TicketPage;
