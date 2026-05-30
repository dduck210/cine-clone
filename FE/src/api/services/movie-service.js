import axiosInstance from "../axiosConfig";

export const getMovies = (params) =>
  axiosInstance.get("/movies", { params }).then((r) => r.data);

export const getMovie = (id) =>
  axiosInstance.get(`/movies/${id}`).then((r) => r.data);

export const getMovieGenres = () =>
  axiosInstance.get("/movies/genres").then((r) => r.data);

export const createMovie = (payload) =>
  axiosInstance.post("/movies", payload).then((r) => r.data);

export const updateMovie = (id, payload) =>
  axiosInstance.put(`/movies/${id}`, payload).then((r) => r.data);

export const deleteMovie = (id) =>
  axiosInstance.delete(`/movies/${id}`).then((r) => r.data);

export const cancelAffectedShowtimes = (movieId, showtimeIds) =>
  axiosInstance.post(`/movies/${movieId}/cancel-affected`, { showtimeIds }).then((r) => r.data);

// Wishlist
export const getWishlist = () =>
  axiosInstance.get("/auth/wishlist").then((r) => r.data);

export const toggleWishlist = (movieId) =>
  axiosInstance.post(`/auth/wishlist/${movieId}`).then((r) => r.data);
