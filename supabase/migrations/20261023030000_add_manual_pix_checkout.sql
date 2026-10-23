alter table public.orders
  drop constraint if exists orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('mercadopago', 'manual_pix'));

create or replace function public.confirm_mercadopago_payment(
  p_order_id uuid,
  p_payment_id text,
  p_amount numeric
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record public.orders%rowtype;
  item jsonb;
begin
  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if order_record.payment_provider <> 'mercadopago' then
    raise exception 'Order is not a Mercado Pago payment.';
  end if;

  if order_record.status = 'paid' then
    return order_record.payment_id = p_payment_id;
  end if;

  if order_record.status <> 'pending'
    or order_record.total <> p_amount
    or p_payment_id = '' then
    raise exception 'Payment does not match the pending order.';
  end if;

  update public.orders
  set status = 'paid', payment_id = p_payment_id, paid_at = now()
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

revoke all on function public.confirm_mercadopago_payment(uuid, text, numeric) from public, anon, authenticated;
grant execute on function public.confirm_mercadopago_payment(uuid, text, numeric) to service_role;

create function public.confirm_manual_pix_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record public.orders%rowtype;
  item jsonb;
begin
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

revoke all on function public.confirm_manual_pix_payment(uuid) from public, anon, authenticated;
grant execute on function public.confirm_manual_pix_payment(uuid) to service_role;
