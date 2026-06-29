-- Add 3 physical helper tables so Le Monde Steak matches the 14-table design.
-- Safe to run multiple times in Supabase SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'OrderDetailStatus') then
    create type "OrderDetailStatus" as enum ('WAITING', 'PREPARING', 'DONE', 'SERVED');
  end if;
end $$;

create table if not exists public.comboitems (
  id text primary key default gen_random_uuid()::text,
  "comboId" text not null references public.combos(id) on update cascade on delete cascade,
  "itemId" text not null references public.items(id) on update cascade on delete restrict,
  quantity integer not null default 1,
  constraint comboitems_combo_item_unique unique ("comboId", "itemId")
);

create table if not exists public.customerpromotions (
  id text primary key default gen_random_uuid()::text,
  "customerId" text not null references public.customers(id) on update cascade on delete cascade,
  "promotionId" text not null references public.promotions(id) on update cascade on delete cascade,
  "isUsed" boolean not null default false,
  "usedAt" timestamptz,
  "assignedAt" timestamptz not null default now(),
  constraint customerpromotions_customer_promotion_unique unique ("customerId", "promotionId")
);

create table if not exists public.orderdetails (
  id text primary key default gen_random_uuid()::text,
  "orderId" text not null references public.orders(id) on update cascade on delete cascade,
  "itemId" text references public.items(id) on update cascade on delete restrict,
  "comboId" text references public.combos(id) on update cascade on delete restrict,
  quantity integer not null,
  price numeric not null default 0,
  status "OrderDetailStatus" not null default 'WAITING',
  constraint orderdetails_item_or_combo_check check (
    ("itemId" is not null and "comboId" is null)
    or ("itemId" is null and "comboId" is not null)
  )
);

create index if not exists comboitems_comboId_idx on public.comboitems("comboId");
create index if not exists comboitems_itemId_idx on public.comboitems("itemId");
create index if not exists customerpromotions_customerId_idx on public.customerpromotions("customerId");
create index if not exists customerpromotions_promotionId_idx on public.customerpromotions("promotionId");
create index if not exists orderdetails_orderId_idx on public.orderdetails("orderId");
create index if not exists orderdetails_itemId_idx on public.orderdetails("itemId");
create index if not exists orderdetails_comboId_idx on public.orderdetails("comboId");
