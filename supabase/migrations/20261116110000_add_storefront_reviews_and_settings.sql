create table public.product_reviews (
  id bigint generated always as identity primary key,
  product_id text not null references public.products (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 1 and 1000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (order_id, product_id)
);

create index product_reviews_product_status_created_idx
  on public.product_reviews (product_id, status, created_at desc);
alter table public.product_reviews enable row level security;
revoke all on public.product_reviews from public, anon, authenticated;
grant select (id, product_id, rating, comment, status, created_at)
  on public.product_reviews to anon, authenticated;

create policy "Anyone can read approved product reviews"
  on public.product_reviews for select to anon, authenticated
  using (status = 'approved');

create policy "Customers and admins can read their reviews"
  on public.product_reviews for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_store_admin()));

create function public.submit_product_review(
  p_order_id uuid,
  p_product_id text,
  p_rating smallint,
  p_comment text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_comment text := nullif(btrim(p_comment), '');
  new_review_id bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.';
  end if;
  if p_rating is null
    or p_rating not between 1 and 5
    or clean_comment is null
    or char_length(clean_comment) > 1000 then
    raise exception 'Review rating or comment is invalid.';
  end if;
  if not exists (
    select 1
    from public.orders
    where id = p_order_id
      and user_id = (select auth.uid())
      and status = 'paid'
  ) or not exists (
    select 1
    from public.order_items
    where order_id = p_order_id
      and product_id = p_product_id
  ) then
    raise exception 'A confirmed purchase of this product is required.';
  end if;

  insert into public.product_reviews (
    product_id, order_id, user_id, rating, comment
  ) values (
    p_product_id, p_order_id, (select auth.uid()), p_rating, clean_comment
  )
  returning id into new_review_id;

  return new_review_id;
end;
$$;

revoke all on function public.submit_product_review(uuid, text, smallint, text) from public, anon;
grant execute on function public.submit_product_review(uuid, text, smallint, text) to authenticated;

create function public.get_my_product_review_orders(p_product_id text)
returns table (order_id uuid, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select review.order_id, review.status
  from public.product_reviews as review
  where review.product_id = p_product_id
    and review.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_product_review_orders(text) from public, anon;
grant execute on function public.get_my_product_review_orders(text) to authenticated;

create function public.moderate_product_review(
  p_review_id bigint,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if p_status is null or p_status not in ('approved', 'rejected') then
    raise exception 'Review status is invalid.';
  end if;

  update public.product_reviews
  set status = p_status
  where id = p_review_id
    and status = 'pending';
  if not found then
    raise exception 'Pending review not found.';
  end if;

  return true;
end;
$$;

revoke all on function public.moderate_product_review(bigint, text) from public, anon;
grant execute on function public.moderate_product_review(bigint, text) to authenticated;

create policy "Store admins can read customer order notifications"
  on public.order_notifications for select to authenticated
  using ((select public.is_store_admin()));

create table public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'KahLima Vendas',
  support_whatsapp text not null default '(11) 95983-9395',
  support_email text not null default 'kah0368270@gmail.com',
  support_message text not null default 'Estamos por aqui para ajudar com dúvidas sobre seus pedidos.',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table public.store_settings enable row level security;
revoke all on public.store_settings from public, anon, authenticated;
grant select (id, store_name, support_whatsapp, support_email, support_message)
  on public.store_settings to anon, authenticated;
create policy "Anyone can read public store settings"
  on public.store_settings for select to anon, authenticated
  using (id);

insert into public.store_settings (
  id, store_name, support_whatsapp, support_email, support_message
) values (
  true,
  'KahLima Vendas',
  '(11) 95983-9395',
  'kah0368270@gmail.com',
  'Estamos por aqui para ajudar com dúvidas sobre seus pedidos.'
)
on conflict (id) do nothing;

create function public.save_store_settings(
  p_store_name text,
  p_support_whatsapp text,
  p_support_email text,
  p_support_message text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_name text := nullif(btrim(p_store_name), '');
  clean_whatsapp text := nullif(btrim(p_support_whatsapp), '');
  clean_email text := nullif(btrim(p_support_email), '');
  clean_message text := nullif(btrim(p_support_message), '');
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if clean_name is null or char_length(clean_name) > 120
    or clean_whatsapp is null
    or char_length(regexp_replace(clean_whatsapp, '[^0-9]', '', 'g')) not between 10 and 15
    or clean_email is null
    or clean_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(clean_email) > 254
    or char_length(coalesce(clean_message, '')) > 300 then
    raise exception 'Store contact details are invalid.';
  end if;

  insert into public.store_settings (
    id, store_name, support_whatsapp, support_email, support_message, updated_at, updated_by
  ) values (
    true, clean_name, clean_whatsapp, clean_email, coalesce(clean_message, ''), now(), (select auth.uid())
  )
  on conflict (id) do update
  set store_name = excluded.store_name,
      support_whatsapp = excluded.support_whatsapp,
      support_email = excluded.support_email,
      support_message = excluded.support_message,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;

  return true;
end;
$$;

revoke all on function public.save_store_settings(text, text, text, text) from public, anon;
grant execute on function public.save_store_settings(text, text, text, text) to authenticated;

create function public.get_store_sales_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  report jsonb;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  select jsonb_build_object(
    'paidCount', count(*) filter (where status = 'paid'),
    'pendingCount', count(*) filter (where status = 'pending'),
    'cancelledCount', count(*) filter (where status = 'cancelled'),
    'revenue', coalesce(sum(total) filter (where status = 'paid'), 0),
    'topProducts', coalesce((
      select jsonb_agg(
        jsonb_build_object('name', product_sales.product_name, 'quantity', product_sales.quantity)
        order by product_sales.quantity desc, product_sales.product_name
      )
      from (
        select item.product_name, sum(item.quantity)::integer as quantity
        from public.order_items as item
        join public.orders as order_record on order_record.id = item.order_id
        where order_record.created_at >= now() - interval '30 days'
          and order_record.status = 'paid'
        group by item.product_name
        order by sum(item.quantity) desc, item.product_name
        limit 5
      ) as product_sales
    ), '[]'::jsonb)
  )
  into report
  from public.orders
  where created_at >= now() - interval '30 days';

  return report;
end;
$$;

revoke all on function public.get_store_sales_overview() from public, anon;
grant execute on function public.get_store_sales_overview() to authenticated;
