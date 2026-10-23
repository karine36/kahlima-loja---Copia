alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'cancelled'));

alter table public.orders
  add column cancellation_message text,
  add column cancelled_at timestamptz,
  add column refund_amount numeric(10, 2);

create function public.cancel_manual_pix_order(p_order_id uuid, p_message text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record public.orders%rowtype;
  clean_message text := nullif(btrim(p_message), '');
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  if clean_message is null or char_length(clean_message) > 500 then
    raise exception 'Cancellation message must contain 1 to 500 characters.';
  end if;

  select * into order_record
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found.';
  end if;

  if order_record.payment_provider <> 'manual_pix'
    or order_record.status not in ('pending', 'paid') then
    raise exception 'Only pending or paid manual Pix orders can be cancelled.';
  end if;

  update public.orders
  set status = 'cancelled',
      cancellation_message = clean_message,
      cancelled_at = now(),
      refund_amount = case when order_record.status = 'paid' then order_record.total else null end
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.cancel_manual_pix_order(uuid, text) from public, anon;
grant execute on function public.cancel_manual_pix_order(uuid, text) to authenticated;
