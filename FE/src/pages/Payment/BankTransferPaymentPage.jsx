import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  Ticket, MapPin, Calendar, Armchair, Clock, CheckCircle,
  ArrowLeft, ShieldCheck, Popcorn, Tag, Monitor, Copy,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";

const MB_ACCOUNT = "0964717591";
const MB_ACCOUNT_NAME = "DUONG ANH DUC";
const MB_BANK_CODE = "MB";

const BankTransferPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    bookingId, bookingCode, amount, movieTitle, cinemaName, roomName,
    showTime, showDate, showAddress, selectedSeats, duration, poster,
    combos, originalPrice, mondayDiscount = 0, voucherDiscount = 0,
    voucherCode, voucherType, voucherValue,
  } = location.state || {};

  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isChecking, setIsChecking] = useState(false);
  const pollRef = useRef(null);

  const transferContent = bookingCode ? `5CINE ${bookingCode}` : "";
  const qrUrl = `https://img.vietqr.io/image/${MB_BANK_CODE}-${MB_ACCOUNT}-qr_only.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(MB_ACCOUNT_NAME)}`;
  const [qrError, setQrError] = useState(false);

  const handlePaid = (state) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsPaid(true);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/payment-success", {
            state: { ...state, orderId: bookingCode, bookingId, paymentMethod: "bank" },
          });
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pollStatus = async () => {
    try {
      const res = await axiosInstance.get(`/payments/casso/status/${bookingId}`);
      if (res.data.paid) handlePaid(location.state);
    } catch { /* silent */ }
  };

  const checkPaymentStatus = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const res = await axiosInstance.get(`/payments/casso/status/${bookingId}`);
      if (res.data.paid) {
        handlePaid(location.state);
      } else {
        toast("Chưa nhận được thanh toán, vui lòng thử lại sau giây lát.", { id: "check-pay" });
      }
    } catch {
      toast.error("Có lỗi xảy ra khi kiểm tra.", { id: "check-pay" });
    } finally {
      setIsChecking(false);
    }
  };

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`, { id: "copy" }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) { navigate("/"); return; }
    pollRef.current = setInterval(pollStatus, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  if (!location.state) return null;

  const CopyRow = ({ label, value }) => (
    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-black text-slate-800 text-sm">{value}</p>
      </div>
      <button onClick={() => copyText(value, label)}
        className="text-[#004C97] hover:text-[#003a75] transition-colors p-1 rounded-lg hover:bg-blue-50">
        <Copy size={16} />
      </button>
    </div>
  );

  const BookingInfo = ({ compact = false }) => (
    <div className={`space-y-${compact ? "2.5" : "4"}`}>
      <div className={`flex items-start gap-${compact ? "2.5" : "3"}`}>
        <MapPin size={compact ? 14 : 16} className="text-[#004C97] shrink-0 mt-0.5" />
        <div><p className={`font-bold text-slate-800 text-${compact ? "sm" : "sm"}`}>{cinemaName}</p>
          {showAddress && !compact && <p className="text-xs text-slate-400 mt-0.5">{showAddress}</p>}
        </div>
      </div>
      {roomName && (
        <div className={`flex items-center gap-${compact ? "2.5" : "3"}`}>
          <Monitor size={compact ? 14 : 16} className="text-[#004C97] shrink-0" />
          <p className={`font-bold text-slate-800 text-sm`}>{roomName}</p>
        </div>
      )}
      <div className={`flex items-center gap-${compact ? "2.5" : "3"}`}>
        <Calendar size={compact ? 14 : 16} className="text-[#004C97] shrink-0" />
        <p className="font-bold text-slate-800 text-sm">{showTime} • {showDate}</p>
      </div>
      <div className={`flex items-center gap-${compact ? "2.5" : "3"}`}>
        <Armchair size={compact ? 14 : 16} className="text-[#004C97] shrink-0" />
        <p className="font-black text-[#dc2626] text-sm tracking-widest">{selectedSeats?.join(", ")}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />

      {isPaid && (
        <div className="fixed inset-0 bg-slate-900/95 z-[90] flex flex-col items-center justify-center gap-6 backdrop-blur-md">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="34" stroke="white" strokeOpacity="0.15" strokeWidth="6" />
              <path d="M40 6 A34 34 0 0 1 74 40" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-white font-black text-lg tracking-tight">Đang xử lý vé của bạn...</p>
            <p className="text-slate-400 text-sm">Vui lòng không tắt trình duyệt</p>
          </div>
          <div className="w-48 bg-white/10 rounded-full h-1 overflow-hidden">
            <div className="bg-emerald-400 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${((3 - countdown) / 3) * 100}%` }} />
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* ── LEFT: Receipt (desktop) ── */}
          <div className="hidden lg:flex lg:w-[48%]">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
              <div className="bg-gradient-to-r from-[#004C97] to-[#0066CC] p-7 text-center text-white relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                    <Ticket size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">Xác nhận đặt vé</h2>
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                  Hóa đơn điện tử #5CINE-{bookingCode}
                </p>
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-4">
                  {[...Array(18)].map((_, i) => <div key={i} className="w-5 h-5 bg-white rounded-full" />)}
                </div>
              </div>

              <div className="p-7 pt-10 flex-1 space-y-5">
                <div className="flex gap-5 pb-5 border-b border-dashed border-slate-200">
                  {poster && <img src={poster} alt="" className="w-20 h-28 object-cover rounded-xl shadow-lg border-2 border-slate-50 shrink-0" />}
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-xl leading-tight mb-1 uppercase tracking-tighter line-clamp-2">{movieTitle}</h3>
                    <span className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mb-2">2D Phụ đề</span>
                    {duration > 0 && <p className="text-xs text-slate-400 font-bold flex items-center gap-1"><Clock size={12} /> {duration} phút</p>}
                  </div>
                </div>
                <div className="pb-5 border-b border-dashed border-slate-200"><BookingInfo /></div>
                {combos?.some((c) => c.quantity > 0) && (
                  <div className="pb-5 border-b border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-3"><Popcorn size={16} className="text-[#dc2626]" /><span className="text-xs font-black text-slate-500 uppercase tracking-widest">Bắp & Nước</span></div>
                    {combos.filter((c) => c.quantity > 0).map((c) => (
                      <div key={c.id || c.name} className="flex justify-between text-sm text-slate-700 font-bold">
                        <span>{c.quantity}x {c.name}</span><span className="text-slate-400">{(c.price * c.quantity).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="space-y-3">
                  {(mondayDiscount > 0 || voucherDiscount > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-medium"><span>Tạm tính</span><span>{originalPrice?.toLocaleString()}đ</span></div>
                      {mondayDiscount > 0 && <div className="flex justify-between text-sm"><span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><Tag size={12} /> Gold Monday −20%</span><span className="text-emerald-600 font-bold">−{mondayDiscount?.toLocaleString()}đ</span></div>}
                      {voucherDiscount > 0 && voucherCode && <div className="flex justify-between text-sm"><span className="flex items-center gap-1.5 text-violet-600 font-semibold"><Tag size={12} /> {voucherCode} {voucherType === "percent" ? `−${voucherValue}%` : ""}</span><span className="text-violet-600 font-bold">−{voucherDiscount?.toLocaleString()}đ</span></div>}
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tổng cộng</span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">{amount?.toLocaleString()}đ</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">Trạng thái</span>
                  <span className="text-xs font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">Đang chờ thanh toán</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Mobile: Full card ── */}
          <div className="lg:hidden w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#004C97] to-[#0066CC] p-5 text-white relative">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><Ticket size={18} className="text-white" /></div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-base uppercase tracking-tight truncate">{movieTitle}</h2>
                  <p className="text-white/60 text-[10px] font-bold">#5CINE-{bookingCode}</p>
                </div>
                <span className="text-white font-black text-lg shrink-0">{amount?.toLocaleString()}đ</span>
              </div>
              <div className="absolute -bottom-2.5 left-0 right-0 flex justify-between px-4">
                {[...Array(14)].map((_, i) => <div key={i} className="w-4 h-4 bg-white rounded-full" />)}
              </div>
            </div>

            <div className="p-5 pt-8 space-y-4">
              <div className="flex flex-col items-center pb-4 border-b border-dashed border-slate-200">
                <div className="bg-[#004C97] text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-blue-200">Quét mã để thanh toán</div>
                <div className="bg-slate-50 p-3 rounded-[2rem] border border-slate-100 shadow-inner flex items-center justify-center w-[186px] h-[186px]">
                  {qrError ? (
                    <p className="text-[10px] text-slate-400 text-center px-2">Không tải được QR.<br/>Dùng thông tin bên dưới để chuyển khoản.</p>
                  ) : (
                    <img src={qrUrl} alt="MB Bank QR" className="w-[160px] h-[160px]"
                      onError={() => setQrError(true)} />
                  )}
                </div>
                <p className="text-slate-400 text-[10px] mt-3 text-center">Mở app ngân hàng bất kỳ và quét mã QR</p>
              </div>

              <div className="space-y-2.5 pb-4 border-b border-dashed border-slate-200">
                <CopyRow label="Số tài khoản" value={MB_ACCOUNT} />
                <CopyRow label="Số tiền" value={`${amount?.toLocaleString()} VND`} />
                <CopyRow label="Nội dung" value={transferContent} />
              </div>

              <div className="space-y-2.5 pb-4 border-b border-dashed border-slate-200"><BookingInfo compact /></div>

              <div className="flex flex-col items-center pt-1 space-y-3">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest">Đã chuyển khoản nhưng chưa thấy chuyển trang?</p>
                <button onClick={checkPaymentStatus} disabled={isChecking}
                  className="bg-white hover:bg-slate-50 text-[#004C97] border border-[#004C97] px-7 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2">
                  {isChecking && <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                  {isChecking ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
                </button>
                <div className="flex items-center gap-3 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] pt-1">
                  <div className="flex gap-1.5">
                    {[0, 0.1, 0.2].map((d, i) => <div key={i} className="w-1.5 h-1.5 bg-[#004C97] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
                  </div>
                  Đang chờ thanh toán
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: QR area (desktop) ── */}
          <div className="hidden lg:flex lg:w-[52%]">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl border border-slate-100 p-10 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700 w-full">
                <div className="bg-[#004C97] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-xl shadow-blue-200">
                  Quét mã để thanh toán
                </div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#004C97] to-[#0066CC] rounded-[2.5rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative bg-white p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center w-[270px] h-[270px]">
                    {qrError ? (
                      <p className="text-sm text-slate-400 text-center px-4">Không tải được QR.<br/>Dùng thông tin bên dưới để chuyển khoản.</p>
                    ) : (
                      <img src={qrUrl} alt="MB Bank QR" className="w-[240px] h-[240px]"
                        onError={() => setQrError(true)} />
                    )}
                  </div>
                </div>

                <div className="mt-8 w-full max-w-sm space-y-3">
                  <p className="text-center text-slate-500 font-bold text-sm mb-4">Thông tin chuyển khoản MB Bank</p>
                  <CopyRow label="Chủ tài khoản" value={MB_ACCOUNT_NAME} />
                  <CopyRow label="Số tài khoản" value={MB_ACCOUNT} />
                  <CopyRow label="Số tiền" value={`${amount?.toLocaleString()} VND`} />
                  <CopyRow label="Nội dung chuyển khoản" value={transferContent} />
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest">Đã chuyển khoản nhưng chưa thấy chuyển trang?</p>
                  <button onClick={checkPaymentStatus} disabled={isChecking}
                    className="bg-white hover:bg-slate-50 text-[#004C97] border border-[#004C97] px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2">
                    {isChecking && <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                    {isChecking ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
                  </button>
                  <p className="text-slate-400 text-[10px] max-w-[320px] text-center pt-2 border-t border-slate-100">
                    Hệ thống tự động phát hiện thanh toán. Vui lòng không tắt trình duyệt cho đến khi nhận được vé.
                  </p>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-4 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
                <div className="flex gap-1.5">
                  {[0, 0.1, 0.2].map((d, i) => <div key={i} className="w-2 h-2 bg-[#004C97] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />)}
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

export default BankTransferPaymentPage;
