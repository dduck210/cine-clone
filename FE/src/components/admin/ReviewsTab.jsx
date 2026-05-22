import React, { useState, useEffect } from "react";
import { Star, Trash2, Search, Filter, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const PAGE_SIZE = 6;

const StarDisplay = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} size={13} className={s <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
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

  useEffect(() => {
    fetchReviews();
  }, [search, filterRating, currentPage]);

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

  const handleSearch = (val) => { setSearch(val); setCurrentPage(1); };
  const handleFilterRating = (val) => { setFilterRating(val); setCurrentPage(1); };

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

  return (
    <div className="space-y-5">
      {/* Header + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Quản lý đánh giá</h2>
          <p className="text-sm text-slate-400 mt-0.5">Tổng {total} đánh giá từ người dùng</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm phim, người dùng, nội dung..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 font-medium"
            />
          </div>
          <select
            value={filterRating}
            onChange={(e) => handleFilterRating(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white"
          >
            <option value="">Tất cả sao</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} sao</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Phim</th>
                    <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Người dùng</th>
                    <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Đánh giá</th>
                    <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Nội dung</th>
                    <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider hidden md:table-cell">Ngày</th>
                    <th className="text-right px-5 py-3.5 font-bold text-slate-500 uppercase text-xs tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        Không tìm thấy đánh giá nào.
                      </td>
                    </tr>
                  ) : reviews.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {r.movie?.poster && (
                            <img src={r.movie.poster} alt={r.movie.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800 line-clamp-2 max-w-[140px]">
                            {r.movie?.title || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{r.user?.name || "Ẩn danh"}</p>
                        <p className="text-xs text-slate-400">{r.user?.email || ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <StarDisplay value={r.rating} />
                          <span className="text-xs font-bold text-slate-500">{r.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 max-w-[240px]">
                        <p className="text-slate-600 text-sm line-clamp-2">{r.comment}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(r)}
                          className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
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
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 font-medium">
                Hiển thị {total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} / {total} đánh giá
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-3 h-9 rounded-lg text-sm font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">‹ Trước</button>
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
                    ) : (
                      <button key={p} onClick={() => setCurrentPage(p)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === p ? "bg-[#dc2626] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                        {p}
                      </button>
                    )
                  )}
                <button onClick={() => setCurrentPage((p) => Math.min(Math.max(totalPages, 1), p + 1))} disabled={currentPage >= totalPages}
                  className="px-3 h-9 rounded-lg text-sm font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">Sau ›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 size={26} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Xóa đánh giá?</h3>
            <p className="text-slate-500 text-sm mb-1">
              Đánh giá của <span className="font-bold text-slate-800">{deleteTarget.user?.name}</span>
            </p>
            <p className="text-slate-400 text-xs mb-6 line-clamp-2">"{deleteTarget.comment}"</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 text-sm">Hủy</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 rounded-xl text-white font-bold hover:bg-red-700 disabled:opacity-50 text-sm">
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
