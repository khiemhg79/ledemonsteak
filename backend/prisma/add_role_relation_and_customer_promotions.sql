-- Complete the physical 14-table design with a real users -> roles relation.
-- Safe to run multiple times in Supabase SQL Editor.

insert into public.roles (id, "roleName", description)
values
  ('ADMIN', 'Admin', 'Quan tri vien he thong'),
  ('STAFF', 'Staff', 'Nhan vien nha hang'),
  ('CUSTOMER', 'Customer', 'Khach hang dat mon qua QR')
on conflict (id) do update
set "roleName" = excluded."roleName",
    description = excluded.description,
    "updatedAt" = current_timestamp;

alter table public.users
  add column if not exists "roleId" text;

update public.users
set "roleId" = upper(role::text)
where "roleId" is null
  and upper(role::text) in ('ADMIN', 'STAFF', 'CUSTOMER');

update public.users
set "roleId" = 'CUSTOMER'
where "roleId" is null;

create index if not exists users_roleId_idx on public.users("roleId");

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_roleId_fkey'
  ) then
    alter table public.users
      add constraint "users_roleId_fkey"
      foreign key ("roleId") references public.roles(id)
      on update cascade on delete restrict;
  end if;
end $$;
