import React, { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosConfig";

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange && onChange(star)}
        className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
      >
        <Star
          size={readonly ? 16 : 24}
          className={star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        />
      </button>
    ))}
  </div>
);

const ReviewSection = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [myReviewId, setMyReviewId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      // silent
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
      <h2 className="text-xl font-bold text-white mb-6">
        Đánh giá phim
        {avgRating && (
          <span className="ml-3 text-base font-semibold text-yellow-400">
            ★ {avgRating} <span className="text-gray-400 font-normal">({reviews.length} đánh giá)</span>
          </span>
        )}
      </h2>

      {/* Review form */}
      {token && canReview && !hasReviewed && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-700">
          <p className="text-white font-semibold mb-3">Viết đánh giá của bạn</p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Chia sẻ cảm nhận về bộ phim..."
            className="w-full bg-gray-700 text-white rounded-xl px-4 py-3 text-sm outline-none resize-none border border-gray-600 focus:border-red-500 transition-colors placeholder-gray-400"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">{comment.length}/500</span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#dc2626] hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}

      {token && !canReview && !hasReviewed && (
        <p className="text-gray-400 text-sm mb-6 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
          Chỉ người dùng đã mua vé mới có thể đánh giá phim này.
        </p>
      )}

      {!token && (
        <p className="text-gray-400 text-sm mb-6 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
          <a href="/login" className="text-red-400 hover:underline">Đăng nhập</a> để xem và viết đánh giá.
        </p>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r._id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-semibold text-sm">{r.user?.name || "Ẩn danh"}</p>
                  <StarRating value={r.rating} readonly />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  {currentUser && r.user?._id === currentUser._id && (
                    <button onClick={() => handleDelete(r._id)} className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-300 text-sm mt-2">{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
