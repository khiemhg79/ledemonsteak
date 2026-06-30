-- Run this once in Supabase SQL Editor to speed up staff/admin/customer refreshes.
-- It is safe to run multiple times because every index uses IF NOT EXISTS.

create index if not exists idx_orders_status_created
  on public.orders ("orderStatus", "createdAt");

create index if not exists idx_orders_table_status_created
  on public.orders ("tableId", "orderStatus", "createdAt");

create index if not exists idx_orderdetails_order
  on public.orderdetails ("orderId");

create index if not exists idx_orderdetails_status
  on public.orderdetails ("status");

create index if not exists idx_invoices_order
  on public.invoices ("orderId");

create index if not exists idx_invoices_status_paid
  on public.invoices ("status", "paidAt");

create index if not exists idx_payments_order
  on public.payments ("orderId");

create index if not exists idx_payments_invoice_status
  on public.payments ("invoiceId", "paymentStatus");

create index if not exists idx_comboitems_combo
  on public.comboitems ("comboId");

create index if not exists idx_comboitems_item
  on public.comboitems ("itemId");

create index if not exists idx_customerpromotions_customer
  on public.customerpromotions ("customerId");

create index if not exists idx_customerpromotions_promotion
  on public.customerpromotions ("promotionId");
