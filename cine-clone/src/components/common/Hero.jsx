// --- Component: Hero Banner ---
const Hero = () => (
  <div className="relative w-full h-[400px] md:h-[500px] bg-gradient-to-r from-red-400 via-orange-300 to-yellow-200 overflow-hidden">
    {/* Decor elements to simulate the banner style */}
    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    
    <div className="container mx-auto h-full flex items-center px-6 relative z-10">
      <div className="max-w-2xl text-white drop-shadow-lg">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
          Ưu Đãi Đặc Biệt Cho Ngày Tình Yêu
        </h1>
        <p className="text-xl mb-8 opacity-90">Giảm giá lớn khi đặt vé đôi. Không thể bỏ lỡ!</p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow-lg transition transform hover:scale-105">
          KHÁM PHÁ NGAY
        </button>
      </div>
    </div>

    {/* Dots indicators */}
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
      <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
      <div className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></div>
    </div>
  </div>
);

export default Hero