import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, Menu, X, ChevronDown, LayoutDashboard, Ticket, Search, Sun, Moon } from "lucide-react";
import axiosInstance from "../../api/axiosConfig";
import { useTheme } from "../../context/theme-context";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const searchRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axiosInstance.get("/auth/profile").then((res) => {
      const fresh = res.data;
      setCurrentUser(fresh);
      localStorage.setItem("currentUser", JSON.stringify(fresh));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    toast.success("Đăng xuất thành công!", { duration: 2000 });
    setTimeout(() => {
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      navigate("/");
    }, 800);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQ.trim()) return;
    setSearchOpen(false);
    setSearchQ("");
    navigate(`/movies?q=${encodeURIComponent(searchQ.trim())}`);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const navLinks = [
    { name: "Trang chủ", path: "/" },
    { name: "Phim", path: "/movies" },
    { name: "Rạp chiếu", path: "/cinemas" },
    { name: "Khuyến mãi", path: "/promotions" },
  ];

  return (
    <>
      <nav className="font-bromega bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 fixed top-0 left-0 w-full z-[100] shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-2">
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <button
            onClick={() => navigate("/", { state: { splashTs: Date.now() } })}
            className="flex items-center gap-2 group transition-transform active:scale-95"
          >
            <div className="text-[#dc2626]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="md:w-10 md:h-10 transform group-hover:-rotate-12 transition-transform duration-300"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" />
                <path d="M13 17v2" />
                <path d="M13 11v2" />
              </svg>
            </div>
            <span className="text-xl md:text-2xl font-black text-[#dc2626] tracking-tight leading-none pt-1">
              5Cine
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-600 dark:text-gray-300 font-bold hover:text-[#dc2626] dark:hover:text-[#dc2626] transition-colors text-sm lg:text-base"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Search bar — desktop */}
          <div className="hidden md:flex items-center">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                <input
                  ref={searchRef}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Tìm phim, diễn viên, đạo diễn..."
                  className="w-56 lg:w-72 px-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                />
                <button type="submit" className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Search size={18} />
                </button>
                <button type="button" onClick={() => setSearchOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={openSearch} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Tìm kiếm phim">
                <Search size={20} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-800 transition-all"
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 hover:opacity-80 active:scale-95 transition-all duration-200"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#dc2626] shadow-md ring-2 ring-white dark:ring-gray-900">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm leading-none select-none">
                        {currentUser.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-none mb-0.5">Xin chào</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-none max-w-[90px] truncate">
                      {currentUser.name}
                    </p>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`hidden lg:block text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-100 dark:border-gray-700 overflow-hidden z-50" style={{width:"232px"}}>
                    <div className="bg-slate-900 dark:bg-gray-950 px-4 py-3.5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#dc2626] flex items-center justify-center flex-shrink-0 ring-2 ring-red-500/30 overflow-hidden">
                        {currentUser.avatar
                          ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                          : <span className="text-white font-black text-sm select-none">{currentUser.name?.charAt(0).toUpperCase() || "U"}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm truncate leading-tight">{currentUser.name}</p>
                        <p className="text-slate-400 text-[11px] truncate mt-0.5">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="p-2 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-gray-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-[#dc2626] transition-colors group"
                      >
                        <User size={15} className="text-slate-400 dark:text-gray-500 group-hover:text-[#dc2626] transition-colors flex-shrink-0" />
                        Tài khoản
                      </Link>
                      <Link
                        to="/my-tickets"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-gray-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-[#dc2626] transition-colors group"
                      >
                        <Ticket size={15} className="text-slate-400 dark:text-gray-500 group-hover:text-[#dc2626] transition-colors flex-shrink-0" />
                        Vé của tôi
                      </Link>
                      {currentUser.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-gray-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-[#dc2626] transition-colors group"
                        >
                          <LayoutDashboard size={15} className="text-slate-400 dark:text-gray-500 group-hover:text-[#dc2626] transition-colors flex-shrink-0" />
                          Quản trị
                        </Link>
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-gray-700">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={15} className="flex-shrink-0" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold hover:text-[#dc2626] p-2 rounded-lg transition-all active:scale-95"
              >
                <User size={22} />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>

        {/* MENU MOBILE EXPAND */}
        <div
          className={`md:hidden bg-white dark:bg-gray-900 border-t border-gray-50 dark:border-gray-800 transition-all duration-300 ease-in-out overflow-hidden ${
            isMobileMenuOpen ? "max-h-[400px] border-b shadow-lg" : "max-h-0"
          }`}
        >
          <div className="p-4 space-y-2">
            <form onSubmit={(e) => { setIsMobileMenuOpen(false); handleSearchSubmit(e); }} className="flex gap-2 mb-3">
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm phim, diễn viên..."
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button type="submit" className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">
                <Search size={16} />
              </button>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 dark:text-gray-300 font-bold hover:bg-red-50 dark:hover:bg-gray-800 hover:text-[#dc2626] rounded-xl transition-all"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {(isDropdownOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/5 md:bg-transparent"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsMobileMenuOpen(false);
          }}
        ></div>
      )}

      {/* Logout Confirm Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-sm">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 mx-auto mb-4">
              <LogOut size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 text-center mb-1">Đăng xuất?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Bạn có chắc muốn đăng xuất khỏi tài khoản không?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-[#dc2626] text-white font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
