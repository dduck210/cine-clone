import axiosInstance from "../axiosConfig";

export const createBooking = (payload) =>
  axiosInstance.post("/bookings", payload).then((r) => r.data);

export const getUserBookings = () =>
  axiosInstance.get("/bookings/user/all").then((r) => r.data);

export const cancelBooking = (id) =>
  axiosInstance.put(`/bookings/${id}/cancel`).then((r) => r.data);
