import React, { useEffect } from 'react'; // Bỏ useState
import { useSearchParams } from 'react-router-dom'; // <--- Import cái này
import Navbar from '../../components/common/Navbar';
import Hero from '../../components/common/Hero';
import Footer from '../../components/common/Footer';
import MovieCard from '../../components/movie/MovieCard';
import { movies } from '../../data/mockData'; 
import { Ticket } from 'lucide-react';

const HomePage = () => {
  // 1. Thay useState bằng useSearchParams
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 2. Lấy giá trị tab từ URL (Mặc định là 'now' nếu không có)
  const activeTab = searchParams.get('tab') || 'now';

  // Hàm chuyển tab tiện lợi
  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <Hero />
      
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Phim Đang Chiếu & Sắp Chiếu</h2>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => handleTabChange('now')} // <-- Gọi hàm đổi URL
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'now' 
                ? 'bg-white shadow border border-gray-200 text-gray-900' 
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Phim Đang Chiếu
          </button>
          <button 
             onClick={() => handleTabChange('coming')} // <-- Gọi hàm đổi URL
             className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeTab === 'coming' 
                ? 'bg-white shadow border border-gray-200 text-gray-900' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Phim Sắp Chiếu
          </button>
        </div>

        {/* Grid phim */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ví dụ logic lọc phim (Giả sử bạn muốn lọc thật) */}
          {movies
            // Nếu muốn lọc thật thì dùng dòng này (cần thêm trường type vào data):
            // .filter(movie => activeTab === 'now' ? movie.isNowShowing : movie.isComingSoon)
            .map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;