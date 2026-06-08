import axiosInstance from "../axiosConfig";

export const getMomoStatus = (bookingId) =>
  axiosInstance.get(`/payments/momo/status/${bookingId}`).then((r) => r.data);

export const getCassoStatus = (bookingId) =>
  axiosInstance.get(`/payments/casso/status/${bookingId}`).then((r) => r.data);

export const createMomoPayment = (bookingId) =>
  axiosInstance.post("/payments/momo/create", { bookingId }).then((r) => r.data);

export const confirmMomoPayment = (params) =>
  axiosInstance.post("/payments/momo/confirm", params).then((r) => r.data);
