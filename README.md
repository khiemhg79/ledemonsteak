# Le Monde Steak — Workspace

Hệ thống đặt món qua QR gồm 4 project độc lập:

| Folder         | Port | Vai trò                          |
|----------------|------|----------------------------------|
| `backend`      | 4000 | API server duy nhất (Next.js)    |
| `customer-app` | 3000 | Web mobile — khách quét QR       |
| `staff-app`    | 3001 | Web desktop — nhân viên & bếp    |
| `admin-app`    | 3002 | Web desktop — quản trị viên      |

## Cách chạy

```bash
# 1. Setup backend
cd backend
cp .env.example .env.local   # điền Supabase URL + key + JWT_SECRET
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev                  # → http://localhost:4000

# 2. Customer app
cd customer-app
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # → http://localhost:3000

# 3. Staff app
cd staff-app
cp .env.example .env.local
npm install
npm run dev                  # → http://localhost:3001

# 4. Admin app
cd admin-app
cp .env.example .env.local
npm install
npm run dev                  # → http://localhost:3002
```

## Tài khoản mẫu (sau khi seed)
| Role      | Phone       | Password  |
|-----------|-------------|-----------|
| Admin     | 0900000001  | Admin@123 |
| Nhân viên | 0900000002  | Admin@123 |
| Khách     | 0900000003  | Admin@123 |

## Cách liên kết 3 frontend với backend
Tất cả gọi API qua biến môi trường `NEXT_PUBLIC_API_URL`.
Backend xử lý CORS, cho phép cả 3 origin gọi vào.

## Deploy Vercel để QR dùng trên Internet

Đưa toàn bộ workspace lên một GitHub repository, sau đó import cùng repository đó thành 4 Vercel project:

| Vercel project | Root Directory | Biến môi trường |
|---|---|---|
| `le-monde-steak-api` | `backend` | `DATABASE_URL`, `JWT_SECRET`, `CUSTOMER_APP_URL`, `BACKEND_PUBLIC_URL` |
| `le-monde-steak-customer` | `customer-app` | `NEXT_PUBLIC_API_URL` |
| `le-monde-steak-staff` | `staff-app` | `NEXT_PUBLIC_API_URL` |
| `le-monde-steak-admin` | `admin-app` | `NEXT_PUBLIC_API_URL` |

Thứ tự triển khai:

1. Deploy `backend` trước với `DATABASE_URL` Supabase và `JWT_SECRET`.
2. Lấy domain backend, ví dụ `https://le-monde-steak-api.vercel.app`.
3. Deploy ba frontend; đặt `NEXT_PUBLIC_API_URL` bằng domain backend.
4. Lấy domain customer, rồi cập nhật backend:
   - `CUSTOMER_APP_URL=https://domain-customer.vercel.app`
   - `BACKEND_PUBLIC_URL=https://domain-backend.vercel.app`
5. Redeploy backend. QR staff từ đây chứa domain HTTPS customer và không phụ thuộc Wi-Fi/IP máy.

Không commit `.env` hoặc `.env.local` lên GitHub. Chỉ nhập giá trị bí mật trong Vercel Project Settings > Environment Variables.
