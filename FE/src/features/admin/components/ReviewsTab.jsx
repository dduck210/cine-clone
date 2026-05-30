import React, { useState, useEffect } from "react";
import { Star, Search, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { reviewService } from "@/api/services";
import usePagination from "@/shared/hooks/use-pagination";

const PAGE_SIZE = 6;

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];

const ratingBadge = (r) => {
  if (r >= 5) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (r >= 4) return "bg-green-50 text-green-700 border border-green-200";
  if (r >= 3) return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  if (r >= 2) return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-red-50 text-red-600 border border-red-200";
};

const UserAvatar = ({ name }) => {
  const initials = (name || "?").split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  const color = AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${color}`}>
      {initials}
    </div>
  );
};

const Stars = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={13} className={s <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-200"} />
    ))}
  </div>
);

export const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const { currentPage, totalPages, setTotalPages, paginationItems, goToPage, reset: resetPage } = usePagination();
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchReviews(); }, [search, filterRating, currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (filterRating) params.rating = filterRating;
      const data = await reviewService.getAdminReviews(params);
      setReviews(data.reviews);
      setTotal(data.total);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">Đánh giá phim</h2>
            <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5">{total} đánh giá từ người dùng</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Tìm phim, người dùng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all bg-white dark:bg-gray-700 text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); resetPage(); }}
            className="border border-slate-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-white outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white dark:bg-gray-700 transition-all cursor-pointer"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} sao</option>)}
          </select>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-50 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5 animate-pulse">
                <div className="w-11 h-16 bg-slate-100 dark:bg-gray-700 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="w-16 h-5 bg-slate-100 dark:bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-gray-700">
                    {["Phim", "Người dùng", "Đánh giá", "Nội dung", "Ngày"].map((h, i) => (
                      <th key={h} className={`text-left px-5 py-3.5 text-[11px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest bg-slate-50/80 dark:bg-gray-700${i === 4 ? " hidden md:table-cell" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                  {(!reviews || reviews.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <MessageSquare size={32} className="text-slate-200 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-slate-400 dark:text-gray-400 text-sm font-medium">Không tìm thấy đánh giá nào.</p>
                      </td>
                    </tr>
                  ) : reviews.map((r) => (
                    <tr key={r._id} className="group border-l-2 border-transparent hover:border-red-400 hover:bg-slate-50/60 dark:hover:bg-gray-700/50 transition-[border-color,background-color] duration-200">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {r.movie?.poster
                            ? <img src={r.movie.poster} alt="" className="w-10 h-14 object-cover rounded-lg shrink-0 shadow-sm" />
                            : <div className="w-10 h-14 bg-slate-100 dark:bg-gray-700 rounded-lg shrink-0" />
                          }
                          <span className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2 max-w-[140px]">
                            {r.movie?.title || "Phim đã xóa"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={r.user?.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate max-w-[130px]">{r.user?.name || "Người dùng đã xóa"}</p>
                            <p className="text-xs text-slate-400 dark:text-gray-400 truncate max-w-[170px]">{r.user?.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-black ${ratingBadge(r.rating)}`}>
                          <Star size={12} className="fill-current" />
                          {r.rating}.0
                        </div>
                        <div className="mt-2"><Stars value={r.rating} /></div>
                      </td>
                      <td className="px-5 py-4 max-w-[240px]">
                        <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 border-l-2 border-slate-200 dark:border-gray-600 pl-2.5">
                          {r.comment || <span className="italic text-slate-300 dark:text-gray-600">Không có nội dung</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell whitespace-nowrap">
                        <span className="text-sm text-slate-400 dark:text-gray-400 font-medium">
                          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-gray-700 bg-slate-50/40 dark:bg-gray-700/30">
                <p className="text-xs text-slate-400 dark:text-gray-400">
                  {total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} / {total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                    className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
                  {paginationItems.map((p, i) =>
                    p === null ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-gray-600 text-xs">…</span>
                    ) : (
                      <button key={p} onClick={() => goToPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm shadow-red-200" : "border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/50"}`}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}
                    className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
