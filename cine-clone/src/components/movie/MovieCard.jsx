import React from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

const MovieCard = ({ movie }) => {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-gray-200">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="font-bromega bg-red-600 text-white py-2 px-6 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            Đặt vé
          </span>
        </div>
      </div>

      <div className="pt-3 pb-1">
        <h3 className="font-bold text-gray-800 text-lg leading-tight truncate group-hover:text-red-600 transition-colors">
          {movie.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1 truncate font-bromega font-normal">
          {movie.genre}
        </p>

        <div className="flex items-center gap-1 mt-2">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-bold text-gray-700 font-bromega">
            {movie.rating}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
