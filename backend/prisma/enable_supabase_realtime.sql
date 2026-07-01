-- Run this once in Supabase SQL Editor to make admin/staff/customer update instantly.
-- The apps still have fast polling fallback, but PostgreSQL realtime needs these tables in supabase_realtime.

alter table public.categories replica identity full;
alter table public.items replica identity full;
alter table public.combos replica identity full;
alter table public.comboitems replica identity full;
alter table public.customers replica identity full;
alter table public.customerpromotions replica identity full;
alter table public.orders replica identity full;
alter table public.orderdetails replica identity full;
alter table public.invoices replica identity full;
alter table public.payments replica identity full;
alter table public.promotions replica identity full;
alter table public.roles replica identity full;
alter table public.tables replica identity full;
alter table public.users replica identity full;

do $$
declare
  table_name text;
  realtime_tables text[] := array[
    'categories',
    'items',
    'combos',
    'comboitems',
    'customers',
    'customerpromotions',
    'orders',
    'orderdetails',
    'invoices',
    'payments',
    'promotions',
    'roles',
    'tables',
    'users'
  ];
begin
  foreach table_name in array realtime_tables loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
