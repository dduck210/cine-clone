import React from 'react';
import { LayoutDashboard, Film, Calendar, ShoppingCart, Users, Settings, Ticket } from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'movies', icon: Film, label: 'Movies' },
    { id: 'schedules', icon: Calendar, label: 'Schedules' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'users', icon: Users, label: 'Users' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed left-0 top-0 flex flex-col z-10">
      <div className="p-6 flex items-center gap-2 text-blue-600 font-bold text-2xl border-b border-gray-100">
        <Ticket size={28} />
        <span>5Cine</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-2">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Main Menu</div>
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">
          <Settings size={20} />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;