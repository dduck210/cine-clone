import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  Smartphone, Ticket, MapPin, Calendar, Armchair, Clock,
  CheckCircle, ArrowLeft,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";

const MomoPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    bookingId, bookingCode, payUrl, deeplink, qrCodeUrl, amount,
    movieTitle, cinemaName, showTime, showDate, selectedSeats, duration, poster,
  } = location.state || {};

  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const pollRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) { navigate("/"); return; }

    // Start polling
    pollRef.current = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/payments/momo/status/${bookingId}`);
        if (res.data.paid) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIsPaid(true);
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev === 1) {
                clearInterval(timer);
                navigate("/payment-success", {
                  state: { ...location.state, orderId: bookingCode, bookingId, paymentMethod: "momo" },
                });
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch { /* ignore */ }
    }, 2000);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />

      {/* ── Paid overlay ── */}
      {isPaid && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <CheckCircle className="w-11 h-11 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Thanh toán thành công!</h2>
              <p className="text-emerald-100 text-sm font-medium">Vé của bạn đã được xác nhận</p>
            </div>
            <div className="px-6 pb-6 pt-4">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((3 - countdown) / 3) * 100}%` }} />
              </div>
              <p className="text-center text-slate-400 text-xs font-medium">Đang chuyển đến trang vé ({countdown}s)...</p>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-lg mx-auto px-4 pt-24 pb-20">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-6 transition-colors">
          <ArrowLeft size={18} /> Quay lại
        </button>

        {/* ── MoMo Payment Card ── */}
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#AE2070] to-[#C41E6B] px-6 py-6 text-center text-white">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
                <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.2" />
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="Arial">MoMo</text>
              </svg>
              <h2 className="text-xl font-black">Ví MoMo</h2>
            </div>
            <p className="text-white/70 text-xs">Quét mã QR bằng app MoMo để thanh toán</p>
          </div>

          <div className="p-6">
            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="MoMo QR" className="w-48 h-48"
                    onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <QRCodeSVG
                    value={payUrl || ''}
                    size={192}
                    level="M"
                    includeMargin
                  />
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-medium mb-1">Số tiền thanh toán</p>
              <p className="text-3xl font-black text-[#AE2070]">{amount?.toLocaleString()}đ</p>
            </div>

            {/* Direct Pay Button (Mobile & Desktop Link) */}
            {(deeplink || payUrl) && (
              <a
                href={deeplink || payUrl}
                target="_self"
                className="w-full bg-[#AE2070] hover:bg-[#8f1a5c] text-white font-black py-4.5 rounded-2xl shadow-[0_15px_30px_rgba(174,32,112,0.3)] transition-all duration-300 text-sm uppercase tracking-widest flex items-center justify-center gap-3 mb-6 active:scale-95 transform hover:-translate-y-1"
              >
                <Smartphone size={20} className="animate-bounce" />
                Mở ứng dụng MoMo
              </a>
            )}

            {/* Instructions */}
            <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 mb-4 text-center">
              <Smartphone size={28} className="text-[#AE2070] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#AE2070] mb-1">Mở App MoMo để thanh toán</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Dùng app <span className="font-bold text-[#AE2070]">MoMo</span> trên điện thoại, chọn <span className="font-bold">quét mã QR</span> và quét mã bên trên để thanh toán.
              </p>
            </div>

            {/* Polling */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs py-2">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang đợi thanh toán từ MoMo...
            </div>
          </div>
        </div>

        {/* ── Booking Summary ── */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 p-6 mt-5">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Ticket size={20} className="text-[#dc2626]" />
            Thông tin đặt vé
          </h3>
          <div className="space-y-4">
            {poster && (
              <div className="flex gap-4 items-center">
                <img src={poster} alt="" className="w-16 h-24 object-cover rounded-xl shadow-md" />
                <div>
                  <p className="font-black text-slate-800 text-lg leading-tight">{movieTitle}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cinemaName}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Suất chiếu</p>
                  <p className="font-bold text-slate-800 text-sm">{showTime}</p>
                  <p className="text-xs text-slate-500">{showDate}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <Armchair size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ghế</p>
                  <p className="font-black text-[#dc2626] text-sm">{selectedSeats?.join(", ")}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rạp</p>
                <p className="font-bold text-slate-800 text-sm">{cinemaName}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MomoPaymentPage;
