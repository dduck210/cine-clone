import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Film, Calendar, Search, X, Clapperboard } from "lucide-react";
import MovieCard from "../components/movie/MovieCard";
import axiosInstance from "../api/axiosConfig";

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("now");

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    axiosInstance.get("/movies")
      .then((res) => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");
  const displayMovies = searchQuery
    ? movies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === "now" ? nowShowing : comingSoon;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-enter { animation: fadeInUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
      `}</style>
      <Navbar />

      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-24 md:pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Clapperboard key={i} size={120} className="absolute text-white"
              style={{ top: `${(i * 27) % 90}%`, left: `${(i * 31) % 95}%`, transform: `rotate(${i * 22}deg)` }}
            />
          ))}
        </div>
        <div className="relative container mx-auto px-6">
          {searchQuery ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">Tìm kiếm</p>
                <h1 className="text-3xl md:text-4xl font-black text-white">
                  Kết quả cho <span className="text-red-400">"{searchQuery}"</span>
                </h1>
                <p className="text-slate-400 mt-2 text-sm">Tìm thấy {displayMovies.length} phim</p>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="flex items-center gap-2 text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-xl font-bold transition-all self-start sm:self-center sm:ml-auto"
              >
                <X size={14} /> Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">5Cine</p>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Danh Sách Phim</h1>
                <p className="text-slate-400 mt-2">Trải nghiệm điện ảnh đẳng cấp với những bộ phim bom tấn mới nhất</p>
              </div>

              {/* Stats */}
              <div className="flex gap-4 shrink-0">
                <div className="text-center bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-2xl font-black text-white">{nowShowing.length}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Đang chiếu</p>
                </div>
                <div className="text-center bg-white/10 border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-2xl font-black text-white">{comingSoon.length}</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">Sắp chiếu</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-6 py-10">
        {/* Tabs */}
        {!searchQuery && (
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex gap-2 bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
              <button
                onClick={() => setActiveTab("now")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  activeTab === "now"
                    ? "bg-[#dc2626] text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Film size={15} />
                Đang Chiếu
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === "now" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {nowShowing.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("soon")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                  activeTab === "soon"
                    ? "bg-[#dc2626] text-white shadow-md shadow-red-200"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <Calendar size={15} />
                Sắp Chiếu
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${activeTab === "soon" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {comingSoon.length}
                </span>
              </button>
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Hiển thị <span className="font-bold text-gray-700">{displayMovies.length}</span> phim
            </p>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] rounded-2xl bg-gray-200" />
                <div className="mt-3 h-4 bg-gray-200 rounded w-3/4" />
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayMovies.length > 0 ? (
          <div key={activeTab + searchQuery} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {displayMovies.map((movie, i) => (
              <div key={movie._id || movie.id} className="card-enter" style={{ animationDelay: `${Math.min(i * 55, 440)}ms` }}>
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-lg">
              {searchQuery ? `Không tìm thấy phim nào với từ khóa "${searchQuery}".` : "Hiện chưa có phim trong mục này."}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MoviesPage;
