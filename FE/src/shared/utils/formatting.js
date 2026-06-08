export const formatCurrency = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export const formatDateTime = (d) =>
  d ? new Date(d).toLocaleString("vi-VN") : "—";

export const formatDuration = (mins) => {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
};
