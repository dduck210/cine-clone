import React from 'react';
import { Link } from 'react-router-dom'; // <--- 1. Import Link
import { Ticket, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => (
  <footer className="bg-white pt-16 pb-8 border-t border-gray-200 mt-16">
    <div className="container mx-auto px-6">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Cột 1: Logo & Slogan */}
        <div>
          {/* Dùng Link ở Logo để bấm vào là về Trang chủ ngay */}
          <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-2xl mb-4 hover:opacity-80 transition-opacity">
            <Ticket size={32} />
            <span>5Cine</span>
          </Link>
          <p className="text-gray-500 text-sm">Điểm đến cuối cùng của tín đồ điện ảnh.</p>
        </div>
        
        {/* Cột 2: About Us */}
        <div>
          <h4 className="font-bold text-gray-800 mb-4">Về 5Cine</h4>
          <ul className="space-y-2 text-gray-500 text-sm">
            {/* Thay a href bằng Link to */}
            <li><Link to="/about" className="hover:text-blue-600 transition-colors">Câu chuyện thương hiệu</Link></li>
            <li><Link to="/careers" className="hover:text-blue-600 transition-colors">Tuyển dụng</Link></li>
            <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Liên hệ</Link></li>
          </ul>
        </div>

        {/* Cột 3: Support */}
        <div>
          <h4 className="font-bold text-gray-800 mb-4">Hỗ trợ</h4>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li><Link to="/faq" className="hover:text-blue-600 transition-colors">Hỏi đáp thường gặp</Link></li>
            <li><Link to="/help" className="hover:text-blue-600 transition-colors">Trung tâm trợ giúp</Link></li>
            <li><Link to="/terms" className="hover:text-blue-600 transition-colors">Điều khoản sử dụng</Link></li>
          </ul>
        </div>

        {/* Cột 4: Legal */}
        <div>
          <h4 className="font-bold text-gray-800 mb-4">Pháp lý</h4>
          <ul className="space-y-2 text-gray-500 text-sm">
            <li><Link to="/privacy" className="hover:text-blue-600 transition-colors">Chính sách bảo mật</Link></li>
            <li><Link to="/cookies" className="hover:text-blue-600 transition-colors">Chính sách Cookie</Link></li>
          </ul>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
        <p>© 2026 5Cine. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          {/* Mạng xã hội thì vẫn dùng thẻ a vì nó link ra ngoài trang web */}
          <a href="https://facebook.com" target="_blank" rel="noreferrer"><Facebook size={20} className="hover:text-blue-600 cursor-pointer transition-colors" /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer"><Twitter size={20} className="hover:text-blue-600 cursor-pointer transition-colors" /></a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={20} className="hover:text-blue-600 cursor-pointer transition-colors" /></a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;