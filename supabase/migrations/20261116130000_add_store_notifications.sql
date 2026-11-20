create table public.store_notifications (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 120),
  message text not null check (char_length(message) between 1 and 500),
  notification_type text not null default 'announcement'
    check (notification_type in ('announcement', 'price_drop')),
  target_user_id uuid references auth.users (id) on delete cascade,
  product_id text references public.products (id) on delete cascade,
  old_price numeric(10, 2),
  new_price numeric(10, 2),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  check (
    (notification_type = 'announcement' and old_price is null and new_price is null)
    or (notification_type = 'price_drop' and product_id is not null and old_price is not null
      and new_price is not null and new_price < old_price)
  )
);

create index store_notifications_active_created_idx
  on public.store_notifications (created_at desc)
  where is_active;
create index store_notifications_target_created_idx
  on public.store_notifications (target_user_id, created_at desc)
  where target_user_id is not null;
alter table public.store_notifications enable row level security;
revoke all on public.store_notifications from public, anon, authenticated;

create table public.store_notification_reads (
  notification_id bigint not null references public.store_notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.store_notification_reads enable row level security;
revoke all on public.store_notification_reads from public, anon, authenticated;

create function public.get_store_notifications()
returns table (
  id bigint,
  title text,
  message text,
  notification_type text,
  target_user_id uuid,
  product_id text,
  old_price numeric,
  new_price numeric,
  created_at timestamptz,
  is_read boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    notification.id,
    notification.title,
    notification.message,
    notification.notification_type,
    notification.target_user_id,
    notification.product_id,
    notification.old_price,
    notification.new_price,
    notification.created_at,
    exists (
      select 1
      from public.store_notification_reads as read
      where read.notification_id = notification.id
        and read.user_id = (select auth.uid())
    ) as is_read
  from public.store_notifications as notification
  where notification.is_active
    and (notification.expires_at is null or notification.expires_at > now())
    and (
      notification.target_user_id is null
      or notification.target_user_id = (select auth.uid())
    )
  order by notification.created_at desc
  limit 30;
$$;

revoke all on function public.get_store_notifications() from public;
grant execute on function public.get_store_notifications() to anon, authenticated;

create function public.mark_store_notification_read(p_notification_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required.';
  end if;
  if not exists (
    select 1
    from public.store_notifications as notification
    where notification.id = p_notification_id
      and notification.is_active
      and (notification.target_user_id is null or notification.target_user_id = (select auth.uid()))
  ) then
    raise exception 'Notification not found.';
  end if;

  insert into public.store_notification_reads (notification_id, user_id)
  values (p_notification_id, (select auth.uid()))
  on conflict (notification_id, user_id) do nothing;
  return true;
end;
$$;

revoke all on function public.mark_store_notification_read(bigint) from public, anon;
grant execute on function public.mark_store_notification_read(bigint) to authenticated;

create function public.publish_store_notification(
  p_title text,
  p_message text,
  p_target_user_id uuid default null,
  p_product_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean_title text := nullif(btrim(p_title), '');
  clean_message text := nullif(btrim(p_message), '');
  new_notification_id bigint;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;
  if clean_title is null or char_length(clean_title) > 120
    or clean_message is null or char_length(clean_message) > 500 then
    raise exception 'Notification title or message is invalid.';
  end if;
  if p_target_user_id is not null and not exists (
    select 1 from auth.users where id = p_target_user_id
  ) then
    raise exception 'Notification recipient not found.';
  end if;
  if p_product_id is not null and not exists (
    select 1 from public.products where id = p_product_id and active
  ) then
    raise exception 'Notification product is not active.';
  end if;

  insert into public.store_notifications (
    title, message, target_user_id, product_id, created_by, expires_at
  ) values (
    clean_title, clean_message, p_target_user_id, p_product_id,
    (select auth.uid()), now() + interval '30 days'
  )
  returning id into new_notification_id;

  return new_notification_id;
end;
$$;

revoke all on function public.publish_store_notification(text, text, uuid, text) from public, anon;
grant execute on function public.publish_store_notification(text, text, uuid, text) to authenticated;

create function public.get_store_notification_recipients()
returns table (user_id uuid, customer_name text, customer_phone text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  return query
  select distinct on (order_row.user_id)
    order_row.user_id,
    coalesce(nullif(btrim(order_row.customer_name), ''), 'Cliente'),
    coalesce(order_row.customer_phone, '')
  from public.orders as order_row
  where order_row.user_id is not null
  order by order_row.user_id, order_row.created_at desc;
end;
$$;

revoke all on function public.get_store_notification_recipients() from public, anon;
grant execute on function public.get_store_notification_recipients() to authenticated;

create function public.notify_product_price_drop()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.active and new.active and new.price < old.price then
    insert into public.store_notifications (
      title, message, notification_type, product_id, old_price, new_price, expires_at
    ) values (
      'Oferta: ' || new.name,
      'O preço baixou de R$ ' || replace(to_char(old.price, 'FM999999990.00'), '.', ',')
        || ' para R$ ' || replace(to_char(new.price, 'FM999999990.00'), '.', ',')
        || '. Aproveite enquanto há estoque.',
      'price_drop',
      new.id,
      old.price,
      new.price,
      now() + interval '30 days'
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_product_price_drop() from public, anon, authenticated;

create trigger products_notify_price_drop
  after update of price on public.products
  for each row
  when (old.price is distinct from new.price)
  execute function public.notify_product_price_drop();
