import React from "react";
import { Star, Clock, Play, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "@/shared/contexts/wishlist-context";

const AGE_BADGE = {
  "All ages": { label: "P",   bg: "bg-green-500" },
  "T13":      { label: "T13", bg: "bg-amber-500" },
  "T16":      { label: "T16", bg: "bg-orange-500" },
  "T18":      { label: "T18", bg: "bg-red-600" },
  "C":        { label: "C",   bg: "bg-purple-600" },
};

const formatDuration = (minutes) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}g ${m}p` : `${m}p`;
};

const MovieCard = ({ movie }) => {
  const movieId = movie._id || movie.id;
  const { ids, toggle } = useWishlist();
  const isSaved = ids.has(movieId);
  const isLoggedIn = !!localStorage.getItem("token");
  const genreText = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
    : movie.genre;

  const ageBadge = AGE_BADGE[movie.ageRestriction] || null;
  const duration = formatDuration(movie.duration);
  const isComingSoon = movie.status === "coming_soon";
  const rating = movie.rating > 0 ? movie.rating : null;

  return (
    <Link to={`/movie/${movieId}`} className="group block">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm group-hover:shadow-2xl transition-all duration-300 will-change-transform group-hover:-translate-y-1.5">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
          onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Image"; }}
        />

        {/* Always-on subtle bottom gradient for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button center on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-y-2 group-hover:translate-y-0">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 group-hover:scale-105 transition-transform duration-200">
            <Play size={20} fill="white" className="text-white ml-1" />
          </div>
        </div>

        {/* Age badge */}
        {ageBadge && (
          <div className={`absolute top-2 left-2 ${ageBadge.bg} text-white text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none shadow-sm`}>
            {ageBadge.label}
          </div>
        )}

        {/* Coming soon chip */}
        {isComingSoon && (
          <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full leading-none shadow-sm">
            Sắp chiếu
          </div>
        )}

        {/* Wishlist heart button */}
        {isLoggedIn && (
          <button
            onClick={(e) => { e.preventDefault(); toggle(movieId); }}
            className={`absolute top-2 ${isComingSoon ? "top-8" : "top-2"} right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 opacity-0 group-hover:opacity-100 ${isSaved ? "bg-red-500 opacity-100" : "bg-black/40 backdrop-blur-sm"}`}
            title={isSaved ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          >
            <Heart size={14} className={isSaved ? "fill-white text-white" : "text-white"} />
          </button>
        )}

        {/* Bottom CTA on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="block w-full text-center bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl shadow-lg">
            Xem chi tiết
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug line-clamp-2 group-hover:text-red-600 transition-colors duration-200">
          {movie.title}
        </h3>

        {genreText && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{genreText}</p>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1">
            <Star
              size={12}
              className={rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600 fill-gray-300 dark:fill-gray-600"}
            />
            <span className={`text-xs font-bold ${rating ? "text-yellow-600" : "text-gray-500 dark:text-gray-500"}`}>
              {rating ? rating.toFixed(1) : "—"}
            </span>
          </div>
          {duration && (
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <Clock size={11} />
              <span className="text-xs">{duration}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
