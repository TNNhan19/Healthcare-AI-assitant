# Chức năng Đăng ký và Đăng nhập - HealthCare Frontend

## Tổng quan

Đã thêm chức năng đăng ký và đăng nhập hoàn chỉnh cho trang web HealthCare với các tính năng:

- ✅ Đăng ký tài khoản mới
- ✅ Đăng nhập với email và mật khẩu
- ✅ Quản lý trạng thái đăng nhập với Context API
- ✅ Bảo vệ các trang cần đăng nhập
- ✅ Menu người dùng với avatar và dropdown
- ✅ Lưu trữ token và thông tin người dùng trong localStorage
- ✅ Validation form đầy đủ
- ✅ UI/UX hiện đại và responsive

## Cấu trúc Files

```
src/
├── context/
│   └── AuthContext.tsx          # Context quản lý authentication
├── components/
│   ├── Header.tsx               # Header với menu người dùng
│   └── ProtectedRoute.tsx       # Component bảo vệ routes
├── pages/
│   ├── LoginPage.tsx            # Trang đăng nhập
│   ├── RegisterPage.tsx         # Trang đăng ký
│   └── AccountPage.tsx          # Trang tài khoản (đã cập nhật)
└── App.tsx                      # App chính với routes
```

## Tính năng chính

### 1. AuthContext
- Quản lý trạng thái đăng nhập toàn cục
- Lưu trữ thông tin người dùng
- Cung cấp các hàm: login, register, logout, updateUser
- Tự động kiểm tra token khi khởi động app

### 2. Trang Đăng nhập (/login)
- Form đăng nhập với validation
- Hiển thị/ẩn mật khẩu
- Remember me checkbox
- Link đến trang đăng ký
- Social login buttons (Google, Facebook)
- Loading state và error handling

### 3. Trang Đăng ký (/register)
- Form đăng ký với validation đầy đủ
- Validation email, password strength
- Confirm password
- Terms and conditions checkbox
- Social signup options

### 4. Header với Menu Người dùng
- Hiển thị avatar với chữ cái đầu của tên
- Dropdown menu với các tùy chọn
- Nút đăng nhập/đăng ký khi chưa đăng nhập
- Tự động đóng menu khi click ra ngoài

### 5. ProtectedRoute
- Bảo vệ các trang cần đăng nhập
- Tự động redirect đến trang đăng nhập
- Loading state trong khi kiểm tra authentication

## API Endpoints

Chức năng hiện tại sử dụng các endpoint sau (cần implement ở backend):

```javascript
// Đăng nhập
POST /api/auth/login
Body: { email, password }

// Đăng ký
POST /api/auth/register
Body: { firstName, lastName, email, password, phone? }

// Response format
{
  token: "jwt_token_here",
  user: {
    id: "user_id",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890"
  }
}
```

## Cách sử dụng

### 1. Khởi chạy ứng dụng
```bash
npm run dev
```

### 2. Truy cập các trang
- Trang chủ: `http://localhost:5173/`
- Đăng nhập: `http://localhost:5173/login`
- Đăng ký: `http://localhost:5173/register`
- Tài khoản: `http://localhost:5173/account` (cần đăng nhập)

### 3. Test chức năng
1. Truy cập `/register` để tạo tài khoản mới
2. Đăng nhập với tài khoản vừa tạo
3. Kiểm tra menu người dùng trong header
4. Truy cập `/account` để xem thông tin tài khoản
5. Test logout và kiểm tra redirect

## Tùy chỉnh

### Thay đổi API endpoints
Chỉnh sửa trong `AuthContext.tsx`:
```javascript
const response = await fetch('YOUR_API_URL/api/auth/login', {
  // ...
});
```

### Thay đổi validation rules
Chỉnh sửa trong `RegisterPage.tsx`:
```javascript
const validateForm = () => {
  // Thêm/sửa các rules validation
};
```

### Thay đổi UI/UX
- Sử dụng Tailwind CSS classes
- Icons từ Lucide React
- Responsive design đã được implement

## Lưu ý

1. **Backend Required**: Cần implement backend API để chức năng hoạt động đầy đủ
2. **Security**: Token được lưu trong localStorage, có thể cân nhắc sử dụng httpOnly cookies
3. **Error Handling**: Đã implement basic error handling, có thể mở rộng thêm
4. **Social Login**: UI đã sẵn sàng, cần implement logic backend

## Troubleshooting

### Lỗi thường gặp
1. **CORS Error**: Đảm bảo backend cho phép CORS từ frontend
2. **API không hoạt động**: Kiểm tra endpoint và response format
3. **Token không lưu**: Kiểm tra localStorage trong DevTools

### Debug
```javascript
// Kiểm tra trạng thái authentication
console.log(localStorage.getItem('token'));
console.log(localStorage.getItem('user'));

// Kiểm tra AuthContext
const { user, isAuthenticated } = useAuth();
console.log({ user, isAuthenticated });
``` 