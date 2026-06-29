const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`
    insert into public.roles (id, "roleName", description, "createdAt", "updatedAt")
    values
      ('ADMIN', 'Admin', 'Quan tri vien he thong', now(), now()),
      ('STAFF', 'Staff', 'Nhan vien nha hang', now(), now()),
      ('CUSTOMER', 'Customer', 'Khach hang dat mon qua QR', now(), now())
    on conflict ("roleName") do update
    set id = excluded.id,
        "roleName" = excluded."roleName",
        description = excluded.description,
        "updatedAt" = now()
  `)

  await prisma.$executeRawUnsafe(`alter table public.users add column if not exists "roleId" text`)
  await prisma.$executeRawUnsafe(`update public.users set "roleId" = upper(role::text) where "roleId" is null and role is not null`)
  await prisma.$executeRawUnsafe(`update public.users set "roleId" = 'CUSTOMER' where "roleId" is null`)
  await prisma.$executeRawUnsafe(`create index if not exists users_roleId_idx on public.users("roleId")`)
  await prisma.$executeRawUnsafe(`
    do $$
    begin
      if not exists (
        select 1
        from pg_constraint
        where conname = 'users_roleId_fkey'
          and conrelid = 'public.users'::regclass
      ) then
        alter table public.users
          add constraint "users_roleId_fkey"
          foreign key ("roleId") references public.roles(id);
      end if;
    end $$;
  `)

  console.log("Applied roles relation migration.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
