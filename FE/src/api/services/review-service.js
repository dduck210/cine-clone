import axiosInstance from "../axiosConfig";

// Admin: all reviews with pagination + filters
export const getAdminReviews = (params) =>
  axiosInstance.get(`/reviews/admin/all`, { params }).then((r) => r.data);

export const deleteReview = (id) =>
  axiosInstance.delete(`/admin/reviews/${id}`).then((r) => r.data);

// Public: reviews for a specific movie
export const getMovieReviews = (movieId) =>
  axiosInstance.get(`/reviews/movie/${movieId}`).then((r) => r.data);

export const canReview = (movieId) =>
  axiosInstance.get(`/reviews/can-review/${movieId}`).then((r) => r.data);

export const createReview = (payload) =>
  axiosInstance.post("/reviews", payload).then((r) => r.data);

export const deleteOwnReview = (reviewId) =>
  axiosInstance.delete(`/reviews/${reviewId}`).then((r) => r.data);
