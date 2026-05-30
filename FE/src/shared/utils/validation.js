export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (v) => {
  if (!v?.trim()) return "Email không được để trống";
  if (!EMAIL_RE.test(v)) return "Email không đúng định dạng";
  return "";
};

export const validatePassword = (v) => {
  if (!v) return "Mật khẩu không được để trống";
  if (v.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
  return "";
};

export const validatePhone = (v) => {
  if (!v) return "";
  if (!/^[0-9]{10,11}$/.test(v)) return "Số điện thoại không hợp lệ (10-11 số)";
  return "";
};

export const validateRequired = (label) => (v) => {
  if (!v?.toString().trim()) return `${label} không được để trống`;
  return "";
};
