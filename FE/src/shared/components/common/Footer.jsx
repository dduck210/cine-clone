import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => (
  <footer className="bg-white dark:bg-gray-900 pt-8 pb-8 font-bromega font-normal border-t border-gray-100 dark:border-gray-800">
    <div className="container mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div>
          <Link to="/" className="flex items-center gap-2 group mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-ticket transform group-hover:-rotate-12 transition-transform duration-300"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
              <path d="M13 5v2"></path>
              <path d="M13 17v2"></path>
              <path d="M13 11v2"></path>
            </svg>
            <span className="text-2xl font-black text-[#dc2626] tracking-tight">
              5Cine
            </span>
          </Link>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Điểm đến cuối cùng của tín đồ điện ảnh.
          </p>
        </div>

        <div>
          <h4 className="text-gray-800 dark:text-gray-200 mb-4 text-base uppercase tracking-wide">
            Về 5Cine
          </h4>
          <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
            <li><Link to="/about" className="hover:text-red-600 transition-colors">Câu chuyện thương hiệu</Link></li>
            <li><Link to="/careers" className="hover:text-red-600 transition-colors">Tuyển dụng</Link></li>
            <li><Link to="/contact" className="hover:text-red-600 transition-colors">Liên hệ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-800 dark:text-gray-200 mb-4 text-base uppercase tracking-wide">
            Hỗ trợ
          </h4>
          <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
            <li><Link to="/faq" className="hover:text-red-600 transition-colors">Hỏi đáp thường gặp</Link></li>
            <li><Link to="/help" className="hover:text-red-600 transition-colors">Trung tâm trợ giúp</Link></li>
            <li><Link to="/terms" className="hover:text-red-600 transition-colors">Điều khoản sử dụng</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gray-800 dark:text-gray-200 mb-4 text-base uppercase tracking-wide">
            Pháp lý
          </h4>
          <ul className="space-y-2 text-gray-500 dark:text-gray-400 text-sm">
            <li><Link to="/privacy" className="hover:text-red-600 transition-colors">Chính sách bảo mật</Link></li>
            <li><Link to="/cookies" className="hover:text-red-600 transition-colors">Chính sách Cookie</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 dark:text-gray-500">
        <p>© 2026 5Cine. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="https://facebook.com" target="_blank" rel="noreferrer">
            <Facebook size={20} className="hover:text-red-600 cursor-pointer transition-colors" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer">
            <Twitter size={20} className="hover:text-red-600 cursor-pointer transition-colors" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            <Instagram size={20} className="hover:text-red-600 cursor-pointer transition-colors" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
