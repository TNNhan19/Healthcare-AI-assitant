// Lấy domain backend từ biến môi trường
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Lưu lại fetch gốc của trình duyệt
const originalFetch = window.fetch;

// Ghi đè fetch
window.fetch = async (input, init = {}) => {
  let url = input;

  // Nếu path không phải URL đầy đủ, nối BASE_URL
  if (typeof input === 'string' && !/^https?:\/\//.test(input)) {
    url = BASE_URL + input;
  }

  // Gọi fetch gốc với options mặc định + ghi đè nếu cần
  return originalFetch(url, {
    ...init,
    credentials: init.credentials || 'include', // tự động gửi cookie
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
};
