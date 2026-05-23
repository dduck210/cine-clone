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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      {/* ── CINEMATIC HERO ── */}
      <div className="relative pt-16 md:pt-20 overflow-hidden bg-slate-900">
        {/* Blurred backdrop */}
        <div className="absolute inset-0">
          <img
            src={movie.poster}
            alt=""
            className="w-full h-full object-cover scale-110 blur-3xl opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900" />
        </div>

        <div className="relative z-10 container mx-auto px-6 max-w-6xl py-12 md:py-16 flex flex-col md:flex-row gap-8 md:gap-12 items-start">
          {/* Poster */}
          <div className="w-[160px] md:w-[230px] flex-shrink-0 mx-auto md:mx-0">
            <div className="relative group rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
              {getYoutubeId(movie.trailer) && (
                <button
                  onClick={() =>
                    document
                      .getElementById("trailer-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <span className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl">
                    <Play
                      className="text-[#dc2626] ml-1"
                      size={28}
                      fill="currentColor"
                    />
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-white pb-6">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {movie.status === "now_showing" && (
                <span className="bg-[#dc2626] text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                  Đang chiếu
                </span>
              )}
              {movie.status === "coming_soon" && (
                <span className="bg-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest">
                  Sắp chiếu
                </span>
              )}
              {movie.ageRestriction && (
                <span className="border border-white/30 text-white/80 text-[11px] font-bold px-2.5 py-1 rounded-md">
                  {movie.ageRestriction}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-[2.6rem] font-black leading-tight mb-4">
              {movie.title}
            </h1>

            {/* Rating + meta */}
            <div className="flex items-center gap-2 mb-5 flex-wrap text-sm">
              {movie.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={
                          i <= Math.round(movie.rating / 2)
                            ? "currentColor"
                            : "none"
                        }
                        className="text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-yellow-300 font-bold">
                    {movie.rating}
                  </span>
                  <span className="text-white/40 text-xs">/10</span>
                </div>
              )}
              <span className="text-white/25">|</span>
              <span className="flex items-center gap-1 text-white/70">
                <Clock size={13} />
                {durationLabel}
              </span>
              {movie.releaseDate && (
                <>
                  <span className="text-white/25">|</span>
                  <span className="flex items-center gap-1 text-white/70">
                    <Calendar size={13} />
                    {new Date(movie.releaseDate).getFullYear()}
                  </span>
                </>
              )}
              {genreNames.map((g) => (
                <span
                  key={g}
                  className="bg-white/10 hover:bg-white/20 text-white/80 text-xs px-2.5 py-1 rounded-full transition-colors"
                >
                  {g}
                </span>
              ))}
            </div>

            <p className="text-white/70 leading-relaxed mb-6 max-w-2xl text-[15px] line-clamp-3">
              {movie.description || "Chưa có mô tả."}
            </p>

            {/* Director / Cast / Release */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 mb-8 max-w-xl text-sm">
              {movie.director && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                    <Info size={10} />
                    Đạo diễn
                  </p>
                  <p className="text-white font-semibold">{movie.director}</p>
                </div>
              )}
              {movie.cast && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                    <User size={10} />
                    Diễn viên
                  </p>
                  <p className="text-white font-semibold line-clamp-2">
                    {movie.cast}
                  </p>
                </div>
              )}
              {movie.releaseDate && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                    <Calendar size={10} />
                    Khởi chiếu
                  </p>
                  <p className="text-white font-semibold">
                    {new Date(movie.releaseDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              )}
            </div>

            {isMonday && (
              <div className="mb-5 inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-4 py-2.5 rounded-xl text-sm font-bold">
                🎉 Golden Monday — Giảm 20% giá vé hôm nay!
              </div>
            )}

            {/* CTA */}
            {movie.status === "coming_soon" ? (
              <div className="flex flex-col gap-3">
                <button
                  disabled
                  className="bg-gray-500 cursor-not-allowed text-white font-black py-4 px-8 rounded-xl shadow-2xl transition-all uppercase tracking-wider text-sm flex items-center gap-2 w-fit"
                >
                  <Ticket size={20} /> Phim Sắp Chiếu
                </button>
                <p className="text-amber-400 font-bold text-sm flex items-center gap-2">
                  <Info size={16} /> Vui lòng quay lại vào ngày{" "}
                  {new Date(movie.releaseDate).toLocaleDateString("vi-VN")} để
                  đặt vé!
                </p>
              </div>
            ) : selectedShowtime ? (
              <Link
                to={`/booking/${id}`}
                state={{
                  selectedShowtime,
                  selectedDate,
                  movieTitle: movie.title,
                  poster: movie.poster,
                }}
              >
                <button className="bg-[#dc2626] hover:bg-red-700 text-white font-black py-4 px-8 rounded-xl shadow-2xl shadow-red-900/40 transition-all uppercase tracking-wider text-sm flex items-center gap-2">
                  <Ticket size={20} /> Mua Vé: {selectedShowtime.time} —{" "}
                  {selectedShowtime.cinemaName}
                </button>
              </Link>
            ) : (
              <button
                onClick={() => {
                  if (!localStorage.getItem("token")) {
                    navigate("/login");
                    return;
                  }
                  showtimeSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                  const el = showtimeSectionRef.current;
                  if (el) {
                    el.classList.add(
                      "ring-2",
                      "ring-[#dc2626]",
                      "ring-offset-4",
                      "rounded-xl",
                    );
                    setTimeout(
                      () =>
                        el.classList.remove(
                          "ring-2",
                          "ring-[#dc2626]",
                          "ring-offset-4",
                          "rounded-xl",
                        ),
                      1500,
                    );
                  }
                  toast("Vui lòng chọn suất chiếu bên dưới ↓", {
                    icon: "🎬",
                    duration: 2500,
                  });
                }}
                className="bg-[#dc2626] hover:bg-red-700 text-white font-black py-4 px-8 rounded-xl shadow-2xl shadow-red-900/40 transition-all uppercase tracking-wider text-sm flex items-center gap-2"
              >
                <Ticket size={20} /> Đặt Vé Ngay
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 pb-12 max-w-6xl">
        {/* ── SYNOPSIS ── */}
        {movie.description && (
          <section className="py-10 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-[#dc2626] pl-3">
              Nội dung phim
            </h2>
            <p className="text-gray-600 leading-relaxed max-w-3xl text-[15px] whitespace-pre-line">
              {movie.description}
            </p>
          </section>
        )}

        {/* ── CAST ── */}
        {movie.cast && (
          <section className="py-10 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-l-4 border-[#dc2626] pl-3">
              Diễn viên tham gia
            </h2>
            <div className="flex flex-wrap gap-3">
              {movie.cast
                .split(",")
                .map((name) => name.trim())
                .filter(Boolean)
                .map((actor) => {
                  const initials = actor
                    .split(" ")
                    .slice(-2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("");
                  const colors = [
                    "bg-red-100 text-red-700",
                    "bg-blue-100 text-blue-700",
                    "bg-violet-100 text-violet-700",
                    "bg-amber-100 text-amber-700",
                    "bg-emerald-100 text-emerald-700",
                    "bg-pink-100 text-pink-700",
                  ];
                  const color = colors[actor.charCodeAt(0) % colors.length];
                  return (
                    <div
                      key={actor}
                      className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-red-300 hover:bg-red-50 transition-colors group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${color}`}
                      >
                        {initials}
                      </div>
                      <span className="text-gray-800 font-semibold text-sm group-hover:text-[#dc2626] transition-colors">
                        {actor}
                      </span>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* ── SHOWTIMES ── */}
        <section
          ref={showtimeSectionRef}
          className="py-10 border-b border-gray-100"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-[#dc2626] pl-3">
            Lịch Chiếu Phim
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(+new Date() + i * 24 * 60 * 60 * 1000);
              const val = toVNDateStr(d);
              const label =
                i === 0
                  ? "Hôm nay"
                  : i === 1
                    ? "Ngày mai"
                    : `${WEEKDAY[vnDay(d)]} ${vnDate(d)}/${vnMonth(d) + 1}`;
              return (
                <button
                  key={val}
                  onClick={() => setSelectedDate(val)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm border transition-all duration-200 ease-out active:scale-95 ${selectedDate === val ? "bg-[#dc2626] text-white border-[#dc2626] shadow-md shadow-red-200" : "bg-white text-gray-600 border-gray-200 hover:border-[#dc2626] hover:text-[#dc2626] hover:shadow-sm"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {cinemaList.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-gray-400 font-bold">
                Hiện chưa có lịch chiếu cho phim này.
              </p>
            </div>
          ) : cinemaList.every((c) => !onDateShowing(c).length) ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">
                Không có suất chiếu nào trong ngày này.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cinemaList.map((cinema) => {
                const filtered = onDateShowing(cinema);
                if (!filtered.length) return null;
                return (
                  <div
                    key={cinema.id}
                    className={`border rounded-xl overflow-hidden transition-all bg-white ${cinema.isOpen ? "border-red-300 shadow-md" : "border-gray-200"}`}
                  >
                    <div
                      className={`flex justify-between items-center p-5 cursor-pointer ${cinema.isOpen ? "bg-red-50" : "bg-white hover:bg-gray-50"}`}
                      onClick={() => toggleCinema(cinema.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-full ${cinema.isOpen ? "bg-red-100 text-[#dc2626]" : "bg-gray-100 text-gray-400"}`}
                        >
                          <MapPin size={20} />
                        </div>
                        <div>
                          <h3
                            className={`font-bold text-lg ${cinema.isOpen ? "text-[#dc2626]" : "text-gray-800"}`}
                          >
                            {cinema.name}
                          </h3>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {cinema.address}
                          </p>
                        </div>
                      </div>
                      {cinema.isOpen ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                    {cinema.isOpen && (
                      <div className="p-5 pt-0 bg-red-50/30 border-t border-red-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">
                          2D Phụ Đề
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {filtered.map((showtime) => {
                            const isSelected =
                              selectedShowtime?.showtimeId === showtime._id;
                            return (
                              <button
                                key={showtime._id}
                                onClick={() =>
                                  handleSelectTime(showtime, cinema)
                                }
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all border ${isSelected ? "bg-[#dc2626] text-white border-[#dc2626] shadow-lg scale-105" : "bg-white text-gray-700 border-gray-300 hover:border-red-500 hover:text-[#dc2626]"}`}
                              >
                                {showtime.startTime}
                                {showtime.availableSeats !== undefined && (
                                  <span className="ml-2 text-xs opacity-70">
                                    ({showtime.availableSeats} ghế)
                                  </span>
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

        {/* ── TRAILER ── */}
        {getYoutubeId(movie.trailer) && (
          <section
            id="trailer-section"
            className="py-10 border-b border-gray-100"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-l-4 border-[#dc2626] pl-3 flex items-center gap-2">
              <Play size={18} className="text-[#dc2626]" /> Trailer
            </h2>
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(movie.trailer)}?autoplay=1&mute=1&rel=0&modestbranding=1`}
                title={`Trailer - ${movie.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </section>
        )}

        <ReviewSection movieId={id} />
      </main>
      <Footer />
    </div>
  );
};

export default MovieDetailPage;
