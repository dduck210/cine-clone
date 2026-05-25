import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Star, Trash2, Search, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchReviews(); }, [search, filterRating, currentPage]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit: PAGE_SIZE });
      if (search) params.append("search", search);
      if (filterRating) params.append("rating", filterRating);
      const res = await axiosInstance.get(`/reviews/admin/all?${params}`);
      setReviews(res.data.reviews);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosInstance.delete(`/reviews/admin/${deleteTarget._id}`);
      toast.success("Đã xóa đánh giá");
      setDeleteTarget(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const paginationItems = Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
            <MessageSquare size={18} className="text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-tight">Đánh giá phim</h2>
            <p className="text-xs text-slate-400 mt-0.5">{total} đánh giá từ người dùng</p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm phim, người dùng..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 transition-all"
            />
          </div>
          <select
            value={filterRating}
            onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-50 bg-white transition-all cursor-pointer"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} sao</option>)}
          </select>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-5 animate-pulse">
                <div className="w-11 h-16 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Phim</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Người dùng</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Đánh giá</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80">Nội dung</th>
                    <th className="text-left px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 hidden md:table-cell">Ngày</th>
                    <th className="text-center px-5 py-3.5 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <MessageSquare size={32} className="text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm font-medium">Không tìm thấy đánh giá nào.</p>
                      </td>
                    </tr>
                  ) : reviews.map((r, i) => (
                    <tr
                      key={r._id}
                      className="group opacity-0 animate-[fadeSlideIn_0.3s_ease_forwards] border-l-2 border-transparent hover:border-red-400 hover:bg-slate-50/60 transition-[border-color,background-color] duration-200"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      {/* Movie */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {r.movie?.poster
                            ? <img src={r.movie.poster} alt="" className="w-10 h-14 object-cover rounded-lg shrink-0 shadow-sm" />
                            : <div className="w-10 h-14 bg-slate-100 rounded-lg shrink-0" />
                          }
                          <span className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 max-w-[140px]">
                            {r.movie?.title || "—"}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={r.user?.name} />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 text-sm truncate max-w-[130px]">{r.user?.name || "Ẩn danh"}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[170px]">{r.user?.email || ""}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-black ${ratingBadge(r.rating)}`}>
                          <Star size={12} className="fill-current" />
                          {r.rating}.0
                        </div>
                        <div className="mt-2">
                          <Stars value={r.rating} />
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-5 py-4 max-w-[240px]">
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 border-l-2 border-slate-200 pl-2.5">
                          {r.comment || <span className="italic text-slate-300">Không có nội dung</span>}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 hidden md:table-cell whitespace-nowrap">
                        <span className="text-sm text-slate-400 font-medium">
                          {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all duration-150"
                          title="Xóa đánh giá"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                <p className="text-xs text-slate-400">
                  {total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} / {total}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">‹</button>
                  {paginationItems.map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs">…</span>
                    ) : (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm shadow-red-200" : "border border-slate-200 text-slate-600 hover:bg-white"}`}>
                        {p}
                      </button>
                    )
                  )}
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
                    className="px-2.5 h-8 rounded-lg text-xs font-bold border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-[scaleIn_0.2s_ease_forwards]">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Xóa đánh giá?</h3>
            <p className="text-slate-500 text-sm mb-1">Đánh giá của <span className="font-bold text-slate-800">{deleteTarget.user?.name}</span></p>
            {deleteTarget.comment && (
              <p className="text-slate-400 text-xs mb-5 line-clamp-2 italic border-l-2 border-slate-200 pl-2 text-left">"{deleteTarget.comment}"</p>
            )}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 text-sm transition-colors">Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 disabled:opacity-50 text-sm transition-colors">
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
