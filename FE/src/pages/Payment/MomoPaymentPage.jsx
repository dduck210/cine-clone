import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  Smartphone,
  Ticket,
  MapPin,
  Calendar,
  Armchair,
  Clock,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  Popcorn,
  Tag,
  Phone,
  Monitor,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";
import momoQRFallback from "./momo.png";

const MomoPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    bookingId,
    bookingCode,
    payUrl,
    deeplink,
    qrCodeUrl,
    amount,
    movieTitle,
    cinemaName,
    roomName,
    showTime,
    showDate,
    showAddress,
    selectedSeats,
    duration,
    poster,
    combos,
    originalPrice,
    mondayDiscount = 0,
    voucherDiscount = 0,
    voucherCode,
    voucherType,
    voucherValue,
  } = location.state || {};

  const [isPaid, setIsPaid] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isConfirming, setIsConfirming] = useState(false);
  const pollRef = useRef(null);

  const handlePaid = (state) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setIsPaid(true);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(timer);
          navigate("/payment-success", {
            state: {
              ...state,
              orderId: bookingCode,
              bookingId,
              paymentMethod: "momo",
            },
          });
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pollStatus = async () => {
    try {
      const res = await axiosInstance.get(`/payments/momo/status/${bookingId}`);
      if (res.data.paid) handlePaid(location.state);
    } catch {
      /* silent */
    }
  };

  const checkPaymentStatus = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      const statusRes = await axiosInstance.get(
        `/payments/momo/status/${bookingId}`,
      );
      if (statusRes.data.paid) {
        handlePaid(location.state);
        return;
      }

      const confirmRes = await axiosInstance.post(
        `/payments/momo/confirm-demo/${bookingId}`,
      );
      if (confirmRes.data.paid) {
        handlePaid(location.state);
      } else {
        toast.error("Xác nhận thất bại, vui lòng thử lại.", {
          id: "check-pay",
        });
      }
    } catch {
      toast.error("Có lỗi xảy ra khi xác nhận thanh toán.", {
        id: "check-pay",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) {
      navigate("/");
      return;
    }

    pollRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />

      {/* ── Paid overlay ── */}
      {isPaid && (
        <div className="fixed inset-0 bg-slate-900/90 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <CheckCircle
                  className="w-11 h-11 text-white"
                  strokeWidth={2.5}
                />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">
                Thanh toán thành công!
              </h2>
              <p className="text-emerald-100 text-sm font-medium">
                Vé của bạn đã được xác nhận
              </p>
            </div>
            <div className="px-6 pb-6 pt-4">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
              <p className="text-center text-slate-400 text-xs font-medium">
                Đang chuyển đến trang vé ({countdown}s)...
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-8 transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />{" "}
          Quay lại
        </button>

        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* ── LEFT: CINEMATIC RECEIPT (desktop only) ── */}
          <div className="hidden lg:flex lg:w-[48%]">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col relative">
              <div className="bg-gradient-to-r from-[#AE2070] to-[#C41E6B] p-7 text-center text-white relative">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                    <Ticket size={22} className="text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">
                    Xác nhận đặt vé
                  </h2>
                </div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">
                  Hóa đơn điện tử #5CINE-{bookingCode}
                </p>

                {/* Receipt cut effect */}
                <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-4">
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="w-5 h-5 bg-white rounded-full" />
                  ))}
                </div>
              </div>

              <div className="p-7 pt-10 flex-1 space-y-5">
                {/* Movie info */}
                <div className="flex gap-5 pb-5 border-b border-dashed border-slate-200">
                  {poster && (
                    <img
                      src={poster}
                      alt=""
                      className="w-20 h-28 object-cover rounded-xl shadow-lg border-2 border-slate-50 shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-xl leading-tight mb-1 uppercase tracking-tighter line-clamp-2">
                      {movieTitle}
                    </h3>
                    <span className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest mb-2">
                      2D Phụ đề
                    </span>
                    {duration > 0 && (
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={12} /> {duration} phút
                      </p>
                    )}
                  </div>
                </div>

                {/* Venue details */}
                <div className="space-y-3 pb-5 border-b border-dashed border-slate-200">
                  <div className="flex items-start gap-3">
                    <MapPin
                      size={16}
                      className="text-[#AE2070] shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        {cinemaName}
                      </p>
                      {showAddress && (
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {showAddress}
                        </p>
                      )}
                    </div>
                  </div>
                  {roomName && (
                    <div className="flex items-center gap-3">
                      <Monitor size={16} className="text-[#AE2070] shrink-0" />
                      <p className="font-bold text-slate-800 text-sm">
                        {roomName}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[#AE2070] shrink-0" />
                    <p className="font-bold text-slate-800 text-sm">
                      {showTime} • {showDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Armchair size={16} className="text-[#AE2070] shrink-0" />
                    <p className="font-black text-[#dc2626] text-base tracking-widest">
                      {selectedSeats?.join(", ")}
                    </p>
                  </div>
                </div>

                {/* Combos */}
                {combos?.some((c) => c.quantity > 0) && (
                  <div className="pb-5 border-b border-dashed border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Popcorn size={16} className="text-[#dc2626]" />
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                        Bắp & Nước
                      </span>
                    </div>
                    <div className="space-y-2">
                      {combos
                        .filter((c) => c.quantity > 0)
                        .map((c) => (
                          <div
                            key={c.id || c.name}
                            className="flex justify-between text-sm text-slate-700 font-bold"
                          >
                            <span>
                              {c.quantity}x {c.name}
                            </span>
                            <span className="text-slate-400">
                              {(c.price * c.quantity).toLocaleString()}đ
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Price breakdown */}
                <div className="space-y-3">
                  {(mondayDiscount > 0 || voucherDiscount > 0) && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400 font-medium">
                        <span>Tạm tính</span>
                        <span>{originalPrice?.toLocaleString()}đ</span>
                      </div>
                      {mondayDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <Tag size={12} /> Gold Monday −20%
                          </span>
                          <span className="text-emerald-600 font-bold">
                            −{mondayDiscount?.toLocaleString()}đ
                          </span>
                        </div>
                      )}
                      {voucherDiscount > 0 && voucherCode && (
                        <div className="flex justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-violet-600 font-semibold">
                            <Tag size={12} /> {voucherCode}{" "}
                            {voucherType === "percent"
                              ? `−${voucherValue}%`
                              : ""}
                          </span>
                          <span className="text-violet-600 font-bold">
                            −{voucherDiscount?.toLocaleString()}đ
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      Tổng cộng
                    </span>
                    <span className="text-4xl font-black text-slate-900 tracking-tighter">
                      {amount?.toLocaleString()}đ
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-400 font-black uppercase tracking-widest italic">
                    Trạng thái
                  </span>
                  <span className="text-xs font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
                    Đang chờ thanh toán
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── MOBILE: Integrated receipt + QR in one card ── */}
          <div className="lg:hidden w-full bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden">
            {/* Pink header */}
            <div className="bg-gradient-to-r from-[#AE2070] to-[#C41E6B] p-5 text-white relative">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Ticket size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-base uppercase tracking-tight truncate">
                    {movieTitle}
                  </h2>
                  <p className="text-white/60 text-[10px] font-bold">
                    #5CINE-{bookingCode}
                  </p>
                </div>
                <span className="text-white font-black text-lg shrink-0">
                  {amount?.toLocaleString()}đ
                </span>
              </div>
              {/* Cut effect */}
              <div className="absolute -bottom-2.5 left-0 right-0 flex justify-between px-4">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-white rounded-full" />
                ))}
              </div>
            </div>

            <div className="p-5 pt-8 space-y-4">
              {/* ── QR CODE (top) ── */}
              <div className="flex flex-col items-center pb-4 border-b border-dashed border-slate-200">
                <div className="bg-[#AE2070] text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-lg shadow-pink-200">
                  Quét mã để thanh toán
                </div>
                <div className="bg-slate-50 p-3 rounded-[2rem] border border-slate-100 shadow-inner">
                  <img
                    src={qrCodeUrl || momoQRFallback}
                    alt="MoMo QR"
                    className="w-[160px] h-[160px]"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = momoQRFallback; }}
                  />
                </div>
                <p className="text-slate-400 text-[10px] mt-3 text-center">
                  Mở App MoMo và quét mã QR bên trên
                </p>
              </div>

              {/* Movie + Poster */}
              <div className="flex gap-4 pb-4 border-b border-dashed border-slate-200">
                {poster && (
                  <img
                    src={poster}
                    alt=""
                    className="w-14 h-20 object-cover rounded-xl shadow-md border border-slate-100 shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 text-lg leading-tight mb-1 uppercase tracking-tighter line-clamp-2">
                    {movieTitle}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                      2D Phụ đề
                    </span>
                    {duration > 0 && (
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-0.5">
                        <Clock size={10} /> {duration} phút
                      </span>
                    )}
                    <span className="text-[11px] text-amber-500 font-black">
                      ★ 8.5
                    </span>
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="space-y-2.5 pb-4 border-b border-dashed border-slate-200">
                <div className="flex items-start gap-2.5">
                  <MapPin
                    size={14}
                    className="text-[#AE2070] shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">
                      {cinemaName}
                    </p>
                    {showAddress && (
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed truncate">
                        {showAddress}
                      </p>
                    )}
                  </div>
                </div>
                {roomName && (
                  <div className="flex items-center gap-2.5">
                    <Monitor size={14} className="text-[#AE2070] shrink-0" />
                    <p className="font-bold text-slate-800 text-sm">
                      {roomName}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <Calendar size={14} className="text-[#AE2070] shrink-0" />
                  <p className="font-bold text-slate-800 text-sm">
                    {showTime} • {showDate}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Armchair size={14} className="text-[#AE2070] shrink-0" />
                  <p className="font-black text-[#dc2626] text-sm tracking-widest">
                    {selectedSeats?.join(", ")}
                  </p>
                </div>
              </div>

              {/* Combos */}
              {combos?.some((c) => c.quantity > 0) && (
                <div className="pb-4 border-b border-dashed border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Popcorn size={14} className="text-[#dc2626]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Bắp & Nước
                    </span>
                  </div>
                  {combos
                    .filter((c) => c.quantity > 0)
                    .map((c) => (
                      <div
                        key={c.id || c.name}
                        className="flex justify-between text-sm text-slate-700 font-bold"
                      >
                        <span>
                          {c.quantity}x {c.name}
                        </span>
                        <span className="text-slate-400">
                          {(c.price * c.quantity).toLocaleString()}đ
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* Price */}
              <div className="space-y-2 pb-4 border-b border-dashed border-slate-200">
                {(mondayDiscount > 0 || voucherDiscount > 0) && (
                  <>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tạm tính</span>
                      <span>{originalPrice?.toLocaleString()}đ</span>
                    </div>
                    {mondayDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <Tag size={11} /> Gold Monday −20%
                        </span>
                        <span className="text-emerald-600 font-bold">
                          −{mondayDiscount?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                    {voucherDiscount > 0 && voucherCode && (
                      <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1 text-violet-600 font-semibold">
                          <Tag size={11} /> {voucherCode}{" "}
                          {voucherType === "percent" ? `−${voucherValue}%` : ""}
                        </span>
                        <span className="text-violet-600 font-bold">
                          −{voucherDiscount?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Tổng cộng
                  </span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">
                    {amount?.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* ── CTA BUTTONS ── */}
              <div className="flex flex-col items-center pt-1 space-y-3">
                {(deeplink || qrCodeUrl || payUrl) && (
                  <a
                    href={deeplink || qrCodeUrl || payUrl}
                    target="_self"
                    className="w-full bg-[#AE2070] hover:bg-[#8f1a5c] text-white font-black py-4 rounded-2xl shadow-[0_12px_28px_rgba(174,32,112,0.3)] transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Smartphone size={20} className="animate-pulse" />
                    Mở ứng dụng MoMo ngay
                  </a>
                )}

                <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                  Đã thanh toán nhưng chưa thấy chuyển trang?
                </p>
                <button
                  onClick={checkPaymentStatus}
                  disabled={isConfirming}
                  className="bg-white hover:bg-slate-50 text-[#AE2070] border border-[#AE2070] px-7 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {isConfirming && (
                    <svg
                      className="animate-spin h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {isConfirming ? "Đang xác nhận..." : "Tôi đã thanh toán"}
                </button>

                <div className="flex justify-between items-center w-full pt-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                    Trạng thái
                  </span>
                  <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Đang chờ thanh toán
                  </span>
                </div>

                <div className="flex items-center justify-center gap-4 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] pt-1">
                  <div className="flex gap-1.5">
                    <div
                      className="w-1.5 h-1.5 bg-[#AE2070] rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-[#AE2070] rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-[#AE2070] rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  Đang chờ thanh toán
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: QR PAYMENT AREA (desktop only) ── */}
          <div className="hidden lg:flex lg:w-[52%]">
            <div className="bg-white w-full rounded-[2rem] shadow-2xl border border-slate-100 p-10 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background MoMo Logo Pattern */}
              <div className="absolute top-0 right-0 opacity-[0.03] -mr-10 -mt-10">
                <svg viewBox="0 0 48 48" className="w-64 h-64 fill-[#AE2070]">
                  <circle cx="24" cy="24" r="24" />
                </svg>
              </div>

              {/* Desktop: Static QR Image */}
              <div className="hidden lg:flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <div className="bg-[#AE2070] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-8 shadow-xl shadow-pink-200">
                  Quét mã để thanh toán
                </div>
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-[#AE2070] to-[#C41E6B] rounded-[2.5rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative bg-white p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100">
                    <img
                      src={qrCodeUrl || momoQRFallback}
                      alt="MoMo QR"
                      className="w-[260px] h-[260px]"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = momoQRFallback; }}
                    />
                  </div>
                </div>
                <div className="mt-8 text-center space-y-5">
                  <p className="text-slate-500 font-bold text-sm italic animate-pulse">
                    Trang web sẽ tự động cập nhật sau khi bạn thanh toán thành
                    công...
                  </p>

                  <div className="flex flex-col items-center gap-3 pt-2">
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">
                      Bạn đã thanh toán nhưng chưa thấy chuyển trang?
                    </p>
                    <button
                      onClick={checkPaymentStatus}
                      disabled={isConfirming}
                      className="bg-white hover:bg-slate-50 text-[#AE2070] border border-[#AE2070] px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm disabled:opacity-60 flex items-center gap-2"
                    >
                      {isConfirming && (
                        <svg
                          className="animate-spin h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      )}
                      {isConfirming ? "Đang xác nhận..." : "Tôi đã thanh toán"}
                    </button>
                  </div>

                  <p className="text-slate-400 text-[10px] max-w-[320px] mx-auto pt-4 border-t border-slate-100">
                    Mã QR sẽ tự động hết hạn sau 10 phút. Vui lòng không tắt
                    trình duyệt cho đến khi nhận được vé.
                  </p>
                </div>
              </div>

              {/* Polling Indicator (desktop) */}
              <div className="mt-12 flex items-center gap-4 text-slate-300 font-black text-[10px] uppercase tracking-[0.3em]">
                <div className="flex gap-1.5">
                  <div
                    className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-[#AE2070] rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                Đang chờ thanh toán
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-3 bg-white rounded-full shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" /> Thanh toán
              an toàn
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
