import axiosInstance from "../axiosConfig";

export const getMomoStatus = (bookingId) =>
  axiosInstance.get(`/payments/momo/status/${bookingId}`).then((r) => r.data);

export const getCassoStatus = (bookingId) =>
  axiosInstance.get(`/payments/casso/status/${bookingId}`).then((r) => r.data);

export const getPaymentStatus = (orderId) =>
  axiosInstance.get(`/payments/status/${orderId}`).then((r) => r.data);

export const createMomoPayment = (bookingId) =>
  axiosInstance.post("/payments/momo/create", { bookingId }).then((r) => r.data);

export const initMomoPayment = (orderId) =>
  axiosInstance.post("/payments/momo/init", { orderId }).then((r) => r.data);

export const initBankTransfer = (orderId) =>
  axiosInstance.post("/payments/bank/init", { orderId }).then((r) => r.data);
