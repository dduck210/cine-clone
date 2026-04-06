import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import {
  Search,
  Bell,
  DollarSign,
  Ticket,
  Clock,
  User,
  MoreHorizontal,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { stats, moviesList as initialMovies } from "../../data/adminData";
import {
  OrdersManager,
  OrderDetailModal,
} from "../../components/admin/OrdersTab";
import { MoviesManager, MovieModal } from "../../components/admin/MoviesTab";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const [movies, setMovies] = useState(initialMovies);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <aside className="w-64 bg-white border-r">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(t) => setSearchParams({ tab: t })}
        />
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative z-0">
        <header className="p-4 bg-white">
          <h1 className="font-bold text-xl">{activeTab}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {activeTab === "movies" && <MoviesManager movies={movies} />}
          {activeTab === "orders" && <OrdersManager />}
        </div>
      </main>
    </div>
  );
};
export default Dashboard;
