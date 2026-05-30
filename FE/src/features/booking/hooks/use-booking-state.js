import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getShowtime } from "@/api/services/showtime-service";
import { validateVoucher } from "@/api/services/voucher-service";
import { COMBOS } from "@/features/booking/data/combos-data";

export const HOLD_SECONDS = 5 * 60;

/** Returns error message if toggling seatNum would leave a gap between selected seats. */
export function checkGapViolation(seatMap, seats, currentSelected, toggleSeatNum) {
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
        const gapSeat = seatMap[`${row}${gap}`];
        if (gapSeat && gapSeat.status === "available" && !gapSeat.isLocked)
          return `Không thể bỏ trống ghế ${row}${gap} giữa các ghế đã chọn`;
      }
    }
  }
  return null;
}

/**
 * useBookingState — all state, effects, and handlers for BookingPage.
 * Returns everything BookingPage needs to render.
 */
export function useBookingState() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedShowtime, movieTitle, poster, selectedDate } = location.state || {};

  const roomName   = selectedShowtime?.roomName    || "";
  const showtimeId = selectedShowtime?.showtimeId;
  const cinemaName = selectedShowtime?.cinemaName  || "5Cine";
  const showTime   = selectedShowtime?.time        || "";
  const showAddress = selectedShowtime?.address    || "";

  const [step, setStep]                   = useState(1);
  const [showSeatInfo, setShowSeatInfo]   = useState(false);
  const [showtimeData, setShowtimeData]   = useState(null);
  const [seats, setSeats]                 = useState([]);

  // Seat grid scale — shrinks grid to fit container on narrow viewports
  const seatOuterRef    = useRef(null);
  const seatInnerRef    = useRef(null);
  const naturalWidthRef = useRef(null);
  const [seatScale, setSeatScale] = useState(1);

  const recalcScale = useCallback(() => {
    if (!seatOuterRef.current || !naturalWidthRef.current) return;
    setSeatScale(Math.min(1, seatOuterRef.current.clientWidth / naturalWidthRef.current));
  }, []);

  useEffect(() => {
    if (!seatInnerRef.current || !seatOuterRef.current) return;
    const t = setTimeout(() => {
      if (!seatInnerRef.current) return;
      naturalWidthRef.current = seatInnerRef.current.scrollWidth;
      recalcScale();
    }, 80);
    return () => clearTimeout(t);
  }, [seats, recalcScale]);

  useEffect(() => {
    window.addEventListener("resize", recalcScale);
    return () => window.removeEventListener("resize", recalcScale);
  }, [recalcScale]);

  const [seatMap, setSeatMap]           = useState({});
  const [loadingSeats, setLoadingSeats] = useState(() => !!showtimeId);
  const [seatLoadError, setSeatLoadError] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [justSelected, setJustSelected]   = useState(new Set());
  const [gapError, setGapError]           = useState("");
  const [fallbackShowDate]                = useState(() => new Date());

  const [secondsLeft, setSecondsLeft]   = useState(HOLD_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const warnedRef = useRef(false);

  const [combos, setCombos]               = useState(COMBOS.map((c) => ({ ...c, quantity: 0 })));
  const [voucherInput, setVoucherInput]   = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError]   = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [navigating, setNavigating]       = useState(false);

  // Load seat map from API
  const loadSeats = useCallback(() => {
    if (!showtimeId) return;
    setLoadingSeats(true);
    setSeatLoadError(false);
    getShowtime(showtimeId)
      .then((data) => {
        setShowtimeData(data.data);
        const seatList = data.seats || [];
        setSeats(seatList);
        const map = {};
        for (const s of seatList) map[s.seatNumber] = s;
        setSeatMap(map);
      })
      .catch((error) => {
        setSeats([]);
        if (error?.response?.status === 410) {
          window.alert("Suất chiếu này đã hết hạn hoặc không còn khả dụng. Vui lòng chọn suất khác.");
          navigate(`/movie/${id}`);
        } else {
          setSeatLoadError(true);
        }
      })
      .finally(() => setLoadingSeats(false));
  }, [showtimeId, navigate, id]);

  useEffect(() => { loadSeats(); }, [loadSeats]);

  // Countdown timer — ticks every second once a seat is selected
  useEffect(() => {
    if (!timerStarted) return;
    if (secondsLeft <= 0) { setTimerExpired(true); return; }
    if (secondsLeft === 60 && !warnedRef.current) { warnedRef.current = true; }
    const interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [timerStarted, secondsLeft]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const updateCombo = (comboId, delta) =>
    setCombos(combos.map((c) => (c.id === comboId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)));

  const checkMixTypeViolation = (currentSelected, addingType) => {
    const existingTypes = new Set(currentSelected.map((sn) => seatMap[sn]?.type || "normal"));
    if (existingTypes.size === 0 || existingTypes.has(addingType)) return null;
    return "Chỉ được chọn 1 loại ghế trong cùng một đơn";
  };

  const handleSeatClick = (seatNum) => {
    const seat = seatMap[seatNum];
    if (!seat || seat.status === "reserved" || seat.status === "booked" || seat.isLocked) return;
    const isDeselecting = selectedSeats.includes(seatNum);
    if (!isDeselecting) {
      const typeError = checkMixTypeViolation(selectedSeats, seat.type || "normal");
      if (typeError) { setGapError(typeError); setTimeout(() => setGapError(""), 3500); return; }
    }
    const gapErr = checkGapViolation(seatMap, seats, selectedSeats, seatNum);
    if (gapErr) { setGapError(gapErr); setTimeout(() => setGapError(""), 3000); return; }
    setGapError("");
    const isAdding = !selectedSeats.includes(seatNum);
    setSelectedSeats((prev) => {
      const next = prev.includes(seatNum) ? prev.filter((s) => s !== seatNum) : [...prev, seatNum];
      if (next.length > 0 && !timerStarted) setTimerStarted(true);
      return next;
    });
    if (isAdding) {
      setJustSelected(new Set([seatNum]));
      setTimeout(() => setJustSelected(new Set()), 250);
    }
  };

  const handleCoupleSeatClick = (seatNumA, seatNumB) => {
    const seatA = seatMap[seatNumA];
    const seatB = seatMap[seatNumB];
    if (!seatA || !seatB) return;
    const bothSelected = selectedSeats.includes(seatNumA) && selectedSeats.includes(seatNumB);
    setGapError("");
    if (bothSelected) {
      setSelectedSeats((prev) => prev.filter((s) => s !== seatNumA && s !== seatNumB));
    } else {
      const typeError = checkMixTypeViolation(selectedSeats, "couple");
      if (typeError) { setGapError(typeError); setTimeout(() => setGapError(""), 3500); return; }
      setSelectedSeats((prev) => {
        const next = [...prev];
        if (!next.includes(seatNumA)) next.push(seatNumA);
        if (!next.includes(seatNumB)) next.push(seatNumB);
        if (next.length > 0 && !timerStarted) setTimerStarted(true);
        return next;
      });
      setJustSelected(new Set([seatNumA, seatNumB]));
      setTimeout(() => setJustSelected(new Set()), 250);
    }
  };

  // Derived seat/price values
  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const maxCol = seats.length > 0 ? Math.max(...seats.map((s) => s.col)) : 12;
  const priceConfig = showtimeData?.priceConfig || {};
  const duration = selectedShowtime?.duration || showtimeData?.movie?.duration || 0;

  const totalTicketPrice = selectedSeats.reduce((sum, sn) => sum + (seatMap[sn]?.price || 0), 0);
  const totalComboPrice  = combos.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const finalTotalPrice  = totalTicketPrice + totalComboPrice;

  // Monday Gold discount (20% off when booking date is Monday in VN timezone)
  const isMonday = (() => {
    const vnStr = (d) => new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
    const s = selectedDate || (selectedShowtime?.date ? vnStr(new Date(selectedShowtime.date)) : null);
    if (!s) return new Date(+new Date() + 7 * 60 * 60 * 1000).getUTCDay() === 1;
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).getDay() === 1;
  })();
  const discountedPrice  = isMonday ? Math.round(finalTotalPrice * 0.8) : finalTotalPrice;
  const voucherDiscount  = appliedVoucher?.discountAmount || 0;
  const priceAfterVoucher = Math.max(0, discountedPrice - voucherDiscount);

  const showDate = new Date(selectedShowtime?.date || fallbackShowDate).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherError("");
    setVoucherLoading(true);
    try {
      const data = await validateVoucher({ code: voucherInput.trim(), orderAmount: discountedPrice });
      setAppliedVoucher({
        code: data.voucher.code,
        discountAmount: data.discountAmount,
        type: data.voucher.type,
        value: data.voucher.value,
      });
      setVoucherInput("");
    } catch (err) {
      setVoucherError(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setVoucherLoading(false);
    }
  };

  const goToPayment = () => {
    if (navigating) return;
    setNavigating(true);
    navigate("/payment", {
      state: {
        showtimeId, movieTitle: movieTitle || "Đang tải...", poster, cinemaName,
        showTime, showDate, showAddress, selectedSeats, combos,
        finalTotalPrice: priceAfterVoucher, roomName, duration,
        originalPrice: finalTotalPrice,
        mondayDiscount: isMonday ? finalTotalPrice - discountedPrice : 0,
        voucherDiscount,
        voucherCode:  appliedVoucher?.code  || null,
        voucherType:  appliedVoucher?.type  || null,
        voucherValue: appliedVoucher?.value || null,
        seatMap: Object.fromEntries(
          selectedSeats.map((sn) => [sn, { type: seatMap[sn]?.type, price: seatMap[sn]?.price }])
        ),
      },
    });
  };

  const resetTimer = () => {
    setTimerExpired(false);
    setSelectedSeats([]);
    setSecondsLeft(HOLD_SECONDS);
    setTimerStarted(false);
    warnedRef.current = false;
  };

  const title = movieTitle || "Đang tải...";
  const isUrgent   = timerStarted && secondsLeft <= 60;
  const isWarning  = timerStarted && secondsLeft <= 120 && secondsLeft > 60;
  const timerProgress = secondsLeft / HOLD_SECONDS;
  const activeCombos  = combos.filter((c) => c.quantity > 0);

  return {
    // location state
    poster, cinemaName, showTime, showAddress, showDate, title,
    // step
    step, setStep,
    // modals
    showSeatInfo, setShowSeatInfo, timerExpired,
    // seat grid
    rows, maxCol, seatMap, loadingSeats, seatLoadError, loadSeats,
    selectedSeats, justSelected, gapError, priceConfig,
    seatOuterRef, seatInnerRef, seatScale,
    handleSeatClick, handleCoupleSeatClick,
    // timer
    timerStarted, secondsLeft, isUrgent, isWarning, timerProgress, formatTime,
    // combos + voucher
    combos, updateCombo,
    voucherInput, setVoucherInput,
    appliedVoucher, setAppliedVoucher,
    voucherError, setVoucherError,
    voucherLoading, handleApplyVoucher,
    // pricing
    totalTicketPrice, activeCombos,
    isMonday, finalTotalPrice, discountedPrice,
    voucherDiscount, priceAfterVoucher,
    // navigation
    navigating, goToPayment, resetTimer, navigate,
  };
}
