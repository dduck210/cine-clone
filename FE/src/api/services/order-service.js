import axiosInstance from "../axiosConfig";

export const getAdminBookings = () =>
  axiosInstance.get("/admin/bookings").then((r) => r.data);

export const confirmBooking = (id) =>
  axiosInstance.put(`/admin/bookings/${id}/confirm`).then((r) => r.data);

export const printBooking = (id) =>
  axiosInstance.put(`/admin/bookings/${id}/print`).then((r) => r.data);

export const updateUser = (id, data) =>
  axiosInstance.put(`/admin/users/${id}`, data).then((r) => r.data);
