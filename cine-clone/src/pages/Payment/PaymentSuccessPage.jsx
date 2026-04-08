import React from "react";
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

  if (!location.state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-bold text-gray-800">
          Không tìm thấy đơn hàng!
        </h2>
        <Link to="/" className="mt-4 text-blue-600 hover:underline">
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
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Chi tiết vé điện tử
              </h1>
              <p className="text-gray-500">
                Mã đơn hàng:{" "}
                <span className="font-mono font-bold text-gray-900">
                  {orderId}
                </span>
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-short">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-500">
                Mã đơn hàng:{" "}
                <span className="font-mono font-bold text-gray-900">
                  {orderId || "XC-99281"}
                </span>
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Vé đã được lưu vào hệ thống của bạn.
              </p>
            </>
          )}
        </div>

        <div className="bg-white mx-auto w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden font-sans text-gray-900 border border-gray-200 hover:shadow-3xl transition-shadow duration-300">
          <div className="bg-slate-900 p-5 pb-5 relative overflow-hidden shrink-0">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Crown size={120} className="text-[#d4af37]" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={14} className="text-[#d4af37]" />
                <p className="text-[#d4af37] text-[9px] font-bold tracking-[0.3em] uppercase">
                  V.I.P Admission
                </p>
              </div>
              <h2 className="text-[20px] font-black text-white leading-tight uppercase tracking-wide">
                {movieTitle}
              </h2>
              <div className="mt-2 inline-block px-2 py-1 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded text-[#d4af37] text-[9px] font-bold tracking-widest uppercase">
                2D Subtitle
              </div>
            </div>
          </div>

          <div className="p-4 pb-2 space-y-4 bg-white flex-1 relative">
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                backgroundSize: "12px 12px",
              }}
            ></div>

            <div className="relative z-10 space-y-2">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">
                  Cinema
                </p>
                <p className="text-[14px] font-extrabold text-slate-900 leading-tight uppercase">
                  {cinemaName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">
                    Date
                  </p>
                  <p className="text-[13px] font-extrabold text-slate-900">
                    {showDate}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-0.5">
                    Time
                  </p>
                  <p className="text-[13px] font-extrabold text-slate-900">
                    {showTime}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#fffaf0] border border-[#f3e3b7] rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-[#b8860b] font-bold uppercase tracking-[0.2em] mb-0.5">
                    Seat(s)
                  </p>
                  <p className="text-[22px] font-black text-slate-900 tracking-tighter leading-none">
                    {Array.isArray(selectedSeats)
                      ? selectedSeats.join(", ")
                      : selectedSeats}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-[#b8860b] font-bold uppercase tracking-[0.2em] mb-0.5">
                    Room
                  </p>
                  <p className="text-[22px] font-black text-slate-900 tracking-tighter leading-none">
                    03
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 flex flex-col items-center justify-center shrink-0">
              <div className="flex gap-4 items-center w-full px-2 justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${orderId || "XC-DEMO"}`}
                  alt="QR Code"
                  className="w-[60px] h-[60px] mix-blend-multiply shrink-0"
                />
                <div className="flex flex-col justify-center items-center">
                  <div className="h-6 flex gap-[2px] opacity-80 justify-center w-full">
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
                  <p className="font-mono font-bold text-slate-600 text-[10px] mt-1.5 tracking-widest uppercase">
                    {orderId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 relative shrink-0">
            <div className="absolute top-0 left-0 w-full border-t-2 border-dashed border-black -mt-[2px]"></div>
            <div className="absolute top-0 left-0 w-full h-[6px] bg-[radial-gradient(circle,transparent_3px,#0f172a_3px)] bg-[length:14px_12px] -mt-[6px]"></div>

            <div className="p-4 flex justify-between items-end">
              <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest">
                Total Paid
              </span>
              <span className="text-[18px] font-black text-white">
                {finalTotalPrice?.toLocaleString()} ₫
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
          {isHistoryMode ? (
            <button
              onClick={() => navigate("/my-tickets")}
              className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} /> Quay lại danh sách
            </button>
          ) : (
            <>
              <Link to="/" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <Home size={18} /> Về trang chủ
                </button>
              </Link>
              <Link to="/my-tickets" className="flex-1 sm:flex-none">
                <button className="w-full sm:w-auto px-8 py-3 bg-[#0369a1] rounded-xl font-bold text-white hover:bg-[#0284c7] shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                  <Ticket size={18} /> Xem vé của tôi
                </button>
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
