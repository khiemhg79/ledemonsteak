alter table "orders"
  add column if not exists "orderNumber" serial;

create unique index if not exists "orders_orderNumber_key"
  on "orders" ("orderNumber");
