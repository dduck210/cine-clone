import React from 'react';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

const MovieCard = ({ movie }) => {
  return (
    // Bao toàn bộ card bằng Link (hoặc chỉ bao ảnh/tiêu đề tùy bạn)
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/movie/${movie.id}`}> 
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-200">
          <img 
            src={movie.poster} 
            alt={movie.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badge Trạng thái */}
          <div className="absolute top-2 left-2">
             {movie.isNowShowing ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Đang chiếu</span>
             ) : (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">Sắp chiếu</span>
             )}
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={`/movie/${movie.id}`}>
            <h3 className="font-bold text-gray-800 mb-1 truncate group-hover:text-blue-600 transition-colors">
            {movie.title}
            </h3>
        </Link>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{movie.genre}</span>
          <div className="flex items-center gap-1 text-orange-400">
            <Star size={14} fill="currentColor" />
            <span className="font-medium">{movie.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;