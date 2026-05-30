import axiosInstance from "../axiosConfig";

export const getRooms = (cinemaId) => {
  const url = cinemaId ? `/admin/cinemas/${cinemaId}/rooms` : "/admin/rooms";
  return axiosInstance.get(url).then((r) => r.data);
};

export const getRoomShowtimes = (roomId) =>
  axiosInstance.get(`/admin/rooms/${roomId}/showtimes`).then((r) => r.data);

export const createRoom = (payload) =>
  axiosInstance.post("/admin/rooms", payload).then((r) => r.data);

export const updateRoom = (id, payload) =>
  axiosInstance.put(`/admin/rooms/${id}`, payload).then((r) => r.data);

export const deleteRoom = (id) =>
  axiosInstance.delete(`/admin/rooms/${id}`).then((r) => r.data);

export const reopenRooms = (cinemaId, roomIds) =>
  axiosInstance.post("/admin/rooms/reopen", { cinemaId, roomIds }).then((r) => r.data);

export const previewEmergencyClose = (cinemaId, roomIds) =>
  axiosInstance.post("/admin/emergency-close/rooms/preview", { cinemaId, roomIds }).then((r) => r.data);

export const emergencyCloseRooms = (cinemaId, roomIds) =>
  axiosInstance.post("/admin/emergency-close/rooms", { cinemaId, roomIds }).then((r) => r.data);
