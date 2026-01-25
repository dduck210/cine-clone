import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Ticket } from 'lucide-react';

const Navbar = () => (
  <nav className="bg-white py-4 px-6 shadow-sm sticky top-0 z-50">
    <div className="container mx-auto flex items-center justify-between">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-2xl hover:opacity-80 transition-opacity">
          <Ticket size={32} />
          <span>5Cine</span>
        </Link>

        {/* Menu chính (Đã xóa Admin Link) */}
        <div className="hidden md:flex gap-6 text-gray-600 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link to="/?tab=now" className="hover:text-blue-600 transition-colors">Movies</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search movies..." 
            className="border border-gray-300 rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:border-blue-500 transition-all"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        {/* Nút Login */}
        <Link to="/login" className="text-gray-600 font-medium hover:text-blue-600 transition-colors">
          Login
        </Link>
      </div>
    </div>
  </nav>
);

export default Navbar;