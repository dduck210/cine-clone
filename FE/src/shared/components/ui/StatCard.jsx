import React from "react";

/**
 * StatCard — reusable KPI/stat card for dashboards.
 * Props:
 *   icon    — lucide icon component
 *   value   — primary metric (string or number)
 *   label   — card title (uppercase label)
 *   sub     — secondary text below the value
 *   color   — Tailwind bg+text class for the icon container (default: "bg-red-50 text-[#dc2626]")
 */
const StatCard = ({ icon, label, value, sub, color = "bg-red-50 text-[#dc2626]" }) => {
  const Icon = icon;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-slate-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 group-hover:text-[#dc2626] transition-colors whitespace-nowrap truncate">{value}</h3>
      {sub && <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 font-medium">{sub}</p>}
    </div>
  );
};

export default StatCard;
