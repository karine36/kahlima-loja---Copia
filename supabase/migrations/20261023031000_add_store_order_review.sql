create table public.store_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.store_admins enable row level security;
revoke all on public.store_admins from public, anon, authenticated;

create function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.store_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

create policy "Store admins can read all orders"
  on public.orders for select to authenticated
  using ((select public.is_store_admin()));

create policy "Store admins can read all order items"
  on public.order_items for select to authenticated
  using ((select public.is_store_admin()));

alter table public.orders
  add column customer_reported_paid_at timestamptz;

create function public.report_manual_pix_paid(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.orders
  set customer_reported_paid_at = coalesce(customer_reported_paid_at, now())
  where id = p_order_id
    and user_id = (select auth.uid())
    and payment_provider = 'manual_pix'
    and status = 'pending';

  if not found then
    raise exception 'Manual Pix order not found or not pending.';
  end if;

  return true;
end;
$$;

revoke all on function public.report_manual_pix_paid(uuid) from public, anon;
grant execute on function public.report_manual_pix_paid(uuid) to authenticated;

create or replace function public.confirm_manual_pix_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record public.orders%rowtype;
  item jsonb;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if order_record.payment_provider <> 'manual_pix' then
    raise exception 'Order is not a manual Pix payment.';
  end if;

  if order_record.status = 'paid' then
    return true;
  end if;

  if order_record.status <> 'pending' then
    raise exception 'Order is not pending.';
  end if;

  update public.orders
  set status = 'paid', paid_at = now()
  where id = p_order_id;

  for item in select value from jsonb_array_elements(order_record.items_snapshot)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, color, product_type
    ) values (
      p_order_id,
      item ->> 'product_id',
      item ->> 'product_name',
      (item ->> 'unit_price')::numeric,
      (item ->> 'quantity')::integer,
      coalesce(item ->> 'color', ''),
      coalesce(item ->> 'product_type', '')
    );
  end loop;

  return true;
end;
$$;

revoke all on function public.confirm_manual_pix_payment(uuid) from public, anon;
grant execute on function public.confirm_manual_pix_payment(uuid) to authenticated;
