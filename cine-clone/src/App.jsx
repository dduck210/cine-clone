import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import Dashboard from './pages/Admin/Dashboard';
import MovieDetailPage from './pages/Movie/MovieDetailPage'; 

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:id" element={<MovieDetailPage />} /> 
      <Route path="/admin" element={<Dashboard />} />
    </Routes>
  );
}

export default App;