import axiosInstance from "../axiosConfig";

export const getRevenueReport = () =>
  axiosInstance.get("/admin/reports/revenue").then((r) => r.data);

export const getBookingsReport = () =>
  axiosInstance.get("/admin/reports/bookings").then((r) => r.data);

export const getComboRevenueReport = () =>
  axiosInstance.get("/admin/reports/combo-revenue").then((r) => r.data);

export const getTimeslotsReport = () =>
  axiosInstance.get("/admin/reports/timeslots").then((r) => r.data);

export const getRefundsReport = () =>
  axiosInstance.get("/admin/reports/refunds").then((r) => r.data);

export const getTopMoviesReport = () =>
  axiosInstance.get("/admin/reports/top-movies").then((r) => r.data);
