import React, { useEffect, useState } from "react";
import usePagination from "@/shared/hooks/use-pagination";
import { Eye, ChevronDown, Plus, Clock, Edit, Star, Search, PlayCircle, X } from "lucide-react";
import MovieModal from "@/features/admin/components/MovieModal";
import MovieStatusBadge, { STATUS_MAP } from "@/features/admin/components/MovieStatusBadge";

// Re-export for backward compat with Dashboard.jsx named imports
export { default as MovieModal } from "@/features/admin/components/MovieModal";

export const MovieDetailModal = ({ movie, onClose, onEdit }) => {
  const genreText = Array.isArray(movie.genre)
    ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
    : movie.genre || "—";
  const sc = STATUS_MAP[movie.status] || STATUS_MAP.coming_soon;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 dark:border-gray-700"
        style={{ animation: "modalIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{movie.title}</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Chi tiết phim</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-200">
              <Edit size={14} /> Chỉnh sửa
            </button>
            <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-gray-700 hover:bg-slate-100 dark:hover:bg-gray-600 rounded-full text-slate-400 dark:text-gray-400 transition-all">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex gap-5">
            <img src={movie.poster} alt={movie.title}
              className="w-28 shrink-0 rounded-xl shadow-md border border-slate-100 dark:border-gray-700 object-cover"
              style={{ aspectRatio: "2/3" }}
              onError={(e) => { e.target.src = "https://via.placeholder.com/112x168?text=No+Image"; }} />
            <div className="flex-1 grid grid-cols-2 gap-2 content-start">
              {[
                { label: "Thể loại", value: genreText },
                { label: "Thời lượng", value: `${movie.duration} phút` },
                { label: "Giới hạn tuổi", value: movie.ageRestriction || "—" },
                { label: "Đánh giá", value: movie.rating ? `⭐ ${movie.rating}/5` : "—" },
                { label: "Đạo diễn", value: movie.director || "—" },
                { label: "Ngày ra mắt", value: movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString("vi-VN") : "—" },
                { label: "Kết thúc chiếu", value: movie.screeningEndDate ? new Date(movie.screeningEndDate).toLocaleDateString("vi-VN") : "—" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">{item.label}</p>
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1.5">Trạng thái</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-3 border border-slate-100 dark:border-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">Diễn viên</p>
              <p className="font-medium text-slate-700 dark:text-gray-300 text-sm line-clamp-2">{movie.cast || "—"}</p>
            </div>
          </div>
          {movie.description && (
            <div className="bg-slate-50 dark:bg-gray-700 rounded-xl p-4 border border-slate-100 dark:border-gray-600">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-2">Mô tả phim</p>
              <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{movie.description}</p>
            </div>
          )}
          {movie.trailer && (
            <a href={movie.trailer} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#dc2626] hover:underline">
              <PlayCircle size={16} /> Xem trailer
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const MOVIES_PAGE_SIZE = 6;

export const MoviesManager = ({ movies, handleAddNew, handleEdit }) => {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGenre, setFilterGenre] = useState("");
  const [detailMovie, setDetailMovie] = useState(null);
  const { currentPage, totalPages, setTotalPages, paginationItems, goToPage, reset: resetPage } = usePagination();

  const genreOptions = Array.from(new Set(
    movies.flatMap((m) =>
      Array.isArray(m.genre)
        ? m.genre.map((g) => (typeof g === "object" ? g.name : g))
        : m.genre ? [m.genre] : []
    ).filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));

  const filteredMovies = movies.filter((movie) => {
    const genreNames = Array.isArray(movie.genre)
      ? movie.genre.map((g) => (typeof g === "object" ? g.name : g))
      : movie.genre ? [movie.genre] : [];
    return (
      (!filterStatus || movie.status === filterStatus) &&
      (!filterGenre || genreNames.includes(filterGenre)) &&
      (!search.trim() || movie.title?.toLowerCase().includes(search.trim().toLowerCase()))
    );
  });

  const computedTotalPages = Math.ceil(filteredMovies.length / MOVIES_PAGE_SIZE);
  const pagedMovies = filteredMovies.slice((currentPage - 1) * MOVIES_PAGE_SIZE, currentPage * MOVIES_PAGE_SIZE);

  useEffect(() => { setTotalPages(computedTotalPages); }, [computedTotalPages]);

  const handleSearch = (val) => { setSearch(val); resetPage(); };
  const handleFilterStatus = (val) => { setFilterStatus(val); resetPage(); };
  const handleFilterGenre = (val) => { setFilterGenre(val); resetPage(); };

  return (
  <>
  <style>{`
    @keyframes modalIn {
      from { opacity: 0; transform: scale(0.95) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-6px) scaleY(0.95); }
      to   { opacity: 1; transform: translateY(0) scaleY(1); }
    }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `}</style>
  <div className="space-y-4">
    {/* Header bar */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý Phim</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400">Quản lý toàn bộ danh sách phim</p>
      </div>
      <button onClick={handleAddNew}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 shrink-0">
        <Plus size={18} /> Thêm phim mới
      </button>
    </div>

    {/* Search + Filter row */}
    <div className="flex gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
        <input value={search} onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm theo tên phim..."
          className="w-full bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626]" />
      </div>
      <div className="relative">
        <select value={filterGenre} onChange={(e) => handleFilterGenre(e.target.value)}
          className="bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626] appearance-none">
          <option value="">Tất cả thể loại</option>
          {genreOptions.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
      </div>
      <div className="relative">
        <select value={filterStatus} onChange={(e) => handleFilterStatus(e.target.value)}
          className="bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2.5 pr-9 text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#dc2626] appearance-none">
          <option value="">Tất cả trạng thái</option>
          <option value="now_showing">Đang chiếu</option>
          <option value="coming_soon">Sắp chiếu</option>
          <option value="stopped">Ngừng chiếu</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
      </div>
    </div>

    {/* Table */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600 text-[13px] uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
              <th className="p-5 pl-6">Tên phim</th>
              <th className="p-5">Thể loại</th>
              <th className="p-5">Thời lượng</th>
              <th className="p-5">Đánh giá</th>
              <th className="p-5 text-center">Trạng thái</th>
              <th className="p-5 pr-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody key={currentPage} className="divide-y divide-slate-100 dark:divide-gray-700">
            {pagedMovies.length > 0 ? pagedMovies.map((movie, idx) => {
              const genreText = Array.isArray(movie.genre)
                ? movie.genre.map((g) => (typeof g === "object" ? g.name : g)).join(", ")
                : movie.genre || "—";
              return (
                <tr key={movie._id} onClick={() => setDetailMovie(movie)}
                  className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all duration-150 cursor-pointer"
                  style={{ animation: "rowIn 0.25s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${idx * 40}ms` }}>
                  <td className="p-5 pl-6">
                    <div className="flex items-center gap-4">
                      <img src={movie.poster} alt=""
                        className="w-14 h-[76px] object-cover rounded-xl border border-slate-100 dark:border-gray-700 shrink-0"
                        onError={(e) => { e.target.style.display = "none"; }} />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white text-[16px] line-clamp-1">{movie.title}</p>
                        <p className="text-[13px] text-slate-400 dark:text-gray-500 font-mono mt-0.5">#{movie._id?.toString().slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-[15px] text-slate-600 dark:text-gray-400">{genreText}</td>
                  <td className="p-5">
                    <div className="flex items-center gap-1.5 text-[15px] text-slate-500 dark:text-gray-400">
                      <Clock size={14} className="text-slate-400 dark:text-gray-500" /> {movie.duration} phút
                    </div>
                  </td>
                  <td className="p-5">
                    {movie.rating ? (
                      <div className="flex items-center gap-1 text-[15px] font-bold text-amber-500">
                        <Star size={14} fill="currentColor" /> {movie.rating}
                      </div>
                    ) : <span className="text-slate-300 dark:text-gray-600 text-[15px]">—</span>}
                  </td>
                  <td className="p-5 text-center">
                    <MovieStatusBadge status={movie.status} />
                  </td>
                  <td className="p-5 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetailMovie(movie)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all" title="Xem"><Eye size={18} /></button>
                      <button onClick={() => handleEdit(movie)} className="p-2 text-slate-400 hover:text-[#dc2626] hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all" title="Sửa"><Edit size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="7" className="p-12 text-center text-slate-400 dark:text-gray-500 italic">
                {search || filterStatus || filterGenre ? "Không có phim nào phù hợp." : "Chưa có dữ liệu phim nào."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-gray-700">
        <p className="text-[15px] text-slate-500 dark:text-gray-400">
          Hiển thị <span className="font-bold text-slate-700 dark:text-white">
            {filteredMovies.length === 0 ? 0 : (currentPage - 1) * MOVIES_PAGE_SIZE + 1}–{Math.min(currentPage * MOVIES_PAGE_SIZE, filteredMovies.length)}
          </span> / <span className="font-bold text-slate-700 dark:text-white">{filteredMovies.length}</span> phim
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            ‹ Trước
          </button>
          {paginationItems.map((p, i) => p === null ? (
            <span key={`d${i}`} className="px-2 text-slate-400 dark:text-gray-600 text-[15px]">…</span>
          ) : (
            <button key={p} onClick={() => goToPage(p)}
              className={`w-10 h-10 rounded-lg text-[15px] font-bold transition-all duration-150 active:scale-95 ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm" : "border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50"}`}>
              {p}
            </button>
          ))}
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-lg text-[15px] font-semibold border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95">
            Sau ›
          </button>
        </div>
      </div>
    </div>
  </div>

  {detailMovie && (
    <MovieDetailModal
      movie={detailMovie}
      onClose={() => setDetailMovie(null)}
      onEdit={() => { handleEdit(detailMovie); setDetailMovie(null); }}
    />
  )}
  </>
  );
};
