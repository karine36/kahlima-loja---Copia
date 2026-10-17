create table public.products (
  id text primary key,
  name text not null,
  price numeric(10, 2) not null check (price > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.products (id, name, price) values
  ('AU-101', 'Power Bank Portátil 20.000mAh', 119.99),
  ('AU-208', 'Caderno Horizonte', 54.50),
  ('AU-315', 'Vaso Aurora', 92.00),
  ('AU-427', 'Bolsa Caminho', 119.90),
  ('KL-501', 'Fone sem fio Pulse', 149.90),
  ('KL-502', 'Camiseta Essencial', 79.90),
  ('KL-503', 'Garrafa Hidra', 64.90),
  ('KL-504', 'Liquidificador Compacto', 189.90),
  ('KL-505', 'Blocos de Montar', 89.90),
  ('KL-506', 'Kit Ferramentas Básico', 119.90)
on conflict (id) do update
set name = excluded.name, price = excluded.price, active = true;

alter table public.products enable row level security;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payment_provider text not null default 'mercadopago' check (payment_provider = 'mercadopago'),
  payment_id text unique,
  total numeric(10, 2) not null check (total > 0),
  item_count integer not null check (item_count > 0),
  customer_name text not null,
  customer_phone text not null,
  delivery jsonb not null,
  items_snapshot jsonb not null check (jsonb_typeof(items_snapshot) = 'array'),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index orders_user_created_at_idx on public.orders (user_id, created_at desc);
alter table public.orders enable row level security;
grant select on public.orders to authenticated;
create policy "Users can read their own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  product_name text not null,
  unit_price numeric(10, 2) not null check (unit_price > 0),
  quantity integer not null check (quantity > 0),
  color text not null default '',
  product_type text not null default ''
);

create index order_items_order_id_idx on public.order_items (order_id);
alter table public.order_items enable row level security;
grant select on public.order_items to authenticated;
create policy "Users can read their own order items"
  on public.order_items for select to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = (select auth.uid())
    )
  );

create function public.confirm_mercadopago_payment(
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
