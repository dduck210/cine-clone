export const MOVIE_STATUS = {
  now_showing: { label: "Đang chiếu", variant: "success" },
  coming_soon: { label: "Sắp chiếu", variant: "warning" },
  stopped:     { label: "Ngừng chiếu", variant: "neutral" },
};

export const ORDER_STATUS = {
  pending:   { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "success" },
  cancelled: { label: "Đã hủy",      variant: "danger" },
  refunded:  { label: "Hoàn tiền",   variant: "info" },
};

export const ROOM_STATUS = {
  active:   { label: "Hoạt động", variant: "success" },
  incident: { label: "Bảo trì",   variant: "warning" },
};

export const VOUCHER_STATUS = {
  active:   { label: "Đang hoạt động",  variant: "success" },
  inactive: { label: "Không hoạt động", variant: "neutral" },
  expired:  { label: "Hết hạn",         variant: "danger" },
};
