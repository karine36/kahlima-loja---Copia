alter table public.products
  add column stock integer not null default 0,
  add column stock_by_color jsonb not null default '{}'::jsonb;

insert into public.products (id, name, price, active, stock, stock_by_color) values
  ('AU-101', 'Power Bank Portátil 20.000mAh', 119.99, true, 7, '{"Preto":6,"Branco":1}'::jsonb),
  ('AU-208', 'Kit de Costura Portátil Completo', 25.00, true, 3, '{}'::jsonb),
  ('AU-315', 'Acendedor Elétrico Recarregável', 24.90, true, 5, '{}'::jsonb),
  ('KL-577', 'Alicate com botões', 20.00, true, 1, '{}'::jsonb),
  ('AU-427', 'Kit com 48 Canetas de Ponta Dupla', 39.90, true, 1, '{}'::jsonb),
  ('KL-501', 'Turbina Portátil para Lavagem', 17.00, true, 1, '{}'::jsonb),
  ('KL-502', 'Extensão Filtro de Linha Coibeu', 46.35, true, 1, '{}'::jsonb),
  ('KL-503', 'Kit de Bolso com 24 Ferramentas', 25.00, true, 1, '{}'::jsonb),
  ('KL-504', 'Fita LED 2835 3000K 12V', 19.90, true, 1, '{}'::jsonb),
  ('KL-505', 'Papa-Bolinhas Elétrico Recarregável', 26.50, true, 1, '{}'::jsonb),
  ('KL-507', 'Sensor de Presença', 24.00, true, 1, '{}'::jsonb),
  ('KL-509', 'Kit com 6 Navalhas', 19.90, true, 2, '{}'::jsonb),
  ('KL-510', 'Kit de Manicure com 16 Peças', 24.99, true, 2, '{}'::jsonb),
  ('KL-511', 'Mouse Bluetooth', 38.00, true, 3, '{"Rosa":1,"Cinza":2}'::jsonb),
  ('KL-512', 'Kit com 500 Unhas Postiças Stiletto', 25.00, true, 8, '{}'::jsonb),
  ('KL-506', 'Kit com 115 Ferramentas', 45.00, true, 1, '{}'::jsonb),
  ('KL-513', 'Mixer Elétrico Recarregável', 25.90, true, 1, '{}'::jsonb),
  ('KL-514', 'Raspador de Língua', 12.95, true, 1, '{}'::jsonb),
  ('KL-515', 'Pincel para Sobrancelha Castanho Claro', 15.70, true, 2, '{}'::jsonb),
  ('KL-516', 'Escova Dental Elétrica com 4 Refis', 25.00, true, 6, '{"Preto":2,"Branco":2,"Rosa":2}'::jsonb),
  ('KL-517', 'Aspirador de Pó Portátil Recarregável', 30.00, true, 7, '{}'::jsonb),
  ('KL-518', 'Torneira Prata com Detalhes Pretos', 25.00, true, 1, '{}'::jsonb),
  ('KL-519', 'Lanterna Elétrica Recarregável', 20.00, true, 1, '{}'::jsonb),
  ('KL-520', 'Carregador portátil 20.000 mAh com cabos e led - cor preto', 129.99, true, 1, '{}'::jsonb),
  ('RK-859', 'Porta jóias Cor Rosa', 16.00, true, 1, '{}'::jsonb),
  ('YU-437', 'Removedor de pelos', 15.50, true, 2, '{}'::jsonb),
  ('YU-438', '6 Cabeçotes de Escova de Dentes Substituíveis para XIAOMI T100', 18.00, true, 10, '{}'::jsonb)
on conflict (id) do update
set stock = excluded.stock,
    stock_by_color = excluded.stock_by_color;

grant select on public.products to anon, authenticated;
create policy "Anyone can read active product inventory"
  on public.products for select to anon, authenticated
  using (active);

alter table public.orders
  add column inventory_shortfall boolean not null default false;

create table public.order_notifications (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index order_notifications_user_created_idx
  on public.order_notifications (user_id, created_at desc);
alter table public.order_notifications enable row level security;
grant select on public.order_notifications to authenticated;
create policy "Customers can read their own order notifications"
  on public.order_notifications for select to authenticated
  using (user_id = (select auth.uid()));

create function public.send_order_notification(p_order_id uuid, p_message text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_user_id uuid;
  clean_message text := nullif(btrim(p_message), '');
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if clean_message is null or char_length(clean_message) > 1000 then
    raise exception 'Notification must contain 1 to 1000 characters.';
  end if;

  select user_id into order_user_id
  from public.orders
  where id = p_order_id;
  if not found then
    raise exception 'Order not found.';
  end if;

  insert into public.order_notifications (order_id, user_id, message)
  values (p_order_id, order_user_id, clean_message);
  return true;
end;
$$;

revoke all on function public.send_order_notification(uuid, text) from public, anon;
grant execute on function public.send_order_notification(uuid, text) to authenticated;

create function public.update_manual_pix_order_details(
  p_order_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_delivery jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := nullif(btrim(p_customer_name), '');
  clean_phone text := nullif(btrim(p_customer_phone), '');
  receive_method text := p_delivery ->> 'receiveMethod';
  station text := p_delivery ->> 'station';
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if clean_name is null or char_length(clean_name) < 2 or char_length(clean_name) > 120
    or clean_phone is null or char_length(clean_phone) < 8 or char_length(clean_phone) > 30
    or jsonb_typeof(p_delivery) <> 'object'
    or p_delivery ->> 'name' is distinct from clean_name
    or p_delivery ->> 'whatsapp' is distinct from clean_phone then
    raise exception 'Customer or delivery details are invalid.';
  end if;

  if receive_method = 'nearby' then
    if nullif(btrim(p_delivery ->> 'street'), '') is null
      or nullif(btrim(p_delivery ->> 'number'), '') is null
      or char_length(p_delivery ->> 'street') > 160
      or char_length(p_delivery ->> 'number') > 20
      or char_length(coalesce(p_delivery ->> 'deliveryNote', '')) > 300 then
      raise exception 'Delivery address is invalid.';
    end if;
  elsif receive_method = 'station' then
    if station not in (
      'itaim-paulista',
      'jardim-helena-vila-mara',
      'sao-miguel-paulista',
      'comendador-ermelino',
      'usp-leste',
      'engenheiro-goulart',
      'tatuape'
    ) then
      raise exception 'Pickup station is invalid.';
    end if;
  else
    raise exception 'Receive method is invalid.';
  end if;

  update public.orders
  set customer_name = clean_name,
      customer_phone = clean_phone,
      delivery = p_delivery
  where id = p_order_id
    and payment_provider = 'manual_pix'
    and status in ('pending', 'paid');
  if not found then
    raise exception 'Only pending or paid manual Pix orders can be edited.';
  end if;

  return true;
end;
$$;

revoke all on function public.update_manual_pix_order_details(uuid, text, text, jsonb) from public, anon;
grant execute on function public.update_manual_pix_order_details(uuid, text, text, jsonb) to authenticated;

create function public.update_product_stock(
  p_product_id text,
  p_stock integer,
  p_stock_by_color jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  color_stock_total integer;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if p_stock < 0 or jsonb_typeof(p_stock_by_color) <> 'object' then
    raise exception 'Stock values are invalid.';
  end if;

  if p_stock_by_color <> '{}'::jsonb then
    if exists (
      select 1
      from jsonb_each_text(p_stock_by_color) as entry(color, quantity)
      where entry.color = '' or entry.quantity !~ '^[0-9]+$'
    ) then
      raise exception 'Color stock values must be non-negative integers.';
    end if;
    select coalesce(sum(value::integer), 0) into color_stock_total
    from jsonb_each_text(p_stock_by_color);
  else
    color_stock_total := p_stock;
  end if;

  update public.products
  set stock = color_stock_total,
      stock_by_color = p_stock_by_color
  where id = p_product_id;
  if not found then
    raise exception 'Product not found.';
  end if;
  return true;
end;
$$;

revoke all on function public.update_product_stock(text, integer, jsonb) from public, anon;
grant execute on function public.update_product_stock(text, integer, jsonb) to authenticated;

create function public.apply_order_stock(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_items jsonb;
  item jsonb;
  product_record public.products%rowtype;
  variant_color text;
  current_stock integer;
  shortfall boolean := false;
begin
  select items_snapshot into order_items
  from public.orders
  where id = p_order_id;
  if not found then
    raise exception 'Order not found.';
  end if;

  for item in select value from jsonb_array_elements(order_items)
  loop
    variant_color := coalesce(item ->> 'color', '');
    select * into product_record
    from public.products
    where id = item ->> 'product_id'
    for update;
    if not found then
      raise exception 'Product not found while applying order stock.';
    end if;

    if product_record.stock_by_color <> '{}'::jsonb then
      if not (product_record.stock_by_color ? variant_color) then
        raise exception 'Product variant is not available.';
      end if;
      current_stock := (product_record.stock_by_color ->> variant_color)::integer;
      if current_stock < (item ->> 'quantity')::integer then
        shortfall := true;
      end if;
      product_record.stock_by_color := jsonb_set(
        product_record.stock_by_color,
        array[variant_color],
        to_jsonb(current_stock - (item ->> 'quantity')::integer),
        false
      );
      update public.products
      set stock_by_color = product_record.stock_by_color,
          stock = (select coalesce(sum(value::integer), 0)
                   from jsonb_each_text(product_record.stock_by_color))
      where id = product_record.id;
    else
      if product_record.stock < (item ->> 'quantity')::integer then
        shortfall := true;
      end if;
      update public.products
      set stock = stock - (item ->> 'quantity')::integer
      where id = product_record.id;
    end if;
  end loop;
  return shortfall;
end;
$$;

revoke all on function public.apply_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.apply_order_stock(uuid) to service_role;

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
  stock_shortfall boolean;
begin
  select * into order_record
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'Order not found.'; end if;
  if order_record.payment_provider <> 'mercadopago' then
    raise exception 'Order is not a Mercado Pago payment.';
  end if;
  if order_record.status = 'paid' then
    return order_record.payment_id = p_payment_id;
  end if;
  if order_record.status <> 'pending' or order_record.total <> p_amount or p_payment_id = '' then
    raise exception 'Payment does not match the pending order.';
  end if;

  stock_shortfall := public.apply_order_stock(p_order_id);
  update public.orders
  set status = 'paid',
      payment_id = p_payment_id,
      paid_at = now(),
      inventory_shortfall = stock_shortfall
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

create or replace function public.confirm_manual_pix_payment(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_record public.orders%rowtype;
  item jsonb;
  stock_shortfall boolean;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  select * into order_record
  from public.orders
  where id = p_order_id
  for update;
  if not found then raise exception 'Order not found.'; end if;
  if order_record.payment_provider <> 'manual_pix' then
    raise exception 'Order is not a manual Pix payment.';
  end if;
  if order_record.status = 'paid' then return true; end if;
  if order_record.status <> 'pending' then raise exception 'Order is not pending.'; end if;

  stock_shortfall := public.apply_order_stock(p_order_id);
  update public.orders
  set status = 'paid',
      paid_at = now(),
      inventory_shortfall = stock_shortfall
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
revoke all on function public.confirm_manual_pix_payment(uuid) from public, anon;
grant execute on function public.confirm_manual_pix_payment(uuid) to authenticated;
