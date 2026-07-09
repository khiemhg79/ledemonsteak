# TongKet - Tài liệu tổng kết project Le Monde Steak

Tài liệu này được viết sau khi đọc source code trong toàn bộ workspace `ledemonsteak`, gồm `backend`, `customer-app`, `staff-app`, `admin-app`, `docs`, các file cấu hình, Prisma schema, seed và các script SQL. Nội dung bên dưới chỉ dựa trên code hiện có trong project; các phần không thấy trong source sẽ được ghi rõ là chưa có hoặc không được frontend sử dụng.

Lưu ý quan trọng:

- Tên file đầu ra theo yêu cầu cuối cùng là `TongKet.md`.
- Project không phải một app đơn lẻ mà là một hệ thống gồm 4 Next.js project chạy riêng: backend API, customer app, staff app, admin app.
- Các thư mục sinh ra khi build/cài đặt như `node_modules/` và `.next/` có mặt trong project nhưng không phải business source chính.

---

## 1. Tổng quan project

### Project này dùng để làm gì?

Project này là hệ thống quản lý gọi món cho nhà hàng steak mang tên Le Monde Steak. Hệ thống cho phép khách hàng quét QR tại bàn để xem menu, thêm món vào giỏ, đặt món, áp mã khuyến mãi và yêu cầu thanh toán. Nhân viên có app riêng để quản lý bàn, tạo QR bàn trống, theo dõi đơn, cập nhật trạng thái từng món và hoàn tất thanh toán. Admin có app riêng để quản lý menu, combo, danh mục, bàn, người dùng, khuyến mãi và xem báo cáo doanh thu.

Nói ngắn gọn, đây là một hệ thống POS/QR ordering nội bộ cho nhà hàng.

### Bài toán thực tế project giải quyết

Trước khi có hệ thống này, nhà hàng thường gặp các vấn đề:

- Khách phải chờ nhân viên đưa menu giấy.
- Nhân viên phải ghi món thủ công, dễ sai hoặc chậm.
- Nhà bếp/nhân viên phục vụ khó theo dõi món nào đang chờ, đang chuẩn bị, đã xong, đã phục vụ.
- Việc tạo hóa đơn và đổi trạng thái bàn dễ bị lệch dữ liệu.
- Admin khó quản lý menu, combo, voucher, bàn và báo cáo doanh thu tập trung.

Project giải quyết bằng cách:

- Mỗi bàn có QR token riêng, chỉ bàn hợp lệ mới được đặt món.
- Khách dùng điện thoại để gọi món trực tiếp.
- Đơn hàng được lưu vào database và hiển thị cho nhân viên.
- Nhân viên cập nhật trạng thái món theo thứ tự.
- Khi khách yêu cầu thanh toán, bàn chuyển sang trạng thái `REQUESTING_BILL`.
- Nhân viên hoàn tất thanh toán, hệ thống tạo invoice/payment và giải phóng bàn.
- Admin quản trị dữ liệu vận hành qua dashboard riêng.

### Đối tượng sử dụng

| Người dùng | App sử dụng | Vai trò trong hệ thống |
|---|---|---|
| Khách hàng | `customer-app` | Quét QR, xem menu, đặt món, áp voucher, yêu cầu thanh toán, xem lịch sử đơn của bàn |
| Nhân viên | `staff-app` | Quản lý bàn, tạo QR, theo dõi đơn, cập nhật trạng thái món, hoàn tất thanh toán, xem hóa đơn |
| Admin | `admin-app` | Quản lý menu, combo, danh mục, bàn, user, promotion, xem báo cáo doanh thu |
| Backend/API | `backend` | Xử lý nghiệp vụ, xác thực JWT, truy cập database qua Prisma |

### Các chức năng chính

Các chức năng chính của toàn hệ thống:

1. Đăng ký và đăng nhập khách hàng.
2. Đăng nhập nhân viên/admin bằng tài khoản nội bộ.
3. Quét và xác thực QR bàn.
4. Xem menu món lẻ và combo.
5. Tìm kiếm, lọc món theo danh mục/combo.
6. Thêm món/combo vào giỏ hàng.
7. Đặt món theo bàn.
8. Áp voucher/khuyến mãi.
9. Xem đơn đang hoạt động của bàn.
10. Khách yêu cầu thanh toán.
11. Nhân viên theo dõi trạng thái bàn.
12. Nhân viên tạo QR cho bàn trống.
13. Nhân viên cập nhật trạng thái từng món.
14. Nhân viên hoàn tất thanh toán.
15. Tạo hóa đơn và payment.
16. Admin quản lý menu món lẻ.
17. Admin quản lý combo.
18. Admin quản lý danh mục.
19. Admin quản lý bàn.
20. Admin quản lý user.
21. Admin quản lý promotion.
22. Admin xem dashboard doanh thu, top món, tỷ lệ combo.
23. Đồng bộ dữ liệu gần realtime bằng Supabase Realtime và polling fallback ở frontend.
24. Backend có SSE endpoint `/api/realtime`, nhưng frontend hiện tại không gọi endpoint này.

### Kiến trúc tổng thể

Sơ đồ tổng quát:

```text
                    +----------------------+
                    |  Customer App        |
                    |  Next.js UI          |
                    |  Port 3000           |
                    +----------+-----------+
                               |
                               | REST API + JWT optional
                               v
+-------------------+   +------+------------------+   +-------------------+
| Staff App         |   | Backend API             |   | Admin App         |
| Next.js UI        +-->| Next.js App Router API  |<--+ Next.js UI        |
| Port 3001         |   | Port 4000               |   | Port 3002         |
+-------------------+   +------+------------------+   +-------------------+
                               |
                               | Prisma Client
                               v
                    +----------+-----------+
                    | PostgreSQL           |
                    | Supabase Database    |
                    +----------+-----------+
                               ^
                               |
                    +----------+-----------+
                    | Supabase Realtime    |
                    | Frontend subscription|
                    +----------------------+
```

Sơ đồ theo tầng:

```text
Frontend apps
    |
    | api.ts wrapper dùng fetch()
    v
Backend API routes
    |
    | authorize(), validate input, business logic
    v
Prisma ORM
    |
    | model mapping, relation, transaction
    v
Supabase PostgreSQL
    |
    | tables: users, orders, orderdetails, invoices, payments, ...
    v
Response JSON
    |
    v
Frontend state/UI update
```

Giải thích từng tầng:

| Tầng | Thành phần | Nhiệm vụ |
|---|---|---|
| Frontend khách | `customer-app` | Giao diện mobile-first cho khách: menu, giỏ hàng, đặt món, voucher, yêu cầu thanh toán |
| Frontend nhân viên | `staff-app` | Quản lý bàn, đơn, trạng thái món, thanh toán, hóa đơn |
| Frontend admin | `admin-app` | Quản trị dữ liệu hệ thống và dashboard |
| API backend | `backend/src/app/api/**` | Cung cấp REST API, xác thực JWT, validate input, chạy business logic |
| Middleware backend | `backend/src/middleware.ts` | Rate limit, CORS preflight, security headers, audit log cho request ghi dữ liệu |
| Lib backend | `backend/src/lib/**` | Prisma singleton, JWT, auth, QR token, promotion, helper order lines |
| ORM | Prisma | Mapping model TypeScript sang bảng PostgreSQL |
| Database | Supabase PostgreSQL | Lưu user, bàn, món, combo, đơn hàng, hóa đơn, payment, promotion |
| Realtime | Supabase Realtime + polling | Frontend tự refresh khi dữ liệu đổi; backend cũng có SSE endpoint riêng |

### Điểm kiến trúc đáng chú ý

Project dùng mô hình "multi-app monorepo nhẹ":

```text
ledemonsteak/
    backend/
    customer-app/
    staff-app/
    admin-app/
    docs/
```

Mỗi app có `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts` riêng. Không có workspace manager như npm workspaces, pnpm workspace hay Turborepo. README hướng dẫn chạy từng app bằng terminal riêng.

---

## 2. Công nghệ sử dụng

### Tổng hợp công nghệ

| Nhóm | Công nghệ | Nơi dùng | Vì sao dùng |
|---|---|---|---|
| Framework frontend | Next.js 14.2.5 | `customer-app`, `staff-app`, `admin-app` | Xây UI React, routing theo App Router, build/deploy dễ lên Vercel |
| Framework backend | Next.js 14.2.5 App Router API | `backend` | Dùng route handler làm REST API, không cần Express |
| UI library | React 18 | cả 4 project | Nền tảng component UI cho Next.js |
| Ngôn ngữ | TypeScript | cả 4 project | Type checking, type cho API/model/UI |
| CSS framework | Tailwind CSS | 3 frontend app | Tạo giao diện nhanh bằng utility class |
| Chart | Recharts | `admin-app` | Vẽ biểu đồ doanh thu, top món, tỷ lệ combo |
| QR render | `qrcode.react` | `customer-app`, `staff-app` | Staff app render QR bàn; customer package cũng có dependency nhưng QR chủ yếu ở staff |
| State management | Zustand | 3 frontend app | Lưu auth state, cart state đơn giản, nhẹ hơn Redux |
| Date helper | `date-fns` | customer/admin deps | Format/xử lý ngày trong UI |
| Utility CSS class | `clsx` | frontend deps | Ghép class có điều kiện |
| ORM | Prisma 5.16 | `backend` | Mapping model, relation, transaction, query PostgreSQL |
| Database | PostgreSQL trên Supabase | `backend/prisma/schema.prisma`, SQL scripts | Lưu dữ liệu quan hệ: user, order, invoice, payment |
| Realtime | Supabase Realtime | `src/lib/realtime.ts` trong 3 frontend | Subscribe thay đổi bảng PostgreSQL để refresh UI |
| Auth | JWT custom + bcryptjs | backend auth routes/lib | Đăng nhập bằng phone/password, trả Bearer token |
| Password hashing | bcryptjs | backend | Hash password trước khi lưu và so sánh khi login |
| Token | jsonwebtoken | backend | Sign/verify JWT 7 ngày |
| API client | Native `fetch()` | frontend `src/lib/api.ts` | Không dùng axios; wrapper tự xử lý timeout/error/token |
| Build tool | Next.js build | từng app | `next dev`, `next build`, `next start` |
| Package manager | npm | `package-lock.json` v3 | Mỗi project có lockfile npm riêng |
| Cloud/deploy | Vercel | README | Mỗi app deploy thành một Vercel project riêng |
| Storage ảnh | URL ảnh/Data URL | menu/admin/backend validation | Admin có thể nhập URL hoặc chọn file chuyển thành data URL; không thấy code upload file lên storage |
| Cache | HTTP cache + in-memory Map | backend menu, frontend api wrapper, middleware rate limit | Backend public menu set cache header; frontend cache map tồn tại nhưng duration hiện trả 0; rate limit dùng Map trong memory |
| Middleware | Next middleware | backend | CORS, rate limit, security headers, audit log |
| Lint | ESLint | từng app | Kiểm tra code style cơ bản |

### Công nghệ không thấy hoặc không được dùng

| Công nghệ/khái niệm | Trạng thái trong project |
|---|---|
| Axios | Không dùng |
| React Query | Không dùng |
| SWR | Không dùng |
| Redux | Không dùng |
| MobX | Không dùng |
| Firebase | Không dùng |
| GraphQL | Không dùng |
| NextAuth | Không dùng |
| Redis/cache server | Không dùng |
| S3/file upload backend | Không thấy |
| Cloudinary upload API | README/env example có nhắc Cloudinary, nhưng code không gọi Cloudinary API upload |
| Refresh token | Không có |
| Session server-side | Không có |
| Repository/service layer đầy đủ | Không có; logic nằm trực tiếp trong route handlers và lib helpers |

### Vì sao từng công nghệ phù hợp với project này?

Next.js phù hợp vì hệ thống có nhiều app web riêng nhưng cùng cách tổ chức. Backend cũng dùng Next API route nên team chỉ cần một stack TypeScript/Next thay vì Express/NestJS riêng.

Prisma phù hợp vì database là quan hệ và có nhiều bảng liên kết: user, customer, table, item, combo, order, invoice, payment, promotion. Prisma giúp viết relation query và transaction rõ hơn SQL thủ công.

Supabase PostgreSQL phù hợp vì vừa cung cấp database PostgreSQL vừa có Supabase Realtime. Frontend tận dụng realtime để reload dữ liệu bàn, order, invoice, menu.

Zustand phù hợp vì state frontend không quá phức tạp. Customer cần auth và cart; staff/admin chủ yếu cần auth. Dùng Redux sẽ nặng hơn nhu cầu hiện tại.

JWT custom phù hợp với mô hình nhiều frontend cùng gọi một backend. Token được lưu ở `localStorage`, gửi qua header `Authorization: Bearer ...`.

Tailwind phù hợp để xây nhanh UI dashboard/table/mobile mà không cần thiết kế component system riêng.

---

## 3. Cấu trúc thư mục

### Cấu trúc cấp root

```text
ledemonsteak/
    .git/
    admin-app/
    backend/
    customer-app/
    docs/
    staff-app/
    README.md
    filtered_tree.txt
    TongKet.md
```

Giải thích:

| Thư mục/file | Nhiệm vụ |
|---|---|
| `.git/` | Metadata Git. Không phải source nghiệp vụ nhưng cho biết project được version control |
| `backend/` | Next.js API server. Chứa Prisma schema, seed, migration SQL, API routes và business logic backend |
| `customer-app/` | App web cho khách hàng dùng điện thoại quét QR và gọi món |
| `staff-app/` | App web cho nhân viên phục vụ/quầy thu ngân |
| `admin-app/` | App web cho admin/quản lý nhà hàng |
| `docs/` | Tài liệu yêu cầu phi chức năng |
| `README.md` | Hướng dẫn chạy local, deploy, tài khoản demo, biến môi trường |
| `filtered_tree.txt` | File liệt kê cây thư mục đã được sinh ra; không phải business logic |
| `TongKet.md` | Tài liệu tổng kết hiện tại |

### Cấu trúc `backend/`

```text
backend/
    prisma/
    scripts/
    src/
        app/
            api/
        lib/
    package.json
    package-lock.json
    tsconfig.json
    next.config.js
    middleware.ts
    .env
    .env.example
    .env.local
```

Giải thích:

| Folder/file | Nhiệm vụ |
|---|---|
| `backend/prisma/schema.prisma` | Định nghĩa toàn bộ model database, enum, relation, map tên cột/bảng |
| `backend/prisma/seed.ts` | Seed dữ liệu ban đầu: roles, categories, items, combos, tables, users, promotions |
| `backend/prisma/*.sql` | Script SQL cho Supabase: schema cũ, seed menu, compatibility, thêm bảng vật lý, index, realtime |
| `backend/scripts/` | Script kiểm tra production và Supabase connection |
| `backend/src/app/api/` | Toàn bộ REST API route handlers |
| `backend/src/lib/` | Helper dùng chung: Prisma client, JWT, auth, CORS, QR token, promotion, order line packing |
| `backend/middleware.ts` | Next middleware chạy trước API: CORS OPTIONS, rate limit, security headers, audit log |
| `backend/package.json` | Dependency và script backend |
| `backend/.env*` | Biến môi trường database, JWT, Supabase, public URL |

### Cấu trúc `backend/src/app/api`

```text
backend/src/app/api/
    admin/
        reports/
        users/
            [id]/
    auth/
        login/
        register/
    health/
    invoices/
    menu/
        [id]/
        categories/
            [id]/
        combos/
            [id]/
    network/
    orders/
        [id]/
            checkout/
            items/
    promotions/
        [id]/
        apply/
    public/
        qr/
            validate/
        tables/
    realtime/
    tables/
        [id]/
            qr/
```

Giải thích:

- `admin/`: API chỉ admin dùng, gồm báo cáo và quản lý user.
- `auth/`: đăng nhập, đăng ký.
- `health/`: kiểm tra backend và database.
- `invoices/`: nhân viên/admin xem hóa đơn đã thanh toán.
- `menu/`: public/admin menu API, gồm item, category, combo.
- `network/`: lấy IP/base URL LAN để tạo QR.
- `orders/`: đặt món, xem đơn, cập nhật trạng thái món, checkout.
- `promotions/`: quản lý và áp dụng voucher.
- `public/`: API public cho customer trước khi login: danh sách bàn active, validate QR.
- `realtime/`: SSE endpoint backend, hiện frontend không dùng.
- `tables/`: quản lý bàn và tạo QR bàn.

### Cấu trúc `customer-app/`

```text
customer-app/
    src/
        app/
            account/
            history/
            login/
            order/
            layout.tsx
            page.tsx
            globals.css
        components/
            cart/
            layout/
            menu/
            orders/
            promotions/
        lib/
            api.ts
            realtime.ts
        store/
            auth.ts
            cart.ts
    package.json
    next.config.js
    tailwind.config.ts
    tsconfig.json
```

Giải thích:

| Folder/file | Nhiệm vụ |
|---|---|
| `src/app/page.tsx` | Trang menu chính của khách, đọc QR URL, validate QR, load menu/tables |
| `src/app/login/` | Trang đăng nhập/đăng ký khách hàng |
| `src/app/order/` | Trang đơn hiện tại và yêu cầu thanh toán |
| `src/app/history/` | Lịch sử đơn của bàn |
| `src/app/account/` | Trang tài khoản khách; hiện cập nhật local state, không gọi backend profile API |
| `src/components/cart/` | Giỏ hàng, áp voucher, gửi order |
| `src/components/menu/` | Card món/combo |
| `src/components/layout/` | Bottom navigation mobile |
| `src/components/orders/` | Hiển thị trạng thái order |
| `src/components/promotions/` | Danh sách voucher |
| `src/lib/api.ts` | Wrapper `fetch()` cho customer |
| `src/lib/realtime.ts` | Supabase Realtime + polling fallback |
| `src/store/auth.ts` | Zustand auth store |
| `src/store/cart.ts` | Zustand cart/table/QR store |

### Cấu trúc `staff-app/`

```text
staff-app/
    src/
        app/
            invoice/
            login/
            orders/
            tables/
            layout.tsx
            page.tsx
            globals.css
        components/
            layout/
            orders/
            payments/
            tables/
        lib/
            api.ts
            realtime.ts
        store/
            auth.ts
    package.json
    next.config.js
    tailwind.config.ts
    tsconfig.json
```

Giải thích:

| Folder/file | Nhiệm vụ |
|---|---|
| `src/app/layout.tsx` | Wrap toàn staff app bằng `StaffGuard` |
| `src/app/login/` | Đăng nhập nhân viên/admin |
| `src/app/tables/` | Quản lý bàn, mở QR, mở chi tiết order, mở thanh toán |
| `src/app/orders/` | Theo dõi đơn/món và cập nhật trạng thái món |
| `src/app/invoice/` | Xem đơn chờ thanh toán và hóa đơn đã thanh toán |
| `src/components/layout/StaffGuard.tsx` | Chặn user không phải STAFF/ADMIN |
| `src/components/tables/` | Table grid, QR modal, order detail modal |
| `src/components/orders/` | Order card và nút cập nhật trạng thái item |
| `src/components/payments/` | Payment modal, receipt/print |
| `src/lib/api.ts` | Wrapper `fetch()` kèm token và xử lý 401 |
| `src/lib/realtime.ts` | Supabase Realtime + polling |
| `src/store/auth.ts` | Zustand auth store cho staff |

### Cấu trúc `admin-app/`

```text
admin-app/
    src/
        app/
            dashboard/
            login/
            menu/
            promotions/
            tables/
            users/
            layout.tsx
            page.tsx
            globals.css
        components/
            dashboard/
            layout/
            menu/
            promotions/
            ui/
            users/
        lib/
            api.ts
            realtime.ts
        store/
            auth.ts
    package.json
    next.config.js
    tailwind.config.ts
    tsconfig.json
```

Giải thích:

| Folder/file | Nhiệm vụ |
|---|---|
| `src/app/layout.tsx` | Wrap admin routes bằng `AdminShell` |
| `src/app/login/` | Đăng nhập admin |
| `src/app/dashboard/` | Dashboard báo cáo |
| `src/app/menu/` | Quản lý menu thông qua `DishTable` |
| `src/app/promotions/` | Quản lý voucher |
| `src/app/tables/` | Quản lý bàn |
| `src/app/users/` | Quản lý user |
| `src/components/layout/AdminShell.tsx` | Guard admin + layout header/sidebar |
| `src/components/layout/AdminSidebar.tsx` | Sidebar điều hướng admin |
| `src/components/dashboard/RevenueChart.tsx` | Biểu đồ doanh thu/top món/combo ratio |
| `src/components/menu/DishTable.tsx` | CRUD dish/combo/category |
| `src/components/promotions/PromotionTable.tsx` | CRUD promotion |
| `src/components/users/UserTable.tsx` | CRUD user |
| `src/components/ui/Modal.tsx` | Modal dùng chung |
| `src/lib/api.ts` | Wrapper `fetch()` admin kèm xử lý token hết hạn |
| `src/lib/realtime.ts` | Supabase Realtime + polling |
| `src/store/auth.ts` | Zustand auth store admin |

### Cấu trúc `docs/`

```text
docs/
    YEU_CAU_PHI_CHUC_NANG.md
```

File này mô tả yêu cầu phi chức năng: build production, performance, security headers, rate limiting, audit log, health check, backup Supabase, responsive, bảo trì. Một số yêu cầu đã có trong code, một số chỉ là tài liệu định hướng.

---

## 4. Luồng hoạt động của project

### Luồng tổng thể một ca phục vụ bàn

```text
Admin tạo bàn/menu/voucher
    |
Nhân viên đăng nhập staff app
    |
Nhân viên chọn bàn EMPTY
    |
Staff app gọi API tạo QR
    |
Khách quét QR
    |
Customer app validate tableId + qrToken
    |
Khách xem menu và thêm món vào giỏ
    |
Customer app gửi POST /api/orders
    |
Backend tạo order + orderdetails + set bàn OCCUPIED
    |
Staff app thấy order mới
    |
Nhân viên cập nhật trạng thái món
    |
Khách yêu cầu thanh toán
    |
Backend set order/table REQUESTING_BILL + tạo invoice unpaid
    |
Staff app mở PaymentModal
    |
Nhân viên xác nhận thanh toán
    |
Backend set order COMPLETED + table EMPTY + invoice PAID + payment SUCCESS
```

### Luồng đăng nhập

```text
User nhập phone/password
    |
Frontend validate sơ bộ
    |
POST /api/auth/login
    |
Backend normalize phone
    |
Tìm user active theo phone
    |
bcrypt.compare(password)
    |
signToken({ id, role, name })
    |
Frontend lưu token + user vào localStorage qua Zustand
    |
Redirect sang màn hình tương ứng
```

Phân quyền sau login:

- Customer app nhận role nào cũng có thể lưu, nhưng luồng register tạo CUSTOMER.
- Staff app chỉ chấp nhận `STAFF` hoặc `ADMIN`.
- Admin app chỉ chấp nhận `ADMIN`.

### Luồng đăng ký khách hàng

```text
Khách nhập tên, số điện thoại, mật khẩu
    |
Customer app validate required/password confirm
    |
POST /api/auth/register
    |
Backend normalize + validate phone Việt Nam
    |
Kiểm tra phone chưa tồn tại
    |
Hash password
    |
Tạo User role CUSTOMER
    |
Tạo Customer liên kết user
    |
Ký JWT
    |
Customer app lưu token/user
```

### Luồng quét QR bàn

```text
Nhân viên chọn bàn EMPTY
    |
Staff app gọi GET /api/tables/:id/qr
    |
Backend kiểm tra role STAFF/ADMIN
    |
Kiểm tra bàn active, chưa có order active/unpaid invoice
    |
Tạo JWT TABLE_QR 12 giờ
    |
Trả URL customer app: ?tableId=...&qrToken=...
    |
Khách mở URL
    |
Customer app gọi POST /api/public/qr/validate
    |
Backend verify token đúng tableId và bàn active
    |
Customer app lưu tableId + qrToken vào cart store/localStorage
```

### Luồng đặt món

```text
Khách xem menu
    |
Thêm dish/combo vào CartDrawer
    |
Chọn voucher nếu đăng nhập và có voucher khả dụng
    |
Nhấn đặt món
    |
POST /api/orders
    |
Backend verify QR token
    |
Load table, items, combos, user/customer nếu có
    |
Validate số lượng và item/combo active
    |
Tính total
    |
Nếu có promoCode: yêu cầu JWT CUSTOMER và tính discount
    |
Transaction:
    - create order
    - create orderdetails
    - update table OCCUPIED
    |
Frontend clear cart
    |
Staff app refresh thấy order mới
```

### Luồng cập nhật trạng thái món

```text
Nhân viên mở staff /orders
    |
Xem từng item trong order
    |
Nhấn nút chuyển trạng thái
    |
PATCH /api/orders/:id/items
    |
Backend kiểm tra role STAFF/ADMIN
    |
Tìm order detail hoặc fallback legacy JSON trong customerNotes
    |
Chỉ cho phép:
WAITING -> PREPARING -> DONE -> SERVED
    |
Update orderdetails hoặc customerNotes
    |
Staff UI reload/optimistic update
```

### Luồng khách yêu cầu thanh toán

```text
Khách mở trang /order
    |
Nếu muốn, apply promotion
    |
Nhấn yêu cầu thanh toán
    |
POST /api/orders/:id/checkout
body không có complete=true
    |
Backend tính lại promo nếu có
    |
Transaction:
    - update table REQUESTING_BILL
    - update order REQUESTING_BILL
    - create/update invoice unpaid
    |
Staff app thấy bàn REQUESTING_BILL
    |
Mở PaymentModal
```

### Luồng nhân viên hoàn tất thanh toán

```text
Nhân viên nhập số tiền nhận + phương thức
    |
POST /api/orders/:id/checkout
body { complete: true, paymentMethod, receivedAmount }
    |
Backend kiểm tra role STAFF/ADMIN
    |
Validate receivedAmount >= finalAmount
    |
Transaction:
    - update table EMPTY
    - update order COMPLETED
    - tăng usageCount promotion nếu có
    - mark CustomerPromotion used
    |
Tạo/update invoice PAID
    |
Tạo payment SUCCESS
    |
Trả receipt
    |
Staff có thể in hóa đơn
```

### Luồng admin quản lý dữ liệu

```text
Admin đăng nhập
    |
AdminShell kiểm tra token + role ADMIN
    |
Admin mở từng module:
    - Dashboard
    - Menu
    - Promotions
    - Tables
    - Users
    |
Frontend gọi API admin/management
    |
Backend authorize ADMIN
    |
Validate input
    |
Prisma create/update/delete mềm
    |
UI reload qua fetch/realtime
```

---

## 5. Fetch dữ liệu

### Cách project gọi dữ liệu

Project gọi dữ liệu bằng native `fetch()` thông qua wrapper `apiFetch()` trong từng frontend:

```text
customer-app/src/lib/api.ts
staff-app/src/lib/api.ts
admin-app/src/lib/api.ts
```

Không thấy dùng:

- `axios`
- React Query
- SWR
- GraphQL
- Firebase client

Frontend realtime dùng Supabase client trong:

```text
customer-app/src/lib/realtime.ts
staff-app/src/lib/realtime.ts
admin-app/src/lib/realtime.ts
```

Realtime không thay thế API fetch. Nó chỉ gọi callback để frontend reload dữ liệu.

### Wrapper fetch của từng app

| App | File | Đặc điểm |
|---|---|---|
| Customer | `customer-app/src/lib/api.ts` | Lấy `NEXT_PUBLIC_API_URL`, fallback `http://localhost:4000`, timeout 60s, tự gắn token nếu có, có `ApiError` |
| Staff | `staff-app/src/lib/api.ts` | Nếu không phải HTTPS sẽ tự ghép host hiện tại với port 4000; token từ localStorage; 401 thì logout và redirect `/login` |
| Admin | `admin-app/src/lib/api.ts` | Token từ localStorage; 401 thì clear auth và redirect `/login?expired=1` |

### Bảng toàn bộ nơi fetch API

| File | API | Method | Input | Output | Ai gọi |
|---|---|---:|---|---|---|
| `customer-app/src/app/page.tsx` | `/api/menu` | GET | Không bắt buộc token | Danh sách categories/items/combos active | Trang menu khách |
| `customer-app/src/app/page.tsx` | `/api/public/tables` | GET | Không | Danh sách bàn active | Trang menu khách |
| `customer-app/src/app/page.tsx` | `/api/public/qr/validate` | POST | `{ tableId, qrToken }` | `{ valid, table }` | Khi URL có QR |
| `customer-app/src/app/login/page.tsx` | `/api/auth/login` | POST | `{ phone, password }` | `{ token, user }` | Form login |
| `customer-app/src/app/login/page.tsx` | `/api/auth/register` | POST | `{ name, phone, password }` | `{ token, user }` | Form register |
| `customer-app/src/components/cart/CartDrawer.tsx` | `/api/promotions` | GET | Bearer token customer | Voucher khả dụng | Khi mở giỏ hàng |
| `customer-app/src/components/cart/CartDrawer.tsx` | `/api/orders` | POST | `{ tableId, qrToken, userId, promoCode, items }` | Order mới | Nút đặt món |
| `customer-app/src/app/order/page.tsx` | `/api/orders?tableId=...` | GET | Query tableId | Active orders của bàn | Trang order |
| `customer-app/src/app/order/page.tsx` | `/api/promotions` | GET | Bearer token | Voucher khả dụng | Trang order |
| `customer-app/src/app/order/page.tsx` | `/api/promotions/apply` | POST | `{ code, orderAmount }` | Discount/finalAmount | Apply voucher trước thanh toán |
| `customer-app/src/app/order/page.tsx` | `/api/orders/:id/checkout` | POST | `{ promoCode? }` | Order/table chuyển requesting bill | Nút yêu cầu thanh toán |
| `customer-app/src/app/history/page.tsx` | `/api/orders?tableId=...&status=ALL` | GET | Query tableId/status | Lịch sử orders của bàn | Trang history |
| `staff-app/src/app/login/page.tsx` | `/api/auth/login` | POST | `{ phone, password }` | `{ token, user }` | Staff login |
| `staff-app/src/app/tables/page.tsx` | `/api/tables` | GET | Bearer STAFF/ADMIN | Danh sách bàn | Trang tables |
| `staff-app/src/app/tables/page.tsx` | `/api/orders?view=staff` | GET | Bearer STAFF/ADMIN | Active orders | Trang tables |
| `staff-app/src/app/tables/page.tsx` | `/api/tables/:id` | PATCH | `{ status }` | Table updated | Đổi trạng thái bàn |
| `staff-app/src/components/tables/QRModal.tsx` | `/api/tables/:id/qr` | GET | Bearer STAFF/ADMIN | QR URL/table info | Modal tạo QR |
| `staff-app/src/app/orders/page.tsx` | `/api/orders?view=staff` | GET | Bearer STAFF/ADMIN | Orders active | Trang orders |
| `staff-app/src/app/orders/page.tsx` | `/api/orders/:id/items` | PATCH | `{ itemId, status }` | Item/order updated | Cập nhật trạng thái món |
| `staff-app/src/components/orders/OrderCard.tsx` | `/api/orders/:id/items` | PATCH | `{ itemId, status }` | Item/order updated | OrderCard |
| `staff-app/src/components/payments/PaymentModal.tsx` | `/api/orders/:id/checkout` | POST | `{ complete:true, paymentMethod, receivedAmount }` | Invoice/payment/receipt | Hoàn tất thanh toán |
| `staff-app/src/app/invoice/page.tsx` | `/api/orders?view=staff` | GET | Bearer STAFF/ADMIN | Active orders | Tab chờ thanh toán |
| `staff-app/src/app/invoice/page.tsx` | `/api/invoices` | GET | Bearer STAFF/ADMIN | Paid invoices | Tab hóa đơn |
| `admin-app/src/app/login/page.tsx` | `/api/auth/login` | POST | `{ phone, password }` | `{ token, user }` | Admin login |
| `admin-app/src/app/dashboard/page.tsx` | `/api/admin/reports` | GET | Bearer ADMIN | Revenue/top dishes/combo ratio | Dashboard |
| `admin-app/src/components/users/UserTable.tsx` | `/api/admin/users` | GET | Bearer ADMIN | Users | User management |
| `admin-app/src/components/users/UserTable.tsx` | `/api/admin/users` | POST | User payload | User created | Create user |
| `admin-app/src/components/users/UserTable.tsx` | `/api/admin/users/:id` | PATCH | User payload | User updated | Edit user |
| `admin-app/src/components/users/UserTable.tsx` | `/api/admin/users/:id` | DELETE | Không | `{ ok:true }` | Delete mềm user |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu` | GET | Bearer ADMIN | Full menu gồm inactive | Menu management |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu` | POST | Dish payload | Dish created | Create dish |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/:id` | PATCH | Dish payload | Dish updated | Edit dish |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/:id` | DELETE | Không | Dish inactive | Delete mềm dish |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/combos` | POST | Combo payload | Combo created | Create combo |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/combos/:id` | PATCH | Combo payload | Combo updated | Edit combo |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/combos/:id` | DELETE | Không | Combo inactive | Delete mềm combo |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/categories` | POST | Category payload | Category created | Create category |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/categories/:id` | PATCH | Category payload | Category updated | Edit category |
| `admin-app/src/components/menu/DishTable.tsx` | `/api/menu/categories/:id` | DELETE | Không | Category/items inactive | Delete mềm category |
| `admin-app/src/components/promotions/PromotionTable.tsx` | `/api/promotions` | GET | Bearer ADMIN | All promotions | Promotion management |
| `admin-app/src/components/promotions/PromotionTable.tsx` | `/api/promotions` | POST | Promotion payload | Promotion created | Create promotion |
| `admin-app/src/components/promotions/PromotionTable.tsx` | `/api/promotions/:id` | PATCH | Promotion payload | Promotion updated | Edit promotion |
| `admin-app/src/components/promotions/PromotionTable.tsx` | `/api/promotions/:id` | DELETE | Không | Promotion inactive | Delete mềm promotion |
| `admin-app/src/app/tables/page.tsx` | `/api/tables` | GET | Bearer ADMIN | Tables | Table management |
| `admin-app/src/app/tables/page.tsx` | `/api/tables` | POST | Table payload | Table created | Create table |
| `admin-app/src/app/tables/page.tsx` | `/api/tables/:id` | PATCH | Table payload | Table updated | Edit table |
| `admin-app/src/app/tables/page.tsx` | `/api/tables/:id` | DELETE | Không | `{ ok:true }` | Delete mềm table |

### Luồng fetch ví dụ: đăng nhập

```text
User click Login
    |
customer/staff/admin login page
    |
apiFetch("/api/auth/login", { method:"POST", body })
    |
fetch(baseUrl + "/api/auth/login")
    |
backend route POST /api/auth/login
    |
Prisma user.findUnique({ phone })
    |
bcrypt.compare()
    |
signToken()
    |
Response { token, user }
    |
Zustand auth.login()
    |
localStorage set token/user
    |
router push dashboard/tables/home
```

### Luồng fetch ví dụ: đặt món

```text
User click Đặt món
    |
CartDrawer.handleSubmit()
    |
apiFetch("/api/orders", POST)
    |
Backend verify QR token
    |
Prisma load table/items/combos/user
    |
calculatePromotion nếu có promo
    |
Prisma transaction:
    create order
    create orderdetails
    update table OCCUPIED
    |
Response order
    |
Cart clear
    |
dispatch events lemonde:orders-changed, lemonde:tables-changed
    |
Staff app realtime/polling refresh
```

### Supabase Realtime

Ba frontend đều có file `src/lib/realtime.ts`. Cách hoạt động:

```text
subscribeRealtime(scope, onChange)
    |
Nếu có NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY hợp lệ
    |
Tạo Supabase client
    |
Subscribe postgres_changes trên các bảng theo scope
    |
Khi có INSERT/UPDATE/DELETE -> debounce -> onChange()
    |
Đồng thời luôn có polling interval 900ms
    |
Focus/visibility change cũng gọi onChange()
```

Bảng được theo dõi theo scope:

| Scope | Bảng theo dõi |
|---|---|
| `customer` | `items`, `combos`, `comboitems`, `categories`, `promotions`, `customerpromotions`, `orders`, `orderdetails`, `tables`, `invoices`, `payments` |
| `staff` | `orders`, `orderdetails`, `tables`, `invoices`, `payments`, `items`, `combos` |
| `admin` | `orders`, `orderdetails`, `tables`, `invoices`, `payments`, `items`, `combos`, `comboitems`, `categories`, `promotions`, `customerpromotions`, `users` |

Backend cũng có endpoint `/api/realtime` dạng SSE, nhưng khi đọc code frontend thì không thấy app nào gọi endpoint này. Vì vậy realtime thực tế của frontend hiện tại là Supabase Realtime + polling fallback.

---

## 6. API

Backend là Next.js App Router API, không phải Express. API nằm trong:

```text
backend/src/app/api/**
```

### Auth API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/auth/login` | POST | `{ phone, password }` | `{ token, user }` | Customer, Staff, Admin |
| `/api/auth/register` | POST | `{ name, phone, password }` | `{ token, user }` | Customer |

Chi tiết:

- Login normalize số điện thoại, tìm user active, kiểm tra password bằng bcrypt, update `lastLoginAt`, ký JWT 7 ngày.
- Register chỉ tạo CUSTOMER, validate phone Việt Nam, password tối thiểu 8 ký tự, tạo `User` và nested `Customer`.

### Public API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/public/tables` | GET | Không | Danh sách bàn active | Customer app |
| `/api/public/qr/validate` | POST | `{ tableId, qrToken }` | `{ valid:true, table }` | Customer app |

Public không cần Bearer token. QR validate dùng JWT riêng loại `TABLE_QR`, không phải user JWT.

### Menu API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/menu` | GET | Optional Bearer ADMIN | `{ categories, items, combos }` | Customer/Admin |
| `/api/menu` | POST | Dish payload | Dish created | Admin |
| `/api/menu/:id` | GET | Không | Dish detail | Không thấy frontend gọi |
| `/api/menu/:id` | PATCH | Dish payload | Dish updated | Admin |
| `/api/menu/:id` | DELETE | Không | Dish inactive | Admin |
| `/api/menu/categories` | GET | Không | Active categories | Không thấy frontend gọi trực tiếp |
| `/api/menu/categories` | POST | Category payload | Category created | Admin |
| `/api/menu/categories/:id` | PATCH | Category payload | Category updated | Admin |
| `/api/menu/categories/:id` | DELETE | Không | Category và items inactive | Admin |
| `/api/menu/combos` | POST | Combo payload | Combo created | Admin |
| `/api/menu/combos/:id` | PATCH | Combo payload | Combo updated | Admin |
| `/api/menu/combos/:id` | DELETE | Không | Combo inactive | Admin |

Điểm quan trọng của `GET /api/menu`:

- Nếu token là ADMIN: trả cả active/inactive để quản lý.
- Nếu không phải admin: chỉ trả active.
- Public response có cache header `public, s-maxage=60, stale-while-revalidate=300`.

### Table API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/tables` | GET | Bearer STAFF/ADMIN | Tables với trạng thái đồng bộ | Staff/Admin |
| `/api/tables` | POST | `{ number, capacity, status, isActive }` | Table created | Admin |
| `/api/tables/:id` | PATCH | Staff: status; Admin: status/number/capacity/isActive | Table updated | Staff/Admin |
| `/api/tables/:id` | DELETE | Không | `{ ok:true }` | Admin |
| `/api/tables/:id/qr` | GET | Bearer STAFF/ADMIN | `{ url, tableId, expiresAt }` | Staff |

Logic quan trọng:

- Staff chỉ được đổi `status`, không được sửa số bàn/sức chứa/isActive.
- Không cho set bàn về `EMPTY` nếu còn active order hoặc unpaid invoice.
- Không cho set bàn sang trạng thái không EMPTY nếu không có active bill.
- QR chỉ tạo được khi bàn active, không có order active, không có invoice unpaid.

### Order API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/orders` | POST | `{ tableId, userId?, items, promoCode?, qrToken }` | Order created | Customer |
| `/api/orders?tableId=...` | GET | Query tableId | Orders của bàn | Customer |
| `/api/orders?tableId=...&status=ALL` | GET | Query tableId/status | Lịch sử orders của bàn | Customer |
| `/api/orders?view=staff` | GET | Bearer STAFF/ADMIN | Active orders | Staff |
| `/api/orders/:id/items` | PATCH | `{ itemId, status }` | Order item updated | Staff |
| `/api/orders/:id/checkout` | POST | `{ promoCode? }` | Request bill | Customer |
| `/api/orders/:id/checkout` | POST | `{ complete:true, paymentMethod, receivedAmount }` | Invoice/payment/receipt | Staff |

Điểm quan trọng:

- Đặt món yêu cầu QR token hợp lệ.
- `items` phải có quantity >= 1 và mỗi dòng chỉ có một trong `itemId` hoặc `comboId`.
- Backend tự lấy giá từ database, không tin giá từ frontend.
- Order detail được lưu ở bảng `orderdetails`; đồng thời `customerNotes` có thể chứa JSON packed order lines để tương thích legacy.
- Checkout endpoint có 2 chế độ: customer request bill và staff complete payment.

### Invoice API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/invoices` | GET | Bearer STAFF/ADMIN | 100 paid invoices gần nhất | Staff |

API này chỉ trả invoice `PAID`, kèm order, table, customer, payment thành công gần nhất.

### Promotion API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/promotions` | GET | Bearer CUSTOMER/ADMIN | Customer: voucher khả dụng; Admin: tất cả | Customer/Admin |
| `/api/promotions` | POST | Promotion payload | Promotion created | Admin |
| `/api/promotions/:id` | PATCH | Promotion payload | Promotion updated | Admin |
| `/api/promotions/:id` | DELETE | Không | Promotion inactive | Admin |
| `/api/promotions/apply` | POST | `{ code, orderAmount }` | Discount/finalAmount | Customer |

Promotion dùng `id` làm mã code. Khi expose ra frontend, backend thêm trường `code = id`.

### Admin API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/admin/users` | GET | Bearer ADMIN | Users | Admin |
| `/api/admin/users` | POST | User payload | User created | Admin |
| `/api/admin/users/:id` | PATCH | User payload | User updated | Admin |
| `/api/admin/users/:id` | DELETE | Không | User inactive | Admin |
| `/api/admin/reports` | GET | Bearer ADMIN | Revenue/top dishes/combo ratio | Admin |

### Utility API

| Endpoint | Method | Request | Response | Ai sử dụng |
|---|---:|---|---|---|
| `/api/health` | GET | Không | `{ status, database, responseTime }` | Monitoring/manual |
| `/api/network` | GET | Không | `{ ip, customerBase, apiBase }` | Không thấy frontend gọi |
| `/api/realtime?scope=...` | GET | SSE | Event stream | Không thấy frontend gọi |

### CORS/OPTIONS

Middleware xử lý `OPTIONS` cho `/api/:path*`. CORS headers hiện để:

```text
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization
```

---

## 7. Database

Database dùng PostgreSQL qua Prisma. Prisma schema nằm ở:

```text
backend/prisma/schema.prisma
```

### Enums

| Enum | Giá trị | Ý nghĩa |
|---|---|---|
| `Role` | `CUSTOMER`, `STAFF`, `ADMIN` | Role logic của user |
| `TableStatus` | `EMPTY`, `OCCUPIED`, `REQUESTING_BILL` | Trạng thái bàn |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | Enum khai báo cho đơn, nhưng field order status trong model là `String` |
| `OrderDetailStatus` | `WAITING`, `PREPARING`, `DONE`, `SERVED` | Trạng thái từng món |
| `DiscountType` | `PERCENTAGE`, `FIXED` | Loại giảm giá |
| `InvoiceStatus` | `UNPAID`, `PAID`, `CANCELLED` | Trạng thái hóa đơn |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` | Trạng thái payment |
| `PaymentMethod` | `CASH`, `BANK_TRANSFER`, `CARD`, `E_WALLET` | Phương thức thanh toán |

### Bảng `roles`

Model Prisma: `UserRole`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | Mã role như `ADMIN`, `STAFF`, `CUSTOMER` |
| `roleName` | unique | Tên hiển thị role |
| `description` |  | Mô tả |
| `createdAt`, `updatedAt` |  | Timestamp |

Quan hệ:

```text
roles 1 --- n users
```

### Bảng `users`

Model Prisma: `User`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID user |
| `username` | mapped `name` | Tên người dùng |
| `phone` | unique | Số điện thoại đăng nhập |
| `password` |  | Password đã hash |
| `email` |  | Email optional |
| `role` |  | Enum role logic |
| `roleId` | FK optional | Trỏ sang `roles.id` |
| `isActive` |  | Soft delete/khóa tài khoản |
| `lastLoginAt` |  | Lần login cuối |
| `createdAt`, `updatedAt` |  | Timestamp |

Quan hệ:

```text
users n --- 1 roles
users 1 --- 0..1 customers
users 1 --- n orders
```

### Bảng `customers`

Model Prisma: `Customer`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID customer |
| `userId` | unique FK optional | Liên kết user đăng nhập |
| `fullName` | mapped `name` | Tên khách |
| `phone` | unique | Phone khách |
| `email`, `address`, `city`, `district` |  | Thông tin liên hệ |
| `dateOfBirth` | mapped `birthday` | Ngày sinh |
| `customerType` |  | Loại khách, default `GUEST` |
| `loyaltyPoints` |  | Điểm tích lũy |
| `totalSpent` |  | Tổng chi tiêu |
| `isActive` |  | Trạng thái |

Quan hệ:

```text
customers 0..1 --- 1 users
customers 1 --- n orders
customers 1 --- n invoices
customers 1 --- n customerpromotions
```

### Bảng `tables`

Model Prisma: `Table`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID bàn |
| `tableNumber` | unique, mapped `number` | Mã/số bàn |
| `capacity` |  | Sức chứa |
| `status` | String | `EMPTY`, `OCCUPIED`, `REQUESTING_BILL` |
| `isActive` |  | Soft delete bàn |
| `createdAt`, `updatedAt` |  | Timestamp |

Quan hệ:

```text
tables 1 --- n orders
tables 1 --- n invoices
```

### Bảng `categories`

Model Prisma: `Category`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID category |
| `categoryName` | mapped `name` | Tên danh mục |
| `description` | mapped `desc` | Mô tả |
| `image` |  | Ảnh |
| `sortOrder` |  | Thứ tự hiển thị |
| `isActive` |  | Soft delete |

Quan hệ:

```text
categories 1 --- n items
```

### Bảng `items`

Model Prisma: `Item`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID món |
| `name` |  | Tên món |
| `price` |  | Giá |
| `description` |  | Mô tả |
| `image` |  | URL/data URL ảnh |
| `isAvailable` |  | Cờ sẵn hàng |
| `sortOrder` |  | Thứ tự |
| `isActive` |  | Soft delete |
| `categoryId` | FK optional | Danh mục |

Quan hệ:

```text
items n --- 1 categories
items 1 --- n comboitems
items 1 --- n orderdetails
```

### Bảng `combos`

Model Prisma: `Combo`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID combo |
| `name` |  | Tên combo |
| `price` |  | Giá combo |
| `description` |  | Mô tả |
| `image` |  | Ảnh |
| `isActive` |  | Soft delete |

Quan hệ:

```text
combos 1 --- n comboitems
combos 1 --- n orderdetails
```

### Bảng `comboitems`

Model Prisma: `ComboItem`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID combo item |
| `comboId` | FK | Combo |
| `itemId` | FK | Món thuộc combo |
| `quantity` |  | Số lượng món trong combo |

Constraint:

```text
unique(comboId, itemId)
```

Quan hệ:

```text
combos 1 --- n comboitems n --- 1 items
```

### Bảng `orders`

Model Prisma: `Order`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID order |
| `orderNumber` | unique autoincrement | Số đơn dễ đọc |
| `tableId` | FK optional | Bàn |
| `userId` | FK optional | User đặt |
| `customerId` | FK optional | Customer đặt |
| `orderStatus` | mapped `status`, String | Trạng thái order |
| `subTotal` | mapped `totalAmount` | Tổng trước giảm/tax/service |
| `taxAmount` |  | Thuế |
| `serviceCharge` |  | Phí dịch vụ |
| `discountAmount` | mapped `discount` | Giảm giá |
| `totalAmount` | mapped `finalAmount` | Tổng cuối |
| `promoCode` |  | Mã promotion |
| `customerNotes` |  | Note hoặc JSON packed order lines |

Quan hệ:

```text
orders n --- 1 tables
orders n --- 1 users
orders n --- 1 customers
orders 1 --- n orderdetails
orders 1 --- 0..1 invoices
orders 1 --- n payments
```

### Bảng `orderdetails`

Model Prisma: `OrderDetail`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID order detail |
| `orderId` | FK cascade | Order |
| `itemId` | FK optional | Món lẻ |
| `comboId` | FK optional | Combo |
| `quantity` |  | Số lượng |
| `price` |  | Giá tại thời điểm order |
| `status` | enum | WAITING/PREPARING/DONE/SERVED |

Thiết kế cho phép một dòng order là món lẻ hoặc combo. Backend validate mỗi line chỉ có một trong `itemId` hoặc `comboId`.

### Bảng `promotions`

Model Prisma: `Promotion`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | Mã voucher/code |
| `name` |  | Tên promotion |
| `type` | mapped `discountType`, String | `PERCENTAGE` hoặc `FIXED` |
| `value` | mapped `discountValue` | Giá trị giảm |
| `minOrderAmount` | mapped `minOrder` | Đơn tối thiểu |
| `maxDiscount` |  | Giảm tối đa |
| `usageLimit` |  | Tổng lượt dùng tối đa |
| `usedCount` | mapped `usageCount` | Số lượt đã dùng |
| `startDate`, `endDate` |  | Thời gian hiệu lực |
| `isActive` |  | Soft delete |
| `description` |  | Mô tả |

Quan hệ:

```text
promotions 1 --- n customerpromotions
```

### Bảng `customerpromotions`

Model Prisma: `CustomerPromotion`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID |
| `customerId` | FK | Customer |
| `promotionId` | FK | Promotion |
| `isUsed` |  | Đã dùng chưa |
| `usedAt` |  | Thời điểm dùng |
| `assignedAt` |  | Thời điểm gán |

Constraint:

```text
unique(customerId, promotionId)
```

### Bảng `invoices`

Model Prisma: `Invoice`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID invoice |
| `invoiceNumber` | mapped `invoiceCode`, unique | Mã hóa đơn |
| `orderId` | unique FK optional | Order tương ứng |
| `customerId` | FK optional | Customer |
| `tableId` | FK optional | Bàn |
| `subTotal` | mapped `subtotal` | Tổng trước giảm/tax |
| `customerName`, `customerTaxCode` |  | Thông tin khách |
| `taxAmount` |  | Thuế |
| `totalAmount` | mapped `total` | Tổng cuối |
| `paymentMethod` | String | Phương thức |
| `status` | enum | UNPAID/PAID/CANCELLED |
| `createdAt` | mapped `issuedAt` | Ngày xuất |
| `paidAt` |  | Ngày thanh toán |
| `note` |  | Ghi chú |

Quan hệ:

```text
invoices n --- 1 orders
invoices n --- 1 customers
invoices n --- 1 tables
invoices 1 --- n payments
```

### Bảng `payments`

Model Prisma: `Payment`.

| Field | Key | Ý nghĩa |
|---|---|---|
| `id` | PK | CUID payment |
| `invoiceId` | FK optional | Invoice |
| `orderId` | FK optional | Order |
| `paymentMethod` | mapped `method` | CASH/BANK_TRANSFER/CARD/E_WALLET |
| `amount` |  | Số tiền phải trả |
| `paidAmount` |  | Số tiền nhận |
| `changeAmount` |  | Tiền thối |
| `paymentStatus` | mapped `status` | PENDING/SUCCESS/FAILED |
| `paidAt` |  | Thời điểm thanh toán |
| `transactionCode` |  | Mã giao dịch |

### ERD dạng text

```text
roles
  |
  | 1-n
  v
users
  | 1-0..1
  v
customers
  |\
  | \ 1-n
  |  v
  | customerpromotions n-1 promotions
  |
  | 1-n
  v
orders n-1 tables
  |
  | 1-n
  v
orderdetails
  |\
  | \ n-1 combos 1-n comboitems n-1 items n-1 categories
  |
  n-1 items

orders 1-0..1 invoices 1-n payments
orders 1-n payments
tables 1-n invoices
customers 1-n invoices
```

### Vì sao thiết kế như vậy?

Thiết kế này tách các khái niệm chính của nhà hàng:

- `users` là tài khoản đăng nhập.
- `customers` là hồ sơ khách hàng và lịch sử loyalty/spent.
- `tables` là tài nguyên vật lý trong nhà hàng.
- `items`, `categories`, `combos`, `comboitems` mô tả menu.
- `orders` là đơn của một bàn tại một thời điểm.
- `orderdetails` là từng món/combo trong đơn, có trạng thái riêng.
- `invoices` là hóa đơn tài chính sau khi khách yêu cầu/hoàn tất thanh toán.
- `payments` là giao dịch thanh toán.
- `promotions` và `customerpromotions` quản lý voucher và trạng thái đã dùng theo khách.

Điểm đáng chú ý là database có nhiều `@map`/`@@map`. Điều này cho thấy code Prisma đang tương thích với schema vật lý có tên cột/bảng kiểu cũ, ví dụ model field `name` map sang cột `username`, `Order.finalAmount` map sang cột `totalAmount`. Đây là dấu hiệu project đã tiến hóa từ schema SQL cũ sang Prisma model mới.

---

## 8. Luồng dữ liệu

Project không chia backend thành Controller -> Service -> Repository đầy đủ. Luồng thực tế đúng theo code là:

```text
Frontend Page/Component
    |
    | gọi apiFetch()
    v
Frontend src/lib/api.ts
    |
    | native fetch()
    v
Backend Next.js Route Handler
    |
    | validate input
    | authorize() nếu cần
    | gọi helper lib nếu có
    v
Prisma Client
    |
    | query / transaction
    v
Supabase PostgreSQL
    |
    v
Route Handler format response
    |
    v
apiFetch parse JSON / throw ApiError
    |
    v
Component setState / Zustand update
    |
    v
UI render lại
```

### Ví dụ dữ liệu order

```text
CartDrawer items
    |
POST /api/orders
    |
route.ts đọc body
    |
verifyTableQrToken(tableId, qrToken)
    |
prisma.table.findUnique()
prisma.item.findMany()
prisma.combo.findMany()
    |
Tạo orderLines
    |
packOrderLines() đưa JSON vào customerNotes
    |
prisma.$transaction()
    |
orders + orderdetails + table status
    |
attachOrderItems()
    |
Response order có items
    |
CartDrawer clear cart
```

### Ví dụ dữ liệu payment

```text
PaymentModal
    |
POST /api/orders/:id/checkout { complete:true }
    |
authorize STAFF/ADMIN
    |
prisma.order.findUnique(include table/customer/invoice)
    |
validate receivedAmount
    |
prisma.$transaction()
    |-- table.update(status EMPTY)
    |-- order.update(status COMPLETED)
    |-- promotion.update usageCount nếu có
    |-- customerPromotion mark used nếu có
    |
invoice.upsert/update PAID
payment.create SUCCESS
    |
Response invoice/payment/order/changeAmount
    |
PaymentModal hiển thị receipt
```

### Luồng dữ liệu realtime

```text
Supabase PostgreSQL table changed
    |
Supabase Realtime channel receives postgres_changes
    |
frontend subscribeRealtime debounce
    |
onChange callback
    |
Page gọi lại loadData()
    |
apiFetch REST API
    |
UI cập nhật
```

Nếu Supabase Realtime không có env hoặc bị lỗi, polling 900ms vẫn gọi refresh.

---

## 9. Authentication

### Login

Backend login route:

```text
POST /api/auth/login
```

Luồng:

```text
phone/password
    |
normalizePhone()
    |
user.findUnique({ phone })
    |
check user.isActive
    |
bcrypt.compare(password, user.password)
    |
update lastLoginAt
    |
signToken({ id, role, name })
    |
return token + user
```

Token payload có:

```text
id
role
name
```

Token hết hạn sau 7 ngày theo `backend/src/lib/jwt.ts`.

### Register

Chỉ customer app gọi register:

```text
POST /api/auth/register
```

Backend tạo:

```text
User(role CUSTOMER)
    |
nested Customer
```

### Logout

Logout chỉ xử lý ở frontend:

```text
Zustand logout()
    |
remove localStorage key
    |
clear user/token in memory
```

Không có API logout backend, vì JWT stateless.

### Token lưu ở đâu?

| App | localStorage key |
|---|---|
| Customer | `lemonde-auth` |
| Staff | `lemonde-staff-auth` |
| Admin | `lemonde-admin-auth` |

Token được gửi bằng:

```text
Authorization: Bearer <token>
```

### Refresh token

Không có refresh token trong source code.

Hệ quả:

- Khi JWT hết hạn, request protected trả 401.
- Staff/admin wrapper sẽ clear localStorage và redirect login.
- Customer wrapper ném `ApiError`; page/component tự xử lý tùy nơi.

### Middleware

`backend/src/middleware.ts` không xác thực role. Nó làm:

- OPTIONS CORS response.
- Rate limit theo IP/method/path.
- Security headers.
- Audit log cho non-GET/HEAD/OPTIONS.
- Gắn `X-Request-Id`.

Authorization thực sự nằm trong route handler qua:

```text
authorize(request, ["ADMIN"])
authorize(request, ["STAFF", "ADMIN"])
authorize(request, ["CUSTOMER"])
```

### Role

Role dùng ở cả frontend và backend:

| Role | Quyền |
|---|---|
| CUSTOMER | Đăng ký/login, xem voucher cá nhân, đặt món bằng QR, apply promotion, yêu cầu thanh toán |
| STAFF | Quản lý bàn ở mức vận hành, tạo QR, xem/cập nhật order, hoàn tất payment, xem invoice |
| ADMIN | Toàn quyền staff + quản trị menu/table/user/promotion/report |

### Guard frontend

| App | Guard |
|---|---|
| Customer | Không có guard global; từng trang/component tự kiểm tra khi cần token |
| Staff | `StaffGuard` yêu cầu role STAFF hoặc ADMIN |
| Admin | `AdminShell` yêu cầu role ADMIN |

---

## 10. State Management

### Zustand stores

Project dùng Zustand cho state global đơn giản.

### Customer auth state

File:

```text
customer-app/src/store/auth.ts
```

State:

```text
user
token
hydrated
```

Action:

```text
hydrate()
login(user, token)
logout()
```

Ai dùng:

- `customer-app/src/app/page.tsx`
- `customer-app/src/app/login/page.tsx`
- `customer-app/src/app/order/page.tsx`
- `customer-app/src/app/account/page.tsx`
- `CartDrawer`

### Customer cart state

File:

```text
customer-app/src/store/cart.ts
```

State:

```text
tableId
qrToken
items
hydrated
```

Action:

```text
hydrate()
setTableId(tableId, qrToken)
clearTable()
addItem(item)
updateQty(id, qty)
removeItem(id)
clear()
total()
```

Đặc điểm:

- `tableId` và `qrToken` được lưu localStorage.
- Cart items không được persist xuống localStorage.
- Nếu đổi bàn, store clear items để tránh đặt món nhầm bàn.
- `addItem` dùng `id` làm key chung cho dish/combo. Nếu một dish và một combo có cùng id thì có thể va chạm, dù CUID thực tế thường khác nhau.

### Staff auth state

File:

```text
staff-app/src/store/auth.ts
```

State/action tương tự customer, nhưng localStorage key riêng. Role check nằm ở `StaffGuard`.

### Admin auth state

File:

```text
admin-app/src/store/auth.ts
```

Khác biệt:

- `hydrate()` kiểm tra user có role `ADMIN`.
- Nếu localStorage có user/token nhưng role không phải ADMIN thì clear ngay.

### Local component state

Nhiều state chỉ nằm trong component:

| Component/Page | State cục bộ |
|---|---|
| Customer menu page | menu data, filter, search, selectedTable, QR validity |
| CartDrawer | open state, promos, selectedPromo, submitting |
| Customer order page | orders, promos, selectedPromo, loading, modal |
| Staff tables page | tables, orders, selected table/order, modal state, dismissed bill |
| Staff orders page | orders, mode/filter, optimistic updating set |
| PaymentModal | method, receivedAmount, receipt, submitting |
| Admin DishTable | menu data, active tab, form, editing item/combo/category |
| Admin UserTable | users, form, modal, editing |
| Admin PromotionTable | promotions, form, modal |
| Admin tables page | tables, form, modal |

### Realtime state update

Realtime không lưu global state. Nó gọi callback để page reload API.

Ví dụ:

```text
subscribeRealtime("staff", () => {
    loadData()
})
```

---

## 11. Component

### Customer components

| Component | Vai trò |
|---|---|
| `CustomerBottomNav` | Thanh điều hướng dưới mobile: menu, order, history, account, cart |
| `CartDrawer` | Giỏ hàng trượt lên, hiển thị món đã chọn, voucher, tổng tiền, gửi order |
| `DishCard` | Hiển thị món/combo, ảnh, giá, mô tả, modal chi tiết, nút thêm vào giỏ |
| `OrderStatus` | Hiển thị trạng thái order/món bằng nhãn dễ hiểu |
| `VoucherList` | Hiển thị voucher, trạng thái khả dụng/upcoming/min order |

### Staff components

| Component | Vai trò |
|---|---|
| `StaffGuard` | Bảo vệ staff routes, redirect login nếu chưa đăng nhập/sai role |
| `Sidebar` | Sidebar staff có trong source, nhưng các page hiện tại chủ yếu tự render header/nav |
| `TableGrid` | Lưới bàn, hiển thị trạng thái bàn và select đổi status |
| `QRModal` | Gọi API tạo QR bàn, render QR bằng `QRCodeSVG`, hỗ trợ in QR |
| `OrderDetailModal` | Hiển thị chi tiết order của bàn đang occupied |
| `OrderCard` | Card order, hiển thị items và nút chuyển trạng thái món |
| `PaymentModal` | Hoàn tất thanh toán, tạo receipt, in hóa đơn |

### Admin components

| Component | Vai trò |
|---|---|
| `AdminShell` | Guard admin + layout tổng thể |
| `AdminSidebar` | Sidebar điều hướng dashboard/menu/promotions/tables/users |
| `RevenueChart` | Biểu đồ doanh thu tháng, top món, tỷ lệ combo |
| `DishTable` | Component lớn quản lý dish/combo/category |
| `PromotionTable` | CRUD voucher/promotion |
| `UserTable` | CRUD user |
| `Modal` | Modal dùng chung cho admin forms |

### Component quan trọng nhất theo nghiệp vụ

```text
Customer:
    page.tsx
    CartDrawer
    DishCard
    order/page.tsx

Staff:
    StaffGuard
    tables/page.tsx
    TableGrid
    QRModal
    orders/page.tsx
    PaymentModal

Admin:
    AdminShell
    dashboard/page.tsx
    DishTable
    PromotionTable
    UserTable
    tables/page.tsx
```

---

## 12. Hooks

### Custom hook theo nghĩa React hook riêng

Project không có folder `hooks/` và không thấy custom hook kiểu:

```text
useSomething.ts
```

Tuy nhiên có các hook/state function từ thư viện và Zustand.

### Zustand hooks

Zustand tạo hook trực tiếp:

| Hook | File | Dùng để làm gì |
|---|---|---|
| `useAuthStore` | `customer-app/src/store/auth.ts` | Auth customer |
| `useCartStore` | `customer-app/src/store/cart.ts` | Cart/table/QR customer |
| `useAuthStore` | `staff-app/src/store/auth.ts` | Auth staff |
| `useAuthStore` | `admin-app/src/store/auth.ts` | Auth admin |

### React built-in hooks

Code dùng nhiều:

- `useState`
- `useEffect`
- `useMemo`
- `useCallback`
- `useRef`
- `usePathname`
- `useRouter`
- `useSearchParams`

### Realtime helper không phải hook

File:

```text
src/lib/realtime.ts
```

Hàm:

```text
subscribeRealtime(scope, onChange)
```

Nó trả về hàm cleanup:

```text
return () => {
    unsubscribe()
}
```

Cách dùng giống hook effect:

```text
useEffect(() => {
    return subscribeRealtime("admin", loadData)
}, [loadData])
```

Ai gọi:

- Customer menu/order/history/cart.
- Staff tables/orders/invoice.
- Admin dashboard/menu/promotions/tables/users.

---

## 13. Business Logic

### Logic normalize số điện thoại

File:

```text
backend/src/lib/authValidation.ts
```

Logic:

```text
Remove non-digits
Nếu bắt đầu bằng 84 và đủ dài -> đổi thành 0...
Phone hợp lệ nếu match ^0[35789]\d{8}$
```

Ý nghĩa:

- Cho phép người dùng nhập có dấu cách/ký tự phụ.
- Chuẩn hóa `84...` về `0...`.
- Chỉ nhận đầu số di động Việt Nam phổ biến.

### Logic password

Register customer:

- Backend yêu cầu password tối thiểu 8 ký tự.

Admin tạo/sửa user:

- Password 8-20 ký tự.
- Có ít nhất một chữ cái.
- Có ít nhất một chữ hoa.
- Có ít nhất một chữ số.
- Có ít nhất một ký tự đặc biệt.

### Logic phân quyền

Backend dùng `authorize(request, roles)`:

```text
Không có Bearer token -> 401
Token sai/hết hạn -> 401
Role không nằm trong roles cho phép -> 403
Đúng role -> trả auth.user
```

Ví dụ:

```text
POST /api/menu -> ADMIN
PATCH /api/orders/:id/items -> STAFF hoặc ADMIN
POST /api/promotions/apply -> CUSTOMER
```

### Logic QR bàn

QR token là JWT riêng:

```text
{
    type: "TABLE_QR",
    tableId
}
```

Hết hạn sau 12 giờ.

Quy tắc:

- Staff/admin chỉ tạo QR cho bàn active.
- Không tạo QR nếu bàn có active order.
- Không tạo QR nếu bàn có unpaid invoice.
- Customer đặt món bắt buộc gửi `qrToken`.
- Backend verify token đúng tableId.

### Logic trạng thái bàn

Trạng thái:

```text
EMPTY
OCCUPIED
REQUESTING_BILL
```

Luồng chính:

```text
EMPTY
    |
    | khách đặt món
    v
OCCUPIED
    |
    | khách yêu cầu thanh toán
    v
REQUESTING_BILL
    |
    | staff hoàn tất thanh toán
    v
EMPTY
```

Quy tắc bảo vệ:

- Không cho set `EMPTY` nếu còn active order hoặc unpaid invoice.
- Không cho set non-EMPTY nếu không có active bill.
- `GET /api/tables` còn tự đồng bộ trạng thái response: nếu table raw `EMPTY` nhưng có active order thì response coi là `OCCUPIED`.

### Logic đặt món

Backend không tin giá từ frontend.

Quy tắc:

- Phải có `tableId`.
- Phải có `qrToken` hợp lệ.
- `items` không rỗng.
- Quantity phải là số nguyên >= 1.
- Mỗi item line chỉ được là dish hoặc combo, không được cả hai.
- Dish/combo phải active.
- Giá trong DB phải finite và > 0.
- Nếu bàn đang `REQUESTING_BILL` thì không cho gọi thêm món.
- Nếu có promotion thì phải là customer đã login và userId phải khớp auth.

### Logic order line compatibility

File:

```text
backend/src/lib/orderLines.ts
```

Project lưu chi tiết món ở `orderdetails`, nhưng vẫn có fallback JSON trong `orders.customerNotes`.

Các helper:

| Hàm | Vai trò |
|---|---|
| `packOrderLines()` | Đóng gói note + items vào JSON text trong `customerNotes` |
| `parseOrderLines()` | Đọc JSON từ `customerNotes` nếu tồn tại |
| `mapOrderDetails()` | Chuyển orderdetails thành format frontend |
| `attachOrderItems()` | Gắn `items` vào order response, ưu tiên orderdetails, fallback JSON |

Ý nghĩa:

- Hỗ trợ schema cũ chưa có `orderdetails`.
- Giúp frontend vẫn có items nếu relation query lỗi hoặc dữ liệu cũ.

### Logic trạng thái từng món

Trạng thái món:

```text
WAITING -> PREPARING -> DONE -> SERVED
```

Backend chỉ cho đi đúng một bước:

| Trạng thái hiện tại | Trạng thái tiếp theo hợp lệ |
|---|---|
| `WAITING` | `PREPARING` |
| `PREPARING` | `DONE` |
| `DONE` | `SERVED` |
| `SERVED` | Không có |

Nếu gửi trạng thái không đúng thứ tự, backend trả lỗi.

### Logic promotion

File:

```text
backend/src/lib/promotion.ts
```

Quy tắc:

- Tìm promotion theo id/code, có thử uppercase/lowercase/raw.
- Promotion phải active.
- Nếu chưa tới `startDate` thì không dùng được.
- Nếu `usageLimit` đã hết thì không dùng được.
- Nếu orderAmount < minOrder thì không dùng được.
- Nếu customer đã dùng promotion thì không dùng được.
- Giảm theo `PERCENTAGE` hoặc `FIXED`.
- Nếu có `maxDiscount`, discount bị cap.
- Discount không vượt quá orderAmount.
- Nếu customer chưa có `CustomerPromotion`, backend có thể tạo assignment khi calculate.

Điểm cần chú ý khi đọc code:

- Trong `calculatePromotion`, code có kiểm tra `startDate` nhưng không thấy kiểm tra `endDate`. Admin UI/backend create/update vẫn validate ngày bắt đầu/kết thúc, nhưng khi apply cần xem kỹ vì `endDate` không được chặn rõ trong helper hiện tại.
- `GET /api/promotions` cho customer cũng không lọc rõ promotion đã quá `endDate`; nó chủ yếu lọc active, usage limit và đã dùng.

### Logic checkout

Endpoint:

```text
POST /api/orders/:id/checkout
```

Có hai chế độ:

1. Customer request bill:

```text
body không có complete=true
```

Backend:

- Có thể áp promo.
- Update table `REQUESTING_BILL`.
- Update order status `"REQUESTING_BILL"`.
- Create/update invoice `UNPAID`.

2. Staff complete payment:

```text
body { complete: true, paymentMethod, receivedAmount }
```

Backend:

- Require STAFF/ADMIN.
- Validate tiền nhận >= finalAmount.
- Update order `COMPLETED`.
- Update table `EMPTY`.
- Update promotion usage/customer promotion.
- Create/update invoice `PAID`.
- Create payment `SUCCESS`.

### Logic menu management

Dish:

- Tên không rỗng, tối đa 50 ký tự.
- Giá > 0 và <= 999,999,999.
- Category bắt buộc và phải active.
- Mô tả tối đa 500 ký tự.
- Image phải là http/https URL hoặc `data:image`.
- Delete là soft delete `isActive:false`.

Combo:

- Tên không rỗng.
- Giá hợp lệ.
- Image URL/data image hợp lệ.
- Items nếu có phải là active item.
- Duplicate itemId được merge ở backend.
- Update combo xóa toàn bộ `comboitems` cũ rồi tạo lại.

Category:

- Tên không rỗng.
- `sortOrder` >= 0.
- Delete category sẽ soft delete category và toàn bộ items thuộc category.

### Logic user management

Admin tạo/sửa/xóa user:

- Chỉ ADMIN.
- Phone normalize + validate.
- Role phải là `ADMIN`, `STAFF` hoặc `CUSTOMER`.
- Phone unique.
- Nếu role CUSTOMER thì upsert `Customer`.
- Nếu đổi từ CUSTOMER sang role khác thì customer bị set inactive.
- Không cho admin xóa chính user đang đăng nhập.
- Delete là soft delete `isActive:false`.

### Logic reports

`GET /api/admin/reports`:

- Lấy tối đa 300 order `COMPLETED` gần nhất.
- Tính revenue/order theo tháng dựa trên `createdAt`.
- Tính month-over-month giữa hai tháng gần nhất.
- Tính top dishes theo quantity/revenue từ orderDetails.
- Tính combo ratio = số dòng combo / tổng số dòng.
- Nếu lỗi thì trả empty report thay vì crash.

### Logic security/rate limit

Middleware:

- Rate limit theo IP + method + path.
- Window 60 giây.
- Auth endpoints: 10 requests/phút.
- GET: 300 requests/phút.
- Write requests: 120 requests/phút.
- Gắn các security headers như `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Log AUDIT cho request ghi dữ liệu.

---

## 14. Luồng của từng chức năng

### 14.1 Đăng nhập customer/staff/admin

```text
B1 User nhập số điện thoại và mật khẩu
    |
B2 Frontend gọi apiFetch("/api/auth/login")
    |
B3 Backend normalize phone
    |
B4 Prisma tìm user theo phone
    |
B5 Kiểm tra user active
    |
B6 bcrypt.compare password
    |
B7 Ký JWT 7 ngày
    |
B8 Trả token/user
    |
B9 Frontend lưu Zustand + localStorage
    |
B10 Redirect
```

Điểm khác nhau:

- Staff kiểm tra role `STAFF` hoặc `ADMIN`.
- Admin kiểm tra role `ADMIN`.

### 14.2 Đăng ký khách hàng

```text
B1 Khách mở /login và chuyển register mode
    |
B2 Nhập name/phone/password/confirm
    |
B3 Frontend validate confirm password
    |
B4 POST /api/auth/register
    |
B5 Backend validate phone/password
    |
B6 Check phone unique
    |
B7 Hash password
    |
B8 Create user CUSTOMER + customer
    |
B9 Return JWT
    |
B10 Customer app login state
```

### 14.3 Nhân viên tạo QR bàn

```text
B1 Staff đăng nhập
    |
B2 Mở /tables
    |
B3 Click bàn EMPTY
    |
B4 QRModal gọi GET /api/tables/:id/qr
    |
B5 Backend authorize STAFF/ADMIN
    |
B6 Check table active
    |
B7 Check không có active order/unpaid invoice
    |
B8 Tạo table QR token 12h
    |
B9 Trả customer URL
    |
B10 Staff app render QRCodeSVG
```

### 14.4 Khách vào bàn bằng QR

```text
B1 Khách quét QR
    |
B2 Browser mở customer app URL có tableId và qrToken
    |
B3 Customer page hydrate cart/auth
    |
B4 POST /api/public/qr/validate
    |
B5 Backend verify token
    |
B6 Check table active
    |
B7 Customer app lưu tableId/qrToken
    |
B8 Load menu
```

### 14.5 Xem menu

```text
B1 Customer mở trang /
    |
B2 GET /api/menu
    |
B3 Backend thấy không phải admin
    |
B4 Query active categories/items/combos
    |
B5 Trả menu
    |
B6 Customer app filter/search theo UI
```

Admin xem menu:

```text
B1 Admin mở /menu
    |
B2 GET /api/menu với Bearer ADMIN
    |
B3 Backend trả cả active/inactive
    |
B4 DishTable hiển thị CRUD
```

### 14.6 Thêm món vào giỏ

```text
B1 User click DishCard
    |
B2 Xem modal chi tiết hoặc click thêm
    |
B3 useCartStore.addItem()
    |
B4 Nếu id đã có thì tăng quantity
    |
B5 CartDrawer hiển thị tổng tiền
```

Không gọi backend ở bước này.

### 14.7 Áp voucher trong giỏ

```text
B1 Customer đã login mở CartDrawer
    |
B2 CartDrawer GET /api/promotions
    |
B3 User chọn voucher
    |
B4 Frontend calculateVoucher() để preview discount
    |
B5 Khi submit order, gửi promoCode cho backend
    |
B6 Backend calculatePromotion() lại để đảm bảo đúng
```

Nếu backend reject promo, CartDrawer retry order không có promo trong một số lỗi 400/401/403.

### 14.8 Đặt món

```text
B1 User click Đặt món
    |
B2 CartDrawer kiểm tra có item, tableId, qrToken
    |
B3 Build payload items
    |
B4 POST /api/orders
    |
B5 Backend verify QR
    |
B6 Backend load DB item/combo để lấy giá thật
    |
B7 Tính tổng và discount
    |
B8 Transaction create order + orderdetails + set table OCCUPIED
    |
B9 Response order
    |
B10 Cart clear
```

### 14.9 Khách xem đơn hiện tại

```text
B1 Customer mở /order
    |
B2 GET /api/orders?tableId=...
    |
B3 Backend query active orders của bàn
    |
B4 attachOrderItems()
    |
B5 UI hiển thị order và từng món
```

### 14.10 Khách yêu cầu thanh toán

```text
B1 Customer mở /order
    |
B2 Chọn voucher nếu có
    |
B3 POST /api/orders/:id/checkout
    |
B4 Backend update order/table REQUESTING_BILL
    |
B5 Backend create/update invoice UNPAID
    |
B6 Customer app hiển thị modal đã gửi yêu cầu
    |
B7 Staff app auto thấy bàn REQUESTING_BILL
```

### 14.11 Staff cập nhật trạng thái món

```text
B1 Staff mở /orders
    |
B2 GET /api/orders?view=staff
    |
B3 UI group theo order hoặc item
    |
B4 Staff click chuyển trạng thái
    |
B5 Optimistic UI update
    |
B6 PATCH /api/orders/:id/items
    |
B7 Backend validate transition
    |
B8 Update orderdetail
    |
B9 Reload/refresh
```

### 14.12 Staff hoàn tất thanh toán

```text
B1 Staff mở PaymentModal từ bàn REQUESTING_BILL hoặc invoice pending
    |
B2 Nhập receivedAmount và paymentMethod
    |
B3 POST /api/orders/:id/checkout complete=true
    |
B4 Backend validate payment
    |
B5 Transaction update order/table/promotion usage
    |
B6 Upsert invoice PAID
    |
B7 Create payment SUCCESS
    |
B8 Return receipt
    |
B9 UI cho in hóa đơn
```

### 14.13 Admin quản lý món

```text
B1 Admin mở /menu
    |
B2 DishTable load GET /api/menu
    |
B3 Admin tạo/sửa/xóa dish
    |
B4 Frontend validate form
    |
B5 POST/PATCH/DELETE /api/menu...
    |
B6 Backend validate chặt hơn
    |
B7 Prisma create/update soft delete
    |
B8 Reload menu
```

### 14.14 Admin quản lý combo

```text
B1 Admin chọn tab combo
    |
B2 Chọn món thành phần + quantity
    |
B3 Submit
    |
B4 POST/PATCH /api/menu/combos
    |
B5 Backend merge duplicate itemId
    |
B6 Check item active
    |
B7 Create/update combo + comboitems
```

### 14.15 Admin quản lý category

```text
B1 Admin chọn tab category
    |
B2 Tạo/sửa danh mục
    |
B3 POST/PATCH /api/menu/categories
    |
B4 Delete category
    |
B5 Backend soft delete category và items thuộc category
```

### 14.16 Admin quản lý bàn

```text
B1 Admin mở /tables
    |
B2 GET /api/tables
    |
B3 Tạo/sửa/xóa bàn
    |
B4 Backend validate number/capacity/status
    |
B5 Delete chỉ cho nếu bàn EMPTY và không có bill active
```

### 14.17 Admin quản lý user

```text
B1 Admin mở /users
    |
B2 GET /api/admin/users
    |
B3 Tạo user
    |
B4 Backend validate role/phone/password
    |
B5 Nếu CUSTOMER thì tạo customer
    |
B6 Sửa user
    |
B7 Nếu đổi role không phải CUSTOMER thì customer inactive
    |
B8 Delete user là soft delete
```

### 14.18 Admin quản lý promotion

```text
B1 Admin mở /promotions
    |
B2 GET /api/promotions
    |
B3 Tạo/sửa voucher
    |
B4 Validate code/value/min/max/date/usageLimit
    |
B5 Backend lưu id = code
    |
B6 Delete là set isActive=false
```

### 14.19 Admin xem dashboard

```text
B1 Admin mở /dashboard
    |
B2 GET /api/admin/reports
    |
B3 Backend lấy completed orders
    |
B4 Tính monthly revenue, MoM, top dishes, combo ratio
    |
B5 RevenueChart render chart
```

### 14.20 Customer xem lịch sử

```text
B1 Customer mở /history
    |
B2 GET /api/orders?tableId=...&status=ALL
    |
B3 Backend trả tối đa 30 orders mới nhất của bàn
    |
B4 UI hiển thị list và modal chi tiết
```

---

## 15. Dependency

### Dependency tổng thể

```text
customer-app
    |
    | REST + Bearer token/QR token
    v
backend API
    |
    v
Prisma
    |
    v
Supabase PostgreSQL

staff-app
    |
    v
backend API

admin-app
    |
    v
backend API

customer-app/staff-app/admin-app
    |
    | Supabase client
    v
Supabase Realtime
```

### Backend dependency

```text
API route handlers
    |
    | import
    v
src/lib/apiAuth.ts
src/lib/jwt.ts
src/lib/prisma.ts
src/lib/cors.ts
src/lib/orderLines.ts
src/lib/promotion.ts
src/lib/qrToken.ts
src/lib/authValidation.ts
```

Chi tiết:

| Backend module | Phụ thuộc |
|---|---|
| Auth routes | `prisma`, `bcryptjs`, `jwt`, `authValidation`, `roles` |
| Menu routes | `prisma`, `authorize`, `corsHeaders` |
| Table routes | `prisma`, `authorize`, `qrToken`, `network` |
| Order routes | `prisma`, `authorize`, `qrToken`, `promotion`, `orderLines` |
| Promotion routes | `prisma`, `authorize`, `promotion` |
| Admin reports | `prisma`, `authorize` |
| Middleware | `NextRequest`, `NextResponse`, in-memory Map |

### Customer component dependency

```text
customer app/page.tsx
    |
    +-- CustomerBottomNav
    |       |
    |       +-- CartDrawer
    |              |
    |              +-- VoucherList
    |
    +-- DishCard
    |
    +-- useAuthStore
    +-- useCartStore
    +-- apiFetch
    +-- subscribeRealtime
```

```text
customer order/page.tsx
    |
    +-- OrderStatus
    +-- VoucherList
    +-- CustomerBottomNav
    +-- apiFetch
    +-- subscribeRealtime
```

### Staff component dependency

```text
staff layout.tsx
    |
    +-- StaffGuard
            |
            +-- children pages
```

```text
staff tables/page.tsx
    |
    +-- TableGrid
    +-- QRModal
    +-- OrderDetailModal
    +-- PaymentModal
    +-- apiFetch
    +-- subscribeRealtime
```

```text
staff orders/page.tsx
    |
    +-- OrderCard
    +-- apiFetch
    +-- subscribeRealtime
```

```text
staff invoice/page.tsx
    |
    +-- PaymentModal
    +-- apiFetch
    +-- subscribeRealtime
```

### Admin component dependency

```text
admin layout.tsx
    |
    +-- AdminShell
            |
            +-- AdminSidebar
            +-- children pages
```

```text
admin dashboard/page.tsx
    |
    +-- RevenueChart
    +-- apiFetch
    +-- subscribeRealtime
```

```text
admin menu/page.tsx
    |
    +-- DishTable
            |
            +-- Modal-like internal forms
            +-- apiFetch
            +-- subscribeRealtime
```

```text
admin users/page.tsx
    |
    +-- UserTable
            |
            +-- Modal
            +-- apiFetch
            +-- subscribeRealtime
```

```text
admin promotions/page.tsx
    |
    +-- PromotionTable
            |
            +-- apiFetch
            +-- subscribeRealtime
```

### Trang nào gọi API nào

| Trang | API chính |
|---|---|
| Customer `/` | `/api/menu`, `/api/public/tables`, `/api/public/qr/validate` |
| Customer `/login` | `/api/auth/login`, `/api/auth/register` |
| Customer `/order` | `/api/orders`, `/api/promotions`, `/api/promotions/apply`, `/api/orders/:id/checkout` |
| Customer `/history` | `/api/orders?status=ALL` |
| Staff `/login` | `/api/auth/login` |
| Staff `/tables` | `/api/tables`, `/api/orders?view=staff`, `/api/tables/:id`, `/api/tables/:id/qr` |
| Staff `/orders` | `/api/orders?view=staff`, `/api/orders/:id/items` |
| Staff `/invoice` | `/api/orders?view=staff`, `/api/invoices`, `/api/orders/:id/checkout` |
| Admin `/login` | `/api/auth/login` |
| Admin `/dashboard` | `/api/admin/reports` |
| Admin `/menu` | `/api/menu`, `/api/menu/combos`, `/api/menu/categories` |
| Admin `/promotions` | `/api/promotions` |
| Admin `/tables` | `/api/tables` |
| Admin `/users` | `/api/admin/users` |

---

## 16. File quan trọng

| STT | File | Vai trò |
|---:|---|---|
| 1 | `README.md` | Hướng dẫn chạy 4 app, port, env, deploy, tài khoản demo |
| 2 | `backend/package.json` | Khai báo dependency backend: Next, Prisma, Supabase, JWT, bcrypt |
| 3 | `backend/prisma/schema.prisma` | Trung tâm dữ liệu: model, enum, relation, mapping bảng/cột |
| 4 | `backend/prisma/seed.ts` | Seed roles, categories, items, combos, tables, users, promotions |
| 5 | `backend/prisma/add_missing_physical_tables_14.sql` | SQL thêm các bảng vật lý còn thiếu như orderdetails/comboitems/customerpromotions |
| 6 | `backend/prisma/le_monde_app_compatibility_11_tables.sql` | SQL compatibility cho schema cũ |
| 7 | `backend/prisma/enable_supabase_realtime.sql` | Bật Supabase Realtime cho các bảng |
| 8 | `backend/prisma/performance_indexes.sql` | Index tối ưu query |
| 9 | `backend/src/middleware.ts` | Rate limit, security headers, CORS, audit log |
| 10 | `backend/src/lib/prisma.ts` | Prisma singleton tránh tạo nhiều connection khi dev |
| 11 | `backend/src/lib/apiAuth.ts` | Đọc Bearer token, verify JWT, check role |
| 12 | `backend/src/lib/jwt.ts` | Ký và verify JWT user |
| 13 | `backend/src/lib/authValidation.ts` | Normalize/validate số điện thoại |
| 14 | `backend/src/lib/qrToken.ts` | Tạo/verify QR token cho bàn |
| 15 | `backend/src/lib/promotion.ts` | Tính promotion/discount và validate voucher |
| 16 | `backend/src/lib/orderLines.ts` | Mapping orderdetails và fallback JSON trong customerNotes |
| 17 | `backend/src/app/api/auth/login/route.ts` | API đăng nhập |
| 18 | `backend/src/app/api/auth/register/route.ts` | API đăng ký customer |
| 19 | `backend/src/app/api/menu/route.ts` | GET menu public/admin và create dish |
| 20 | `backend/src/app/api/orders/route.ts` | Tạo order và list orders |
| 21 | `backend/src/app/api/orders/[id]/checkout/route.ts` | Customer request bill và staff complete payment |
| 22 | `backend/src/app/api/orders/[id]/items/route.ts` | Cập nhật trạng thái từng món |
| 23 | `backend/src/app/api/tables/route.ts` | List/create table và sync trạng thái bàn |
| 24 | `backend/src/app/api/tables/[id]/route.ts` | Update/delete table với rule active bill |
| 25 | `backend/src/app/api/tables/[id]/qr/route.ts` | Tạo QR URL cho bàn |
| 26 | `backend/src/app/api/promotions/route.ts` | List/create promotion theo role |
| 27 | `backend/src/app/api/promotions/apply/route.ts` | Customer apply voucher |
| 28 | `backend/src/app/api/admin/users/route.ts` | Admin list/create user |
| 29 | `backend/src/app/api/admin/reports/route.ts` | Dashboard report |
| 30 | `backend/src/app/api/invoices/route.ts` | Staff xem hóa đơn paid |
| 31 | `customer-app/src/lib/api.ts` | Wrapper fetch customer |
| 32 | `customer-app/src/store/cart.ts` | Cart/table/QR global state |
| 33 | `customer-app/src/app/page.tsx` | Trang menu chính, validate QR |
| 34 | `customer-app/src/components/cart/CartDrawer.tsx` | Đặt món, voucher, gửi order |
| 35 | `customer-app/src/app/order/page.tsx` | Xem đơn hiện tại, apply promo, request bill |
| 36 | `staff-app/src/components/layout/StaffGuard.tsx` | Guard staff routes |
| 37 | `staff-app/src/app/tables/page.tsx` | Màn hình vận hành bàn |
| 38 | `staff-app/src/app/orders/page.tsx` | Màn hình cập nhật trạng thái món |
| 39 | `staff-app/src/components/payments/PaymentModal.tsx` | Hoàn tất thanh toán và receipt |
| 40 | `admin-app/src/components/layout/AdminShell.tsx` | Guard/layout admin |
| 41 | `admin-app/src/components/menu/DishTable.tsx` | CRUD menu lớn nhất |
| 42 | `admin-app/src/components/users/UserTable.tsx` | CRUD user |
| 43 | `admin-app/src/components/promotions/PromotionTable.tsx` | CRUD promotion |
| 44 | `admin-app/src/components/dashboard/RevenueChart.tsx` | Chart dashboard |

---

## 17. Những điểm khó hiểu

### 1. `Order.status` trong Prisma là String dù có enum `OrderStatus`

Trong schema có enum:

```text
PENDING, CONFIRMED, COMPLETED, CANCELLED
```

Nhưng model `Order.status` là `String`, không phải enum. Code lại dùng thêm `"REQUESTING_BILL"`.

Giải thích dễ hiểu:

Project cần trạng thái order `REQUESTING_BILL` để biểu diễn "khách đã gọi thanh toán", nhưng enum cũ không có giá trị này. Vì vậy field được để String để lưu được giá trị ngoài enum.

### 2. Vừa có `orderdetails`, vừa có JSON trong `customerNotes`

Người mới đọc sẽ hỏi: tại sao chi tiết order không chỉ nằm trong `orderdetails`?

Lý do từ code:

- Source có helper `packOrderLines()` và `parseOrderLines()`.
- Các SQL compatibility cho thấy schema đã được nâng cấp từ hệ cũ.
- Backend cố gắng create `orderdetails`; nếu lỗi thì vẫn còn dữ liệu packed JSON trong `customerNotes`.

Hiểu đơn giản:

```text
orderdetails = cách lưu mới, chuẩn hơn
customerNotes JSON = phao cứu sinh/tương thích dữ liệu cũ
```

### 3. Một endpoint checkout làm hai việc

`POST /api/orders/:id/checkout` có hai ý nghĩa:

```text
Không có complete=true
    -> khách yêu cầu thanh toán

Có complete=true
    -> nhân viên hoàn tất thanh toán
```

Điều này tiết kiệm endpoint nhưng dễ gây nhầm. Khi đọc code, phải nhìn body `complete`.

### 4. Backend có `/api/realtime` nhưng frontend không dùng

Backend có SSE endpoint rất kỹ:

```text
GET /api/realtime?scope=customer|staff|admin
```

Nhưng frontend lại dùng Supabase Realtime trong `src/lib/realtime.ts`.

Hiểu đơn giản:

- `/api/realtime` là một phương án realtime backend tự làm.
- Frontend hiện tại chọn Supabase Realtime + polling.
- Vì vậy đừng nghĩ `/api/realtime` đang chạy trong UI hiện tại.

### 5. Public/admin cùng dùng `GET /api/menu`

Cùng một endpoint nhưng output khác nhau theo Authorization:

```text
Không có ADMIN token
    -> chỉ active menu

Có ADMIN token
    -> cả active và inactive
```

Điểm này quan trọng vì admin app dùng cùng API với customer nhưng gửi token.

### 6. Promotion code chính là `id`

Promotion không có field `code` riêng trong database. Backend dùng:

```text
promotion.id = code
```

Khi trả ra frontend, backend expose thêm:

```text
code: promotion.id
```

Sinh viên mới đọc có thể tưởng thiếu cột `code`, nhưng thật ra code nằm ở primary key.

### 7. Promotion có `endDate` nhưng helper apply chưa kiểm tra rõ

Admin form có start/end date. Backend create/update validate end >= start. Nhưng helper `calculatePromotion()` khi đọc code thấy kiểm tra `startDate`, `usageLimit`, `minOrder`, `isUsed`, nhưng không thấy check `endDate` đã qua.

Đây là điểm nên review nếu project cần chính xác về hạn voucher.

### 8. `api.ts` có cache map nhưng cache duration trả 0

Trong frontend wrappers có in-memory cache object, nhưng hàm cache duration hiện trả 0. Nghĩa là cache gần như không hoạt động.

Hiểu đơn giản:

```text
Có khung cache
Nhưng đang tắt bằng duration = 0
```

### 9. Account page customer chỉ sửa local

Customer `/account` cập nhật user trong Zustand/localStorage bằng `login(updatedUser, token)`, không thấy gọi API update profile. Vì vậy thay đổi có thể chỉ là local UI, không bền trong database.

### 10. Staff có `Sidebar` nhưng layout hiện dùng guard/header riêng

`staff-app/src/components/layout/Sidebar.tsx` tồn tại, nhưng các trang staff hiện render nav/header trực tiếp. Đây có thể là component dư từ iteration trước hoặc chưa tích hợp.

### 11. Nhiều file SQL phản ánh lịch sử tiến hóa database

Trong `backend/prisma` có:

- schema/seed mới.
- SQL Supabase cũ.
- SQL official menu.
- SQL compatibility 11 tables.
- SQL add missing physical tables 14.

Khi đọc database phải ưu tiên `schema.prisma` cho code hiện tại, sau đó đọc SQL để hiểu migration/seed/lịch sử.

### 12. Bàn có status trong DB nhưng `GET /api/tables` còn tính status động

Nếu DB table đang `EMPTY` nhưng có active order, API trả về `OCCUPIED`. Nếu DB table đang `OCCUPIED` nhưng không có active order, API response có thể trả `EMPTY`.

Hiểu đơn giản:

```text
DB status = trạng thái lưu
API status = trạng thái đã sửa theo order thực tế
```

---

## 18. Roadmap đọc project

Nếu muốn hiểu project nhanh nhất, nên đọc theo thứ tự sau:

1. `README.md`
2. `backend/prisma/schema.prisma`
3. `backend/prisma/seed.ts`
4. `backend/src/lib/prisma.ts`
5. `backend/src/lib/jwt.ts`
6. `backend/src/lib/apiAuth.ts`
7. `backend/src/lib/authValidation.ts`
8. `backend/src/lib/qrToken.ts`
9. `backend/src/lib/orderLines.ts`
10. `backend/src/lib/promotion.ts`
11. `backend/src/middleware.ts`
12. `backend/src/app/api/auth/login/route.ts`
13. `backend/src/app/api/auth/register/route.ts`
14. `backend/src/app/api/menu/route.ts`
15. `backend/src/app/api/orders/route.ts`
16. `backend/src/app/api/orders/[id]/checkout/route.ts`
17. `backend/src/app/api/orders/[id]/items/route.ts`
18. `backend/src/app/api/tables/route.ts`
19. `backend/src/app/api/tables/[id]/route.ts`
20. `backend/src/app/api/tables/[id]/qr/route.ts`
21. `backend/src/app/api/promotions/route.ts`
22. `backend/src/app/api/promotions/apply/route.ts`
23. `backend/src/app/api/admin/users/route.ts`
24. `backend/src/app/api/admin/reports/route.ts`
25. `customer-app/src/lib/api.ts`
26. `customer-app/src/store/auth.ts`
27. `customer-app/src/store/cart.ts`
28. `customer-app/src/app/page.tsx`
29. `customer-app/src/components/cart/CartDrawer.tsx`
30. `customer-app/src/app/order/page.tsx`
31. `staff-app/src/store/auth.ts`
32. `staff-app/src/components/layout/StaffGuard.tsx`
33. `staff-app/src/app/tables/page.tsx`
34. `staff-app/src/components/tables/QRModal.tsx`
35. `staff-app/src/app/orders/page.tsx`
36. `staff-app/src/components/payments/PaymentModal.tsx`
37. `admin-app/src/store/auth.ts`
38. `admin-app/src/components/layout/AdminShell.tsx`
39. `admin-app/src/app/dashboard/page.tsx`
40. `admin-app/src/components/menu/DishTable.tsx`
41. `admin-app/src/components/promotions/PromotionTable.tsx`
42. `admin-app/src/components/users/UserTable.tsx`
43. `admin-app/src/app/tables/page.tsx`
44. `src/lib/realtime.ts` trong từng frontend để hiểu refresh/realtime.

Nếu chỉ có 2 giờ để đọc:

```text
README
    |
schema.prisma
    |
auth/login/register
    |
orders route + checkout
    |
tables route + QR route
    |
customer page + CartDrawer
    |
staff tables/orders + PaymentModal
    |
admin DishTable/UserTable/PromotionTable
```

---

## 19. Từ điển project

| Thuật ngữ | Nghĩa trong project |
|---|---|
| Backend | Next.js project `backend`, chạy API ở port 4000 |
| Customer app | Frontend cho khách gọi món, port 3000 |
| Staff app | Frontend cho nhân viên, port 3001 |
| Admin app | Frontend cho quản trị, port 3002 |
| API route | File `route.ts` trong Next App Router, xử lý HTTP request |
| Route handler | Hàm `GET`, `POST`, `PATCH`, `DELETE` export từ `route.ts` |
| Middleware | `backend/src/middleware.ts`, chạy trước API để CORS/rate-limit/security |
| Prisma | ORM dùng để query PostgreSQL |
| Model | Định nghĩa bảng/entity trong `schema.prisma` |
| `@map` | Prisma mapping field sang tên cột vật lý khác |
| `@@map` | Prisma mapping model sang tên bảng vật lý khác |
| Supabase | Cloud PostgreSQL và realtime provider |
| Supabase Realtime | Cơ chế subscribe thay đổi DB để frontend refresh |
| JWT | Token đăng nhập user, gửi qua Bearer Authorization |
| QR token | JWT riêng cho bàn, payload type `TABLE_QR`, hết hạn 12h |
| Bearer token | Header `Authorization: Bearer <token>` |
| Role | Quyền user: CUSTOMER/STAFF/ADMIN |
| Guard | Component frontend chặn route nếu chưa login/sai role |
| Zustand | Thư viện state management lưu auth/cart |
| Cart | Giỏ hàng customer, gồm dish/combo và quantity |
| Table | Bàn nhà hàng |
| Table status | Trạng thái bàn: EMPTY/OCCUPIED/REQUESTING_BILL |
| Order | Đơn gọi món của một bàn |
| Order detail | Từng món/combo trong order |
| Item | Món lẻ trong menu |
| Category | Danh mục món |
| Combo | Gói combo gồm nhiều item |
| Combo item | Dòng liên kết combo và item |
| Invoice | Hóa đơn sau khi khách yêu cầu/hoàn tất thanh toán |
| Payment | Bản ghi giao dịch thanh toán |
| Promotion | Voucher/khuyến mãi |
| CustomerPromotion | Bảng đánh dấu voucher được gán/đã dùng bởi customer |
| Soft delete | Không xóa vật lý, chỉ set `isActive=false` |
| Active order | Order chưa `COMPLETED` và chưa `CANCELLED` |
| Request bill | Khách yêu cầu thanh toán, table/order chuyển `REQUESTING_BILL` |
| Checkout | Trong code vừa nghĩa request bill vừa nghĩa complete payment tùy body |
| Packed order lines | JSON chứa items được lưu trong `customerNotes` để tương thích |
| Fallback | Cách xử lý dự phòng nếu dữ liệu mới chưa có hoặc query relation lỗi |
| Polling | Gọi API lặp lại theo interval để refresh dữ liệu |
| SSE | Server-Sent Events, backend có `/api/realtime` nhưng frontend không dùng |
| Rate limit | Giới hạn số request trong 60 giây theo IP/path/method |
| Audit log | Log request ghi dữ liệu trong middleware |
| CORS | Header cho phép frontend khác origin gọi backend |
| Vercel | Cloud deploy được README hướng dẫn |
| Cloudinary | Được nhắc trong env example cho ảnh, nhưng không thấy code upload |
| `apiFetch` | Wrapper fetch trong từng frontend |
| `subscribeRealtime` | Helper frontend subscribe Supabase + polling fallback |

---

## 20. Tổng kết: Nếu phải giải thích project này trong 15 phút

Nếu hướng dẫn một lập trình viên mới vào team, có thể nói như sau:

Project Le Monde Steak là một hệ thống gọi món bằng QR cho nhà hàng. Nó gồm bốn Next.js app riêng. `backend` chạy API ở port 4000 và nói chuyện với Supabase PostgreSQL qua Prisma. `customer-app` là giao diện mobile cho khách. `staff-app` là giao diện vận hành cho nhân viên. `admin-app` là giao diện quản trị cho quản lý.

Luồng quan trọng nhất bắt đầu từ bàn. Nhân viên đăng nhập staff app, chọn một bàn đang `EMPTY`, tạo QR. QR chứa `tableId` và `qrToken`. Khách quét QR, customer app gọi backend để validate QR. Nếu hợp lệ, app lưu `tableId` và `qrToken`, load menu từ `/api/menu`, khách thêm món vào giỏ và gửi order qua `/api/orders`.

Backend khi tạo order không tin dữ liệu giá từ frontend. Nó verify QR token, load item/combo từ database, tự tính tiền, tự tính promotion nếu có, rồi trong transaction tạo `orders`, tạo `orderdetails`, và chuyển bàn sang `OCCUPIED`. Staff app nhờ realtime/polling sẽ thấy order mới. Nhân viên bấm chuyển trạng thái từng món theo chuỗi `WAITING -> PREPARING -> DONE -> SERVED`.

Khi khách muốn thanh toán, customer app gọi `/api/orders/:id/checkout` nhưng không gửi `complete=true`. Backend hiểu đây là yêu cầu thanh toán, chuyển order và table sang `REQUESTING_BILL`, đồng thời tạo hoặc cập nhật invoice `UNPAID`. Staff app thấy bàn đang yêu cầu thanh toán và mở `PaymentModal`. Khi nhân viên nhận tiền, staff app gọi lại cùng endpoint checkout nhưng body có `complete:true`, `paymentMethod`, `receivedAmount`. Backend validate tiền, chuyển order sang `COMPLETED`, bàn về `EMPTY`, invoice sang `PAID`, tạo payment `SUCCESS`, cập nhật lượt dùng promotion nếu có.

Admin app quản lý dữ liệu nền của hệ thống. Admin có thể CRUD user, bàn, danh mục, món, combo, voucher và xem dashboard. Hầu hết delete trong hệ thống là soft delete bằng `isActive=false`, để không phá lịch sử order/invoice.

Về authentication, project không dùng NextAuth mà tự làm JWT. Login bằng phone/password, password được hash bằng bcrypt. JWT chứa id/role/name, hết hạn 7 ngày, frontend lưu ở localStorage qua Zustand. Backend route nào cần quyền sẽ gọi `authorize()`. Middleware backend không phân quyền, nó chỉ làm CORS, rate limit, security headers và audit log.

Về database, đọc `backend/prisma/schema.prisma` là quan trọng nhất. Các bảng chính là `users`, `customers`, `tables`, `categories`, `items`, `combos`, `comboitems`, `orders`, `orderdetails`, `promotions`, `customerpromotions`, `invoices`, `payments`, `roles`. Có nhiều `@map` và `@@map`, nghĩa là Prisma model đang tương thích với tên bảng/cột vật lý cũ. Vì vậy khi debug database phải nhìn cả model name lẫn mapped column/table name.

Về frontend, customer quan trọng nhất là `page.tsx`, `CartDrawer`, `order/page.tsx`, `cart.ts`. Staff quan trọng nhất là `tables/page.tsx`, `orders/page.tsx`, `PaymentModal`, `QRModal`. Admin quan trọng nhất là `DishTable`, `PromotionTable`, `UserTable`, `dashboard/page.tsx`. Ba frontend đều gọi backend qua `src/lib/api.ts` và đều có `src/lib/realtime.ts` để subscribe Supabase Realtime cộng với polling fallback.

Nếu cần sửa hoặc mở rộng project, hãy bắt đầu từ nghiệp vụ trong backend route, sau đó kiểm tra frontend nào gọi route đó. Ví dụ sửa thanh toán thì đọc `orders/[id]/checkout/route.ts`, `PaymentModal`, customer `order/page.tsx`, staff `invoice/page.tsx`. Sửa menu thì đọc `menu/route.ts`, combo/category routes và admin `DishTable`, rồi kiểm tra customer `page.tsx`/`DishCard`.

Tóm lại, project này có kiến trúc dễ hiểu ở mức hệ thống:

```text
Customer/Staff/Admin Next.js UI
    |
    v
Next.js Backend API
    |
    v
Prisma
    |
    v
Supabase PostgreSQL
```

Điểm cần nắm thật chắc là lifecycle của một bàn:

```text
EMPTY
    -> QR được tạo
    -> khách đặt món
OCCUPIED
    -> món được chuẩn bị/phục vụ
    -> khách yêu cầu thanh toán
REQUESTING_BILL
    -> staff thu tiền
EMPTY
```

Nắm được vòng đời này, cộng với cách JWT role hoạt động và các bảng order/invoice/payment liên kết với nhau, là đã hiểu được phần lõi của toàn bộ hệ thống.
