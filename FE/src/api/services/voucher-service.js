import axiosInstance from "../axiosConfig";

export const getVouchers = (params) =>
  axiosInstance.get("/vouchers/admin", { params }).then((r) => r.data);

export const createVoucher = (payload) =>
  axiosInstance.post("/vouchers/admin", payload).then((r) => r.data);

export const updateVoucher = (id, payload) =>
  axiosInstance.put(`/admin/vouchers/${id}`, payload).then((r) => r.data);

export const deleteVoucher = (id) =>
  axiosInstance.delete(`/admin/vouchers/${id}`).then((r) => r.data);

export const validateVoucher = (code, showtimeId) =>
  axiosInstance.post("/vouchers/validate", { code, showtimeId }).then((r) => r.data);
