import axiosInstance from "../axiosConfig";

export const getTicket = (id) =>
  axiosInstance.get(`/tickets/${id}`).then((r) => r.data);

export const scanTicket = (bookingCode) =>
  axiosInstance.post("/tickets/scan", { bookingCode }).then((r) => r.data);

export const hardCopyTicket = (ticketId) =>
  axiosInstance.post(`/tickets/${ticketId}/hard-copy`).then((r) => r.data);

export const getTicketByView = (bookingCode) =>
  axiosInstance.get(`/tickets/view/${bookingCode}`).then((r) => r.data);
