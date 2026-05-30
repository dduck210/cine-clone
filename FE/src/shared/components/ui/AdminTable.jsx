import React from "react";
import LoadingSpinner from "./LoadingSpinner";

const ALIGN_MAP = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

/**
 * Admin data table. Replaces 8 near-identical table patterns across admin tabs.
 * @param {Array<{key: string, label: string, align?: "left"|"center"|"right", render?: function, className?: string}>} columns
 * @param {Array<object>} data
 * @param {boolean} loading
 * @param {string} [emptyText="Chưa có dữ liệu"]
 * @param {function} [onRowClick]
 * @param {string} [rowKey="_id"]
 * @param {string} [className]
 */
export default function AdminTable({
  columns = [],
  data = [],
  loading = false,
  emptyText = "Chưa có dữ liệu",
  onRowClick,
  rowKey = "_id",
  className = "",
}) {
  const colCount = columns.length;

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-gray-700/80 border-b border-slate-200 dark:border-gray-700 text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-5 py-3.5 ${ALIGN_MAP[col.align] ?? "text-left"} ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan={colCount}>
                <LoadingSpinner size="md" color="red" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={colCount}
                className="text-center text-slate-400 dark:text-gray-500 italic py-12 text-sm"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row[rowKey] ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={
                  onRowClick
                    ? "hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
                    : ""
                }
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-5 py-4 text-sm text-slate-700 dark:text-gray-300 ${ALIGN_MAP[col.align] ?? "text-left"} ${col.className ?? ""}`}
                  >
                    {col.render ? col.render(row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
