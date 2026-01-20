<p align="center">
  <img src="https://vitejs.dev/logo.svg" width="100" alt="Vite Logo" />
</p>

# Smart Restaurant Admin - Frontend

Giao diện quản trị cho hệ thống nhà hàng thông minh, xây dựng với React và Vite.

## 🚀 Công nghệ sử dụng

- **React 19.2.0** - UI Library
- **Vite 7.2.4** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS 4.1.18** - Styling
- **React Router 7.11.0** - Routing
- **Axios** - HTTP client
- **React Query (TanStack Query)** - Data fetching
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Lucide React** - Icons
- **React QR Code** - QR display

## 📋 Yêu cầu cài đặt

- Node.js >= 18.x
- npm hoặc yarn
- Backend đã chạy tại `http://localhost:3000`

## ⚙️ Cài đặt

### 1. Vào thư mục frontend:

```bash
cd web-smart-restaurant-admin-fe
```

### 2. Cài đặt dependencies:

```bash
npm install
```

### 3. Cấu hình API URL (optional):

Mặc định frontend gọi API tại `http://localhost:3000/api/admin`

Nếu muốn đổi, sửa file `src/api/axios.ts`:

```typescript
const api = axios.create({
   baseURL: "http://localhost:3000/api/admin", // Đổi URL tại đây
   withCredentials: true,
});
```

## 🏃 Chạy ứng dụng

### Development mode:

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:5173`

### Build production:

```bash
npm run build
```

### Preview production build:

```bash
npm run preview
```

## 🔑 Đăng nhập

Sau khi đăng ký admin ở backend, đăng nhập với:

- **URL**: `http://localhost:5173/login`
- **Username**: `admin` (hoặc username bạn đã tạo)
- **Password**: `admin123` (hoặc password bạn đã đặt)

## 📱 Chức năng chính

### 1. Quản lý bàn

- ➕ Tạo bàn mới (table number, capacity, location)
- 📋 Xem danh sách bàn dạng lưới
- ✏️ Chỉnh sửa thông tin bàn
- 🔄 Đổi trạng thái Active/Inactive
- 🗑️ Vô hiệu hóa bàn (soft delete)

### 2. Quản lý QR Code

- 🎯 Tạo QR code cho từng bàn
- 👁️ Xem preview QR code
- 📥 Tải QR code dạng PNG hoặc PDF
- 📦 Tải tất cả QR code (ZIP file)
- 🔄 Regenerate QR code (từng bàn hoặc tất cả)

### 3. Các tính năng khác

- 🔐 Đăng nhập/Đăng xuất
- 🔄 Auto refresh token khi hết hạn
- 📊 Thống kê tổng quan (Total tables, Active tables)
- 🔍 Filter và search bàn

## 🗂️ Cấu trúc thư mục

```
src/
├── api/              # Gọi API backend, chia theo vai trò (admin, customer, staff)
│   ├── admin/        # API cho admin (auth, accounts, tables, menu, orders...)
│   ├── customer/     # API cho khách hàng
│   ├── staff/        # API cho nhân viên
│   ├── axios.ts      # Cấu hình axios, interceptors, baseURL
│   └── staffAxios.ts # Axios riêng cho staff
├── components/       # Các component UI dùng lại nhiều nơi (modal, sidebar, form, table...)
│   ├── tables/       # Component liên quan đến quản lý bàn
│   ├── menu/         # Component liên quan đến thực đơn
│   ├── customer/     # Component cho giao diện khách
│   └── ...
├── layouts/          # Layout tổng thể cho từng vai trò (Admin, Customer, Staff)
│   ├── AdminLayout.tsx
│   ├── CustomerLayout.tsx
│   └── StaffLayout.tsx
├── pages/            # Các trang chính, chia theo vai trò
│   ├── admin/        # Trang quản trị: Dashboard, Login, Accounts, Menu, Orders, Reports, Table...
│   ├── customer/     # Trang khách: Menu, Đặt món, Đăng nhập, Đăng ký, Lịch sử...
│   └── staff/        # Trang nhân viên: KDS, Waiter, Monitor...
├── routes/           # Định tuyến, bảo vệ route
│   ├── AppRoutes.tsx
│   └── ProtectedRoute.tsx
├── types/            # Định nghĩa TypeScript types cho menu, bàn, QR, v.v.
├── utils/            # Hàm tiện ích (format tiền, xử lý file, ...)
├── ws/               # Kết nối websocket (staffSocket...)
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

**Mô tả ngắn:**

- `api/`: Chứa các hàm gọi API backend, chia theo vai trò (admin, customer, staff).
- `components/`: Các thành phần UI dùng lại nhiều nơi (modal, sidebar, form, table, QR, ...).
- `layouts/`: Layout tổng thể cho từng vai trò (admin, khách, nhân viên).
- `pages/`: Các trang chính, chia theo vai trò (admin, customer, staff).
- `routes/`: Định tuyến, bảo vệ route, phân quyền.
- `types/`: Định nghĩa kiểu dữ liệu TypeScript cho toàn app.
- `utils/`: Hàm tiện ích dùng chung.
- `ws/`: Kết nối websocket cho real-time (KDS, waiter, ...).
- `App.tsx`, `main.tsx`: Điểm khởi tạo ứng dụng.

## 🎨 Giao diện

### Trang chính và chức năng

- **Login Page**: Đăng nhập với validation, lưu token, tự động chuyển trang sau khi đăng nhập thành công.
- **Dashboard/Tables Page**: Hiển thị danh sách bàn dạng lưới, thống kê tổng số bàn, bàn đang hoạt động, thao tác thêm/sửa/xóa bàn, tải/regen QR code.
- **Menu Management**: Quản lý thực đơn, danh mục, món ăn, thêm/sửa/xóa món, upload ảnh món, gán modifiers.
- **Orders Management**: Quản lý đơn hàng, xem chi tiết đơn, cập nhật trạng thái, lọc/sắp xếp đơn hàng.
- **Reports Page**: Xem báo cáo doanh thu, món bán chạy, xuất file CSV/PDF.
- **Accounts Management**: Quản lý tài khoản admin, nhân viên, tạo/sửa/vô hiệu hóa tài khoản.
- **QR Code Modal**: Xem trước QR code, tải PNG/PDF, copy token, hiển thị thông tin bàn.
- **KDS (Kitchen Display System)**: Giao diện cho bếp xem đơn hàng mới, cập nhật trạng thái món.
- **Waiter Monitor**: Giao diện cho nhân viên phục vụ theo dõi, nhận đơn, cập nhật trạng thái phục vụ.
- **Customer Pages**: Giao diện cho khách đặt món, xem menu, giỏ hàng, lịch sử, đánh giá món ăn.

## 🔐 Authentication Flow

1. User đăng nhập → Nhận access token + refresh token (httpOnly cookie)
2. Access token lưu trong localStorage
3. Mọi request đều gửi kèm Bearer token
4. Khi access token hết hạn (401) → Tự động gọi refresh endpoint
5. Nhận access token mới → Retry request failed
6. Nếu refresh fail → Redirect về login

## 📝 Ghi chú

## ⚙️ Hướng dẫn cấu hình file .env cho frontend

Tạo file `.env` trong thư mục `web-SmartRestaurantAdmin_FE` với nội dung mẫu:

```env
# Địa chỉ backend API cho admin
VITE_ADMIN_API_URL=http://localhost:3000
# Địa chỉ backend API cho app khách
VITE_APP_API_URL=http://localhost:3001
# Địa chỉ websocket cho staff (nếu có)
VITE_STAFF_WS_URL=http://localhost:3001/ws
```

Sau khi sửa file .env, cần khởi động lại frontend để nhận cấu hình mới.

- **Auto-refresh**: Token tự động refresh khi hết hạn
- **Protected Routes**: Các route yêu cầu đăng nhập được bảo vệ
- **Responsive**: Giao diện responsive cho mobile/tablet
- **TypeScript**: Full type safety với TypeScript

## 🐛 Troubleshooting

### Backend không kết nối được:

```
Network Error / CORS Error
```

**Giải pháp**:

- Kiểm tra backend đã chạy chưa (port 3000)
- Kiểm tra CORS đã bật trong backend
- Kiểm tra `baseURL` trong `src/api/axios.ts`

### Lỗi 401 Unauthorized:

**Giải pháp**:

- Clear localStorage: `localStorage.clear()`
- Đăng nhập lại
- Kiểm tra token expiration trong backend

### Không tải được dependencies:

```
npm install error
```

**Giải pháp**:

```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 đã được sử dụng:

**Giải pháp**: Vite tự động chọn port khác (5174, 5175...) hoặc đổi trong `vite.config.ts`

## 🚀 Deploy (Optional)

### Deploy lên Vercel:

```bash
npm run build
# Upload dist folder lên Vercel
```

Nhớ cập nhật `baseURL` trong `axios.ts` thành URL backend production.
