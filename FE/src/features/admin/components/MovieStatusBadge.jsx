import React from "react";

export const STATUS_MAP = {
  now_showing: {
    label: "Đang chiếu",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    dot: "bg-emerald-500 animate-pulse",
  },
  coming_soon: {
    label: "Sắp chiếu",
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  stopped: {
    label: "Ngừng chiếu",
    bg: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

/**
 * MovieStatusBadge — pill badge for movie screening status.
 * @param {{ status: "now_showing" | "coming_soon" | "stopped", dotSize?: string }} props
 */
const MovieStatusBadge = ({ status, dotSize = "w-2 h-2" }) => {
  const sc = STATUS_MAP[status] || STATUS_MAP.coming_soon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc.bg} ${sc.text} ${sc.border}`}
    >
      <span className={`${dotSize} rounded-full ${sc.dot}`} />
      {sc.label}
    </span>
  );
};

export default MovieStatusBadge;
