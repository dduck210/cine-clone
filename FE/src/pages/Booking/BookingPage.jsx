import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axiosInstance from "../../api/axiosConfig";
import {
  Minus,
  Plus,
  Calendar,
  MapPin,
  Ticket,
  Popcorn,
  CreditCard,
  Clock,
  AlertTriangle,
} from "lucide-react";

const HOLD_SECONDS = 5 * 60; // 5 minutes

const SEAT_COLORS = {
  normal: {
    available: "bg-white text-slate-700 border-2 border-slate-300 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50",
    selected: "bg-[#dc2626] text-white shadow-lg shadow-red-200 scale-110 ring-2 ring-red-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Thường",
    dot: "bg-white border-2 border-slate-300",
  },
  vip: {
    available: "bg-amber-50 text-amber-700 border-2 border-amber-400 hover:border-amber-600 hover:bg-amber-100",
    selected: "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110 ring-2 ring-amber-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "VIP",
    dot: "bg-amber-400",
  },
  couple: {
    available: "bg-pink-50 text-pink-700 border-2 border-pink-400 hover:border-pink-600 hover:bg-pink-100",
    selected: "bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110 ring-2 ring-pink-100",
    locked: "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-50",
    label: "Đôi",
    dot: "bg-pink-400",
  },
};

// Check if selecting/deselecting a seat would leave an available gap in its row
function checkGapViolation(seatMap, seatsByRow, currentSelected, toggleSeatNum) {
  const tempSelected = currentSelected.includes(toggleSeatNum)
    ? currentSelected.filter((s) => s !== toggleSeatNum)
    : [...currentSelected, toggleSeatNum];

  const byRow = {};
  for (const sn of tempSelected) {
    const match = sn.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const [, row, col] = match;
    if (!byRow[row]) byRow[row] = [];
    byRow[row].push(parseInt(col));
  }

  for (const [row, cols] of Object.entries(byRow)) {
    if (cols.length < 2) continue;
    cols.sort((a, b) => a - b);
    for (let i = 0; i < cols.length - 1; i++) {
      for (let gap = cols[i] + 1; gap < cols[i + 1]; gap++) {
        const gapSeatNum = `${row}${gap}`;
        const gapSeat = seatMap[gapSeatNum];
        if (gapSeat && gapSeat.status === "available" && !gapSeat.isLocked) {
          return `Không thể bỏ trống ghế ${gapSeatNum} giữa các ghế đã chọn`;
        }
      }
    }
  }
  return null;
}

const BookingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedShowtime, movieTitle, poster } = location.state || {};

  const showtimeId = selectedShowtime?.showtimeId;
  const cinemaName = selectedShowtime?.cinemaName || "5Cine";
  const showTime = selectedShowtime?.time || "";
  const showAddress = selectedShowtime?.address || "";

  const [showtimeData, setShowtimeData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [seatMap, setSeatMap] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [gapError, setGapError] = useState("");

  // 5-minute countdown
  const [secondsLeft, setSecondsLeft] = useState(HOLD_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);

  const [combos, setCombos] = useState([
    { id: 1, name: "Combo Solo", detail: "1 Bắp + 1 Nước ngọt", price: 80000, quantity: 0 },
    { id: 2, name: "Combo Couple", detail: "1 Bắp lớn + 2 Nước", price: 150000, quantity: 0 },
  ]);

  useEffect(() => {
    if (!showtimeId) {
      setLoadingSeats(false);
      return;
    }
    axiosInstance
      .get(`/showtimes/${showtimeId}`)
      .then((res) => {
        setShowtimeData(res.data.data);
        const seatList = res.data.seats || [];
        setSeats(seatList);
        const map = {};
        for (const s of seatList) {
          map[s.seatNumber] = s;
        }
        setSeatMap(map);
      })
      .catch(() => setSeats([]))
      .finally(() => setLoadingSeats(false));
  }, [showtimeId]);

  // Start countdown when user selects first seat
  useEffect(() => {
    if (selectedSeats.length > 0 && !timerStarted) {
      setTimerStarted(true);
    }
  }, [selectedSeats, timerStarted]);

  useEffect(() => {
    if (!timerStarted) return;
    if (secondsLeft <= 0) {
      alert("Hết thời gian giữ ghế! Vui lòng chọn lại.");
      navigate(-1);
      return;
    }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timerStarted, secondsLeft, navigate]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const updateCombo = (comboId, delta) => {
    setCombos(combos.map((c) => (c.id === comboId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)));
  };

  const handleSeatClick = useCallback(
    (seatNum) => {
      const seat = seatMap[seatNum];
      if (!seat || seat.status === "reserved" || seat.status === "booked" || seat.isLocked) return;

      const error = checkGapViolation(seatMap, seats, selectedSeats, seatNum);
      if (error) {
        setGapError(error);
        setTimeout(() => setGapError(""), 3000);
        return;
      }
      setGapError("");
      setSelectedSeats((prev) =>
        prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum]
      );
    },
    [seatMap, seats, selectedSeats]
  );

  const handleCoupleSeatClick = useCallback(
    (seatNumA, seatNumB) => {
      const seatA = seatMap[seatNumA];
      const seatB = seatMap[seatNumB];
      if (!seatA || !seatB) return;
      const bothSelected = selectedSeats.includes(seatNumA) && selectedSeats.includes(seatNumB);
      setGapError("");
      if (bothSelected) {
        setSelectedSeats((prev) => prev.filter((s) => s !== seatNumA && s !== seatNumB));
      } else {
        setSelectedSeats((prev) => {
          const next = [...prev];
          if (!next.includes(seatNumA)) next.push(seatNumA);
          if (!next.includes(seatNumB)) next.push(seatNumB);
          return next;
        });
      }
    },
    [seatMap, selectedSeats]
  );

  // Build row → sorted seats mapping
  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const maxCol = seats.length > 0 ? Math.max(...seats.map((s) => s.col)) : 12;

  const priceConfig = showtimeData?.priceConfig || {};

  // Price calculation: sum of each selected seat's actual price
  const totalTicketPrice = selectedSeats.reduce((sum, sn) => {
    const seat = seatMap[sn];
    return sum + (seat?.price || 0);
  }, 0);
  const totalComboPrice = combos.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const finalTotalPrice = totalTicketPrice + totalComboPrice;

  const showDate = selectedShowtime?.date
    ? new Date(selectedShowtime.date).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })
    : new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });

  const title = movieTitle || "Đang tải...";
  const isUrgent = timerStarted && secondsLeft <= 60;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 border-l-4 border-red-600 pl-4">
            Chọn ghế của bạn
          </h1>
          {/* Countdown timer */}
          {timerStarted && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${isUrgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-slate-100 text-slate-600"}`}>
              <Clock size={16} />
              Thời gian giữ ghế: <span className="font-black text-base">{formatTime(secondsLeft)}</span>
            </div>
          )}
        </div>

        {gapError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            <AlertTriangle size={16} />
            {gapError}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* LEFT: Seat map */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-10 w-full overflow-x-auto">
            <div className="w-full h-12 sm:h-16 bg-slate-100 rounded-xl flex items-center justify-center mb-16 shadow-inner border border-slate-200 relative overflow-hidden shrink-0 min-w-[600px]">
              <div className="absolute top-0 w-full h-2 bg-gradient-to-b from-slate-300 to-transparent opacity-50"></div>
              <span className="text-slate-400 font-bold tracking-[0.5em] text-xs sm:text-sm uppercase">
                Màn hình chiếu
              </span>
            </div>

            {loadingSeats ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent"></div>
              </div>
            ) : seats.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold">
                Không tải được sơ đồ ghế. Vui lòng thử lại.
              </div>
            ) : (
              <div className="flex justify-center overflow-x-auto pb-4">
                <div className="flex flex-col gap-3 min-w-max px-2">
                  {rows.map((row) => {
                    const elements = [];
                    let i = 0;
                    while (i < maxCol) {
                      const col = i + 1;
                      const seatNum = `${row}${col}`;
                      const seat = seatMap[seatNum];
                      const isMiddle = col === Math.floor(maxCol / 2);

                      if (!seat) {
                        elements.push(<div key={seatNum} className={`w-9 h-9 sm:w-11 sm:h-11 ${isMiddle ? "mr-6 sm:mr-10" : ""}`} />);
                        i++;
                        continue;
                      }

                      const seatType = seat.type || "normal";

                      // Ghế đôi: gộp 2 ghế liền kề thành 1 nút rộng
                      if (seatType === "couple") {
                        const nextCol = col + 1;
                        const nextSeatNum = `${row}${nextCol}`;
                        const nextSeat = seatMap[nextSeatNum];
                        if (nextSeat && nextSeat.type === "couple") {
                          const colors = SEAT_COLORS.couple;
                          const isSelected = selectedSeats.includes(seatNum) || selectedSeats.includes(nextSeatNum);
                          const isUnavailable =
                            seat.status === "reserved" || seat.status === "booked" || seat.isLocked ||
                            nextSeat.status === "reserved" || nextSeat.status === "booked" || nextSeat.isLocked;
                          elements.push(
                            <button
                              key={`${seatNum}-couple`}
                              disabled={isUnavailable}
                              onClick={() => handleCoupleSeatClick(seatNum, nextSeatNum)}
                              title={`${seatNum} & ${nextSeatNum} - Đôi - ${((seat.price || 0) * 2).toLocaleString()}đ`}
                              className={`h-9 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${isMiddle ? "mr-6 sm:mr-10" : ""} ${
                                isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available
                              }`}
                              style={{ width: "calc(2 * 2.75rem + 0.5rem)" }}
                            >
                              <span>{col}</span>
                              <span className="opacity-40 text-[10px]">♥</span>
                              <span>{nextCol}</span>
                            </button>
                          );
                          i += 2;
                          continue;
                        }
                      }

                      // Ghế thường / VIP
                      const colors = SEAT_COLORS[seatType] || SEAT_COLORS.normal;
                      const isSelected = selectedSeats.includes(seatNum);
                      const isUnavailable = seat.status === "reserved" || seat.status === "booked" || seat.isLocked;
                      elements.push(
                        <button
                          key={seatNum}
                          disabled={isUnavailable}
                          onClick={() => handleSeatClick(seatNum)}
                          title={`${seatNum} - ${colors.label} - ${(seat.price || 0).toLocaleString()}đ`}
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${isMiddle ? "mr-6 sm:mr-10" : ""} ${
                            isUnavailable ? colors.locked : isSelected ? colors.selected : colors.available
                          }`}
                        >
                          {col}
                        </button>
                      );
                      i++;
                    }

                    return (
                      <div key={row} className="flex gap-2 sm:gap-3 items-center justify-center">
                        <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">{row}</span>
                        {elements}
                        <span className="w-6 text-slate-400 font-bold text-xs sm:text-sm text-center">{row}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-16 border-t border-slate-100 pt-8">
              {Object.entries(SEAT_COLORS).map(([type, c]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${c.dot}`}></div>
                  <div>
                    <span className="text-slate-600 text-sm font-medium">{c.label}</span>
                    {priceConfig[type] && (
                      <span className="block text-xs text-slate-400">{priceConfig[type].toLocaleString()}đ</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center">
                  <span className="text-slate-400 text-xs font-bold">X</span>
                </div>
                <span className="text-slate-600 text-sm font-medium">Đã đặt / Khoá</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#dc2626]"></div>
                <span className="text-slate-600 text-sm font-medium">Đang chọn</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Bill summary */}
          <div className="w-full lg:w-[450px] shrink-0 sticky top-28">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col relative">
              <div className="bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shrink-0">
                <div className="relative z-10">
                  <h3 className="font-extrabold text-2xl mb-3 line-clamp-2 pr-12">{title}</h3>
                  <p className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-sm">2D</span>
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
                      <p className="text-sm text-slate-500">{showTime}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-slate-200 my-4 relative">
                  <div className="absolute -left-10 -top-3 w-6 h-6 bg-[#f8fafc] rounded-full border-r border-slate-200 shadow-inner"></div>
                  <div className="absolute -right-10 -top-3 w-6 h-6 bg-[#f8fafc] rounded-full border-l border-slate-200 shadow-inner"></div>
                </div>

                {/* Selected seats detail */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">Ghế chọn:</span>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block text-xl break-words max-w-[200px]">
                        {selectedSeats.length > 0 ? selectedSeats.join(", ") : "-"}
                      </span>
                      {selectedSeats.length > 0 && (
                        <span className="text-xs text-[#dc2626] font-bold">{selectedSeats.length} ghế</span>
                      )}
                    </div>
                  </div>
                  {/* Seat type breakdown */}
                  {selectedSeats.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {["normal", "vip", "couple"].map((type) => {
                        const typeSeats = selectedSeats.filter((sn) => seatMap[sn]?.type === type);
                        if (typeSeats.length === 0) return null;
                        const typeSeat = seatMap[typeSeats[0]];
                        return (
                          <div key={type} className="flex justify-between text-xs text-slate-500">
                            <span>{SEAT_COLORS[type].label} × {typeSeats.length}</span>
                            <span className="font-medium">{((typeSeat?.price || 0) * typeSeats.length).toLocaleString()}đ</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Combos */}
                <div className="flex-1 mb-6">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <Popcorn size={16} className="text-[#dc2626]" /> Combo ưu đãi
                  </h4>
                  <div className="space-y-3">
                    {combos.map((combo) => (
                      <div key={combo.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex-1 pr-4">
                          <p className="font-bold text-sm text-slate-800">{combo.name}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{combo.detail}</p>
                          <p className="text-sm text-[#dc2626] font-black mt-1.5">{combo.price.toLocaleString()}đ</p>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                          <button onClick={() => updateCombo(combo.id, -1)} className="text-slate-400 hover:text-[#dc2626] hover:bg-red-50 p-1 rounded transition-colors">
                            <Minus size={14} strokeWidth={3} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center text-slate-800">{combo.quantity}</span>
                          <button onClick={() => updateCombo(combo.id, 1)} className="text-slate-400 hover:text-[#dc2626] hover:bg-red-50 p-1 rounded transition-colors">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total & pay button */}
                <div className="bg-slate-900 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 mt-auto rounded-b-2xl border-t-[3px] border-dashed border-slate-700">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Tổng thanh toán</span>
                    <span className="text-3xl font-black text-white leading-none">
                      {finalTotalPrice.toLocaleString()}{" "}
                      <span className="text-xl text-slate-400">₫</span>
                    </span>
                  </div>

                  <button
                    disabled={selectedSeats.length === 0}
                    onClick={() => {
                      navigate("/payment", {
                        state: {
                          showtimeId,
                          movieTitle: title,
                          poster,
                          cinemaName,
                          showTime,
                          showDate,
                          showAddress,
                          selectedSeats,
                          combos,
                          finalTotalPrice,
                          seatMap: Object.fromEntries(
                            selectedSeats.map((sn) => [sn, { type: seatMap[sn]?.type, price: seatMap[sn]?.price }])
                          ),
                        },
                      });
                    }}
                    className={`w-full font-black py-4 rounded-xl transition-all uppercase text-sm tracking-widest flex items-center justify-center gap-2 ${
                      selectedSeats.length === 0
                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                        : "bg-[#dc2626] hover:bg-red-700 text-white shadow-lg shadow-red-900/50 hover:-translate-y-1"
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
