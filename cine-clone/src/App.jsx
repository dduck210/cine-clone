import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import Dashboard from './pages/Admin/Dashboard';
// 👇 Kiểm tra kỹ dòng import này, đảm bảo file MovieDetailPage.jsx nằm đúng thư mục này
import MovieDetailPage from './pages/Movie/MovieDetailPage'; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* 👇 Kiểm tra kỹ dòng này đã có chưa */}
      <Route path="/movie/:id" element={<MovieDetailPage />} /> 
      <Route path="/admin" element={<Dashboard />} />
    </Routes>
  );
}

export default App;