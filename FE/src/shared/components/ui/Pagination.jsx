import React from "react";

/**
 * Build page number list with ellipsis.
 * Always shows first, last, current, and 1 neighbor each side.
 */
function buildPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current]);
  if (current - 1 > 1) pages.add(current - 1);
  if (current + 1 < total) pages.add(current + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("...");
    result.push(sorted[i]);
  }

  return result;
}

const BTN_BASE = "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all";
const BTN_ACTIVE = "bg-[#dc2626] text-white border-[#dc2626]";
const BTN_INACTIVE =
  "bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:border-red-300";
const BTN_DISABLED = "opacity-40 cursor-not-allowed";

/**
 * Page number controls. Replaces 6 identical pagination renders.
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {function} onPageChange
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = buildPages(currentPage, totalPages);
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      {/* Prev */}
      <button
        className={`${BTN_BASE} ${BTN_INACTIVE} ${isPrevDisabled ? BTN_DISABLED : ""}`}
        onClick={() => !isPrevDisabled && onPageChange(currentPage - 1)}
        disabled={isPrevDisabled}
        aria-label="Previous page"
      >
        &lt;
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="px-2 py-1.5 text-xs text-slate-400 dark:text-gray-500 select-none"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            className={`${BTN_BASE} ${page === currentPage ? BTN_ACTIVE : BTN_INACTIVE}`}
            onClick={() => page !== currentPage && onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        className={`${BTN_BASE} ${BTN_INACTIVE} ${isNextDisabled ? BTN_DISABLED : ""}`}
        onClick={() => !isNextDisabled && onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  );
}
