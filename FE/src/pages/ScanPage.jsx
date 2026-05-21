import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeSVG } from "qrcode.react";
import toast, { Toaster } from "react-hot-toast";
import { Camera, CheckCircle, XCircle, Ticket, Home, Clock, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosConfig";

const ScanPage = () => {
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-scanner",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      false
    );
    scannerRef.current = scanner;

    scanner.render(
      async (text) => {
        const code = text.trim();
        scanner.clear().catch(() => {});
        setScanning(false);
        setLoading(true);

        try {
          const res = await axiosInstance.post("/tickets/scan", { bookingCode: code });
          setTicket(res.data.booking);
          if (res.data.message.includes("thành công")) {
            toast.success(res.data.message);
          }
        } catch (err) {
          setError(err.response?.data?.message || "Không thể quét vé này");
          toast.error(err.response?.data?.message || "Quét thất bại");
        } finally {
          setLoading(false);
        }
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  const handleRetry = () => {
    setTicket(null);
    setError(null);
    setScanning(true);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#dc2626] border-t-transparent" />
        <p className="text-white font-medium">Đang kiểm tra vé...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Vé không hợp lệ</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Camera size={18} /> Quét lại
          </button>
          <Link to="/" className="block mt-3 text-gray-400 hover:text-gray-600 text-sm">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  // Show ticket result
  if (ticket) {
    const isPrinted = ticket.ticketStatus === "printed";
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className={`p-6 text-center ${isPrinted ? "bg-emerald-500" : "bg-[#dc2626]"}`}>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              {isPrinted ? <CheckCircle className="w-10 h-10 text-white" /> : <Ticket className="w-10 h-10 text-white" />}
            </div>
            <h2 className="text-white font-black text-xl">{isPrinted ? "Vé hợp lệ" : "Vé đã được in"}</h2>
            <p className="text-white/80 text-sm mt-1">{isPrinted ? "Chúc bạn xem phim vui vẻ!" : "Vé này đã được xác nhận trước đó"}</p>
          </div>

          {/* Ticket card */}
          <div className="p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Mã vé</span>
              <span className="font-mono font-bold text-[#dc2626] text-sm">{ticket.bookingCode}</span>
            </div>
            <hr className="border-dashed border-gray-200" />
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Phim</span>
              <span className="font-bold text-gray-900 text-sm text-right">{ticket.movieTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Rạp</span>
              <span className="text-gray-700 text-sm">{ticket.cinemaName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Suất chiếu</span>
              <span className="text-gray-700 text-sm">{ticket.showDate} - {ticket.showTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Phòng</span>
              <span className="text-gray-700 text-sm">{ticket.roomName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Ghế</span>
              <span className="font-bold text-[#dc2626] text-sm">{ticket.seatNumbers?.join(", ")}</span>
            </div>
            {ticket.userName && (
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Khách hàng</span>
                <span className="text-gray-700 text-sm">{ticket.userName}</span>
              </div>
            )}
            <hr className="border-dashed border-gray-200" />
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-400 text-xs uppercase tracking-widest font-bold">Tổng tiền</span>
              <span className="font-black text-[#dc2626] text-lg">{ticket.totalPrice?.toLocaleString()} đ</span>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center pt-3">
              <QRCodeSVG value={ticket.bookingCode} size={100} bgColor="transparent" fgColor="#111827" level="M" />
              <p className="text-[10px] text-gray-400 mt-2">{ticket.bookingCode}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-gray-100 flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 bg-[#dc2626] hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Camera size={18} /> Quét vé khác
            </button>
            <Link
              to="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Home size={18} /> Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Scanner view (default)
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#dc2626]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ScanLine className="w-10 h-10 text-[#dc2626]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Quét vé tự động</h1>
        <p className="text-gray-400">Đưa mã QR trên email hoặc điện thoại vào camera</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
        <div className="p-4">
          <div id="qr-scanner" className="w-full rounded-xl overflow-hidden" />
        </div>
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-400 text-center">
            Hệ thống sẽ tự động in vé và hiển thị thông tin
          </p>
        </div>
      </div>

      <Link to="/" className="mt-6 text-gray-400 hover:text-white text-sm flex items-center gap-1">
        <Home size={14} /> Về trang chủ
      </Link>
    </div>
  );
};

export default ScanPage;
