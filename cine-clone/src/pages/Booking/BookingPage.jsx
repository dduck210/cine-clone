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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 ml-2">
          Chọn ghế của bạn
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
            <div className="w-full h-16 bg-gray-100 rounded-xl flex items-center justify-center mb-16 shadow-inner border border-gray-200 relative overflow-hidden">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-gray-300 to-transparent opacity-50"></div>
              <span className="text-gray-400 font-bold tracking-[0.5em] text-sm uppercase">
                Màn hình chiếu
              </span>
            </div>

            <div className="flex justify-center overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex flex-col gap-3 min-w-max">
                {rows.map((row) => (
                  <div
                    key={row}
                    className="flex gap-4 items-center justify-center"
                  >
                    <span className="w-6 text-gray-400 font-bold text-sm text-center">
                      {row}
                    </span>
                    {Array.from({ length: seatsPerRow }).map((_, index) => {
                      const seatNumber = index + 1;
                      const seatId = `${row}${seatNumber}`;
                      const isBooked = bookedSeats.includes(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      const marginClass = seatNumber === 6 ? "mr-10" : "";

                      return (
                        <button
                          key={seatId}
                          disabled={isBooked}
                          onClick={() => handleSeatClick(seatId)}
                          className={`
                                            w-10 h-10 sm:w-11 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center shadow-sm
                                            ${marginClass}
                                            ${
                                              isBooked
                                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                                : isSelected
                                                  ? "bg-[#0369a1] text-white shadow-lg shadow-blue-200 transform scale-110 ring-2 ring-blue-200"
                                                  : "bg-white text-gray-700 border border-gray-300 hover:border-[#0369a1] hover:text-[#0369a1] hover:bg-blue-50"
                                            }
                                        `}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                    <span className="w-6 text-gray-400 font-bold text-sm text-center">
                      {row}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-12 mt-12 border-t border-gray-100 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-white border border-gray-300"></div>
                <span className="text-gray-600 text-sm">Ghế thường</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-[#0369a1] shadow-md"></div>
                <span className="text-gray-600 text-sm">Đang chọn</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
                  X
                </div>
                <span className="text-gray-600 text-sm">Đã đặt</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="bg-[#0369a1] p-6 text-white relative overflow-hidden flex-shrink-0">
                <div className="relative z-10">
                  <h3 className="font-bold text-2xl mb-2 line-clamp-2">
                    {movieTitle}
                  </h3>
                  <p className="text-blue-100 text-sm flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">
                      2D
                    </span>
                    <span>Phụ đề Tiếng Việt</span>
                  </p>
                </div>
                <Ticket className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-800">{cinemaName}</p>
                      <p className="text-sm text-gray-500">{showAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-800">{showDate}</p>
                      <p className="text-sm text-gray-500">
                        {showTime} - Hôm nay
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-100 my-4 relative">
                  <div className="absolute -left-9 -top-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                  <div className="absolute -right-9 -top-3 w-6 h-6 bg-gray-50 rounded-full"></div>
                </div>

                <div className="flex justify-between items-start mb-6">
                  <span className="text-gray-500 font-medium">Ghế chọn:</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block text-lg break-words max-w-[200px]">
                      {selectedSeats.length > 0
                        ? selectedSeats.join(", ")
                        : "-"}
                    </span>
                    {selectedSeats.length > 0 && (
                      <span className="text-xs text-blue-600 font-semibold">
                        {selectedSeats.length} ghế
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Popcorn size={18} className="text-orange-500" />
                    Combo ưu đãi
                  </h4>
                  <div className="space-y-3">
                    {combos.map((combo) => (
                      <div
                        key={combo.id}
                        className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-sm text-gray-800">
                            {combo.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {combo.detail}
                          </p>
                          <p className="text-sm text-[#0369a1] font-semibold mt-1">
                            {combo.price.toLocaleString()}đ
                          </p>
                        </div>
                        <div className="flex items-center gap-3 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                          <button
                            onClick={() => updateCombo(combo.id, -1)}
                            className="text-gray-400 hover:text-[#0369a1]"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">
                            {combo.quantity}
                          </span>
                          <button
                            onClick={() => updateCombo(combo.id, 1)}
                            className="text-gray-400 hover:text-[#0369a1]"
                          >
                            <Plus size={14} />
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
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
                    className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all uppercase text-sm tracking-wider flex items-center justify-center gap-2
        ${
          selectedSeats.length === 0
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-[#0369a1] hover:bg-[#0284c7] text-white shadow-blue-200 hover:-translate-y-1"
        }`}
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
