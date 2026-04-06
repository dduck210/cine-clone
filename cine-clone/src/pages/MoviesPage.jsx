import React, { useState } from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { movies } from "../data/mockData"; // Import data phim của bạn
import { Film, Calendar } from "lucide-react";
import MovieCard from "../components/movie/MovieCard";

const MoviesPage = () => {
  const [activeTab, setActiveTab] = useState("now"); // 'now' | 'soon'

  // Lọc phim (Giả sử trong mockData có trường status, nếu không có bạn có thể tự chia mảng)
  const nowShowing = movies.filter(
    (m) => m.status === "Đang chiếu" || !m.status,
  );
  const comingSoon = movies.filter((m) => m.status === "Sắp chiếu");

  // Nếu data chưa có status, bạn có thể hardcode chia đôi mảng để test:
  // const nowShowing = movies.slice(0, 4);
  // const comingSoon = movies.slice(4, 8);

  const displayMovies = activeTab === "now" ? nowShowing : comingSoon;

  return (
    <div className="min-h-screen bg-white font-bromega text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-16">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-3xl md:text-5xl font-black text-[#dc2626] mb-4 uppercase tracking-tight">
            Danh Sách Phim
          </h1>
          <p className="text-gray-500 font-medium">
            Cập nhật những bộ phim bom tấn mới nhất tại 5Cine
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-2">
            <button
              onClick={() => setActiveTab("now")}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === "now"
                  ? "bg-[#dc2626] text-white shadow-lg shadow-red-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Film size={18} /> Phim Đang Chiếu
            </button>
            <button
              onClick={() => setActiveTab("soon")}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                activeTab === "soon"
                  ? "bg-[#dc2626] text-white shadow-lg shadow-red-200"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <Calendar size={18} /> Phim Sắp Chiếu
            </button>
          </div>
        </div>

        {/* Movie Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in-up">
          {displayMovies.length > 0 ? (
            displayMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-400 font-bold text-lg">
                Hiện chưa có phim trong mục này.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MoviesPage;
