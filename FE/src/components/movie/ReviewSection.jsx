import React, { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange && onChange(star)}
        className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
      >
        <Star
          size={readonly ? 15 : 22}
          className={star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

const INITIAL_VISIBLE = 3;

const ReviewSection = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReviewId, setMyReviewId] = useState(null);
  const [hasPendingShowtime, setHasPendingShowtime] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchReviews();
    if (token) checkEligibility();
  }, [movieId]);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/movie/${movieId}`);
      setReviews(res.data);
    } catch {
      // silent
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/can-review/${movieId}`);
      setCanReview(res.data.canReview);
      setHasReviewed(res.data.hasReviewed);
      setMyReviewId(res.data.reviewId || null);
      setHasPendingShowtime(res.data.hasPendingShowtime || false);
    } catch (err) {
      console.error("can-review error:", err.response?.status, err.response?.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error("Vui lòng nhập nội dung đánh giá");
    setSubmitting(true);
    try {
      await axiosInstance.post("/reviews", { movieId, rating, comment: comment.trim() });
      toast.success("Đã gửi đánh giá!");
      setComment("");
      setRating(5);
      setHasReviewed(true);
      setCanReview(false);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    try {
      await axiosInstance.delete(`/reviews/${reviewId}`);
      toast.success("Đã xóa đánh giá");
      setHasReviewed(false);
      setCanReview(true);
      setMyReviewId(null);
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa");
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-[#dc2626] pl-3">
        Đánh giá phim
        {avgRating && (
          <span className="ml-3 text-base font-semibold text-yellow-500">
            ★ {avgRating}
            <span className="text-gray-400 font-normal ml-1">({reviews.length} đánh giá)</span>
          </span>
        )}
      </h2>

      {/* Review form */}
      {token && canReview && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
          <p className="text-gray-800 font-semibold mb-3 text-sm">Viết đánh giá của bạn</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Chia sẻ cảm nhận về bộ phim..."
            className="w-full bg-white text-gray-900 rounded-xl px-4 py-3 text-sm outline-none resize-none border border-gray-200 focus:border-[#dc2626] focus:ring-2 focus:ring-red-100 transition-colors placeholder-gray-400"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">{comment.length}/500</span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#dc2626] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm shadow-red-200 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}

      {token && !canReview && !hasReviewed && hasPendingShowtime && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 px-5 py-4 mb-6 flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">🎬</span>
          <div>
            <p className="text-amber-800 text-sm font-bold">Phim có hay không? Đánh giá giúp chúng tôi nhé!</p>
            <p className="text-amber-600 text-xs mt-0.5">Sau khi phim kết thúc, hãy quay lại đây để chia sẻ cảm nhận của bạn.</p>
          </div>
        </div>
      )}

      {token && !canReview && !hasReviewed && !hasPendingShowtime && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4 py-3 mb-6">
          <p className="text-gray-400 text-sm font-bold text-center">
            Chỉ người dùng đã mua vé mới có thể đánh giá phim này.
          </p>
        </div>
      )}

      {!token && (
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4 py-3 mb-6">
          <p className="text-gray-400 text-sm font-bold text-center">
            <a href="/login" className="text-[#dc2626] hover:underline">Đăng nhập</a> để xem và viết đánh giá.
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-3">
          {reviews.slice(0, visibleCount).map((r) => (
            <div key={r._id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-800 font-semibold text-sm mb-1">{r.user?.name || "Ẩn danh"}</p>
                  <StarRating value={r.rating} readonly />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {currentUser && r.user?._id === currentUser._id && (
                    <button onClick={() => handleDelete(r._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-2">{r.comment}</p>
            </div>
          ))}

          {reviews.length > INITIAL_VISIBLE && (
            <button
              onClick={() => setVisibleCount(visibleCount >= reviews.length ? INITIAL_VISIBLE : reviews.length)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:text-[#dc2626] hover:border-red-200 hover:bg-red-50 transition-all"
            >
              {visibleCount >= reviews.length
                ? "Thu gọn"
                : `Xem thêm ${reviews.length - visibleCount} đánh giá`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
