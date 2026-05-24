import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { Film, Calendar, Search, X, Clapperboard, ChevronDown } from "lucide-react";
import MovieCard from "../components/movie/MovieCard";
import axiosInstance from "../api/axiosConfig";

const MoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const activeTab = searchParams.get("tab") || "now";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  const PAGE_SIZE = 10;

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/movies").then((res) => setMovies(res.data)).catch(() => setMovies([])),
      new Promise((r) => setTimeout(r, 1000)),
    ]).finally(() => setLoading(false));
  }, []);

  const nowShowing = movies.filter((m) => m.status === "now_showing");
  const comingSoon = movies.filter((m) => m.status === "coming_soon");
  const allDisplay = searchQuery
    ? movies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === "now" ? nowShowing : comingSoon;
  const displayMovies = allDisplay.slice(0, visibleCount);
  const hasMore = visibleCount < allDisplay.length;

  const handleTabChange = (tab) => {
    setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set("tab", tab); return n; });
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-900">
      <Navbar />

      {/* ── HERO ── */}
      <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-24 md:pt-32 pb-16 overflow-hidden">
        {/* Decorative background icons */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <Clapperboard key={i} size={120} className="absolute text-white"
              style={{ top: `${(i * 27) % 90}%`, left: `${(i * 31) % 95}%`, transform: `rotate(${i * 22}deg)` }}
            />
          ))}
        </div>
        {/* Radial glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[280px] bg-red-700/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative container mx-auto px-6 opacity-0 animate-[fadeIn_0.7s_ease_forwards]">
          {searchQuery ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div>
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-1">Tìm kiếm</p>
                <h1 className="text-3xl md:text-4xl font-black text-white">
                  Kết quả cho <span className="text-red-400">"{searchQuery}"</span>
                </h1>
                <p className="text-slate-400 mt-2 text-sm">Tìm thấy {allDisplay.length} phim</p>
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
                <p className="text-red-400 text-sm font-bold uppercase tracking-widest mb-2">5Cine</p>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Danh Sách Phim</h1>
                <p className="text-slate-400 mt-2 max-w-md">Trải nghiệm điện ảnh đẳng cấp với những bộ phim bom tấn mới nhất</p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 shrink-0 opacity-0 animate-[fadeUp_0.6s_ease_0.25s_forwards]">
                <div className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 hover:bg-white/15 transition-colors cursor-default">
                  <p className="text-3xl font-black text-white">{nowShowing.length}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-widest">Đang chiếu</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 hover:bg-white/15 transition-colors cursor-default">
                  <p className="text-3xl font-black text-white">{comingSoon.length}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-1 uppercase tracking-widest">Sắp chiếu</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-6 py-10">
        {/* Tabs + counter */}
        {!searchQuery && (
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="relative flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm">
              <div
                className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-[#dc2626] rounded-xl shadow-md shadow-red-200 transition-transform duration-300 ease-in-out ${activeTab === "soon" ? "translate-x-full" : "translate-x-0"}`}
              />
              {[
                { key: "now", icon: <Film size={15} />, label: "Đang Chiếu", count: nowShowing.length },
                { key: "soon", icon: <Calendar size={15} />, label: "Sắp Chiếu", count: comingSoon.length },
              ].map(({ key, icon, label, count }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key)}
                  className={`relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors duration-200 ${activeTab === key ? "text-white" : "text-gray-500 hover:text-gray-800"}`}
                >
                  {icon}
                  {label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-black transition-colors duration-200 ${activeTab === key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-400 font-medium">
              Hiển thị <span className="font-black text-gray-800">{Math.min(visibleCount, allDisplay.length)}</span>
              /<span className="font-black text-gray-800">{allDisplay.length}</span> phim
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
              <div
                key={movie._id || movie.id}
                className="opacity-0 animate-[fadeUp_0.5s_ease_forwards]"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-600 font-bold text-lg">
              {searchQuery ? `Không tìm thấy phim nào với từ khóa "${searchQuery}".` : "Hiện chưa có phim trong mục này."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchParams({})}
                className="mt-4 text-sm text-red-600 font-bold hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="group flex items-center gap-2 px-8 py-3.5 bg-white border-2 border-[#dc2626] text-[#dc2626] font-bold rounded-2xl hover:bg-[#dc2626] hover:text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-red-100"
            >
              <ChevronDown size={18} className="group-hover:translate-y-0.5 transition-transform" />
              Xem thêm ({allDisplay.length - visibleCount} phim còn lại)
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MoviesPage;
