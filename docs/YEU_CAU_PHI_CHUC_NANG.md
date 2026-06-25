# Yêu cầu phi chức năng - Le Monde Steak

## 1. Hiệu năng

- Trang khách hàng, nhân viên và quản trị sử dụng Next.js production build, nén nội dung và cache dữ liệu ít thay đổi.
- API thực đơn được cache 60 giây; danh sách bàn công khai được cache 30 giây.
- Các request GET trùng nhau được dùng chung, tránh gửi nhiều request đồng thời.
- Polling của màn hình nhân viên không chạy khi tab trình duyệt bị ẩn và không tạo request mới khi request trước chưa hoàn thành.
- API đơn hàng, hóa đơn và báo cáo chỉ truy vấn các trường cần hiển thị, không trả về dữ liệu ảnh không cần thiết.
- Mọi request từ frontend có timeout 10 giây và hiển thị thông báo thân thiện khi hệ thống phản hồi quá lâu.

Mục tiêu nghiệm thu:

- Tải trang không quá 3 giây trong điều kiện mạng ổn định, sau lần cold start đầu tiên.
- Thao tác giao diện cục bộ như tìm kiếm, mở chi tiết món và thêm vào giỏ phản hồi ngay.
- API thông thường hướng tới thời gian phản hồi dưới 1 giây; thao tác ghi dữ liệu không quá 2 giây trong điều kiện database ổn định.

## 2. Bảo mật

- Mật khẩu được băm bằng bcrypt trước khi lưu.
- API sử dụng JWT và phân quyền CUSTOMER, STAFF, ADMIN.
- Prisma thực hiện truy vấn có tham số, hạn chế SQL Injection.
- React tự động escape nội dung hiển thị; dữ liệu in hóa đơn được escape trước khi tạo HTML.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.
- Rate limit:
  - Đăng nhập/đăng ký: tối đa 10 request/phút/IP/endpoint.
  - API đọc: tối đa 300 request/phút/IP/endpoint.
  - API ghi: tối đa 120 request/phút/IP/endpoint.
- Request thay đổi dữ liệu được ghi log dạng `AUDIT` trên Vercel Logs và có `X-Request-Id`.
- Toàn bộ môi trường production sử dụng HTTPS do Vercel cung cấp.
- API sử dụng Bearer token, không dùng cookie xác thực tự động nên giảm nguy cơ CSRF.

## 3. Tính sẵn sàng và ổn định

- Endpoint giám sát: `GET /api/health`.
- Health check kiểm tra cả backend và kết nối database, trả HTTP 503 nếu database không sẵn sàng.
- Mỗi frontend có error boundary, cho phép thử lại và điều hướng về màn hình an toàn.
- Các lỗi API được xử lý bằng thông báo thân thiện, không hiển thị stack trace hoặc thông tin bí mật.

Cấu hình vận hành:

- Dùng UptimeRobot hoặc Better Stack gọi `/api/health` mỗi 5 phút.
- Bật cảnh báo Vercel khi deployment/function có lỗi.
- Mục tiêu uptime: tối thiểu 99%, không tính thời gian bảo trì có thông báo.
- Mục tiêu khôi phục dịch vụ: không quá 15 phút.

## 4. Sao lưu và khôi phục dữ liệu

Phần này phải cấu hình trên Supabase:

1. Vào `Project Settings > Database > Backups`.
2. Bật backup tự động hằng ngày nếu gói Supabase hỗ trợ.
3. Giữ tối thiểu 7 bản backup gần nhất.
4. Trước thay đổi database quan trọng, xuất thêm file SQL thủ công.
5. Mỗi tháng thử khôi phục trên project thử nghiệm để xác minh bản backup sử dụng được.

Các thao tác đặt món và thanh toán dùng transaction Prisma để tránh ghi dữ liệu dở dang.

## 5. Tương thích

- Giao diện responsive cho điện thoại, máy tính bảng và desktop.
- Hỗ trợ các phiên bản hiện hành của Chrome, Edge, Safari và Firefox.
- QR sử dụng chuẩn phổ biến và chứa URL HTTPS sau khi deploy.
- Ảnh hỗ trợ PNG, JPG/JPEG và URL Cloudinary.

## 6. Khả dụng và trải nghiệm người dùng

- Customer web-app được thiết kế mobile-first cho khách quét QR tại bàn.
- Các thao tác có trạng thái loading, disabled và thông báo thành công/thất bại.
- Thanh điều hướng cố định, nút giỏ hàng và các modal có kích thước ổn định trên màn hình nhỏ.
- Người dùng có thể xem menu và thêm món ngay cả khi chưa đăng nhập; đặt món yêu cầu QR bàn hợp lệ.

## 7. Bảo trì

- Monorepo tách riêng `backend`, `customer-app`, `staff-app`, `admin-app`.
- Chức năng được chia theo route, component, store và thư viện dùng chung trong từng ứng dụng.
- Mỗi request API có mã `X-Request-Id`; thao tác ghi có log `AUDIT` để tra cứu trên Vercel.
- GitHub lưu lịch sử thay đổi, Vercel tự động build/deploy theo commit trên nhánh `main`.
