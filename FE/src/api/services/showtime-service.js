import axiosInstance from "../axiosConfig";

export const getShowtimes = (params) =>
  axiosInstance.get("/admin/showtimes", { params }).then((r) => r.data);

export const getShowtime = (id) =>
  axiosInstance.get(`/showtimes/${id}`).then((r) => r.data);

export const createShowtime = (payload) =>
  axiosInstance.post("/showtimes", payload).then((r) => r.data);

export const updateShowtime = (id, payload) =>
  axiosInstance.put(`/showtimes/${id}`, payload).then((r) => r.data);

export const cancelShowtime = (id) =>
  axiosInstance.put(`/showtimes/${id}/cancel`).then((r) => r.data);

export const deleteShowtime = (id) =>
  axiosInstance.delete(`/admin/showtimes/${id}`).then((r) => r.data);

export const bulkCancelShowtimes = (ids) =>
  axiosInstance.post("/showtimes/bulk-cancel", { ids }).then((r) => r.data);

// Public: get showtimes for a movie or cinema
export const getMovieShowtimes = (movieId, params) =>
  axiosInstance.get(`/showtimes`, { params: { movieId, ...params } }).then((r) => r.data);

export const getCinemaShowtimes = (cinemaId) =>
  axiosInstance.get(`/showtimes`, { params: { cinemaId } }).then((r) => r.data);
