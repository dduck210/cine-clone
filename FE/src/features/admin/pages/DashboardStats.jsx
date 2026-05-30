import React, { useState, useEffect } from "react";
import {
  DollarSign, Ticket, RefreshCw, Popcorn, TrendingUp, Trophy, Clock, AlertTriangle, Download,
} from "lucide-react";
import { StatCard } from "@/shared/components/ui";

const exportCSV = (stats, extStats) => {
  const rows = [
    ["Chỉ số", "Giá trị"],
    ["Doanh thu vé", stats.totalRevenue.toLocaleString("vi-VN") + "đ"],
    ["Doanh thu F&B", extStats.comboRevenue.toLocaleString("vi-VN") + "đ"],
    ["Vé đã bán", stats.totalBookings],
    ["Vé hoàn", extStats.refunds.totalRefunds],
    ["Tổng hoàn tiền", extStats.refunds.totalRefundAmount.toLocaleString("vi-VN") + "đ"],
    [],
    ["Chi tiết F&B", "Doanh thu"],
    ...extStats.comboItems.map(c => [c.name, c.revenue.toLocaleString("vi-VN") + "đ"]),
    [],
    ["Khung giờ", "Số vé"],
    ...extStats.timeslots.map(t => [t._id, t.bookings]),
  ];
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `5cine-report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const DashboardStats = ({ stats, extStats, loading }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const id = setTimeout(() => setMounted(true), 50); return () => clearTimeout(id); }, []);

  return (
  <div className="space-y-6">
    {/* Header with export button */}
    {!loading && (
      <div className="flex justify-end">
        <button
          onClick={() => exportCSV(stats, extStats)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-red-300 hover:text-red-600 text-slate-600 dark:text-gray-300 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95"
        >
          <Download size={15} /> Xuất CSV
        </button>
      </div>
    )}
    {/* Main stats */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {loading ? (
        [1, 2, 3, 4].map((i) => <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl h-36 animate-pulse border border-slate-100 dark:border-gray-700" />)
      ) : (
        <>
          <div className="tab-enter" style={{ animationDelay: "0ms" }}><StatCard icon={DollarSign} label="Doanh thu vé" value={stats.totalRevenue.toLocaleString("vi-VN") + " đ"} sub="Vé đã thanh toán" color="bg-emerald-50 text-emerald-600" /></div>
          <div className="tab-enter" style={{ animationDelay: "60ms" }}><StatCard icon={Popcorn} label="Doanh thu F&B" value={extStats.comboRevenue.toLocaleString("vi-VN") + " đ"} sub="Bắp rang, nước, combo" color="bg-orange-50 text-orange-500" /></div>
          <div className="tab-enter" style={{ animationDelay: "120ms" }}><StatCard icon={Ticket} label="Vé đã bán" value={stats.totalBookings} sub="Đơn đã hoàn tất" color="bg-red-50 text-[#dc2626]" /></div>
          <div className="tab-enter" style={{ animationDelay: "180ms" }}><StatCard icon={RefreshCw} label="Vé hoàn" value={extStats.refunds.totalRefunds} sub={extStats.refunds.totalRefundAmount.toLocaleString("vi-VN") + " đ đã hoàn"} color="bg-blue-50 text-blue-500" /></div>
        </>
      )}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Khung giờ hot */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#dc2626]" /> Khung giờ bán chạy
        </h3>
        {loading || !extStats.timeslots.length ? (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        ) : (() => {
          const max = extStats.timeslots[0]?.bookings || 1;
          const BAR_MAX_PX = 110;
          const SHORT = { morning: "Sáng", afternoon: "Chiều", evening: "Tối", night: "Đêm" };
          const SUB = { morning: "trước 12h", afternoon: "12–17h", evening: "18–21h", night: "từ 22h" };
          const COLORS = { morning: "#f97316", afternoon: "#eab308", evening: "#dc2626", night: "#991b1b" };
          return (
            <div>
              {/* Chart */}
              <div className="flex items-end justify-around gap-3 px-2 border-b border-slate-100 dark:border-gray-700" style={{ height: `${BAR_MAX_PX + 32}px` }}>
                {extStats.timeslots.map((ts) => {
                  const barH = Math.max(10, Math.round((ts.bookings / max) * BAR_MAX_PX));
                  return (
                    <div key={ts._id} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300 mb-1">{ts.bookings} vé</span>
                      <div
                        className="w-full max-w-[52px] rounded-t-lg transition-all duration-700 ease-out"
                        style={{ height: mounted ? `${barH}px` : "0px", backgroundColor: COLORS[ts._id] || "#dc2626" }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-around gap-3 px-2 pt-3">
                {extStats.timeslots.map((ts) => (
                  <div key={ts._id} className="flex-1 text-center">
                    <p className="text-xs font-bold text-slate-600 dark:text-gray-300">{SHORT[ts._id] || ts._id}</p>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500">{SUB[ts._id] || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Doanh thu F&B chi tiết */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Popcorn size={18} className="text-orange-500" /> Chi tiết doanh thu F&B
        </h3>
        {loading || !extStats.comboItems.length ? (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        ) : (
          <div className="space-y-2">
            {extStats.comboItems.map((item, idx) => (
              <div key={item._id} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-gray-700 last:border-0 tab-enter" style={{ animationDelay: `${idx * 80}ms` }}>
                <div>
                  <p className="font-medium text-slate-700 dark:text-gray-300 text-sm">{item._id}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">×{item.totalQuantity} phần</p>
                </div>
                <span className="font-bold text-orange-500">{item.totalRevenue.toLocaleString()}đ</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Top phim doanh thu */}
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm p-6">
      <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
        <Trophy size={18} className="text-yellow-500" /> Top phim doanh thu cao nhất
      </h3>
      {loading || !extStats.topMovies.length ? (
        loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-gray-700 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <p className="text-slate-400 text-sm italic">Chưa có dữ liệu</p>
        )
      ) : (() => {
        const maxRevenue = extStats.topMovies[0]?.revenue || 1;
        const MEDAL = ["🥇", "🥈", "🥉"];
        return (
          <div className="space-y-3">
            {extStats.topMovies.map((movie, idx) => (
              <div key={movie._id} className="flex items-center gap-3 group tab-enter" style={{ animationDelay: `${idx * 70}ms` }}>
                <span className="w-6 text-center text-base flex-shrink-0">
                  {MEDAL[idx] || <span className="text-xs font-bold text-slate-400">{idx + 1}</span>}
                </span>
                {movie.poster ? (
                  <img src={movie.poster} alt={movie.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0 shadow-sm" />
                ) : (
                  <div className="w-10 h-14 bg-slate-100 dark:bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <Ticket size={16} className="text-slate-300 dark:text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 dark:text-gray-300 text-sm truncate group-hover:text-[#dc2626] transition-colors">{movie.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-700 ease-out"
                        style={{ width: mounted ? `${Math.round((movie.revenue / maxRevenue) * 100)}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 flex-shrink-0">{movie.bookings} vé</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#dc2626] flex-shrink-0 whitespace-nowrap">
                  {movie.revenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>

    {/* Pending/expired summary */}
    {!loading && (stats.pendingBookings > 0 || stats.expiredBookings > 0) && (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-2xl p-4 flex items-center gap-3 tab-enter" style={{ animationDelay: "0ms" }}>
          <Clock size={20} className="text-amber-600 shrink-0" />
          <div>
            <p className="text-amber-700 dark:text-amber-400 font-bold text-lg">{stats.pendingBookings}</p>
            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">Đơn đang chờ thanh toán</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3 tab-enter" style={{ animationDelay: "80ms" }}>
          <AlertTriangle size={20} className="text-slate-400 dark:text-gray-500 shrink-0" />
          <div>
            <p className="text-slate-600 dark:text-gray-300 font-bold text-lg">{stats.expiredBookings || 0}</p>
            <p className="text-slate-500 dark:text-gray-400 text-xs font-medium">Đơn hết hạn (không thanh toán)</p>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default DashboardStats;
