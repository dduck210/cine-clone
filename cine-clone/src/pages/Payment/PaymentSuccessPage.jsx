import React, { useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckCircle, Home, Ticket, ArrowLeft, Crown } from "lucide-react";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    movieTitle,
    cinemaName,
    showTime,
    showDate,
    selectedSeats = [],
    finalTotalPrice,
    orderId,
    isHistoryMode,
  } = location.state || {};

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!location.state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">
          Không tìm thấy đơn hàng!
        </h2>
        <Link to="/" className="mt-4 text-red-600 hover:underline font-bold">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10">
          {isHistoryMode ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">
                Chi tiết vé điện tử
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {orderId}
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short border border-green-200">
                <CheckCircle
                  className="w-10 h-10 text-green-600"
                  strokeWidth={2.5}
                />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {orderId || "XC-99281"}
                </span>
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Vé đã được lưu vào lịch sử của bạn.
              </p>
            </>
          )}
        </div>

        <div className="bg-white mx-auto w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden font-sans text-gray-900 border border-gray-100 hover:shadow-red-100/50 transition-shadow duration-500">
          <div className="bg-slate-900 p-6 pb-6 relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Crown size={120} className="text-[#d4af37]" />
            </div>

            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown size={14} className="text-[#d4af37]" />
                <p className="text-[#d4af37] text-[10px] font-black tracking-[0.4em] uppercase">
                  V.I.P Admission
                </p>
              </div>
              <h2 className="text-[22px] font-black text-white leading-tight uppercase tracking-tight">
                {movieTitle}
              </h2>
              <div className="mt-3 inline-block px-3 py-1 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded-full text-[#d4af37] text-[10px] font-black tracking-widest uppercase">
                2D Phụ Đề
              </div>
            </div>
          </div>

          <div className="p-6 pb-4 space-y-5 bg-white flex-1 relative">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            ></div>

            <div className="relative z-10 space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                  Cinema
                </p>
                <p className="text-[15px] font-black text-slate-800 uppercase leading-none">
                  {cinemaName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                    Date
                  </p>
                  <p className="text-[14px] font-black text-slate-800">
                    {showDate}
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                    Time
                  </p>
                  <p className="text-[14px] font-black text-slate-800">
                    {showTime}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">
                    Seat(s)
                  </p>
                  <p className="text-[24px] font-black text-[#dc2626] tracking-tighter leading-none">
                    {Array.isArray(selectedSeats)
                      ? selectedSeats.join(", ")
                      : selectedSeats}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">
                    Room
                  </p>
                  <p className="text-[24px] font-black text-[#dc2626] tracking-tighter leading-none">
                    03
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 flex flex-col items-center justify-center border-t border-dashed border-slate-100">
              <div className="flex gap-5 items-center w-full px-2 justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${orderId || "XC-DEMO"}`}
                  alt="QR Code"
                  className="w-[70px] h-[70px] mix-blend-multiply shrink-0"
                />
                <div className="flex flex-col justify-center items-center">
                  <div className="h-7 flex gap-[2.5px] opacity-80 justify-center w-full">
                    {[2, 4, 1, 3, 2, 1, 1, 3, 4, 2, 1, 2, 3, 1, 1].map(
                      (w, i) => (
                        <div
                          key={i}
                          className="bg-slate-900 h-full"
                          style={{ width: `${w}px` }}
                        ></div>
                      ),
                    )}
                  </div>
                  <p className="font-mono font-black text-slate-500 text-[11px] mt-2 tracking-widest uppercase">
                    {orderId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 relative p-5">
            <div className="absolute top-0 left-0 w-full h-[6px] bg-[radial-gradient(circle,transparent_3px,#0f172a_3px)] bg-[length:14px_12px] -mt-[6px]"></div>

            <div className="flex justify-between items-end">
              <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-widest">
                Total Paid
              </span>
              <span className="text-[20px] font-black text-white">
                {finalTotalPrice?.toLocaleString()} ₫
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center px-4">
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
