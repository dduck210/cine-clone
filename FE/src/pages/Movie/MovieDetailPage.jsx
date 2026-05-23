import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import ReviewSection from "../../components/movie/ReviewSection";
import axiosInstance from "../../api/axiosConfig";
import {
  Star,
  Clock,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
  Ticket,
  Play,
} from "lucide-react";

function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/,
  );
  return m ? m[1] : null;
}

const toVNDateStr = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).toISOString().split("T")[0];
const vnDay = (d = new Date()) => new Date(+d + 7 * 60 * 60 * 1000).getUTCDay();
const vnDate = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).getUTCDate();
const vnMonth = (d = new Date()) =>
  new Date(+d + 7 * 60 * 60 * 1000).getUTCMonth();
const WEEKDAY = [
  "Chủ Nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [cinemaList, setCinemaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => toVNDateStr());
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const showtimeSectionRef = useRef(null);
  const isMonday = vnDay() === 1;

  useEffect(() => {
    window.scrollTo(0, 0);
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
            grouped[cid] = {
              id: cid,
              name: st.cinema.name,
              address: st.cinema.address,
              showtimes: [],
              isOpen: false,
            };
          grouped[cid].showtimes.push(st);
        });
        setCinemaList(Object.values(grouped));
      } catch (err) {
        console.error("Error fetching movie detail:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const toggleCinema = (cinemaId) =>
    setCinemaList(
      cinemaList.map((c) => ({
        ...c,
        isOpen: c.id === cinemaId ? !c.isOpen : false,
      })),
    );

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
    cinema.showtimes.filter(
      (st) => toVNDateStr(new Date(st.date)) === selectedDate,
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="animate-pulse pt-24 pb-12 max-w-6xl mx-auto px-6 flex flex-col md:flex-row gap-10">
          <div className="w-[240px] h-[360px] bg-slate-800 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-10 bg-slate-800 rounded w-3/4" />
            <div className="h-5 bg-slate-800 rounded w-1/4" />
            <div className="h-24 bg-slate-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Không tìm thấy phim.</p>
      </div>
    );

  const genreNames = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
    : movie.genre
      ? [movie.genre]
      : [];

  const durationLabel = `${Math.floor(movie.duration / 60)}h${movie.duration % 60 > 0 ? ` ${movie.duration % 60}m` : ""}`;
  const youtubeId = getYoutubeId(movie.trailer);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      {/* ── CINEMATIC HERO ── */}
      <div className="relative pt-16 md:pt-20 overflow-hidden bg-slate-900 min-h-[450px] md:min-h-[600px] flex items-center">
        {/* Blurred backdrop */}
        <div className="absolute inset-0">
          <img
            src={movie.poster}
            alt=""
            className="w-full h-full object-cover scale-110 blur-2xl opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-slate-900" />
        </div>

        <div className="relative z-10 container mx-auto px-0 md:px-6 max-w-7xl py-0 md:py-24">
          <div className="flex flex-col md:flex-row gap-0 md:gap-16 lg:gap-24 items-stretch">
            
            {/* Poster Section - Matches Info Height on Desktop */}
            <div className="relative w-full md:w-[320px] lg:w-[420px] flex-shrink-0 group">
              <div className="md:sticky md:top-28 h-[50vh] md:h-full min-h-[400px] md:min-h-0 overflow-hidden md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-b md:border border-white/10 group-hover:border-white/20 transition-all duration-700">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/400x600?text=No+Image"; }}
                />
                {/* Mobile overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent md:hidden" />
              </div>
            </div>

            {/* Info Section - Premium UI */}
            <div className="flex-1 text-white px-6 md:px-0 py-10 md:py-0 flex flex-col justify-center">
              {/* Status & Rating Glass Badge */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                {movie.status === "now_showing" && (
                  <span className="relative flex h-3 w-3 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                  </span>
                )}
                <span className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/20 shadow-xl ${movie.status === 'now_showing' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {movie.status === "now_showing" ? "Đang công chiếu" : "Sắp ra mắt"}
                </span>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-2xl">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="text-sm font-black text-white">{movie.rating > 0 ? movie.rating : "8.5"}</span>
                  <span className="text-[10px] text-white/30 font-bold">/ 10</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-white/30" />
                <span className="text-white/40 text-[10px] md:text-xs font-black uppercase tracking-widest italic">IMAX / 4DX</span>
              </div>

              {/* Title with decorative underline */}
              <div className="relative mb-10">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black leading-[0.95] tracking-tighter uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                  {movie.title}
                </h1>
                {movie.ageRestriction && (
                  <div className="mt-4 flex items-center gap-4">
                    <span className="bg-red-600 text-white text-xs md:text-lg font-black px-4 py-1.5 rounded-lg shadow-[0_5px_15px_rgba(220,38,38,0.4)]">
                      {movie.ageRestriction}
                    </span>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-red-600 to-transparent rounded-full" />
                  </div>
                )}
              </div>

              {/* High-End Metadata Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-8 mb-12 py-12 border-y border-white/5 relative">
                <div className="flex flex-col gap-2 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Đạo diễn</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight transition-colors group-hover/item:text-red-400">{movie.director || "Christopher Nolan"}</span>
                </div>
                <div className="flex flex-col gap-2 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Thời lượng</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight flex items-center gap-3">
                     <Clock size={20} className="text-white/20" /> {durationLabel}
                  </span>
                </div>
                <div className="flex flex-col gap-2 col-span-2 lg:col-span-1 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Diễn viên chính</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight line-clamp-1">{movie.cast || "Đang cập nhật"}</span>
                </div>
                <div className="flex flex-col gap-2 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Ngày phát hành</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight flex items-center gap-3">
                     <Calendar size={20} className="text-white/20" /> {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-2 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Thể loại</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight">{genreNames.join(" / ") || "Hành Động"}</span>
                </div>
                <div className="flex flex-col gap-2 group/item">
                  <span className="text-red-500/60 uppercase text-[9px] font-black tracking-[0.3em]">Định dạng</span>
                  <span className="text-white font-black text-base md:text-xl lg:text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Phụ đề Việt / 2D</span>
                </div>
              </div>

              {/* Elevated Synopsis */}
              <div className="mb-14 relative group">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-xl md:text-2xl font-black uppercase tracking-[0.2em] text-white/90">Nội dung phim</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent" />
                </div>
                <p className="text-white/60 leading-relaxed text-base md:text-xl font-medium max-w-5xl transition-all duration-500 group-hover:text-white/90">
                  {movie.description || "Chưa có mô tả chi tiết cho bộ phim này."}
                </p>
              </div>

              {/* Large Iconic CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {movie.status === "coming_soon" ? (
                  <button disabled className="w-full sm:w-auto bg-white/5 border border-white/10 text-white/30 font-black py-6 px-16 rounded-[2rem] cursor-not-allowed uppercase tracking-[0.2em] text-sm md:text-base flex items-center justify-center gap-4">
                    <Ticket size={28} /> Phim Sắp Ra Mắt
                  </button>
                ) : selectedShowtime ? (
                  <Link
                    to={`/booking/${id}`}
                    state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}
                    className="w-full sm:w-auto"
                  >
                    <button className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-6 px-16 rounded-[2rem] shadow-[0_25px_60px_rgba(220,38,38,0.5)] hover:shadow-none transition-all duration-500 uppercase tracking-[0.2em] text-sm md:text-base flex items-center justify-center gap-4 active:scale-95 group">
                      <Ticket size={28} className="group-hover:rotate-12 transition-transform duration-500" /> 
                      Xác Nhận Đặt: {selectedShowtime.time}
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!localStorage.getItem("token")) { navigate("/login"); return; }
                      showtimeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      toast("Vui lòng chọn suất chiếu bên dưới", { icon: "🎬" });
                    }}
                    className="w-full sm:w-auto bg-[#dc2626] hover:bg-red-700 text-white font-black py-6 px-20 rounded-[2rem] shadow-[0_25px_60px_rgba(220,38,38,0.5)] hover:shadow-none transition-all duration-500 uppercase tracking-[0.2em] text-sm md:text-base flex items-center justify-center gap-4 active:scale-95 group"
                  >
                    <Ticket size={28} className="group-hover:rotate-12 transition-transform duration-500" /> 
                    Đặt Vé Ngay
                  </button>
                )}
                {youtubeId && (
                  <button
                    onClick={() => setIsTrailerOpen(true)}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/20 text-white font-black py-6 px-16 rounded-[2rem] transition-all duration-500 uppercase tracking-[0.2em] text-sm md:text-base flex items-center justify-center gap-4 active:scale-95"
                  >
                    <Play size={26} fill="currentColor" /> Xem Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 pb-20 max-w-6xl relative z-20">
        {/* ── SHOWTIMES ── */}
        <section
          ref={showtimeSectionRef}
          className="py-4 mb-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Lịch Chiếu Phim</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đặt vé nhanh · Không chờ đợi</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
                const val = toVNDateStr(d);
                const label =
                  i === 0
                    ? "Hôm nay"
                    : i === 1
                      ? "Ngày mai"
                      : `${WEEKDAY[vnDay(d)]} ${vnDate(d)}/${vnMonth(d) + 1}`;
                const isActive = selectedDate === val;
                return (
                  <button
                    key={val}
                    onClick={() => setSelectedDate(val)}
                    className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all duration-300 border ${isActive ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {cinemaList.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <Ticket size={40} />
              </div>
              <p className="text-slate-400 font-black text-lg">Hiện chưa có lịch chiếu cho phim này.</p>
            </div>
          ) : cinemaList.every((c) => !onDateShowing(c).length) ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                 <Calendar size={40} />
              </div>
              <p className="text-slate-400 font-black text-lg">Không có suất chiếu nào trong ngày đã chọn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cinemaList.map((cinema) => {
                const filtered = onDateShowing(cinema);
                if (!filtered.length) return null;
                return (
                  <div
                    key={cinema.id}
                    className={`bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${cinema.isOpen ? "border-red-500 ring-4 ring-red-50 shadow-2xl" : "border-slate-100 hover:border-slate-300 shadow-lg shadow-slate-200/40"}`}
                  >
                    <div
                      className={`flex justify-between items-center p-8 cursor-pointer ${cinema.isOpen ? "bg-red-50/30" : "bg-white"}`}
                      onClick={() => toggleCinema(cinema.id)}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${cinema.isOpen ? "bg-[#dc2626] text-white" : "bg-slate-100 text-slate-400"}`}>
                          <MapPin size={28} />
                        </div>
                        <div>
                          <h3 className={`font-black text-xl mb-1 ${cinema.isOpen ? "text-[#dc2626]" : "text-slate-900"}`}>{cinema.name}</h3>
                          <p className="text-slate-400 font-medium text-sm">{cinema.address}</p>
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${cinema.isOpen ? "bg-red-100 text-[#dc2626]" : "bg-slate-100 text-slate-400"}`}>
                        {cinema.isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                    
                    {cinema.isOpen && (
                      <div className="p-8 pt-0 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="h-px bg-slate-100 w-full mb-8" />
                        <div className="flex flex-wrap gap-4">
                          {filtered.map((showtime) => {
                            const isSelected = selectedShowtime?.showtimeId === showtime._id;
                            return (
                              <button
                                key={showtime._id}
                                onClick={() => handleSelectTime(showtime, cinema)}
                                className={`group relative min-w-[140px] px-6 py-4 rounded-2xl font-black text-lg transition-all border-2 ${isSelected ? "bg-[#dc2626] text-white border-[#dc2626] shadow-xl shadow-red-200 scale-105" : "bg-white text-slate-800 border-slate-100 hover:border-[#dc2626] hover:text-[#dc2626] hover:shadow-lg"}`}
                              >
                                {showtime.startTime}
                                {showtime.availableSeats !== undefined && (
                                  <div className={`text-[10px] uppercase tracking-widest mt-1 opacity-60 ${isSelected ? "text-white" : "text-slate-400"}`}>
                                    {showtime.availableSeats} GHẾ TRỐNG
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <ReviewSection movieId={id} />
      </main>

      {/* ── TRAILER MODAL ── */}
      {isTrailerOpen && youtubeId && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl" onClick={() => setIsTrailerOpen(false)} />
           <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.3)] bg-black border border-white/10">
              <button 
                onClick={() => setIsTrailerOpen(false)}
                className="absolute top-6 right-6 z-10 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronDown size={30} className="rotate-90" />
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

      {/* ── STICKY MOBILE BOOKING ── */}
      {selectedShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:hidden animate-in slide-in-from-bottom-full duration-500">
          <Link
                to={`/booking/${id}`}
                state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}
          >
            <button className="w-full bg-[#dc2626] text-white font-black py-5 px-6 rounded-2xl shadow-2xl flex items-center justify-between">
               <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Đã chọn suất chiếu</p>
                  <p className="text-sm">{selectedShowtime.time} — {selectedShowtime.cinemaName}</p>
               </div>
               <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl">
                  <Ticket size={18} />
                  <span className="text-sm uppercase tracking-widest font-black">Đặt Ngay</span>
               </div>
            </button>
          </Link>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MovieDetailPage;
