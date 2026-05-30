import axiosInstance from "../axiosConfig";

export const getNotifications = () =>
  axiosInstance.get("/admin/notifications").then((r) => r.data);

export const markNotificationsRead = (ids) =>
  axiosInstance.post("/admin/notifications/read", { ids }).then((r) => r.data);

export const getVapidKey = () =>
  axiosInstance.get("/push/vapid-key").then((r) => r.data);

export const subscribePush = (payload) =>
  axiosInstance.post("/push/subscribe", payload).then((r) => r.data);
