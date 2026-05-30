import React from "react";

/**
 * Empty list placeholder with icon, title, optional subtitle and action.
 * @param {ReactNode} icon
 * @param {string} title
 * @param {string} [subtitle]
 * @param {ReactNode} [action]
 * @param {string} [className]
 */
export default function EmptyState({ icon, title, subtitle, action, className = "" }) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="w-14 h-14 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-gray-500">
        {icon}
      </div>
      <p className="text-slate-600 dark:text-gray-400 font-bold text-base">{title}</p>
      {subtitle && (
        <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">{subtitle}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
