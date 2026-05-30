import axiosInstance from "../axiosConfig";

export const getAuditLogs = (params) =>
  axiosInstance.get("/admin/audit-logs", { params }).then((r) => r.data);
