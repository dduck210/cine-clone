import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  Smartphone, Ticket, MapPin, Calendar, Armchair, Clock,
  CheckCircle, ArrowLeft, ShieldCheck,
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

  // Manual check fallback
  const checkPaymentStatus = async () => {
    try {
      const res = await axiosInstance.get(`/payments/momo/status/${bookingId}`);
      if (res.data.paid) {
        if (pollRef.current) clearInterval(pollRef.current);
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
      } else {
        toast.error("Hệ thống chưa nhận được thanh toán. Vui lòng đợi trong giây lát!", { id: "check-pay" });
      }
    } catch {
      toast.error("Có lỗi xảy ra khi kiểm tra trạng thái.");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) { navigate("/"); return; }

    // Start polling
    pollRef.current = setInterval(checkPaymentStatus, 2000);

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

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* ── LEFT: CINEMATIC RECEIPT ── */}
          <div className="lg:w-[45%] flex">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative">
              <div className="bg-[#AE2070] p-8 text-center text-white relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                     <Ticket size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Xác nhận đặt vé</h2>
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Hóa đơn điện tử #5CINE-{bookingCode}</p>
                
                {/* Receipt cut effect */}
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-4">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-white rounded-full" />
                  ))}
                </div>
              </div>

              <div className="p-8 pt-10 flex-1">
                <div className="flex gap-5 mb-8">
                  {poster && (
                    <img src={poster} alt="" className="w-24 h-36 object-cover rounded-2xl shadow-xl border-2 border-slate-50 shrink-0" />
                  )}
                  <div className="flex-1 py-1">
                    <h3 className="font-black text-slate-900 text-2xl leading-[1.1] mb-3 uppercase tracking-tighter line-clamp-2">{movieTitle}</h3>
                    <div className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mb-4">2D Phụ đề</div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                        <MapPin size={14} className="text-[#AE2070]" /> {cinemaName}
                      </p>
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                        <Calendar size={14} className="text-[#AE2070]" /> {showTime} • {showDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-dashed border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">Vị trí ghế</span>
                    <span className="text-lg font-black text-[#dc2626] tracking-widest">{selectedSeats?.join(", ")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">Trạng thái</span>
                    <span className="text-xs font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Đang chờ...</span>
                  </div>
                  <div className="mt-8 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Tổng cộng thanh toán</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{amount?.toLocaleString()}đ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: SMART PAYMENT AREA ── */}
          <div className="lg:w-[55%] flex">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl border border-slate-100 p-10 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background MoMo Logo Pattern */}
              <div className="absolute top-0 right-0 opacity-[0.03] -mr-10 -mt-10">
                <svg viewBox="0 0 48 48" className="w-64 h-64 fill-[#AE2070]"><circle cx="24" cy="24" r="24"/></svg>
              </div>

              {/* Desktop QR Focus */}
              <div className="hidden lg:flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <div className="bg-[#AE2070] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-xl shadow-pink-200">
                  Quét mã để thanh toán
                </div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#AE2070] to-[#C41E6B] rounded-[2.5rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative bg-white p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100">
                    <QRCodeSVG
                      value={qrCodeUrl || payUrl || ''}
                      size={260}
                      level="H"
                      includeMargin
                      imageSettings={{
                        src: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png",
                        x: undefined, y: undefined, height: 48, width: 48, excavate: true,
                      }}
                    />
                  </div>
                </div>
                <div className="mt-10 text-center space-y-5">
                  <p className="text-slate-500 font-bold text-sm italic animate-pulse">Trang web sẽ tự động cập nhật sau khi bạn thanh toán thành công...</p>
                  
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">Bạn đã thanh toán nhưng chưa thấy chuyển trang?</p>
                    <button 
                      onClick={checkPaymentStatus}
                      className="bg-white hover:bg-slate-50 text-[#AE2070] border border-[#AE2070] px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                    >
                      Tôi đã thanh toán
                    </button>
                  </div>

                  <p className="text-slate-400 text-[10px] max-w-[320px] mx-auto pt-4 border-t border-slate-100">Mã QR sẽ tự động hết hạn sau 10 phút. Vui lòng không tắt trình duyệt cho đến khi nhận được vé.</p>
                </div>
              </div>

              {/* Mobile CTA Focus */}
              <div className="lg:hidden w-full space-y-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex justify-center">
                   <div className="bg-slate-50 p-4 rounded-[2rem] border border-slate-100 shadow-inner">
                      <QRCodeSVG value={qrCodeUrl || payUrl || ''} size={160} level="M" includeMargin />
                   </div>
                </div>
                
                <div className="space-y-4">
                  {(deeplink || qrCodeUrl || payUrl) && (
                    <a
                      href={deeplink || qrCodeUrl || payUrl}
                      target="_self"
                      className="w-full bg-[#AE2070] hover:bg-[#8f1a5c] text-white font-black py-5 rounded-2xl shadow-[0_20px_40px_rgba(174,32,112,0.3)] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-4 active:scale-95 shadow-xl"
                    >
                      <Smartphone size={24} className="animate-pulse" />
                      Mở ứng dụng MoMo ngay
                    </a>
                  )}
                  <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center">
                    <p className="text-xs text-[#AE2070] font-bold leading-relaxed">
                      Chạm vào nút trên để mở App MoMo và thanh toán an toàn chỉ với 1 bước.
                    </p>
                  </div>
                </div>
              </div>

              {/* Polling Indicator */}
              <div className="mt-12 flex items-center gap-4 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                Đang chờ thanh toán
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-3 bg-white rounded-full shadow-sm border border-slate-100">
             <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} className="text-emerald-500" /> Thanh toán an toàn
             </div>
             <div className="w-px h-4 bg-slate-200" />
             <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <Clock size={14} className="text-blue-500" /> Hỗ trợ 24/7
             </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MomoPaymentPage;
