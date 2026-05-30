import React, { useState, useEffect } from "react";
import { ClipboardList, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { auditService } from "../../api/services";
import usePagination from "../../shared/hooks/use-pagination";

const ACTION_COLORS = {
  DELETE_USER: "bg-red-50 text-red-600 border-red-100",
  CREATE_SHOWTIME: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCEL_SHOWTIME: "bg-orange-50 text-orange-700 border-orange-100",
  REFUND: "bg-purple-50 text-purple-700 border-purple-100",
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
    + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export const AuditManager = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const { currentPage, totalPages, setTotalPages, goToPage } = usePagination();
  const PAGE_SIZE = 20;

  const load = async (p = currentPage) => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs({ page: p, limit: PAGE_SIZE });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(currentPage); }, [currentPage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Nhật Ký Quản Trị</h1>
          <p className="text-slate-400 dark:text-gray-400 text-sm mt-1">Theo dõi mọi hành động của admin trong hệ thống</p>
        </div>
        <button
          onClick={() => load(currentPage)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 hover:border-red-300 hover:text-red-600 rounded-xl transition-all active:scale-95"
        >
          <RefreshCw size={14} /> Làm mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={40} className="text-slate-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-slate-400 dark:text-gray-400 font-medium">Chưa có nhật ký nào.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-gray-700 border-b border-slate-100 dark:border-gray-700 text-xs uppercase tracking-wider text-slate-500 dark:text-gray-400 font-bold">
                    <th className="text-left px-5 py-3.5">Thời gian</th>
                    <th className="text-left px-5 py-3.5">Admin</th>
                    <th className="text-left px-5 py-3.5">Hành động</th>
                    <th className="text-left px-5 py-3.5">Chi tiết</th>
                    <th className="text-left px-5 py-3.5 hidden md:table-cell">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-400 dark:text-gray-400 text-xs whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-700 dark:text-white text-sm">{log.adminName || log.admin?.name || "—"}</p>
                        <p className="text-xs text-slate-400 dark:text-gray-400">{log.admin?.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${ACTION_COLORS[log.action] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-gray-400 text-xs max-w-[280px] truncate">
                        {log.detail || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 dark:text-gray-400 text-xs hidden md:table-cell">
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-gray-700">
              <p className="text-xs text-slate-400 dark:text-gray-400">
                Tổng <span className="font-bold text-slate-600 dark:text-gray-300">{total}</span> bản ghi
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-300 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-bold text-slate-600 dark:text-gray-300">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-gray-600 text-slate-500 dark:text-gray-300 hover:border-red-300 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
