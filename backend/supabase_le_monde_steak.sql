-- Le Monde Steak - Supabase PostgreSQL schema + seed data
-- Mục tiêu: cấu trúc bảng giống hệ thống Ushi Mania mẫu.
-- Cách dùng: Supabase Dashboard -> SQL Editor -> New query -> dán toàn bộ file -> Run.

create extension if not exists "pgcrypto";

do $$ begin
  create type "Role" as enum ('CUSTOMER', 'STAFF', 'ADMIN');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "TableStatus" as enum ('EMPTY', 'OCCUPIED', 'REQUESTING_BILL');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "OrderStatus" as enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "OrderDetailStatus" as enum ('WAITING', 'PREPARING', 'DONE', 'SERVED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "DiscountType" as enum ('PERCENTAGE', 'FIXED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "InvoiceStatus" as enum ('UNPAID', 'PAID', 'CANCELLED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "PaymentStatus" as enum ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type "PaymentMethod" as enum ('CASH', 'BANK_TRANSFER', 'CARD', 'E_WALLET');
exception when duplicate_object then null;
end $$;

-- Bảng phân quyền đăng nhập cho 3 web: customer-app, staff-app, admin-app.
-- Bảng này bổ sung để code hiện tại chạy được, còn các bảng nghiệp vụ bên dưới giữ tên giống Ushi Mania.
create table if not exists "users" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "phone" text not null unique,
  "password" text not null,
  "email" text,
  "role" "Role" not null default 'CUSTOMER',
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create table if not exists "customers" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text unique references "users"("id") on update cascade on delete set null,
  "name" text not null,
  "phone" text not null unique,
  "email" text,
  "address" text,
  "birthday" date,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "tables" (
  "id" text primary key default gen_random_uuid()::text,
  "number" text not null unique,
  "capacity" integer not null default 2,
  "status" "TableStatus" not null default 'EMPTY',
  "isActive" boolean not null default true
);

create table if not exists "categories" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "desc" text,
  "sortOrder" integer not null default 0,
  "isActive" boolean not null default true
);

create table if not exists "items" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "price" double precision not null,
  "description" text,
  "image" text,
  "isActive" boolean not null default true,
  "categoryId" text not null references "categories"("id") on update cascade on delete restrict
);

create table if not exists "combos" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "price" double precision not null,
  "description" text,
  "image" text,
  "isActive" boolean not null default true
);

create table if not exists "comboitems" (
  "id" text primary key default gen_random_uuid()::text,
  "comboId" text not null references "combos"("id") on update cascade on delete cascade,
  "itemId" text not null references "items"("id") on update cascade on delete restrict,
  "quantity" integer not null default 1
);

create table if not exists "promotions" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "code" text not null unique,
  "discountType" "DiscountType" not null,
  "discountValue" double precision not null,
  "minOrder" double precision not null default 0,
  "maxDiscount" double precision,
  "usageLimit" integer,
  "usageCount" integer not null default 0,
  "startDate" timestamptz not null,
  "endDate" timestamptz not null,
  "isActive" boolean not null default true,
  "description" text
);

create table if not exists "customerpromotions" (
  "id" text primary key default gen_random_uuid()::text,
  "customerId" text not null references "customers"("id") on update cascade on delete cascade,
  "promotionId" text not null references "promotions"("id") on update cascade on delete cascade,
  "isUsed" boolean not null default false,
  "usedAt" timestamptz,
  "assignedAt" timestamptz not null default now(),
  constraint "customerpromotions_customer_promotion_unique" unique ("customerId", "promotionId")
);

create table if not exists "orders" (
  "id" text primary key default gen_random_uuid()::text,
  "tableId" text not null references "tables"("id") on update cascade on delete restrict,
  "userId" text references "users"("id") on update cascade on delete set null,
  "customerId" text references "customers"("id") on update cascade on delete set null,
  "status" "OrderStatus" not null default 'PENDING',
  "totalAmount" double precision not null default 0,
  "discount" double precision not null default 0,
  "finalAmount" double precision not null default 0,
  "promoCode" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "orderdetails" (
  "id" text primary key default gen_random_uuid()::text,
  "orderId" text not null references "orders"("id") on update cascade on delete cascade,
  "itemId" text references "items"("id") on update cascade on delete restrict,
  "comboId" text references "combos"("id") on update cascade on delete restrict,
  "quantity" integer not null,
  "price" double precision not null,
  "status" "OrderDetailStatus" not null default 'WAITING',
  constraint "orderdetails_item_or_combo_check" check (
    ("itemId" is not null and "comboId" is null)
    or ("itemId" is null and "comboId" is not null)
  )
);

create table if not exists "invoices" (
  "id" text primary key default gen_random_uuid()::text,
  "invoiceCode" text not null unique,
  "orderId" text not null unique references "orders"("id") on update cascade on delete cascade,
  "customerId" text references "customers"("id") on update cascade on delete set null,
  "tableId" text not null references "tables"("id") on update cascade on delete restrict,
  "subtotal" double precision not null default 0,
  "discount" double precision not null default 0,
  "total" double precision not null default 0,
  "status" "InvoiceStatus" not null default 'UNPAID',
  "issuedAt" timestamptz not null default now(),
  "paidAt" timestamptz,
  "note" text
);

create table if not exists "payments" (
  "id" text primary key default gen_random_uuid()::text,
  "invoiceId" text not null references "invoices"("id") on update cascade on delete cascade,
  "orderId" text not null references "orders"("id") on update cascade on delete cascade,
  "method" "PaymentMethod" not null default 'CASH',
  "amount" double precision not null,
  "status" "PaymentStatus" not null default 'PENDING',
  "paidAt" timestamptz,
  "transactionCode" text,
  "createdAt" timestamptz not null default now()
);

create index if not exists "customers_userId_idx" on "customers"("userId");
create index if not exists "items_categoryId_idx" on "items"("categoryId");
create index if not exists "comboitems_comboId_idx" on "comboitems"("comboId");
create index if not exists "comboitems_itemId_idx" on "comboitems"("itemId");
create index if not exists "customerpromotions_customerId_idx" on "customerpromotions"("customerId");
create index if not exists "customerpromotions_promotionId_idx" on "customerpromotions"("promotionId");
create index if not exists "orders_tableId_idx" on "orders"("tableId");
create index if not exists "orders_userId_idx" on "orders"("userId");
create index if not exists "orders_customerId_idx" on "orders"("customerId");
create index if not exists "orderdetails_orderId_idx" on "orderdetails"("orderId");
create index if not exists "orderdetails_itemId_idx" on "orderdetails"("itemId");
create index if not exists "orderdetails_comboId_idx" on "orderdetails"("comboId");
create index if not exists "invoices_orderId_idx" on "invoices"("orderId");
create index if not exists "invoices_customerId_idx" on "invoices"("customerId");
create index if not exists "payments_invoiceId_idx" on "payments"("invoiceId");
create index if not exists "payments_orderId_idx" on "payments"("orderId");

create or replace function set_updated_at()
returns trigger as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists "orders_set_updated_at" on "orders";
create trigger "orders_set_updated_at"
before update on "orders"
for each row
execute function set_updated_at();

drop trigger if exists "customers_set_updated_at" on "customers";
create trigger "customers_set_updated_at"
before update on "customers"
for each row
execute function set_updated_at();

-- Seed data
insert into "categories" ("id", "name", "desc", "sortOrder", "isActive") values
  ('cat_do_chien', 'Đồ chiên', 'Các món ăn khai vị và món chiên', 1, true),
  ('cat_gu_steak_co_dien', 'Gu Steak Cổ Điển', 'Các phần steak phong cách cổ điển', 2, true),
  ('cat_gu_steak_dong_vui', 'Gu Steak Đông Vui', 'Set steak dùng chung cho nhóm', 3, true),
  ('cat_gu_steak_sang_tao', 'Gu Steak Sáng Tạo', 'Các món steak biến tấu hiện đại', 4, true),
  ('cat_pasta', 'Pasta', 'Mì Ý và sốt Âu', 5, true),
  ('cat_pizza', 'Pizza', 'Pizza dùng kèm steak', 6, true),
  ('cat_salad', 'Salad', 'Salad và món rau', 7, true),
  ('cat_dessert', 'Tráng miệng', 'Món ngọt sau bữa chính', 8, true)
on conflict ("id") do nothing;

insert into "items" ("id", "name", "price", "categoryId", "description", "image", "isActive") values
  ('item_steak_mini_teriyaki', 'Steak mini thăn bò ngoài sốt Teriyaki', 169000, 'cat_do_chien', 'Steak mini ăn nhẹ cùng sốt Teriyaki', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577535/Steak_mini_thanbongoaisotteriyaki_o2p0dz.png', true),
  ('item_kid_combo', 'Kid combo cơm phô mai bò băm', 129000, 'cat_do_chien', 'Combo nhỏ cho trẻ em', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577534/kidcombo_comphomaibobam_zqlbm2.png', true),
  ('item_steak_diane', 'Steak Diane', 329000, 'cat_gu_steak_co_dien', 'Steak cổ điển dùng cùng sốt Diane', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577601/steakdiane_ojqbzq.png', true),
  ('item_steak_de_bistro', 'Steak de Bistro', 349000, 'cat_gu_steak_co_dien', 'Steak phong cách bistro Pháp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577598/steakdebistro_ewvtlh.png', true),
  ('item_steak_au_poirve', 'Steak au Poirve', 359000, 'cat_gu_steak_co_dien', 'Steak sốt tiêu kiểu Âu', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577597/steakaupoirve_hy2fcd.png', true),
  ('item_steak_frite', 'Steak Frite', 299000, 'cat_gu_steak_co_dien', 'Steak ăn kèm khoai tây chiên', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577594/steak_frite_w7w63d.png', true),
  ('item_saumon_steak', 'Saumon Steak', 319000, 'cat_gu_steak_co_dien', 'Steak cá hồi áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577593/saumonsteak_di8kv5.png', true),
  ('item_steak_thanngoai_bo', 'Steak thăn ngoại bò', 399000, 'cat_gu_steak_dong_vui', 'Phần steak bò dùng chung', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577592/steakthanngoaibo_vcjjt1.png', true),
  ('item_steak_thanngoai_ca_hoi', 'Steak thăn ngoại bò và cá hồi', 469000, 'cat_gu_steak_dong_vui', 'Kết hợp bò và cá hồi', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577587/steakthanngoai_cahoi_cy9mga.png', true),
  ('item_steak_topblade_combo', 'Steak Top Blade Combo', 459000, 'cat_gu_steak_sang_tao', 'Combo steak top blade sáng tạo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577585/steaktopblade_combo_hycvsq.png', true),
  ('item_steak_suon_cotlet', 'Steak sườn cốt lết sốt tiêu Phú Quốc', 389000, 'cat_gu_steak_sang_tao', 'Steak sườn cốt lết cùng sốt tiêu', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577581/steaksuoncotletsottieuphuquoc_y4xu0h.png', true),
  ('item_steak_ca_hoi_combo', 'Steak cá hồi combo', 429000, 'cat_gu_steak_sang_tao', 'Combo cá hồi áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577573/steakcahoi_combo_fso36i.png', true),
  ('item_my_y_sot_kem_nam', 'Mỳ Ý sốt kem nấm', 159000, 'cat_pasta', 'Pasta sốt kem nấm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577557/myysotkemnam_aprdvp.png', true),
  ('item_my_y_sot_bo_bam', 'Mỳ Ý sốt bò băm', 169000, 'cat_pasta', 'Pasta sốt bò băm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577555/myysotbobam_eggdgv.png', true),
  ('item_pizza_bo_bam', 'Pizza bò băm', 189000, 'cat_pizza', 'Pizza nhân bò băm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577553/pizzabobam_ddaskl.png', true),
  ('item_salad_caesar', 'Salad Caesar', 99000, 'cat_salad', 'Salad Caesar dùng kèm steak', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577560/saladcaesar_svc0h3.png', true),
  ('item_tiramisu', 'Tiramisu', 89000, 'cat_dessert', 'Mascarpone, espresso, cocoa', null, true)
on conflict ("id") do nothing;

-- Bổ sung đầy đủ danh mục và món theo file THANHHHHHH.docx.
insert into "categories" ("id", "name", "desc", "sortOrder", "isActive") values
  ('cat_petit_classique', 'Petit Classique', 'Các món steak phong cách cao cấp cổ điển', 9, true),
  ('cat_rau_cu_ap_chao', 'Rau củ áp chảo', 'Rau củ, nấm và món ăn kèm áp chảo', 10, true)
on conflict ("id") do nothing;

insert into "items" ("id", "name", "price", "categoryId", "description", "image", "isActive") values
  ('item_ga_chien_dac_biet', 'Gà chiên đặc biệt', 149000, 'cat_do_chien', 'Món gà chiên dùng khai vị hoặc ăn kèm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577534/gachiendacbiet_hfzxye.png', true),
  ('item_dia_chien_tong_hop', 'Đĩa chiên tổng hợp', 199000, 'cat_do_chien', 'Tổng hợp các món chiên khai vị', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577533/diachientonghop_r6tuqh.png', true),
  ('item_steak_au_vin_rouge', 'Steak au Vin Rouge', 369000, 'cat_gu_steak_co_dien', 'Steak sốt vang đỏ kiểu Pháp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577597/steakauvinrouge_oztkxi.png', true),
  ('item_steak_thanngoai_bo_ma_dui_ga', 'Steak thăn ngoại bò và má đùi gà', 459000, 'cat_gu_steak_dong_vui', 'Phần steak kết hợp bò và gà cho nhóm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577590/steakthanngoaibo_maduiga_ybyv3j.png', true),
  ('item_steak_thanngoai_bo_heo_cotlet', 'Steak thăn ngoại bò và heo cốt lết', 469000, 'cat_gu_steak_dong_vui', 'Phần steak kết hợp bò và heo cốt lết', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577589/steakthanngoaibo_heocotlet_rjuym2.png', true),
  ('item_steak_heo_cotlet_ma_dui_ga', 'Steak heo cốt lết và má đùi gà', 389000, 'cat_gu_steak_dong_vui', 'Set steak heo và gà dùng chung', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577586/steakheocotlet_maduiga_jagjgd.png', true),
  ('item_steak_thanngoai_bo_ca_hoi', 'Steak thăn ngoại bò và cá hồi', 469000, 'cat_gu_steak_dong_vui', 'Kết hợp bò và cá hồi', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577587/steakthanngoaibo_cahoi_cy9mga.png', true),
  ('item_steak_mini_thanngoai_teriyaki_combo', 'Steak mini thăn ngoại sốt Teriyaki combo', 299000, 'cat_gu_steak_sang_tao', 'Combo steak mini sốt Teriyaki', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577585/steak_mini_thanngoaisotteriyaki_combo_ilxuwi.png', true),
  ('item_steak_thanngoai_combo', 'Steak thăn ngoại combo', 429000, 'cat_gu_steak_sang_tao', 'Combo steak thăn ngoại', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577583/steakthanngoai_combo_ycnm15.png', true),
  ('item_steak_suon_cotlet_combo', 'Steak sườn cốt lết combo', 429000, 'cat_gu_steak_sang_tao', 'Combo steak sườn cốt lết', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577580/steaksuoncotlet_combo_w22tyg.png', true),
  ('item_steak_ma_dui_ga_nam_mo_ap_chao', 'Steak má đùi gà nấm mỡ áp chảo', 329000, 'cat_gu_steak_sang_tao', 'Steak gà dùng kèm nấm mỡ áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577578/steakmaduiga_nammoapchao_c0psid.png', true),
  ('item_steak_ma_dui_ga_combo', 'Steak má đùi gà combo', 349000, 'cat_gu_steak_sang_tao', 'Combo steak má đùi gà', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577577/steakmaduiga_combo_uy2wgw.png', true),
  ('item_steak_luon_vit', 'Steak lườn vịt', 359000, 'cat_gu_steak_sang_tao', 'Steak lườn vịt áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577577/steakluonvit_qs155y.png', true),
  ('item_steak_ca_hoi', 'Steak cá hồi', 369000, 'cat_gu_steak_sang_tao', 'Steak cá hồi áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577575/steakcahoi_ikyyud.png', true),
  ('item_steak_ca_dory', 'Steak cá Dory', 329000, 'cat_gu_steak_sang_tao', 'Steak cá Dory mềm ngọt', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577572/steakcadory_ntmsy4.png', true),
  ('item_steak_ca_dory_combo', 'Steak cá Dory combo', 369000, 'cat_gu_steak_sang_tao', 'Combo steak cá Dory', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577570/steakcadory_combo_bu9mei.png', true),
  ('item_my_y_ca_hoi_muc_sot_tom_yum', 'Mỳ Ý cá hồi mực sốt Tom Yum', 189000, 'cat_pasta', 'Pasta hải sản sốt Tom Yum', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577554/myycahoi_mucsottomyum_de8mjy.png', true),
  ('item_surf_turf', 'Surf & Turf', 599000, 'cat_petit_classique', 'Steak kết hợp hải sản phong cách Petit Classique', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577603/suft_turf_iqvw5o.png', true),
  ('item_rossini', 'Rossini', 649000, 'cat_petit_classique', 'Steak Rossini phong cách cổ điển', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577603/rossini_g9knjo.png', true),
  ('item_petit_classique', 'Petit Classique', 529000, 'cat_petit_classique', 'Món steak chữ ký của nhóm Petit Classique', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577600/petitclassique_w5svmv.png', true),
  ('item_pizza_gap_nhan_pho_mai_bo_bam', 'Pizza gấp nhân phô mai bò băm', 219000, 'cat_pizza', 'Pizza gấp nhân phô mai và bò băm', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577554/pizzagapnhanphomaibobam_q7i0tq.png', true),
  ('item_pizza_dua_xuc_xich', 'Pizza dứa xúc xích', 179000, 'cat_pizza', 'Pizza dứa và xúc xích', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577552/pizzaduaxucxich_ojdwik.png', true),
  ('item_mang_tay_khoai_tay_bi_ap_chao', 'Măng tây khoai tây bi áp chảo', 119000, 'cat_rau_cu_ap_chao', 'Rau củ áp chảo dùng kèm steak', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577569/mangtay_khoaitaybiapchao_wnd7iy.png', true),
  ('item_nam_mo_mang_tay_ap_chao', 'Nấm mỡ măng tây áp chảo', 119000, 'cat_rau_cu_ap_chao', 'Nấm mỡ và măng tây áp chảo', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577569/nammo_mangtayapchao_j6jsu3.png', true),
  ('item_salad_luon_vit_xong_khoi', 'Salad lườn vịt xông khói', 159000, 'cat_salad', 'Salad ăn kèm lườn vịt xông khói', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577567/saladluonvitxongkhoi_dcsog7.png', true),
  ('item_salad_hoa_qua_theo_mua_burrata', 'Salad hoa quả theo mùa Burrata', 169000, 'cat_salad', 'Salad hoa quả theo mùa kèm Burrata', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577565/saladhoaquatheomuaburrata_nbrkzk.png', true),
  ('item_salad_hoa_qua_theo_mua', 'Salad hoa quả theo mùa', 129000, 'cat_salad', 'Salad hoa quả tươi theo mùa', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577564/saladhoaquatheomua_efoipa.png', true),
  ('item_salad_hoa_qua_nhiet_doi_burrata', 'Salad hoa quả nhiệt đới Burrata', 169000, 'cat_salad', 'Salad hoa quả nhiệt đới kèm Burrata', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577564/saladhoaquanhietdoiburrata_a7e7xu.png', true),
  ('item_salad_hoa_qua_nhiet_doi', 'Salad hoa quả nhiệt đới', 129000, 'cat_salad', 'Salad hoa quả nhiệt đới', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577562/saladhoaquanhietdoi_qlojxu.png', true),
  ('item_salad_bistro_phap', 'Salad Bistro Pháp', 139000, 'cat_salad', 'Salad phong cách Bistro Pháp', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577559/saladbistrophap_aoy1v3.png', true),
  ('item_luon_vit_xong_khoi', 'Lườn vịt xông khói', 189000, 'cat_salad', 'Lườn vịt xông khói dùng cùng salad', 'https://res.cloudinary.com/ducj0zvys/image/upload/v1781577558/luonvitxongkhoi_duzzr3.png', true)
on conflict ("id") do nothing;

insert into "combos" ("id", "name", "price", "description", "isActive") values
  ('combo_date_2', 'Set Le Monde Date 2 người', 899000, 'Set steak đôi cho buổi hẹn', true),
  ('combo_family_4', 'Set Le Monde Family 4 người', 1599000, 'Set steak gia đình', true),
  ('combo_lunch_1', 'Set Lunch 1 người', 299000, 'Set trưa nhanh gọn', true)
on conflict ("id") do nothing;

insert into "comboitems" ("id", "comboId", "itemId", "quantity") values
  ('ci_date_steak_diane', 'combo_date_2', 'item_steak_diane', 1),
  ('ci_date_steak_frite', 'combo_date_2', 'item_steak_frite', 1),
  ('ci_date_salad', 'combo_date_2', 'item_salad_caesar', 1),
  ('ci_date_tiramisu', 'combo_date_2', 'item_tiramisu', 1),
  ('ci_family_steak_de_bistro', 'combo_family_4', 'item_steak_de_bistro', 2),
  ('ci_family_steak_suon', 'combo_family_4', 'item_steak_suon_cotlet', 1),
  ('ci_family_pizza', 'combo_family_4', 'item_pizza_bo_bam', 1),
  ('ci_family_salad', 'combo_family_4', 'item_salad_caesar', 2),
  ('ci_lunch_steak_frite', 'combo_lunch_1', 'item_steak_frite', 1),
  ('ci_lunch_pasta', 'combo_lunch_1', 'item_my_y_sot_kem_nam', 1)
on conflict ("id") do nothing;

insert into "tables" ("id", "number", "capacity", "status", "isActive") values
  ('table_t01', 'T01', 2, 'EMPTY', true),
  ('table_t02', 'T02', 2, 'EMPTY', true),
  ('table_t03', 'T03', 4, 'EMPTY', true),
  ('table_t04', 'T04', 4, 'EMPTY', true),
  ('table_t05', 'T05', 4, 'EMPTY', true),
  ('table_t06', 'T06', 6, 'EMPTY', true),
  ('table_t07', 'T07', 6, 'EMPTY', true),
  ('table_t08', 'T08', 6, 'EMPTY', true),
  ('table_t09', 'T09', 8, 'EMPTY', true),
  ('table_t10', 'T10', 10, 'EMPTY', true)
on conflict ("id") do nothing;

-- Password for all demo accounts: Admin@123
insert into "users" ("id", "name", "phone", "password", "role", "isActive") values
  ('user_admin', 'Admin', '0900000001', '$2a$10$PMpBS/CeGIT./rKLVq0Ss.ig95cGo/PfmXdqRcr8T6hZSi53ju/J.', 'ADMIN', true),
  ('user_staff', 'Nhân viên', '0900000002', '$2a$10$PMpBS/CeGIT./rKLVq0Ss.ig95cGo/PfmXdqRcr8T6hZSi53ju/J.', 'STAFF', true),
  ('user_customer', 'Khách demo', '0900000003', '$2a$10$PMpBS/CeGIT./rKLVq0Ss.ig95cGo/PfmXdqRcr8T6hZSi53ju/J.', 'CUSTOMER', true)
on conflict ("id") do nothing;

insert into "customers" ("id", "userId", "name", "phone", "email", "isActive") values
  ('customer_demo', 'user_customer', 'Khách demo', '0900000003', 'customer@lemondesteak.vn', true)
on conflict ("id") do nothing;

insert into "promotions" (
  "id", "name", "code", "discountType", "discountValue", "minOrder", "maxDiscount",
  "usageLimit", "usageCount", "startDate", "endDate", "isActive", "description"
) values
  ('promo_lemonde10', 'Giảm 10% Le Monde', 'LEMONDE10', 'PERCENTAGE', 10, 100000, 50000, 500, 0, '2026-01-01 00:00:00+07', '2027-12-31 23:59:59+07', true, 'Ưu đãi Le Monde cho hóa đơn từ 100.000đ'),
  ('promo_newguest', 'Giảm 10% khách mới', 'NEWGUEST', 'PERCENTAGE', 10, 200000, 100000, 500, 0, '2025-01-01 00:00:00+07', '2026-12-31 23:59:59+07', true, 'Ưu đãi cho khách mới'),
  ('promo_weekend50', 'Giảm 50k cuối tuần', 'WEEKEND50', 'FIXED', 50000, 300000, null, null, 0, '2025-01-01 00:00:00+07', '2026-12-31 23:59:59+07', true, 'Ưu đãi cuối tuần')
on conflict ("id") do nothing;

insert into "customerpromotions" ("id", "customerId", "promotionId", "isUsed") values
  ('cp_demo_newguest', 'customer_demo', 'promo_newguest', false),
  ('cp_demo_weekend50', 'customer_demo', 'promo_weekend50', false)
on conflict ("id") do nothing;
