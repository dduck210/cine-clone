import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  User,
  Mail,
  CheckCircle,
  MapPin,
  Calendar,
  Armchair,
  Popcorn,
  X,
  Copy,
  ShieldCheck,
  ArrowLeft,
  Ticket,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const QR_BANK = {
  bankId: "MB",
  accountNo: "01234567890",
  accountName: "5CINE CINEMA",
};

const PAYMENT_METHODS = [
  {
    id: "momo",
    label: "Ví MoMo",
    desc: "Thanh toán qua ví điện tử MoMo",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#AE2070" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="bold"
          fontFamily="Arial"
        >
          MoMo
        </text>
      </svg>
    ),
    color: "border-[#AE2070] bg-[#AE2070]/5",
    dot: "bg-[#AE2070]",
  },
  {
    id: "qr",
    label: "QR Banking",
    desc: "Quét mã QR chuyển khoản ngân hàng",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#0066CC" />
        <text
          x="50%"
          y="54%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontWeight="bold"
          fontFamily="Arial"
        >
          QR
        </text>
      </svg>
    ),
    color: "border-blue-500 bg-blue-50",
    dot: "bg-blue-500",
  },
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    showtimeId,
    movieTitle,
    cinemaName,
    showTime,
    showDate,
    showAddress,
    selectedSeats = [],
    combos = [],
    finalTotalPrice,
    poster,
    existingBookingId,
    existingBookingCode,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [qrModal, setQrModal] = useState(null); // { bookingId, bookingCode, qrUrl, amount }
  const [qrStep, setQrStep] = useState(1); // 1=QR scan, 2=OTP
  const [momoModal, setMomoModal] = useState(null); // { payUrl, amount, bookingCode }
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const otpRefs = useRef([]);

  // Dismiss all toasts when leaving this page
  useEffect(() => {
    return () => toast.dismiss();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!location.state) navigate("/");
  }, [location, navigate]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user)
      setCustomerInfo((p) => ({
        ...p,
        name: user.name || "",
        email: user.email || "",
      }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!emailRegex.test(customerInfo.email))
      newErrors.email = "Email sai định dạng";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    if (!validateForm()) {
      toast.error("Vui lòng hoàn thiện thông tin nhận vé!", { id: "pay-val" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để đặt vé!", { id: "pay-auth" });
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xử lý...");

    try {
      // Dùng booking cũ (tiếp tục thanh toán) hoặc tạo mới
      let bookingId, bookingCode;
      if (existingBookingId) {
        bookingId = existingBookingId;
        bookingCode = existingBookingCode || "";
      } else {
        const extraItems = combos
          .filter((c) => c.quantity > 0)
          .map((c) => ({ name: c.name, quantity: c.quantity, price: c.price }));
        const bookingRes = await axiosInstance.post("/bookings", {
          showtimeId,
          seats: selectedSeats,
          extraItems,
        });
        bookingId = bookingRes.data._id;
        bookingCode = bookingRes.data.bookingCode;
      }

      if (paymentMethod === "momo") {
        const momoRes = await axiosInstance.post("/payments/momo/create", { bookingId });
        toast.dismiss(loadingToast);
        setMomoModal({ payUrl: momoRes.data.payUrl, amount: finalTotalPrice, bookingCode });
        setIsProcessing(false);
      } else if (paymentMethod === "qr") {
        toast.dismiss(loadingToast);
        const addInfo = encodeURIComponent(`5CINE ${bookingCode}`);
        const qrUrl = `https://img.vietqr.io/image/${QR_BANK.bankId}-${QR_BANK.accountNo}-qr_only.png?amount=${finalTotalPrice}&addInfo=${addInfo}&accountName=${encodeURIComponent(QR_BANK.accountName)}`;
        setQrModal({ bookingId, bookingCode, qrUrl, amount: finalTotalPrice });
        setIsProcessing(false);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(
        err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại",
      );
      setIsProcessing(false);
    }
  };

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

  // Request OTP from backend then advance to step 2
  const handleRequestOtp = async () => {
    if (!qrModal) return;
    setIsProcessing(true);
    const t = toast.loading("Đang gửi mã OTP...");
    try {
      const res = await axiosInstance.post("/payments/qr/request-otp", { bookingId: qrModal.bookingId });
      toast.dismiss(t);
      toast.success(`Đã gửi OTP tới ${res.data.email}`);
      setQrStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.dismiss(t);
      toast.error(err.response?.data?.message || "Gửi OTP thất bại, thử lại");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmOtp = () => {
    const entered = otpDigits.join("");
    if (entered.length < 6) { setOtpError("Vui lòng nhập đủ 6 số"); return; }
    handleConfirmQr(entered);
  };

  const handleConfirmQr = async (otp) => {
    if (!qrModal) return;
    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xác nhận...");
    try {
      await axiosInstance.post("/payments", {
        bookingId: qrModal.bookingId,
        method: "qr",
        otp,
      });
      toast.dismiss(loadingToast);
      const savedModal = qrModal;
      setQrModal(null);
      setQrStep(1);
      setOtpDigits(["", "", "", "", "", ""]);
      setIsSuccess(true);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(timer);
            navigate("/payment-success", {
              state: {
                ...location.state,
                orderId: savedModal.bookingCode,
                bookingId: savedModal.bookingId,
                paymentMethod: "qr",
              },
            });
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Xác nhận thất bại, thử lại");
      setIsProcessing(false);
    }
  };

  if (!location.state) return null;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Navbar />
      <Toaster position="top-center" />

      {isSuccess && (
        <div className="fixed inset-0 bg-slate-900/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <CheckCircle className="w-11 h-11 text-white" strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Thanh toán thành công!</h2>
              <p className="text-emerald-100 text-sm font-medium">Vé của bạn đã được xác nhận</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <Ticket size={18} className="text-[#dc2626] shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium">Phim</p>
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{movieTitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-0.5">Suất chiếu</p>
                  <p className="font-bold text-slate-800 text-sm">{showTime}</p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                  <p className="text-xs text-slate-400 font-medium mb-0.5">Ghế</p>
                  <p className="font-bold text-[#dc2626] text-sm">{selectedSeats?.join(", ")}</p>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Tổng tiền</span>
                <span className="font-black text-emerald-700 text-lg">{finalTotalPrice?.toLocaleString()}đ</span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((5 - countdown) / 5) * 100}%` }} />
              </div>
              <p className="text-center text-slate-400 text-xs font-medium">Đang chuyển đến trang vé ({countdown}s)...</p>
            </div>
          </div>
        </div>
      )}

      {/* MoMo — hiện thông tin test trước khi redirect */}
      {momoModal && (
        <div className="fixed inset-0 bg-slate-900/85 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden">

            <div className="bg-gradient-to-r from-[#AE2070] to-[#8f1a5c] px-6 py-5 relative">
              <button onClick={() => setMomoModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X size={16} />
              </button>
              <div className="text-center text-white">
                <h2 className="text-lg font-black mb-0.5">Thanh toán MoMo</h2>
                <p className="text-pink-200 text-xs">Copy thông tin bên dưới rồi mở trang thanh toán</p>
              </div>
            </div>

            <div className="p-6">
              {/* Tóm tắt đơn */}
              <div className="flex justify-between items-center mb-5 bg-pink-50 rounded-2xl px-4 py-3 border border-pink-100">
                <span className="text-sm text-slate-500 font-medium">Số tiền</span>
                <span className="text-lg font-black text-[#AE2070]">{momoModal.amount?.toLocaleString()}đ</span>
              </div>

              {/* Thông tin test */}
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Thông tin tài khoản test</p>
              <div className="space-y-2 mb-5">
                {[
                  { label: "Số điện thoại", value: "0000000000" },
                  { label: "OTP",           value: "000000" },
                  { label: "PIN",           value: "000000" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-800 text-sm tracking-widest">{value}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(value); toast.success(`Đã sao chép ${label}!`); }}
                        className="text-[#AE2070] hover:text-[#8f1a5c] transition-colors"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setMomoModal(null); window.location.href = momoModal.payUrl; }}
                className="w-full bg-[#AE2070] hover:bg-[#8f1a5c] text-white font-black py-3.5 rounded-2xl text-sm uppercase tracking-wider transition-all"
              >
                Mở trang thanh toán MoMo →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Payment Modal — multi-step */}
      {qrModal && (
        <div className="fixed inset-0 bg-slate-900/85 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full border border-slate-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-5 relative">
              <button onClick={() => { setQrModal(null); setQrStep(1); setOtpDigits(["","","","","",""]); setOtpError(""); }}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X size={16} />
              </button>

              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[{ n: 1, label: "Chuyển khoản" }, { n: 2, label: "Xác nhận OTP" }].map(({ n, label }) => (
                  <React.Fragment key={n}>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${qrStep >= n ? "bg-white text-blue-600" : "bg-white/20 text-white/60"}`}>{n}</div>
                      <span className={`text-xs font-bold hidden sm:inline ${qrStep >= n ? "text-white" : "text-white/50"}`}>{label}</span>
                    </div>
                    {n < 2 && <div className={`w-8 h-0.5 rounded-full ${qrStep > n ? "bg-white" : "bg-white/30"}`} />}
                  </React.Fragment>
                ))}
              </div>

              <div className="text-center text-white">
                <h2 className="text-lg font-black mb-0.5">
                  {qrStep === 1 ? "Quét mã QR thanh toán" : "Nhập mã xác nhận"}
                </h2>
                <p className="text-blue-100 text-xs">
                  {qrStep === 1 ? "Dùng app ngân hàng quét mã bên dưới" : "Nhập 6 số cuối trong nội dung chuyển khoản"}
                </p>
              </div>
            </div>

            {/* Step 1: QR + bank info */}
            {qrStep === 1 && (
              <div className="p-6">
                <div className="bg-blue-50 rounded-2xl p-3 mb-4 border border-blue-100 flex justify-center">
                  <img src={qrModal.qrUrl} alt="VietQR" className="w-44 h-44 rounded-xl"
                    onError={(e) => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(`${QR_BANK.bankId} ${QR_BANK.accountNo} ${qrModal.amount} ${qrModal.bookingCode}`)}`; }} />
                </div>

                <div className="space-y-2 mb-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 text-sm">
                  {[
                    { label: "Ngân hàng", value: `${QR_BANK.bankId} Bank`, copy: null },
                    { label: "Số tài khoản", value: QR_BANK.accountNo, copy: QR_BANK.accountNo },
                    { label: "Chủ tài khoản", value: QR_BANK.accountName, copy: null },
                    { label: "Số tiền", value: `${qrModal.amount.toLocaleString()}đ`, copy: null, highlight: true },
                    { label: "Nội dung CK", value: `5CINE ${qrModal.bookingCode}`, copy: `5CINE ${qrModal.bookingCode}` },
                  ].map(({ label, value, copy, highlight }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-slate-400">{label}</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${highlight ? "text-blue-600" : "text-slate-800"}`}>{value}</span>
                        {copy && (
                          <button onClick={() => { navigator.clipboard.writeText(copy); toast.success("Đã sao chép!"); }}
                            className="text-blue-400 hover:text-blue-600 ml-1"><Copy size={12} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 flex items-start gap-2">
                  <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-blue-700 text-xs font-medium">
                    Sau khi chuyển khoản, bấm nút bên dưới để nhận mã OTP xác nhận qua email.
                  </p>
                </div>

                <button onClick={handleRequestOtp} disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                  {isProcessing ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang gửi OTP...</>
                  ) : "Tiếp tục →"}
                </button>
              </div>
            )}

            {/* Step 2: OTP input */}
            {qrStep === 2 && (
              <div className="p-6">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mx-auto mb-4 border border-blue-100">
                  <ShieldCheck size={28} className="text-blue-600" />
                </div>

                <p className="text-center text-slate-500 text-sm mb-6">
                  Nhập mã <span className="font-bold text-slate-800">6 chữ số</span> đã được gửi về email của bạn
                </p>

                {/* 6-box OTP */}
                <div className="flex justify-center gap-2 mb-3">
                  {otpDigits.map((d, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      autoComplete="one-time-code"
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      className={`w-11 h-14 text-center text-xl font-black border-2 rounded-xl outline-none transition-all ${
                        otpError ? "border-red-400 bg-red-50 text-red-600" :
                        d ? "border-blue-500 bg-blue-50 text-blue-700" :
                        "border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-400 focus:bg-blue-50"
                      }`}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="text-center text-red-500 text-xs font-bold mb-4">{otpError}</p>
                )}
                {!otpError && <div className="mb-4" />}

                <button onClick={handleConfirmOtp} disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 mb-3">
                  {isProcessing ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang xác nhận...</>
                  ) : "Xác nhận thanh toán"}
                </button>

                <button onClick={() => { setQrStep(1); setOtpDigits(["","","","","",""]); setOtpError(""); }}
                  className="w-full flex items-center justify-center gap-1 text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors">
                  <ArrowLeft size={14} /> Quay lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-3 uppercase tracking-tight">
            Xác nhận & Thanh toán
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">
            Kiểm tra thông tin và xác nhận đặt vé của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Thông tin nhận vé */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <User size={22} strokeWidth={2.5} />
                </div>
                Thông tin nhận vé
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <User
                    className={`absolute left-4 top-4 ${errors.name ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Họ và tên khách hàng"
                    value={customerInfo.name}
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.name ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => {
                      setCustomerInfo({
                        ...customerInfo,
                        name: e.target.value,
                      });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Mail
                    className={`absolute left-4 top-4 ${errors.email ? "text-red-500" : "text-slate-400"}`}
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="Email nhận vé"
                    value={customerInfo.email}
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.email ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => {
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Phương thức thanh toán */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${paymentMethod === m.id ? m.color + " shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                  >
                    <div className="shrink-0">{m.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">
                        {m.label}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{m.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === m.id ? "border-transparent " + m.dot : "border-slate-300"}`}
                    >
                      {paymentMethod === m.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Cột phải: tóm tắt đơn */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-200">
              <div className="relative h-48 bg-slate-900 flex items-center p-6 overflow-hidden">
                {poster && (
                  <img
                    src={poster}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110"
                    alt="bg"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                <div className="relative z-10 w-full flex gap-5 items-center text-white">
                  {poster && (
                    <img
                      src={poster}
                      className="w-20 h-28 object-cover rounded-xl shadow-2xl border border-white/20 shrink-0"
                      alt="poster"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-black text-xl mb-2 leading-tight uppercase tracking-tight line-clamp-2">
                      {movieTitle}
                    </h3>
                    <div className="bg-[#dc2626] px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block">
                      2D Phụ Đề
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white">
                <div className="space-y-5 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100">
                      <MapPin size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Rạp chiếu
                      </p>
                      <p className="font-bold text-slate-800 text-[16px] leading-tight">
                        {cinemaName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100">
                      <Calendar size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Suất chiếu
                      </p>
                      <p className="font-bold text-slate-800 text-[16px] leading-tight">
                        {showTime} - {showDate}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm border border-slate-100">
                      <Armchair size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">
                        Vị trí ghế
                      </p>
                      <p className="font-black text-[#dc2626] text-xl tracking-widest">
                        {selectedSeats?.join(", ")}
                      </p>
                    </div>
                  </div>
                  {combos?.some((c) => c.quantity > 0) && (
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm">
                        <Popcorn size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#dc2626] text-[10px] font-black uppercase tracking-wider mb-2">
                          Bắp & Nước
                        </p>
                        <ul className="space-y-1.5">
                          {combos
                            .filter((c) => c.quantity > 0)
                            .map((c) => (
                              <li
                                key={c.id}
                                className="flex justify-between text-[13px] text-slate-700 font-bold"
                              >
                                <span>
                                  {c.quantity}x {c.name}
                                </span>
                                <span className="text-slate-400">
                                  {(c.price * c.quantity).toLocaleString()}đ
                                </span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t-2 border-slate-100 flex justify-between items-end mb-8">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                    Tổng cộng
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {finalTotalPrice?.toLocaleString("vi-VN")}{" "}
                    <span className="text-lg text-slate-300 font-normal">
                      ₫
                    </span>
                  </span>
                </div>

                {/* Nút thanh toán */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${
                    isProcessing
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : paymentMethod === "momo"
                        ? "bg-[#AE2070] hover:bg-[#8f1a5c] text-white shadow-pink-200 transform hover:-translate-y-1"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 transform hover:-translate-y-1"
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      ĐANG XỬ LÝ...
                    </>
                  ) : paymentMethod === "momo" ? (
                    "THANH TOÁN QUA MOMO"
                  ) : (
                    "HIỂN THỊ MÃ QR"
                  )}
                </button>

                <p className="text-center text-slate-400 text-xs mt-3 font-medium">
                  {paymentMethod === "momo"
                    ? "Bạn sẽ được chuyển đến trang thanh toán MoMo"
                    : "Mã QR VietQR hỗ trợ tất cả ngân hàng Việt Nam"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentPage;
