import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  User, Mail, CheckCircle, MapPin, Calendar, Armchair, Popcorn,
  Ticket, Clock, Tag,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";


const PAYMENT_METHODS = [
  {
    id: "momo", label: "Ví MoMo", desc: "Quét mã QR bằng app MoMo để thanh toán",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#AE2070" />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Arial">MoMo</text>
      </svg>
    ),
    color: "border-[#AE2070] bg-[#AE2070]/5", dot: "bg-[#AE2070]",
  },
  {
    id: "bank", label: "MB Bank", desc: "Chuyển khoản qua QR VietQR — tự động xác nhận",
    icon: (
      <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
        <circle cx="24" cy="24" r="24" fill="#004C97" />
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">MB</text>
      </svg>
    ),
    color: "border-[#004C97] bg-[#004C97]/5", dot: "bg-[#004C97]",
  },
];

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    showtimeId, movieTitle, cinemaName, roomName, showTime, showDate, showAddress,
    selectedSeats = [], combos = [], finalTotalPrice, poster, duration,
    existingBookingId, existingBookingCode, originalPrice, mondayDiscount = 0, voucherDiscount = 0,
    voucherCode, voucherType, voucherValue,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [customerInfo, setCustomerInfo] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => { return () => { toast.dismiss(); }; }, []);
  useEffect(() => { window.scrollTo(0, 0); if (!location.state) navigate("/"); }, [location, navigate]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user) setCustomerInfo((p) => ({ ...p, name: user.name || "", email: user.email || "" }));
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerInfo.name.trim()) newErrors.name = "Vui lòng nhập họ tên";
    if (!customerInfo.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!emailRegex.test(customerInfo.email)) newErrors.email = "Email sai định dạng";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    if (!validateForm()) { toast.error("Vui lòng hoàn thiện thông tin nhận vé!", { id: "pay-val" }); return; }
    const token = localStorage.getItem("token");
    if (!token) { toast.error("Vui lòng đăng nhập để đặt vé!", { id: "pay-auth" }); navigate("/login"); return; }

    setIsProcessing(true);
    const loadingToast = toast.loading("Đang xử lý...");

    try {
      let bookingId, bookingCode;
      if (existingBookingId) { bookingId = existingBookingId; bookingCode = existingBookingCode || ""; }
      else {
        const extraItems = combos.filter((c) => c.quantity > 0).map((c) => ({ name: c.name, quantity: c.quantity, price: c.price }));
        const bookingRes = await axiosInstance.post("/bookings", { showtimeId, seats: selectedSeats, extraItems, voucherCode: voucherCode || undefined });
        bookingId = bookingRes.data._id;
        bookingCode = bookingRes.data.bookingCode;
      }

      const navState = {
        bookingId, bookingCode, amount: finalTotalPrice,
        movieTitle, cinemaName, roomName, showTime, showDate, showAddress,
        selectedSeats, duration, poster,
        combos, originalPrice, mondayDiscount, voucherDiscount, voucherCode, voucherType, voucherValue,
      };

      if (paymentMethod === "momo") {
        const momoRes = await axiosInstance.post("/payments/momo/create", { bookingId });
        toast.dismiss(loadingToast);
        setIsProcessing(false);
        navigate("/payment/momo", {
          state: { ...navState, payUrl: momoRes.data.payUrl, deeplink: momoRes.data.deeplink, qrCodeUrl: momoRes.data.qrCodeUrl },
        });
      } else if (paymentMethod === "bank") {
        toast.dismiss(loadingToast);
        setIsProcessing(false);
        navigate("/payment/bank", { state: navState });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại");
      setIsProcessing(false);
    }
  };


  if (!location.state) return null;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      <Navbar />

      {/* ── Success overlay ── */}
      {isSuccess && (
        <div className="fixed inset-0 bg-slate-900/90 z-[90] flex items-start sm:items-center justify-center p-4 pt-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 my-auto">
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
                <div><p className="text-xs text-slate-400 font-medium">Phim</p><p className="font-bold text-slate-800 text-sm line-clamp-1">{movieTitle}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center"><p className="text-xs text-slate-400 font-medium mb-0.5">Suất chiếu</p><p className="font-bold text-slate-800 text-sm">{showTime}</p></div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center"><p className="text-xs text-slate-400 font-medium mb-0.5">Ghế</p><p className="font-bold text-[#dc2626] text-sm">{selectedSeats?.join(", ")}</p></div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 flex items-center justify-between">
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wide">Tổng tiền</span>
                <span className="font-black text-emerald-700 text-lg">{finalTotalPrice?.toLocaleString()}đ</span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2"><div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${((5 - countdown) / 5) * 100}%` }} /></div>
              <p className="text-center text-slate-400 text-xs font-medium">Đang chuyển đến trang vé ({countdown}s)...</p>
            </div>
          </div>
        </div>
      )}


      {/* ── Main content ── */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-3 uppercase tracking-tight">Xác nhận & Thanh toán</h1>
          <p className="text-slate-500 max-w-2xl mx-auto font-medium">Kiểm tra thông tin và xác nhận đặt vé của bạn.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Thông tin nhận vé */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-8 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm"><User size={22} strokeWidth={2.5} /></div>
                Thông tin nhận vé
              </h3>
              <div className="space-y-5">
                <div className="relative">
                  <User className={`absolute left-4 top-4 ${errors.name ? "text-red-500" : "text-slate-400"}`} size={20} />
                  <input type="text" placeholder="Họ và tên khách hàng" value={customerInfo.name}
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.name ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => { setCustomerInfo({ ...customerInfo, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: "" }); }} />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">{errors.name}</p>}
                </div>
                <div className="relative">
                  <Mail className={`absolute left-4 top-4 ${errors.email ? "text-red-500" : "text-slate-400"}`} size={20} />
                  <input type="email" placeholder="Email nhận vé" value={customerInfo.email}
                    className={`w-full bg-slate-50 border rounded-xl pl-12 pr-4 py-4 outline-none transition-all font-semibold ${errors.email ? "border-red-500 ring-4 ring-red-50" : "border-slate-200 focus:border-[#dc2626] focus:ring-4 focus:ring-red-50"}`}
                    onChange={(e) => { setCustomerInfo({ ...customerInfo, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: "" }); }} />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-bold ml-1">{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* Phương thức thanh toán */}
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626] shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                </div>
                Phương thức thanh toán
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left ${paymentMethod === m.id ? m.color + " shadow-md" : "border-slate-200 hover:border-slate-300 bg-white"}`}>
                    <div className="shrink-0">{m.icon}</div>
                    <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 text-sm">{m.label}</p><p className="text-slate-400 text-xs mt-0.5">{m.desc}</p></div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${paymentMethod === m.id ? "border-transparent " + m.dot : "border-slate-300"}`}>
                      {paymentMethod === m.id && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Cột phải: tóm tắt đơn */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden">
              {/* Poster */}
              <div className="relative h-48 bg-slate-900 flex items-center p-6 overflow-hidden rounded-t-[32px]">
                {poster && <img src={poster} className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110" alt="bg" />}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                <div className="relative z-10 w-full flex gap-5 items-center text-white">
                  {poster && <img src={poster} className="w-20 h-28 object-cover rounded-xl shadow-2xl border border-white/20 shrink-0" alt="poster" />}
                  <div className="flex-1">
                    <h3 className="font-black text-xl mb-2 leading-tight uppercase tracking-tight line-clamp-2">{movieTitle}</h3>
                    <div className="bg-[#dc2626] px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest inline-block">2D Phụ Đề</div>
                  </div>
                </div>
              </div>

              {/* Booking details */}
              <div className="p-8 pb-4 bg-white">
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100"><MapPin size={20} strokeWidth={2.5} /></div>
                    <div className="flex-1"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Rạp chiếu</p><p className="font-bold text-slate-800 text-[16px] leading-tight">{cinemaName}</p></div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#dc2626] shrink-0 border border-red-100"><Calendar size={20} strokeWidth={2.5} /></div>
                    <div className="flex-1"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Suất chiếu</p><p className="font-bold text-slate-800 text-[16px] leading-tight">{showTime} - {showDate}</p></div>
                  </div>
                  {(roomName || duration > 0) && (
                    <div className="grid grid-cols-2 gap-3">
                      {roomName && <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100"><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Phòng chiếu</p><p className="font-bold text-slate-800 text-[13px]">{roomName}</p></div>}
                      {duration > 0 && <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2"><Clock size={14} className="text-[#dc2626] shrink-0" /><div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Thời lượng</p><p className="font-bold text-slate-800 text-[13px]">{duration} phút</p></div></div>}
                    </div>
                  )}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm border border-slate-100"><Armchair size={20} strokeWidth={2.5} /></div>
                    <div className="flex-1"><p className="text-slate-400 font-bold uppercase tracking-wider text-[9px] mb-0.5">Vị trí ghế</p><p className="font-black text-[#dc2626] text-xl tracking-widest">{selectedSeats?.join(", ")}</p></div>
                  </div>
                  {combos?.some((c) => c.quantity > 0) && (
                    <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#dc2626] shrink-0 shadow-sm"><Popcorn size={20} /></div>
                      <div className="flex-1">
                        <p className="text-[#dc2626] text-[10px] font-black uppercase tracking-wider mb-2">Bắp & Nước</p>
                        <ul className="space-y-1.5">
                          {combos.filter((c) => c.quantity > 0).map((c) => (
                            <li key={c.id} className="flex justify-between text-[13px] text-slate-700 font-bold"><span>{c.quantity}x {c.name}</span><span className="text-slate-400">{(c.price * c.quantity).toLocaleString()}đ</span></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Discount + tổng cộng + nút - luôn hiển thị ở dưới */}
              <div className="px-8 pt-5 pb-7 bg-white border-t-2 border-slate-100 shrink-0">
                {(mondayDiscount > 0 || voucherDiscount > 0) ? (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-sm text-slate-400">
                      <span>Tạm tính</span>
                      <span>{originalPrice?.toLocaleString("vi-VN")}đ</span>
                    </div>
                    {mondayDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <Tag size={12} /> Gold Monday −20%
                        </span>
                        <span className="text-emerald-600 font-bold">−{mondayDiscount?.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    {voucherDiscount > 0 && voucherCode && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-1.5 text-violet-600 font-semibold">
                          <Tag size={12} /> {voucherCode} {voucherType === "percent" ? `−${voucherValue}%` : ""}
                        </span>
                        <span className="text-violet-600 font-bold">−{voucherDiscount?.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-end">
                      <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tổng cộng</span>
                      <span className="text-3xl font-black text-slate-900 leading-none">{finalTotalPrice?.toLocaleString("vi-VN")} <span className="text-lg text-slate-300 font-normal">₫</span></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Tổng cộng</span>
                    <span className="text-3xl font-black text-slate-900 leading-none">{finalTotalPrice?.toLocaleString("vi-VN")} <span className="text-lg text-slate-300 font-normal">₫</span></span>
                  </div>
                )}

                <button onClick={handlePayment} disabled={isProcessing}
                  className={`w-full font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3 ${isProcessing ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : paymentMethod === "bank" ? "bg-[#004C97] hover:bg-[#003a75] text-white shadow-blue-200 transform hover:-translate-y-1" : "bg-[#AE2070] hover:bg-[#8f1a5c] text-white shadow-pink-200 transform hover:-translate-y-1"}`}>
                  {isProcessing ? (<><svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>ĐANG XỬ LÝ...</>) : "THANH TOÁN NGAY"}
                </button>

                <p className="text-center text-slate-400 text-xs mt-3 font-medium">
                  {paymentMethod === "bank" ? "Chuyển khoản MB Bank — hệ thống tự động xác nhận" : "Quét mã QR bằng app MoMo để thanh toán"}
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
