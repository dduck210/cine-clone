import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { movies } from "../../data/mockData";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import {
  Minus,
  Plus,
  Calendar,
  MapPin,
  Ticket,
  Popcorn,
  CreditCard,
} from "lucide-react";

const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedShowtime } = location.state || {};

  const cinemaName = selectedShowtime?.cinemaName || "5Cine Royal City";
  const showTime = selectedShowtime?.time || "19:30";
  const showAddress = selectedShowtime?.address || "Rạp 03 • Tầng 4";
  const showDate = "Thứ Bảy, 20/07/2024";

  const PRICE_PER_TICKET = 120000;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [movie, setMovie] = useState(null);

  const [combos, setCombos] = useState([
    {
      id: 1,
      name: "Combo Solo",
      detail: "1 Bắp + 1 Nước ngọt",
      price: 80000,
      quantity: 0,
    },
    {
      id: 2,
      name: "Combo Couple",
      detail: "1 Bắp lớn + 2 Nước",
      price: 150000,
      quantity: 0,
    },
  ]);

  const updateCombo = (id, delta) => {
    setCombos(
      combos.map((combo) =>
        combo.id === id
          ? { ...combo, quantity: Math.max(0, combo.quantity + delta) }
          : combo,
      ),
    );
  };

  useEffect(() => {
    if (id) {
      const foundMovie = movies.find((m) => m.id === parseInt(id));
      setMovie(foundMovie);
    }
  }, [id]);

  const bookedSeats = ["D5", "D6", "E5", "E6", "H10", "H11"];
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seatsPerRow = 12;

  const handleSeatClick = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const movieTitle = movie ? movie.title : "Đang tải tên phim...";

  const totalTicketPrice = selectedSeats.length * PRICE_PER_TICKET;
  const totalComboPrice = combos.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const finalTotalPrice = totalTicketPrice + totalComboPrice;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-16">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 border-l-4 border-red-600 pl-4">
          Chọn ghế của bạn
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* CỘT TRÁI: CHỌN GHẾ */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 w-full overflow-x-auto">
            {/* Màn hình chiếu */}
            <div className="w-full h-12 sm:h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-16 shadow-inner border border-slate-200 relative overflow-hidden shrink-0 min-w-[600px]">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-slate-300 to-transparent opacity-50"></div>
              <span className="text-slate-400 font-bold tracking-[0.5em] text-xs sm:text-sm uppercase">
                Màn hình chiếu
              </span>
            </div>

            {/* Sơ đồ ghế */}
            <div className="flex justify-center overflow-x-auto pb-4 custom-scrollbar">
              <div className="flex flex-col gap-3 min-w-max px-2">
                {rows.map((row) => (
                  <div
                    key={row}
                    className="flex gap-3 sm:gap-4 items-center justify-center"
                  >
                    <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">
                      {row}
                    </span>
                    {Array.from({ length: seatsPerRow }).map((_, index) => {
                      const seatNumber = index + 1;
                      const seatId = `${row}${seatNumber}`;
                      const isBooked = bookedSeats.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      // Lối đi ở giữa
                      const marginClass =
                        seatNumber === 6 ? "mr-6 sm:mr-10" : "";

                      return (
                        <button
                          key={seatId}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seatId)}
                          className={`
                            w-9 h-9 sm:w-11 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center
                            ${marginClass}
                            ${
                              isBooked
                                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-60"
                                : isSelected
                                  ? "bg-[#dc2626] text-white shadow-lg shadow-red-200 transform scale-110 ring-2 ring-red-100 border-none"
                                  : "bg-white text-slate-700 border-2 border-slate-300 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50"
                            }
                          `}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                    <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chú thích ghế */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mt-16 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-white border-2 border-slate-300"></div>
                <span className="text-slate-600 text-sm font-medium">
                  Ghế thường
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-[#dc2626] shadow-md shadow-red-200"></div>
                <span className="text-slate-600 text-sm font-medium">
                  Đang chọn
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 text-slate-400 flex items-center justify-center text-xs font-bold opacity-60">
                  X
                </div>
                <span className="text-slate-600 text-sm font-medium">
                  Đã đặt
                </span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BILL THANH TOÁN */}
          <div className="w-full lg:w-[450px] shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
              {/* Nền xanh bị đuổi, thay bằng nền đen/xám tối sang trọng */}
              <div className="bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
                <div className="relative z-10">
                  <h3 className="font-extrabold text-2xl mb-3 line-clamp-2 pr-12">
                    {movieTitle}
                  </h3>
                  <p className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm">
                      2D
                    </span>
                    <span>Phụ đề Tiếng Việt</span>
                  </p>
                </div>
                <Ticket className="absolute -bottom-6 -right-6 w-36 h-36 text-white/5 rotate-12" />
              </div>

              <div className="p-6 sm:p-8 flex-1 flex flex-col bg-[#fafafa]">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#dc2626] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{cinemaName}</p>
                      <p className="text-sm text-slate-500">{showAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-[#dc2626] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{showDate}</p>
                      <p className="text-sm text-slate-500">
                        {showTime} - Hôm nay
                      </p>
                    </div>
                  </div>
                </div>

                {/* Đường răng cưa */}
                <div className="border-t-2 border-dashed border-slate-200 my-4 relative">
                  <div className="absolute -left-10 -top-3 w-6 h-6 bg-[#f8fafc] rounded-full border-r border-slate-200 shadow-inner"></div>
                  <div className="absolute -right-10 -top-3 w-6 h-6 bg-[#f8fafc] rounded-full border-l border-slate-200 shadow-inner"></div>
                </div>

                <div className="flex justify-between items-start mb-6 pt-2">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1.5">
                    Ghế chọn:
                  </span>
                  <div className="text-right">
                    <span className="font-black text-slate-900 block text-xl break-words max-w-[200px]">
                      {selectedSeats.length > 0
                        ? selectedSeats.join(", ")
                        : "-"}
                    </span>
                    {selectedSeats.length > 0 && (
                      <span className="text-xs text-[#dc2626] font-bold">
                        {selectedSeats.length} ghế
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 mb-8">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <Popcorn size={16} className="text-[#dc2626]" />
                    Combo ưu đãi
                  </h4>
                  <div className="space-y-3">
                    {combos.map((combo) => (
                      <div
                        key={combo.id}
                        className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-sm text-slate-800">
                            {combo.name}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {combo.detail}
                          </p>
                          <p className="text-sm text-[#dc2626] font-black mt-1.5">
                            {combo.price.toLocaleString()}đ
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => updateCombo(combo.id, -1)}
                            className="text-slate-400 hover:text-[#dc2626] hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center text-slate-800">
                            {combo.quantity}
                          </span>
                          <button
                            onClick={() => updateCombo(combo.id, 1)}
                            className="text-slate-400 hover:text-[#dc2626] hover:bg-red-50 p-1 rounded transition-colors"
                          >
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá..."
                    className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-[#dc2626] focus:ring-4 focus:ring-red-50 transition-all font-medium placeholder:text-slate-400"
                  />
                </div>

                <div className="bg-slate-900 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 mt-auto rounded-b-2xl border-t-[3px] border-dashed border-slate-700">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                      Tổng thanh toán
                    </span>
                    <span className="text-3xl font-black text-white leading-none">
                      {finalTotalPrice?.toLocaleString()}{" "}
                      <span className="text-xl text-slate-400">₫</span>
                    </span>
                  </div>

                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => {
                      navigate("/payment", {
                        state: {
                          movieTitle,
                          poster: movie?.poster,
                          cinemaName,
                          showTime,
                          showDate,
                          showAddress,
                          selectedSeats,
                          combos,
                          finalTotalPrice,
                        },
                      });
                    }}
                    className={`w-full font-black py-4 rounded-xl transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-2
                      ${
                        selectedSeats.length === 0
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-[#dc2626] hover:bg-red-700 text-white shadow-lg shadow-red-900/50 hover:-translate-y-1"
                      }
                    `}
                  >
                    <CreditCard size={18} /> Thanh toán ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPage;
