import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ReviewSection from "../../components/movie/ReviewSection";
import axiosInstance from "../../api/axiosConfig";
import {
  Star, Clock, Calendar, MapPin, ChevronDown,
  Ticket, Play, X, Heart, Share2, Copy, Check,
} from "lucide-react";
import { useWishlist } from "../../context/wishlist-context";

function isShowtimeLocked(showtime, now = Date.now()) {
  const lockMins = showtime.bookingLockMinutes ?? 5;
  if (!showtime.date || !showtime.startTime) return false;
  const vnDate = new Date(showtime.date).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const startVN = new Date(`${vnDate}T${showtime.startTime}:00+07:00`);
  return now >= startVN.getTime() - lockMins * 60 * 1000;
}

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
  return m ? m[1] : null;
}

const toVNDateStr = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const vnDay = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDay();
const vnDate = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDate();
const vnMonth = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCMonth();
const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ids: wishlistIds, toggle: toggleWishlist } = useWishlist();
  const isLoggedIn = !!localStorage.getItem("token");
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: movie?.title, text: `Xem phim ${movie?.title} tại 5Cine`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Đã sao chép link!", { duration: 1500 });
      });
    }
  };
  const [movie, setMovie] = useState(null);
  const [cinemaList, setCinemaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toVNDateStr());
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [showtimeVisible, setShowtimeVisible] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const showtimeSectionRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const fetchShowtimes = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/showtimes?movieId=${id}`);
      setCinemaList((prev) => {
        const openIds = new Set(prev.filter((c) => c.isOpen).map((c) => c.id));
        const grouped = {};
        res.data.forEach((st) => {
          if (!st.cinema) return;
          const cid = st.cinema._id;
          if (!grouped[cid])
            grouped[cid] = { id: cid, name: st.cinema.name, address: st.cinema.address, showtimes: [], isOpen: openIds.has(cid) };
          grouped[cid].showtimes.push(st);
        });
        return Object.values(grouped);
      });
    } catch {}
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const [movieRes, showtimeRes] = await Promise.all([
          axiosInstance.get(`/movies/${id}`),
          axiosInstance.get(`/showtimes?movieId=${id}`),
        ]);
        setMovie(movieRes.data);
        const grouped = {};
        showtimeRes.data.forEach((st) => {
          if (!st.cinema) return;
          const cid = st.cinema._id;
          if (!grouped[cid])
            grouped[cid] = { id: cid, name: st.cinema.name, address: st.cinema.address, showtimes: [], isOpen: false };
          grouped[cid].showtimes.push(st);
        });
        setCinemaList(Object.values(grouped));
      } catch (err) {
        console.error("Error fetching movie detail:", err);
      } finally {
        setLoading(false);
        setTimeout(() => setShowtimeVisible(true), 80);
      }
    })();
  }, [id]);

  // Poll showtimes every 60s (catches admin cancellations) + tick every 30s (updates lock state)
  useEffect(() => {
    const pollId = setInterval(fetchShowtimes, 5_000);
    const tickId = setInterval(() => setNowTick(Date.now()), 1_000);
    return () => { clearInterval(pollId); clearInterval(tickId); };
  }, [fetchShowtimes]);

  const toggleCinema = (cinemaId) =>
    setCinemaList(cinemaList.map((c) => ({ ...c, isOpen: c.id === cinemaId ? !c.isOpen : false })));

  const handleSelectTime = (showtime, cinema) =>
    setSelectedShowtime({
      showtimeId: showtime._id,
      time: showtime.startTime,
      date: showtime.date,
      cinemaId: cinema.id,
      cinemaName: cinema.name,
      address: cinema.address,
      price: showtime.price,
      roomName: showtime.room?.name || "",
      duration: movie?.duration || 0,
    });

  const onDateShowing = (cinema) =>
    cinema.showtimes.filter((st) => toVNDateStr(new Date(st.date)) === selectedDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <Navbar />
        <div className="animate-pulse pt-24 max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-10 py-20">
          <div className="w-[220px] h-[330px] bg-white/5 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-8 bg-white/5 rounded w-2/3" />
            <div className="h-5 bg-white/5 rounded w-1/4" />
            <div className="h-20 bg-white/5 rounded mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-lg font-medium">Không tìm thấy phim.</p>
      </div>
    );

  const genreNames = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
    : movie.genre ? [movie.genre] : [];

  const durationLabel = `${Math.floor(movie.duration / 60)}h${movie.duration % 60 > 0 ? ` ${movie.duration % 60}p` : ""}`;
  const youtubeId = getYoutubeId(movie.trailer);
  const heroImg = movie.backdrop || movie.poster;
  const ratingVal = movie.rating > 0 ? movie.rating : null;

  return (
    <div className="min-h-screen bg-[#f8f8f8] font-sans text-gray-900">
      <Helmet>
        <title>{movie ? `${movie.title} — 5Cine` : "5Cine"}</title>
        <meta name="description" content={movie?.description?.slice(0, 160) || "Xem thông tin phim và đặt vé tại 5Cine"} />
        <meta property="og:title" content={movie ? `${movie.title} — 5Cine` : "5Cine"} />
        <meta property="og:image" content={movie?.poster || ""} />
        <meta property="og:type" content="video.movie" />
      </Helmet>
      <Navbar />

      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-[#0a0a0f]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: movie.backdrop ? "none" : "blur(8px) scale(1.1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-[#0a0a0f]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-20 pb-12 md:pt-28 md:pb-14 flex flex-col md:flex-row gap-6 lg:gap-12 items-start md:items-center">

          {/* Poster */}
          <div className="opacity-0 animate-[fadeUp_0.8s_ease_0.1s_forwards] shrink-0 w-full md:w-[300px] lg:w-[400px]">
            <div className="relative">
              <div className="absolute -inset-6 bg-red-900/20 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8)] border border-white/15 ring-1 ring-white/5">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Image"; }}
                />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="opacity-0 animate-[fadeUp_0.8s_ease_0.25s_forwards] flex-1 text-white pb-2">
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${movie.status === "now_showing" ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-amber-500/15 border-amber-500/30 text-amber-400"}`}>
                {movie.status === "now_showing" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                )}
                {movie.status === "now_showing" ? "Đang chiếu" : "Sắp chiếu"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight mb-4 text-white">
              {movie.title}
            </h1>

            {/* Genre pills */}
            {genreNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {genreNames.slice(0, 4).map((g, i) => (
                  <span key={i} className="text-xs text-white/70 bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
              {ratingVal && (
                <div className="flex items-center gap-1.5">
                  <Star size={15} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-black text-white">{ratingVal}</span>
                  <span className="text-white/30 text-xs">/5</span>
                </div>
              )}
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5 text-white/60">
                <Clock size={14} />
                <span className="font-bold">{durationLabel}</span>
              </div>
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-1.5 text-white/60">
                <Calendar size={14} />
                <span className="font-bold">
                  {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>

            {/* Metadata list */}
            <div className="mb-6 space-y-2.5 border-l-2 border-white/10 pl-4 text-sm">
              {[
                { label: "Đạo diễn", value: movie.director },
                { label: "Diễn viên", value: movie.cast },
                { label: "Ngôn ngữ",  value: movie.language },
                ...(movie.ageRestriction ? [{ label: "Độ tuổi", value: movie.ageRestriction }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <p className="text-white/30 text-[9px] uppercase tracking-widest font-bold w-[72px] shrink-0 pt-0.5">{label}</p>
                  <p className="text-white/80 font-semibold leading-snug">{value || "—"}</p>
                </div>
              ))}
            </div>

            {movie.description && (
              <p className="text-white/50 text-sm md:text-[15px] leading-relaxed max-w-2xl mb-8 text-justify">
                {movie.description}
              </p>
            )}

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              {movie.status === "coming_soon" ? (
                <button disabled className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/30 font-bold py-3.5 px-8 rounded-xl cursor-not-allowed text-sm">
                  <Ticket size={18} /> Sắp ra mắt
                </button>
              ) : selectedShowtime ? (
                <Link to={`/booking/${id}`} state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}>
                  <button className="inline-flex items-center gap-2.5 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgba(220,38,38,0.45)] transition-all text-sm uppercase tracking-wide">
                    <Ticket size={18} /> Đặt vé · {selectedShowtime.time}
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (!localStorage.getItem("token")) { navigate("/login"); return; }
                    showtimeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    toast("Chọn suất chiếu bên dưới 👇", { icon: "🎬" });
                  }}
                  className="inline-flex items-center gap-2.5 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgba(220,38,38,0.45)] transition-all text-sm uppercase tracking-wide"
                >
                  <Ticket size={18} /> Đặt vé ngay
                </button>
              )}
              {youtubeId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold py-3.5 px-7 rounded-xl transition-all text-sm"
                >
                  <Play size={16} fill="currentColor" /> Trailer
                </button>
              )}
              {isLoggedIn && movie && (
                <button
                  onClick={() => {
                    toggleWishlist(movie._id);
                    const isSaved = wishlistIds.has(movie._id);
                    toast(isSaved ? "Đã bỏ khỏi yêu thích" : "Đã thêm vào yêu thích ❤️", { duration: 1500 });
                  }}
                  className={`inline-flex items-center gap-2 py-3.5 px-5 rounded-xl border transition-all text-sm font-bold ${wishlistIds.has(movie._id) ? "bg-red-500 border-red-400 text-white" : "bg-white/10 hover:bg-white/15 border-white/15 text-white"}`}
                  title={wishlistIds.has(movie._id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                >
                  <Heart size={16} className={wishlistIds.has(movie._id) ? "fill-white" : ""} />
                  {wishlistIds.has(movie._id) ? "Đã lưu" : "Yêu thích"}
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 py-3.5 px-5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all text-sm font-bold"
                title="Chia sẻ phim"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? "Đã sao chép" : "Chia sẻ"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">

        {/* ── SHOWTIMES ── */}
        <section
          ref={showtimeSectionRef}
          className={`pt-6 mb-16 transition-all duration-700 ${showtimeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 border-l-4 border-[#dc2626] pl-3">Lịch chiếu</h2>
              <p className="text-slate-400 text-xs font-medium mt-0.5 pl-3">Chọn ngày và suất chiếu phù hợp</p>
            </div>

            {/* Date tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
                const val = toVNDateStr(d);
                const isActive = selectedDate === val;
                const dayLabel = WEEKDAY[vnDay(d)];
                const dateLabel = `${vnDate(d)}/${vnMonth(d) + 1}`;
                return (
                  <button
                    key={val}
                    onClick={() => setSelectedDate(val)}
                    className={`shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl font-bold text-xs transition-all border ${isActive ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.03]" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800 hover:scale-[1.02]"}`}
                  >
                    <span className="text-[10px] uppercase tracking-wide opacity-70">{dayLabel}</span>
                    <span className="text-sm font-black mt-0.5">{dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {cinemaList.length === 0 || cinemaList.every((c) => !onDateShowing(c).length) ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Calendar size={28} />
              </div>
              <p className="text-slate-400 font-semibold text-sm">
                {cinemaList.length === 0 ? "Chưa có lịch chiếu cho phim này." : "Không có suất chiếu trong ngày đã chọn."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cinemaList.map((cinema) => {
                const filtered = onDateShowing(cinema);
                if (!filtered.length) return null;
                return (
                  <div
                    key={cinema.id}
                    className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${cinema.isOpen ? "border-slate-300 shadow-md" : "border-slate-200 shadow-sm hover:border-slate-300"}`}
                  >
                    <button
                      className="w-full flex justify-between items-center px-5 py-4 text-left"
                      onClick={() => toggleCinema(cinema.id)}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${cinema.isOpen ? "bg-[#dc2626] text-white" : "bg-slate-100 text-slate-400"}`}>
                          <MapPin size={18} />
                        </div>
                        <div className="text-left">
                          <p className={`font-black text-[15px] leading-tight transition-colors ${cinema.isOpen ? "text-[#dc2626]" : "text-slate-800"}`}>{cinema.name}</p>
                          <p className="text-slate-400 text-xs mt-0.5 font-medium">{cinema.address}</p>
                        </div>
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${cinema.isOpen ? "bg-red-50 text-[#dc2626] rotate-180" : "bg-slate-100 text-slate-400"}`}>
                        <ChevronDown size={16} />
                      </div>
                    </button>

                    {/* Smooth accordion via CSS grid */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${cinema.isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                          <div className="flex flex-wrap gap-2.5">
                            {filtered.map((showtime) => {
                              const isSelected = selectedShowtime?.showtimeId === showtime._id;
                              const locked = isShowtimeLocked(showtime, nowTick);
                              return (
                                <button
                                  key={showtime._id}
                                  onClick={() => !locked && handleSelectTime(showtime, cinema)}
                                  disabled={locked}
                                  title={locked ? `Đã khóa đặt vé (trước ${showtime.bookingLockMinutes ?? 5} phút)` : undefined}
                                  className={`flex flex-col items-center min-w-[90px] px-4 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                                    locked
                                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                                      : isSelected
                                        ? "bg-[#dc2626] text-white border-[#dc2626] shadow-lg shadow-red-100"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:scale-[1.04] active:scale-[0.97] hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50"
                                  }`}
                                >
                                  <span className="font-black text-base">{showtime.startTime}</span>
                                  <span className={`text-[10px] font-medium mt-0.5 ${
                                    isSelected ? "text-red-100"
                                    : locked ? "text-slate-400"
                                    : showtime.availableSeats <= 5 ? "text-orange-500 font-bold"
                                    : "text-slate-400"
                                  }`}>
                                    {locked ? "Đã khóa"
                                      : showtime.availableSeats === 0 ? "Hết ghế"
                                      : showtime.availableSeats <= 5 ? `⚡ Còn ${showtime.availableSeats} ghế`
                                      : showtime.availableSeats !== undefined ? `${showtime.availableSeats} ghế trống`
                                      : ""}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── REVIEWS ── */}
        <ReviewSection movieId={id} />
      </main>

      {/* ── TRAILER MODAL ── */}
      {isTrailerOpen && youtubeId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-12">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-[fadeIn_0.2s_ease_forwards]"
            onClick={() => setIsTrailerOpen(false)}
          />
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black animate-[scaleIn_0.25s_ease_forwards]">
            <button
              onClick={() => setIsTrailerOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X size={18} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={`Trailer - ${movie.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* ── STICKY MOBILE BAR ── */}
      {selectedShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden animate-[slideUp_0.3s_ease_forwards]">
          <Link to={`/booking/${id}`} state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}>
            <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between shadow-[0_-4px_30px_rgba(220,38,38,0.3)]">
              <div>
                <p className="text-red-200 text-[9px] uppercase tracking-widest font-bold">Suất đã chọn</p>
                <p className="text-white font-black text-sm">{selectedShowtime.time} · {selectedShowtime.cinemaName}</p>
              </div>
              <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-xl transition-colors">
                <Ticket size={16} className="text-white" />
                <span className="text-white font-black text-sm">Đặt ngay</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MovieDetailPage;
