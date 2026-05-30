export const SEAT_COLORS = {
  normal: {
    available: "bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-2 border-slate-300 dark:border-gray-500 hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95",
    selected: "bg-[#dc2626] text-white shadow-lg shadow-red-200 scale-110 ring-2 ring-red-300 ring-offset-1",
    locked: "bg-slate-200 dark:bg-gray-600 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-300 dark:border-gray-500 opacity-50",
    label: "Thường", dot: "bg-white dark:bg-gray-600 border-2 border-slate-300 dark:border-gray-500",
  },
  vip: {
    available: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-2 border-amber-400 hover:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 active:scale-95",
    selected: "bg-amber-500 text-white shadow-lg shadow-amber-200 scale-110 ring-2 ring-amber-300 ring-offset-1",
    locked: "bg-slate-200 dark:bg-gray-600 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-300 dark:border-gray-500 opacity-50",
    label: "VIP", dot: "bg-amber-400",
  },
  couple: {
    available: "bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-2 border-pink-400 hover:border-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/30 active:scale-95",
    selected: "bg-pink-500 text-white shadow-lg shadow-pink-200 scale-110 ring-2 ring-pink-300 ring-offset-1",
    locked: "bg-slate-200 dark:bg-gray-600 text-slate-400 dark:text-gray-500 cursor-not-allowed border border-slate-300 dark:border-gray-500 opacity-50",
    label: "Đôi", dot: "bg-pink-400",
  },
};
