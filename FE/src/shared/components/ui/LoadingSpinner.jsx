import React from "react";

const SIZE_MAP = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

const COLOR_MAP = {
  red: "border-[#dc2626]",
  white: "border-white",
  slate: "border-slate-400",
};

/**
 * Centered loading spinner.
 * @param {"sm"|"md"|"lg"} size
 * @param {"red"|"white"|"slate"} color
 * @param {string} className
 */
export default function LoadingSpinner({ size = "md", color = "red", className = "" }) {
  const sizeClass = SIZE_MAP[size] ?? SIZE_MAP.md;
  const colorClass = COLOR_MAP[color] ?? COLOR_MAP.red;

  return (
    <div className={`flex justify-center items-center py-8 ${className}`}>
      <div
        className={`animate-spin rounded-full border-4 border-t-transparent ${sizeClass} ${colorClass}`}
      />
    </div>
  );
}
