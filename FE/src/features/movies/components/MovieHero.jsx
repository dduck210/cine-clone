import React from "react";
import { Link } from "react-router-dom";
import { Star, Clock, Calendar, Ticket, Play, Heart, Share2, Check } from "lucide-react";

/**
 * MovieHero — dark hero section with backdrop/poster, meta info, and CTA buttons.
 * Props:
 *   movie           — full movie object from API
 *   movieId         — string, used in Link to booking
 *   selectedShowtime — currently selected showtime object or null
 *   selectedDate    — date string "YYYY-MM-DD"
 *   wishlistIds     — Set of saved movie IDs
 *   isLoggedIn      — boolean
 *   copied          — boolean, share link copied state
 *   onTrailerOpen   — () => void
 *   onWishlistToggle — () => void
 *   onShare         — () => void
 *   onBookNow       — () => void  (when no showtime selected yet)
 */
const MovieHero = ({
  movie,
  movieId,
  selectedShowtime,
  selectedDate,
  wishlistIds,
  isLoggedIn,
  copied,
  onTrailerOpen,
  onWishlistToggle,
  onShare,
  onBookNow,
}) => {
  const genreNames = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
    : movie.genre ? [movie.genre] : [];

  const durationLabel = `${Math.floor(movie.duration / 60)}h${movie.duration % 60 > 0 ? ` ${movie.duration % 60}p` : ""}`;
  const heroImg = movie.backdrop || movie.poster;
  const ratingVal = movie.rating > 0 ? movie.rating : null;

  // Detect YouTube trailer
  const youtubeId = (() => {
    if (!movie.trailer) return null;
    const m = movie.trailer.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
    return m ? m[1] : null;
  })();

  return (
    <div className="relative overflow-hidden bg-[#0a0a0f]">
      {/* Backdrop */}
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

        {/* Info panel */}
        <div className="opacity-0 animate-[fadeUp_0.8s_ease_0.25s_forwards] flex-1 text-white pb-2">
          {/* Status badge */}
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
              <Link to={`/booking/${movieId}`} state={{ selectedShowtime, selectedDate, movieTitle: movie.title, poster: movie.poster }}>
                <button className="inline-flex items-center gap-2.5 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgba(220,38,38,0.45)] transition-all text-sm uppercase tracking-wide">
                  <Ticket size={18} /> Đặt vé · {selectedShowtime.time}
                </button>
              </Link>
            ) : (
              <button
                onClick={onBookNow}
                className="inline-flex items-center gap-2.5 bg-[#dc2626] hover:bg-red-700 active:scale-95 text-white font-black py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgba(220,38,38,0.45)] transition-all text-sm uppercase tracking-wide"
              >
                <Ticket size={18} /> Đặt vé ngay
              </button>
            )}

            {youtubeId && (
              <button
                onClick={onTrailerOpen}
                className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold py-3.5 px-7 rounded-xl transition-all text-sm"
              >
                <Play size={16} fill="currentColor" /> Trailer
              </button>
            )}

            {isLoggedIn && (
              <button
                onClick={onWishlistToggle}
                className={`inline-flex items-center gap-2 py-3.5 px-5 rounded-xl border transition-all text-sm font-bold ${
                  wishlistIds.has(movie._id)
                    ? "bg-red-500 border-red-400 text-white"
                    : "bg-white/10 hover:bg-white/15 border-white/15 text-white"
                }`}
                title={wishlistIds.has(movie._id) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                <Heart size={16} className={wishlistIds.has(movie._id) ? "fill-white" : ""} />
                {wishlistIds.has(movie._id) ? "Đã lưu" : "Yêu thích"}
              </button>
            )}

            <button
              onClick={onShare}
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
  );
};

export default MovieHero;
