export const stats = [
    { label: "Tổng Doanh thu", value: "1.175.000.000 VND", sub: "Tăng 15% so với tháng trước", icon: "DollarSign" },
    { label: "Số vé đã bán", value: "15.890", sub: "Tăng 10% so với tháng trước", icon: "Ticket" },
    { label: "Thời lượng chiếu", value: "1.250 giờ", sub: "Giảm 2% so với tháng trước", icon: "Clock" },
];
  
export const moviesList = [
    { 
        id: "mov001", 
        title: "Cuộc Phiêu Lưu Vĩ Đại", 
        genre: "Hành động, Phiêu lưu", 
        duration: "120 phút", 
        status: "Đang chiếu",
        poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300"
    },
    { 
        id: "mov002", 
        title: "Bí Mật Rừng Sâu", 
        genre: "Kinh dị, Bí ẩn", 
        duration: "105 phút", 
        status: "Sắp chiếu",
        poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=300"
    },
    { 
        id: "mov003", 
        title: "Tình Yêu Không Hồi Kết", 
        genre: "Lãng mạn, Drama", 
        duration: "135 phút", 
        status: "Đang chiếu",
        poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300"
    },
    { 
        id: "mov004", 
        title: "Kẻ Săn Đêm (Night Stalker)", 
        genre: "Hành động, Tội phạm", 
        duration: "90 phút", 
        status: "Sắp chiếu",
        poster: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=300"
    },
    { 
        id: "mov005", 
        title: "Vũ Trụ Song Song", 
        genre: "Khoa học viễn tưởng", 
        duration: "150 phút", 
        status: "Đang chiếu",
        poster: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=300"
    },
];

export const schedulesList = [
    { id: "sch001", movie: "Cuộc Phiêu Lưu Vĩ Đại", date: "20/07/2024", time: "19:00", room: "Phòng 1", price: "80.000 VND" },
    { id: "sch002", movie: "Tình Yêu Không Hồi Kết", date: "20/07/2024", time: "20:30", room: "Phòng 2", price: "85.000 VND" },
    { id: "sch003", movie: "Vũ Trụ Song Song", date: "21/07/2024", time: "18:00", room: "Phòng 3", price: "90.000 VND" },
];
  
export const ordersList = [
    { id: "ord001", user: "Nguyễn Văn A", movie: "Cuộc Phiêu Lưu Vĩ Đại", time: "20/07/2024 19:00", total: "240.000 VND", status: "Đã thanh toán" },
    { id: "ord002", user: "Trần Thị B", movie: "Tình Yêu Không Hồi Kết", time: "20/07/2024 20:30", total: "170.000 VND", status: "Đã thanh toán" },
    { id: "ord003", user: "Lê Văn C", movie: "Vũ Trụ Song Song", time: "21/07/2024 18:00", total: "360.000 VND", status: "Chưa thanh toán" },
    { id: "ord004", user: "Phạm Thị D", movie: "Bí Mật Rừng Sâu", time: "22/07/2024 10:00", total: "150.000 VND", status: "Đã thanh toán" },
];