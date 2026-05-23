import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import toast, { Toaster } from "react-hot-toast";
import { Camera, CheckCircle, XCircle, Ticket, Home, ScanLine, Keyboard, ImagePlus, CameraOff, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosConfig";
import TicketCard from "../components/ticket/TicketCard";

const ScanPage = () => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const qrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  // Guard: prevents duplicate calls when QR stays in frame across multiple scan frames
  const processingRef = useRef(false);

  const processCode = async (rawCode) => {
    const code = rawCode.trim();
    if (!code) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post("/tickets/scan", { bookingCode: code });
      setTicket(res.data.booking);
      if (res.data.message.includes("thành công")) toast.success(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xử lý mã vé này");
      toast.error(err.response?.data?.message || "Xử lý thất bại");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = async () => {
    if (!qrCodeRef.current) return;
    try { await qrCodeRef.current.stop(); } catch {}
    try { await qrCodeRef.current.clear(); } catch {}
    qrCodeRef.current = null;
  };

  const startCamera = async () => {
    processingRef.current = false;
    setCameraError(null);
    await stopCamera();

    const html5QrCode = new Html5Qrcode("qr-scanner");
    qrCodeRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          // Html5Qrcode fires this callback every frame the QR is visible — only process once
          if (processingRef.current) return;
          processingRef.current = true;
          await stopCamera();
          await processCode(text);
        },
        () => {}
      );
    } catch (err) {
      setCameraError(err?.message || "Không thể mở camera");
    }
  };

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, []);

  // Auto-restart camera when returning to scanner view from ticket/error
  useEffect(() => {
    if (!ticket && !error && !loading) {
      // Delay to let React render the #qr-scanner element first
      const t = setTimeout(() => startCamera(), 100);
      return () => clearTimeout(t);
    }
  }, [ticket, error, loading]);

  // Scan QR from uploaded image — works even without camera
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLoading(true);
    const tempScanner = new Html5Qrcode("qr-file-reader");
    try {
      const text = await tempScanner.scanFile(file, false);
      await processCode(text.trim());
    } catch {
      toast.error("Không tìm thấy mã QR trong ảnh. Vui lòng thử ảnh khác.");
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (processingRef.current) return;
    processingRef.current = true;
    await stopCamera();
    await processCode(manualCode);
    setManualCode("");
    processingRef.current = false;
  };

  const handleRetry = () => {
    setTicket(null);
    setError(null);
  };

  const handleSendHardCopy = async () => {
    if (!ticket?._id) return;
    setDownloadingPdf(true);
    try {
      const res = await axiosInstance.post(`/tickets/${ticket._id}/hard-copy`);
      toast.success(`Đã gửi vé đến email ${res.data.to || "khách hàng"}!`, { duration: 2000 });
    } catch {
      toast.error("Không thể gửi vé. Vui lòng thử lại.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#dc2626] border-t-transparent" />
        <p className="text-white font-medium">Đang kiểm tra vé...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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

  if (ticket) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 gap-4">
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
        <div className="w-full max-w-[360px] flex flex-col gap-2">
          <div className="flex gap-2">
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">

      {/* Hidden div required by Html5Qrcode.scanFile() */}
      <div id="qr-file-reader" className="hidden" />

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#dc2626]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ScanLine className="w-10 h-10 text-[#dc2626]" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Quét vé</h1>
        <p className="text-gray-400">Quét QR, tải ảnh, hoặc nhập mã thủ công</p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">

        {/* Camera area */}
        {cameraError && (
          <div className="p-6 text-center border-b border-gray-100">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CameraOff className="w-7 h-7 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-gray-700 mb-1">Camera không khả dụng</p>
            <p className="text-xs text-gray-400 mb-4">
              {cameraError.includes("in use") || cameraError.includes("NotReadable")
                ? "Camera đang bị ứng dụng khác sử dụng"
                : cameraError.includes("NotAllowed") || cameraError.includes("Permission")
                ? "Trình duyệt chưa được cấp quyền camera"
                : "Không thể mở camera"}
            </p>
            <button
              onClick={startCamera}
              className="text-xs text-[#dc2626] hover:underline font-bold flex items-center gap-1 mx-auto"
            >
              <Camera size={12} /> Thử lại camera
            </button>
          </div>
        )}
        {/* Always in DOM so Html5Qrcode can find #qr-scanner regardless of cameraError state */}
        <style>{`#qr-scanner video { height: 270px !important; object-fit: cover; width: 100% !important; }`}</style>
        <div className={cameraError ? "hidden" : "p-4"}>
          <div style={{ height: "270px", overflow: "hidden", borderRadius: "12px" }}>
            <div id="qr-scanner" className="w-full" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Đưa mã QR vào khung để tự động nhận diện
          </p>
        </div>

        {/* Upload QR image */}
        <div className="px-4 py-3 border-t border-gray-100">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm transition-colors"
          >
            <ImagePlus size={16} className="text-[#dc2626]" />
            Tải ảnh chụp mã QR
          </button>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            Chụp màn hình QR của khách rồi upload
          </p>
        </div>

        {/* Manual input */}
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 text-center mb-2 flex items-center justify-center gap-1">
            <Keyboard size={11} /> Hoặc nhập mã vé thủ công
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="VD: BK1234567890"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#dc2626]/30 focus:border-[#dc2626] uppercase"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="bg-[#dc2626] hover:bg-red-700 disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              OK
            </button>
          </form>
        </div>
      </div>

      <Link to="/" className="mt-6 text-gray-400 hover:text-white text-sm flex items-center gap-1">
        <Home size={14} /> Về trang chủ
      </Link>
    </div>
  );
};

export default ScanPage;
age;
