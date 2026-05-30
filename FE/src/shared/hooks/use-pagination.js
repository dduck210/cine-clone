import { useState, useCallback } from "react";

export default function usePagination(initialPage = 1) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const reset = useCallback(() => setCurrentPage(1), []);

  // Returns page numbers + null for ellipsis
  const paginationItems = (() => {
    if (totalPages <= 1) return [];
    const items = [];
    const addItem = (p) => { if (!items.includes(p)) items.push(p); };

    addItem(1);
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) {
      addItem(p);
    }
    if (totalPages > 1) addItem(totalPages);

    // Build final array with null for gaps
    const result = [];
    for (let i = 0; i < items.length; i++) {
      if (i > 0 && items[i] - items[i - 1] > 1) result.push(null);
      result.push(items[i]);
    }
    return result;
  })();

  return { currentPage, totalPages, setCurrentPage, setTotalPages, paginationItems, goToPage, reset };
}
