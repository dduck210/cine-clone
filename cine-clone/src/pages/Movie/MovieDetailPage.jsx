import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { Star, Clock, Calendar, User, MapPin, ChevronDown, ChevronUp, Info, PlayCircle, Ticket } from 'lucide-react';

const MovieDetailPage = () => {
  // Mock dữ liệu chuẩn theo ảnh mẫu
  const movie = {
    title: "Vùng Đất Quỷ Dữ: Thành Phố Zombies",
    rating: 4.5,
    description: "Một chủng virus bí ẩn bùng phát, biến cư dân thành những thây ma khát máu. Một nhóm nhỏ những người sống sót phải chiến đấu để tìm nơi trú ẩn an toàn trong một thành phố hoang tàn, nơi mọi góc phố đều ẩn chứa hiểm nguy chết người. Họ phải đối mặt với không chỉ lũ xác sống mà còn cả sự nghi ngờ lẫn nhau để tồn tại.",
    duration: "125 phút",
    releaseDate: "15/10/2024",
    director: "Lê Hoàng",
    cast: "Nguyễn Anh, Trần Thị B, Phạm Văn C, Lý Thu D",
    genres: ["Kinh dị", "Hành động", "Khoa học viễn tưởng"],
    // Ảnh poster khổ dọc (Portrait)
    poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=600&auto=format&fit=crop" 
  };

  const cinemas = [
    {
      id: 1,
      name: "5Cine Royal City",
      address: "Royal City, Nguyễn Trãi, Thanh Xuân, Hà Nội",
      times: ["10:00", "12:30", "15:00", "17:30", "20:00", "22:30"],
      isOpen: true
    },
    {
      id: 2,
      name: "5Cine Times City",
      address: "Times City, Minh Khai, Hai Bà Trưng, Hà Nội",
      times: ["09:00", "11:30", "14:00", "16:30", "19:00", "21:30"],
      isOpen: false
    },
    {
      id: 3,
      name: "5Cine Cầu Giấy",
      address: "Trần Duy Hưng, Cầu Giấy, Hà Nội",
      times: ["10:15", "13:45", "16:15", "19:45"],
      isOpen: false
    }
  ];

  const [cinemaList, setCinemaList] = useState(cinemas);

  const toggleCinema = (id) => {
    setCinemaList(cinemaList.map(cinema => 
      cinema.id === id ? { ...cinema, isOpen: !cinema.isOpen } : cinema
    ));
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 py-10 max-w-[1600px]">
        
        {/* --- PHẦN 1: LAYOUT 2 CỘT (POSTER TRÁI - INFO PHẢI) --- */}
        <div className="flex flex-col md:flex-row gap-10 mb-16">
            
            {/* CỘT TRÁI: POSTER (Vùng trắng bạn nhắc tới) */}
            <div className="w-full md:w-[300px] flex-shrink-0">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 relative group">
                    <img 
                        src={movie.poster} 
                        alt={movie.title}
                        className="w-full h-[450px] object-cover"
                    />
                    {/* Hiệu ứng hover chơi cho đẹp */}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all"></div>
                </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT PHIM */}
            <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
                    {movie.title}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-6">
                    <div className="flex text-yellow-400">
                        {[1, 2, 3, 4].map(star => <Star key={star} size={20} fill="currentColor" />)}
                        <Star size={20} fill="currentColor" className="text-yellow-400/50" />
                    </div>
                    <span className="text-gray-500 font-medium text-sm pt-0.5">4.5/5.0</span>
                </div>

                <p className="text-gray-600 leading-relaxed mb-8 text-justify">
                    {movie.description}
                </p>

                {/* Grid Thông tin chi tiết */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 mb-8 border-t border-b border-gray-100 py-6">
                    {/* Sub-Cột 1 */}
                    <div className="space-y-5">
                        <div>
                            <span className="font-bold text-gray-900 block text-sm mb-1">Thời lượng</span>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Clock size={16} className="text-blue-600"/> {movie.duration}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 block text-sm mb-1">Ngày phát hành</span>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Calendar size={16} className="text-blue-600"/> {movie.releaseDate}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 block text-sm mb-1">Diễn viên</span>
                            <div className="flex items-start gap-2 text-gray-600 text-sm">
                                <User size={16} className="text-blue-600 mt-0.5 flex-shrink-0"/> {movie.cast}
                            </div>
                        </div>
                    </div>

                    {/* Sub-Cột 2 */}
                    <div className="space-y-5">
                        <div>
                            <span className="font-bold text-gray-900 block text-sm mb-2">Thể loại</span>
                            <div className="flex flex-wrap gap-2">
                                {movie.genres.map((genre, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-bold border border-gray-200">
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="font-bold text-gray-900 block text-sm mb-1">Đạo diễn</span>
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Info size={16} className="text-blue-600"/> {movie.director}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nút Mua Vé Full Width của cột phải */}
                <button className="w-full bg-[#0369a1] hover:bg-[#0284c7] text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-200 transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                    <Ticket size={20} /> Mua Vé Ngay
                </button>
            </div>
        </div>

        {/* --- PHẦN 2: LỊCH CHIẾU PHIM --- */}
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-blue-600 pl-3">
                Lịch Chiếu Phim
            </h2>
            
            <div className="space-y-4">
                {cinemaList.map((cinema) => (
                    <div key={cinema.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors bg-white">
                        {/* Header Rạp */}
                        <div 
                            className={`flex justify-between items-center p-5 cursor-pointer transition-colors ${cinema.isOpen ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
                            onClick={() => toggleCinema(cinema.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${cinema.isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${cinema.isOpen ? 'text-blue-700' : 'text-gray-800'}`}>
                                        {cinema.name}
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-0.5">{cinema.address}</p>
                                </div>
                            </div>
                            <div className="text-gray-400">
                                {cinema.isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>

                        {/* Danh sách giờ chiếu */}
                        {cinema.isOpen && (
                            <div className="p-5 pt-0 bg-gray-50 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-4">2D Phụ Đề</p>
                                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-3 animate-fade-in">
                                    {cinema.times.map((time, idx) => (
                                        <button 
                                            key={idx}
                                            className="bg-white border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:shadow-md transition-all"
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MovieDetailPage;