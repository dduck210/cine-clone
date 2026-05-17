import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Film, Calendar, Search, X } from "lucide-react";
import MovieCard from "../components/movie/MovieCard";
import axiosInstance from "../api/axiosConfig";

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("now");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    axiosInstance
      .get("/movies")
      .then((res) => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");
  const baseMovies = searchQuery
    ? movies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === "now" ? nowShowing : comingSoon;
  const displayMovies = baseMovies;

  return (
    <div className="min-h-screen bg-white font-bromega text-gray-900">
      <Navbar />

      <main className="container mx-auto px-6 pt-24 md:pt-32 pb-16">
        <div className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-3xl md:text-5xl font-black text-[#dc2626] mb-4 uppercase tracking-tight">
            {searchQuery ? "Kết Quả Tìm Kiếm" : "Danh Sách Phim"}
          </h1>
          {searchQuery ? (
            <div className="flex items-center justify-center gap-3">
              <p className="text-gray-600 font-medium">
                Kết quả cho: <span className="font-black text-gray-900">"{searchQuery}"</span>
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-1 text-sm text-red-600 hover:underline font-bold"
              >
                <X size={14} /> Xóa bộ lọc
              </button>
            </div>
          ) : (
            <p className="text-gray-500 font-medium">
              Cập nhật những bộ phim bom tấn mới nhất tại 5Cine
            </p>
          )}
        </div>

        {!searchQuery && (
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
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-xl bg-gray-200"></div>
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in-up">
            {displayMovies.length > 0 ? (
              displayMovies.map((movie) => (
                <MovieCard key={movie._id || movie.id} movie={movie} />
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 font-bold text-lg">
                  {searchQuery ? `Không tìm thấy phim nào với từ khóa "${searchQuery}".` : "Hiện chưa có phim trong mục này."}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MoviesPage;
