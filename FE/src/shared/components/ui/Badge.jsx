import React from "react";

const VARIANTS = {
  success: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700",
  warning: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700",
  danger:  "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700",
  info:    "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700",
  neutral: "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-600",
  purple:  "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700",
  amber:   "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700",
};

const BASE = "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border";

/**
 * Status badge with color variants.
 * @param {"success"|"warning"|"danger"|"info"|"neutral"|"purple"|"amber"} variant
 * @param {boolean} [dot=false] — animated pulse dot
 * @param {string} [className]
 */
export default function Badge({ variant = "neutral", dot = false, className = "", children }) {
  const variantClass = VARIANTS[variant] ?? VARIANTS.neutral;

  return (
    <span className={`${BASE} ${variantClass} ${className}`}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {children}
    </span>
  );
}
