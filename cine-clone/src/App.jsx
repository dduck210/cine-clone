import React from "react";
import { Routes, Route } from "react-router-dom";

// Các trang hiện có
import HomePage from "./pages/Home/HomePage";
import MovieDetailPage from "./pages/Movie/MovieDetailPage";
import BookingPage from "./pages/Booking/BookingPage";
import PaymentPage from "./pages/Payment/PaymentPage";
import PaymentSuccessPage from "./pages/Payment/PaymentSuccessPage";
import MyTicketsPage from "./pages/Ticket/MyTicketsPage";
import Dashboard from "./pages/Admin/Dashboard";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ProfilePage from "./pages/Profile/ProfilePage";

// --- IMPORT CÁC TRANG MỚI ---
// Lưu ý: Đảm bảo bạn đã tạo file đúng vị trí trong thư mục src/pages/
import MoviesPage from "./pages/MoviesPage";
import CinemasPage from "./pages/CinemasPage";
import PromotionsPage from "./pages/PromotionsPage";

function App() {
  return (
    <>
      <Routes>
        {/* Route trang chủ */}
        <Route path="/" element={<HomePage />} />

        {/* Route danh sách phim & chi tiết */}
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />

        {/* Route rạp chiếu */}
        <Route path="/cinemas" element={<CinemasPage />} />

        {/* Route khuyến mãi */}
        <Route path="/promotions" element={<PromotionsPage />} />

        {/* Các route chức năng khác */}
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Route Auth & Admin */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
