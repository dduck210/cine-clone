import React, { useEffect, useState, useRef } from "react";
import {
  useLocation,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  CheckCircle,
  Home,
  Ticket,
  ArrowLeft,
  XCircle,
  Clock,
  ShieldCheck,
  KeyRound,
  Copy,
  User,
  Mail,
  Smartphone,
  Banknote,
} from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import { EventSourcePolyfill } from "event-source-polyfill";
import toast, { Toaster } from "react-hot-toast";
import { usePushSubscription } from "../../hooks/usePushSubscription";
import TicketCard from "../../components/ticket/TicketCard";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveTicketStatus, setLiveTicketStatus] = useState(location.state?.ticketStatus || null);

  // OTP state for MoMo flow
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const otpRefs = useRef([]);

  const isMomoReturn = searchParams.has("resultCode");
  const isHistoryMode = location.state?.isHistoryMode;
  const isCash = location.state?.isCash;
  const bookingStatus = location.state?.bookingStatus;
  const paymentMethod = location.state?.paymentMethod;

  const isTicketIssued = liveTicketStatus === "printed" && bookingStatus === "paid";
  const isPendingCash =
    (isCash && !isHistoryMode) ||
    (isHistoryMode && paymentMethod === "cash" && bookingStatus !== "paid");

  usePushSubscription(isTicketIssued ? null : ticketData?.bookingCode);

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isMomoReturn) {
      const resultCode = searchParams.get("resultCode");

      if (resultCode !== "0") {
        setError(
          searchParams.get("message") || "Thanh toán thất bại hoặc bị hủy.",
        );
        return;
      }

      setLoading(true);
      const params = {};
      searchParams.forEach((v, k) => { params[k] = v; });

      axiosInstance
        .post("/payments/momo/confirm", params)
        .then((res) => {
          setTicketData(res.data);
          if (!res.data.otpVerified) {
            setShowOtpStep(true);
            setTimeout(() => otpRefs.current[0]?.focus(), 300);
          }
        })
        .catch((err) =>
          setError(err.response?.data?.message || "Xác nhận thanh toán thất bại"),
        )
        .finally(() => setLoading(false));
    } else if (location.state) {
      const s = location.state;
      setTicketData({
        bookingId: s.bookingId,
        bookingCode: s.orderId,
        movieTitle: s.movieTitle,
        cinemaName: s.cinemaName,
        roomName: s.roomName || "",
        showTime: s.showTime,
        showDate: s.showDate,
        selectedSeats: s.selectedSeats,
        finalTotalPrice: s.finalTotalPrice,
        poster: s.poster,
        combos: (s.combos || []).filter((c) => c.quantity > 0),
      });
    } else {
      navigate("/");
    }
  }, []);

  // SSE: auto-update khi admin scan/in vé
  useEffect(() => {
    const bookingId = ticketData?.bookingId || location.state?.bookingId;
    if (!bookingId || liveTicketStatus === "printed") return;

    const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
    const streamUrl = `${apiBase}/bookings/${bookingId}/stream`;

    let es;
    if (import.meta.env.VITE_API_URL) {
      es = new EventSourcePolyfill(streamUrl, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
    } else {
      es = new EventSource(streamUrl);
    }

    es.addEventListener("ticket_printed", () => {
      setLiveTicketStatus("printed");
      toast.success("Vé của bạn đã được xác nhận!", { duration: 2000 });
    });

    es.onerror = (err) => {
      console.error("[SSE] connection error:", err, "url:", streamUrl);
    };

    return () => es.close();
  }, [ticketData, liveTicketStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#AE2070] border-t-transparent" />
        <p className="text-slate-500 font-medium">Đang xác nhận thanh toán MoMo...</p>
      </div>
    );
  }

  // OTP handlers
  const handleOtpInput = (idx, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    setOtpError("");
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerifyOtp = async () => {
    const entered = otpDigits.join("");
    if (entered.length < 6) { setOtpError("Vui lòng nhập đủ 6 số"); return; }
    setIsVerifyingOtp(true);
    try {
      await axiosInstance.post("/payments/momo/verify-otp", {
        bookingId: ticketData?.bookingId,
        otp: entered,
      });
      toast.success("Xác thực thành công! Vé đã được kích hoạt.");
      setOtpVerified(true);
      setShowOtpStep(false);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Mã OTP không đúng");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <main className="max-w-lg mx-auto px-4 pt-28 pb-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-200">
            <XCircle className="w-10 h-10 text-red-600" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase">Thanh toán thất bại</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 bg-[#dc2626] text-white font-bold rounded-xl hover:bg-red-700 transition-all"
          >
            Về trang chủ
          </button>
        </main>
      </div>
    );
  }

  if (!ticketData) return null;

  const {
    bookingId,
    bookingCode,
    movieTitle,
    cinemaName,
    roomName,
    showTime,
    showDate,
    selectedSeats,
    finalTotalPrice,
    combos = [],
  } = ticketData;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        {/* Page title */}
        <div className="text-center mb-10">
          {isHistoryMode ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">
                {isTicketIssued ? "Chi tiết vé điện tử" : "Chi tiết đơn đặt vé"}
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode}
                </span>
              </p>
              {bookingStatus === "paid" && (
                isTicketIssued ? (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">
                    <CheckCircle size={16} /> Vé điện tử đã được nhân viên rạp xác nhận
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
                    <Clock size={16} /> Vé điện tử đang chờ nhân viên rạp xác nhận
                  </div>
                )
              )}
            </>
          ) : isCash ? (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
                <Clock className="w-10 h-10 text-amber-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Đặt vé thành công!
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode || "—"}
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {bookingCode || "—"}
                </span>
              </p>
            </>
          )}
        </div>

        {/* OTP step for MoMo — verify before showing ticket */}
        {showOtpStep && ticketData ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#AE2070] to-[#dc2626] px-6 pt-5 pb-4 text-center text-white">
              <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mx-auto mb-3 ring-4 ring-white/20">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <h2 className="text-lg font-black mb-0.5">Xác nhận thanh toán</h2>
              <p className="text-white/70 text-xs">
                Nhập mã OTP được gửi về email của bạn
              </p>
            </div>

            {/* Ticket info summary */}
            <div className="p-5 space-y-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <Ticket size={15} className="text-[#AE2070] shrink-0" />
                <span className="font-bold text-slate-800">{ticketData.movieTitle}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-slate-400 block mb-0.5">Suất chiếu</span>
                  <span className="font-bold text-slate-700">{ticketData.showTime} - {ticketData.showDate}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-slate-400 block mb-0.5">Ghế</span>
                  <span className="font-bold text-[#AE2070]">{ticketData.selectedSeats?.join(", ")}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                <span className="text-slate-400">Tổng tiền</span>
                <span className="font-black text-[#AE2070]">{ticketData.finalTotalPrice?.toLocaleString()}đ</span>
              </div>
            </div>

            {/* OTP input */}
            <div className="p-5">
              <p className="text-center text-slate-500 text-xs mb-4">
                Nhập mã <span className="font-bold text-slate-800">6 chữ số</span> từ email để hoàn tất
              </p>

              <div className="flex justify-center gap-2 mb-3">
                {otpDigits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    autoComplete="one-time-code"
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className={`w-11 h-14 text-center text-xl font-black border-2 rounded-xl outline-none transition-all ${
                      otpError
                        ? "border-red-400 bg-red-50 text-red-600"
                        : d
                        ? "border-[#AE2070] bg-red-50 text-[#AE2070]"
                        : "border-slate-200 bg-slate-50 text-slate-800 focus:border-[#AE2070] focus:bg-red-50"
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-center text-red-500 text-xs font-bold mb-3">{otpError}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp}
                className="w-full bg-gradient-to-r from-[#AE2070] to-[#dc2626] hover:from-[#8B1A5C] hover:to-red-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xác nhận...
                  </>
                ) : (
                  "Xác nhận thanh toán"
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* Main card: QR (chưa xác nhận) hoặc Vé hợp lệ (đã xác nhận) */}
        {!showOtpStep && (isTicketIssued ? (
          <TicketCard
            bookingCode={bookingCode}
            movieTitle={movieTitle}
            cinemaName={cinemaName}
            roomName={roomName}
            showDate={showDate}
            showTime={showTime}
            seats={selectedSeats}
            totalPrice={finalTotalPrice}
            combos={combos}
          />
        ) : isPendingCash ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Clock className="w-12 h-12 text-amber-400" />
            <p className="font-mono font-bold text-gray-700 text-sm tracking-[0.15em] uppercase text-center">
              {bookingCode || "—"}
            </p>
            <p className="text-sm text-amber-600 font-bold text-center">
              Vui lòng đến quầy rạp và xuất trình mã đơn này để thanh toán
            </p>
          </div>
        ) : bookingCode ? (
          <div className="mx-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-black text-center">
              Đưa mã QR này cho nhân viên rạp xác nhận
            </p>
            <QRCodeSVG
              value={`${window.location.origin}/ticket/${bookingCode}`}
              size={200}
              bgColor="transparent"
              fgColor="#111827"
              level="M"
            />
            <p className="font-mono font-bold text-gray-700 text-sm tracking-[0.2em] uppercase">{bookingCode}</p>
          </div>
        ) : null)}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center px-4 flex-wrap">
          {isHistoryMode ? (
            <button
              onClick={() => navigate("/my-tickets")}
              className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
            >
              <ArrowLeft size={18} strokeWidth={3} /> Quay lại danh sách
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/")}
                className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
              >
                <Home size={18} strokeWidth={3} /> Về trang chủ
              </button>
              <button
                onClick={() => navigate("/my-tickets")}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#dc2626] rounded-2xl font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest"
              >
                <Ticket size={18} strokeWidth={3} /> Xem vé của tôi
              </button>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
