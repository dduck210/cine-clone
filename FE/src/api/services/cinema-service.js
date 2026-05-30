import axiosInstance from "../axiosConfig";

export const getCinemas = () =>
  axiosInstance.get("/admin/cinemas").then((r) => r.data);

export const getCinema = (id) =>
  axiosInstance.get(`/admin/cinemas/${id}`).then((r) => r.data);

export const getCinemaRooms = (id) =>
  axiosInstance.get(`/admin/cinemas/${id}/rooms`).then((r) => r.data);

export const createCinema = (payload) =>
  axiosInstance.post("/admin/cinemas", payload).then((r) => r.data);

export const updateCinema = (id, payload) =>
  axiosInstance.put(`/admin/cinemas/${id}`, payload).then((r) => r.data);

export const deleteCinema = (id) =>
  axiosInstance.delete(`/admin/cinemas/${id}`).then((r) => r.data);

export const updateCinemaStatus = (id, status) =>
  axiosInstance.patch(`/admin/cinemas/${id}/status`, { status }).then((r) => r.data);
