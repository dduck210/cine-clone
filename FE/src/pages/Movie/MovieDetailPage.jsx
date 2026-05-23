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
  Info,
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

        <div className="relative z-10 container mx-auto px-6 max-w-6xl py-12 md:py-20 flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-start">
          
          {/* Mobile Cover / Video Preview (Horizontal) */}
          <div className="block md:hidden w-full relative aspect-video rounded-2xl overflow-hidden shadow-2xl group">
             <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                 {youtubeId && (
                   <button 
                    onClick={() => setIsTrailerOpen(true)}
                    className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center active:scale-90 transition-transform"
                   >
                     <Play className="text-white ml-1" size={30} fill="currentColor" />
                   </button>
                 )}
              </div>
          </div>

          {/* Desktop Poster (Vertical) */}
          <div className="hidden md:block w-[280px] flex-shrink-0">
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/10">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {youtubeId && (
                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3"
                >
                  <span className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                    <Play
                      className="text-[#dc2626] ml-1"
                      size={32}
                      fill="currentColor"
                    />
                  </span>
                  <span className="text-white font-black text-xs uppercase tracking-[0.2em]">Xem Trailer</span>
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-white text-center md:text-left">
            {/* Badges */}
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4 flex-wrap">
              {movie.status === "now_showing" && (
                <span className="bg-[#dc2626] text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-red-900/40">
                  Đang chiếu
                </span>
              )}
              {movie.status === "coming_soon" && (
                <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg shadow-amber-900/40">
                  Sắp chiếu
                </span>
              )}
              {movie.ageRestriction && (
                <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-bold px-3 py-1.5 rounded-lg">
                  {movie.ageRestriction}
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-[3.5rem] font-black leading-tight mb-6 tracking-tight drop-shadow-2xl">
              {movie.title}
            </h1>

            {/* Rating + meta */}
            <div className="flex items-center justify-center md:justify-start gap-4 mb-8 flex-wrap text-[15px] font-medium text-white/80">
              {movie.rating > 0 && (
                <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5">
                  <Star size={16} fill="#fbbf24" className="text-amber-400" />
                  <span className="text-amber-400 font-black">{movie.rating}</span>
                  <span className="text-white/40 text-xs">/10</span>
                </div>
              )}
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-white/40" />
                {durationLabel}
              </span>
              <span className="text-white/20 hidden md:block">•</span>
              {genreNames.map((g) => (
                <span key={g} className="text-white/60 hover:text-white transition-colors cursor-default">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-white/70 leading-relaxed mb-10 max-w-2xl text-lg font-medium drop-shadow">
              {movie.description || "Chưa có mô tả."}
            </p>

            {/* Director / Cast */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-12">
               {movie.director && (
                <div className="space-y-1">
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">Đạo diễn</p>
                  <p className="text-white font-bold text-lg">{movie.director}</p>
                </div>
              )}
               {movie.cast && (
                <div className="space-y-1">
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">Diễn viên</p>
                  <p className="text-white font-bold text-lg line-clamp-1">{movie.cast}</p>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {movie.status === "coming_soon" ? (
                <button disabled className="w-full md:w-auto bg-slate-800 text-white/50 font-black py-5 px-10 rounded-2xl cursor-not-allowed uppercase tracking-widest text-sm flex items-center justify-center gap-3">
                  <Ticket size={22} /> Phim Sắp Chiếu
                </button>
              ) : selectedShowtime ? (
                <Link
                  to={`/booking/${id}`}
                  state={{
                    selectedShowtime,
                    selectedDate,
                    movieTitle: movie.title,
                    poster: movie.poster,
                  }}
                  className="w-full md:w-auto"
                >
                  <button className="w-full bg-[#dc2626] hover:bg-red-700 text-white font-black py-5 px-12 rounded-2xl shadow-[0_15px_30px_rgba(220,38,38,0.4)] hover:shadow-none transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95">
                    <Ticket size={22} /> Đặt Ngay: {selectedShowtime.time}
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (!localStorage.getItem("token")) {
                      navigate("/login");
                      return;
                    }
                    showtimeSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    toast("Vui lòng chọn suất chiếu bên dưới", { icon: "🎬" });
                  }}
                  className="w-full md:w-auto bg-[#dc2626] hover:bg-red-700 text-white font-black py-5 px-12 rounded-2xl shadow-[0_15px_30px_rgba(220,38,38,0.4)] hover:shadow-none transition-all duration-300 uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95"
                >
                  <Ticket size={22} /> Đặt Vé Ngay
                </button>
              )}
              {youtubeId && (
                <button 
                  onClick={() => setIsTrailerOpen(true)}
                  className="w-full md:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black py-5 px-10 rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95"
                >
                   <Play size={20} fill="currentColor" /> Xem Trailer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 pb-20 max-w-6xl -mt-10 relative z-20">
        
        {/* ── INFO BOXES ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
               <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-[#dc2626]">
                  <Calendar size={24} />
               </div>
               <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Khởi chiếu</p>
                  <p className="text-slate-900 font-black text-lg">
                    {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—"}
                  </p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
               <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <Star size={24} fill="currentColor" />
               </div>
               <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Đánh giá</p>
                  <p className="text-slate-900 font-black text-lg">{movie.rating > 0 ? `${movie.rating}/10` : "Chưa có"}</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex items-start gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <User size={24} />
               </div>
               <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Phân loại</p>
                  <p className="text-slate-900 font-black text-lg">{movie.ageRestriction || "Mọi lứa tuổi"}</p>
               </div>
            </div>
        </div>

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
