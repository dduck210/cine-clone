import axiosInstance from "../axiosConfig";

export const getUsers = (params) =>
  axiosInstance.get("/admin/users", { params }).then((r) => r.data);

export const updateUserRole = (id, role) =>
  axiosInstance.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data);

export const deleteUser = (id) =>
  axiosInstance.delete(`/admin/users/${id}`).then((r) => r.data);

export const getProfile = () =>
  axiosInstance.get("/auth/profile").then((r) => r.data);

export const updateProfile = (payload) =>
  axiosInstance.put("/auth/profile", payload).then((r) => r.data);

export const changePassword = (payload) =>
  axiosInstance.put("/auth/change-password", payload).then((r) => r.data);
