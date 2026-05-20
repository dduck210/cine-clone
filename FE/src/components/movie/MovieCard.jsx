import React from "react";
import { Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";

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
  const genreText = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
    : movie.genre;

  const ageBadge = AGE_BADGE[movie.ageRestriction] || null;
  const duration = formatDuration(movie.duration);
  const isComingSoon = movie.status === "coming_soon";

  return (
    <Link
      to={`/movie/${movieId}`}
      className="group block"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm group-hover:shadow-xl transition-all duration-300 will-change-transform group-hover:-translate-y-1">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Age restriction badge */}
        {ageBadge && (
          <div className={`absolute top-2 left-2 ${ageBadge.bg} text-white text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none`}>
            {ageBadge.label}
          </div>
        )}

        {/* Coming soon chip */}
        {isComingSoon && (
          <div className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full leading-none">
            Sắp chiếu
          </div>
        )}

        {/* Hover CTA */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <span className="block w-full text-center bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 rounded-xl">
            Xem chi tiết
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
          {movie.title}
        </h3>

        {genreText && (
          <p className="text-xs text-gray-400 truncate">{genreText}</p>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-gray-700">
              {movie.rating > 0 ? movie.rating.toFixed(1) : "—"}
            </span>
          </div>
          {duration && (
            <div className="flex items-center gap-1 text-gray-400">
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
