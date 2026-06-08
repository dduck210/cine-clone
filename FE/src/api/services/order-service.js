import axiosInstance from "../axiosConfig";

// Bookings (used in profile and admin)
export const createBooking = (payload) =>
  axiosInstance.post("/bookings", payload).then((r) => r.data);

export const getUserBookings = () =>
  axiosInstance.get("/bookings/user/all").then((r) => r.data);

export const getAdminBookings = () =>
  axiosInstance.get("/admin/bookings").then((r) => r.data);

export const confirmBooking = (id) =>
  axiosInstance.put(`/admin/bookings/${id}/confirm`).then((r) => r.data);

export const printBooking = (id) =>
  axiosInstance.put(`/admin/bookings/${id}/print`).then((r) => r.data);

export const cancelBooking = (id) =>
  axiosInstance.put(`/bookings/${id}/cancel`).then((r) => r.data);

export const updateUser = (id, data) =>
  axiosInstance.put(`/admin/users/${id}`, data).then((r) => r.data);
