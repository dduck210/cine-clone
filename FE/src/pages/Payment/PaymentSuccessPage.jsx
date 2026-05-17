import React, { useEffect, useState } from "react";
import { useLocation, useSearchParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { CheckCircle, Home, Ticket, ArrowLeft, Crown, XCircle, Clock, Download } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import toast, { Toaster } from "react-hot-toast";

const PaymentSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isMomoReturn = searchParams.has("resultCode");
  const isHistoryMode = location.state?.isHistoryMode;
  const isCash = location.state?.isCash;
  const bookingStatus = location.state?.bookingStatus;
  const paymentMethod = location.state?.paymentMethod;
  const ticketStatus = location.state?.ticketStatus;

  // Vé chỉ hiển thị QR/PDF sau khi admin xuất vé
  const isTicketIssued = isHistoryMode && ticketStatus === "printed";
  const isPendingCash =
    (isCash && !isHistoryMode) ||
    (isHistoryMode && paymentMethod === "cash" && bookingStatus !== "paid");

  useEffect(() => {
    window.scrollTo(0, 0);

    if (isMomoReturn) {
      const resultCode = searchParams.get("resultCode");

      if (resultCode !== "0") {
        setError(searchParams.get("message") || "Thanh toán thất bại hoặc bị hủy.");
        return;
      }

      // Gọi backend để verify chữ ký và lấy thông tin vé
      setLoading(true);
      const params = {};
      searchParams.forEach((v, k) => { params[k] = v; });

      axiosInstance.post("/payments/momo/confirm", params)
        .then((res) => setTicketData(res.data))
        .catch((err) => setError(err.response?.data?.message || "Xác nhận thanh toán thất bại"))
        .finally(() => setLoading(false));

    } else if (location.state) {
      // Luồng tiền mặt/QR/history — dữ liệu có sẵn trong state
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

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#AE2070] border-t-transparent" />
        <p className="text-slate-500 font-medium">Đang xác nhận thanh toán MoMo...</p>
      </div>
    );
  }

  // --- Lỗi thanh toán ---
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
          <button onClick={() => navigate("/")}
            className="px-8 py-3 bg-[#dc2626] text-white font-bold rounded-xl hover:bg-red-700 transition-all">
            Về trang chủ
          </button>
        </main>
      </div>
    );
  }

  if (!ticketData) return null;

  const { bookingId, bookingCode, movieTitle, cinemaName, roomName, showTime, showDate, selectedSeats, finalTotalPrice, poster, combos = [] } = ticketData;

  const showPdfButton = isTicketIssued;

  const handleDownloadPdf = async () => {
    if (!bookingId) return;
    setDownloadingPdf(true);
    try {
      const response = await axiosInstance.get(`/tickets/${bookingId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${bookingCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Không thể tải vé PDF. Vui lòng thử lại.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />
      <Toaster position="top-center" />

      <main className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10">
          {isHistoryMode ? (
            <>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-tight">
                {isTicketIssued ? "Chi tiết vé điện tử" : "Chi tiết đơn đặt vé"}
              </h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">{bookingCode}</span>
              </p>
              {!isTicketIssued && bookingStatus === "paid" && (
                <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-full text-sm font-bold">
                  <Clock size={16} /> Vé điện tử đang chờ nhân viên rạp xác nhận
                </div>
              )}
            </>
          ) : isCash ? (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
                <Clock className="w-10 h-10 text-amber-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Đặt vé thành công!</h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">{bookingCode || "—"}</span>
              </p>
              <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-bold">
                <Clock size={16} /> Vui lòng đến quầy rạp thanh toán trước giờ chiếu
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-200">
                <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Thanh toán thành công!</h1>
              <p className="text-gray-500 font-medium">
                Mã đơn hàng:{" "}
                <span className="font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">{bookingCode || "—"}</span>
              </p>
              <p className="text-gray-400 text-sm mt-2">Vé điện tử sẽ hiển thị sau khi nhân viên rạp xác nhận.</p>
            </>
          )}
        </div>

        {/* Ticket card */}
        <div className="bg-white mx-auto w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-slate-900 p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Crown size={120} className="text-[#d4af37]" />
            </div>
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown size={14} className="text-[#d4af37]" />
                <p className="text-[#d4af37] text-[10px] font-black tracking-[0.4em] uppercase">V.I.P Admission</p>
              </div>
              <h2 className="text-[22px] font-black text-white leading-tight uppercase tracking-tight">{movieTitle}</h2>
              <div className="mt-3 inline-block px-3 py-1 border border-[#d4af37]/30 bg-[#d4af37]/10 rounded-full text-[#d4af37] text-[10px] font-black tracking-widest uppercase">
                2D Phụ Đề
              </div>
            </div>
          </div>

          <div className="p-6 pb-4 space-y-5 bg-white relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "12px 12px" }} />

            <div className="relative z-10 space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Cinema</p>
                <p className="text-[15px] font-black text-slate-800 uppercase leading-none">{cinemaName}</p>
                {roomName && <p className="text-[11px] text-slate-400 font-bold mt-0.5">{roomName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Date</p>
                  <p className="text-[14px] font-black text-slate-800">{showDate}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Time</p>
                  <p className="text-[14px] font-black text-slate-800">{showTime}</p>
                </div>
              </div>
              <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Seat(s)</p>
                  <p className="text-[24px] font-black text-[#dc2626] tracking-tighter leading-none">
                    {Array.isArray(selectedSeats) ? selectedSeats.join(", ") : selectedSeats}
                  </p>
                </div>
              </div>
              {combos.length > 0 && (
                <div className="p-3.5 bg-orange-50/60 border border-orange-100 rounded-2xl">
                  <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-2">F&B / Combo</p>
                  <div className="space-y-1.5">
                    {combos.map((c, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[13px] font-semibold text-slate-700">{c.name} <span className="text-orange-500">×{c.quantity}</span></span>
                        <span className="text-[13px] font-black text-slate-800">{(c.price * c.quantity).toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 flex flex-col items-center border-t border-dashed border-slate-100">
              {isTicketIssued ? (
                <div className="flex gap-5 items-center w-full px-2 justify-center">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${bookingCode || "5CINE"}`}
                    alt="QR Code" className="w-[70px] h-[70px] mix-blend-multiply shrink-0" />
                  <div className="flex flex-col items-center">
                    <div className="h-7 flex gap-[2.5px] opacity-80">
                      {[2, 4, 1, 3, 2, 1, 1, 3, 4, 2, 1, 2, 3, 1, 1].map((w, i) => (
                        <div key={i} className="bg-slate-900 h-full" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <p className="font-mono font-black text-slate-500 text-[11px] mt-2 tracking-widest uppercase">{bookingCode}</p>
                  </div>
                </div>
              ) : isPendingCash ? (
                <div className="flex flex-col items-center gap-2 py-2 px-4 w-full">
                  <div className="w-[70px] h-[70px] rounded-xl bg-amber-50 border-2 border-dashed border-amber-300 flex items-center justify-center shrink-0">
                    <Clock className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-[11px] font-bold text-amber-500 text-center tracking-wide uppercase">
                    QR xuất hiện sau khi thanh toán tại quầy
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2 px-4 w-full">
                  <div className="w-[70px] h-[70px] rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <Ticket className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 text-center tracking-wide uppercase">
                    QR xuất hiện sau khi nhân viên xác nhận vé
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 relative p-5">
            <div className="absolute top-0 left-0 w-full h-[6px] bg-[radial-gradient(circle,transparent_3px,#0f172a_3px)] bg-[length:14px_12px] -mt-[6px]" />
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-black text-[#d4af37] uppercase tracking-widest">{isCash ? "Tổng tiền (chưa thanh toán)" : "Total Paid"}</span>
              <span className="text-[20px] font-black text-white">{finalTotalPrice?.toLocaleString()} ₫</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center px-4 flex-wrap">
          {isHistoryMode ? (
            <button onClick={() => navigate("/my-tickets")}
              className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest">
              <ArrowLeft size={18} strokeWidth={3} /> Quay lại danh sách
            </button>
          ) : (
            <>
              <button onClick={() => navigate("/")}
                className="w-full sm:w-auto px-10 py-3.5 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest">
                <Home size={18} strokeWidth={3} /> Về trang chủ
              </button>
              <button onClick={() => navigate("/my-tickets")}
                className="w-full sm:w-auto px-10 py-3.5 bg-[#dc2626] rounded-2xl font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest">
                <Ticket size={18} strokeWidth={3} /> Xem vé của tôi
              </button>
            </>
          )}
          {showPdfButton && bookingId && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full sm:w-auto px-10 py-3.5 bg-slate-800 rounded-2xl font-black text-white hover:bg-slate-900 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-widest disabled:opacity-60"
            >
              <Download size={18} strokeWidth={3} />
              {downloadingPdf ? "Đang tải..." : "Tải vé PDF"}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentSuccessPage;
