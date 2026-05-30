import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import axiosInstance from "@/api/axiosConfig";
import { useWishlist } from "@/shared/contexts/wishlist-context";

/**
 * WishlistTab — grid of saved/favourite movies with remove action.
 */
const WishlistTab = () => {
  const { toggle } = useWishlist();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/auth/wishlist")
      .then((res) => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (movieId) => {
    await toggle(movieId);
    setMovies((prev) => prev.filter((m) => m._id !== movieId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white border-l-4 border-red-600 pl-3">Phim yêu thích</h2>
        {movies.length > 0 && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {movies.length} phim
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-2xl bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có phim yêu thích.</p>
          <Link to="/movies" className="mt-3 inline-block text-sm text-red-600 font-bold hover:underline">
            Khám phá phim ngay →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div key={movie._id} className="group relative">
              <Link to={`/movie/${movie._id}`} className="block">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-600 shadow-sm group-hover:shadow-lg transition-all">
                  <img
                    src={movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300x450?text=No+Image"; }}
                  />
                </div>
                <p className="mt-2 text-sm font-bold text-gray-800 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors">
                  {movie.title}
                </p>
              </Link>
              <button
                onClick={() => handleRemove(movie._id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                title="Bỏ yêu thích"
              >
                <Heart size={13} className="fill-white text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistTab;
