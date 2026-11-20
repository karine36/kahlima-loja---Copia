alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_owner;

alter table public.profiles
  add constraint profiles_avatar_path_owner
  check (avatar_path is null or avatar_path like (id::text || '/%'));

create table public.store_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.store_presence enable row level security;
revoke all on public.store_presence from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own profile photos" on storage.objects;
create policy "Users upload own profile photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update own profile photos" on storage.objects;
create policy "Users update own profile photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users and admins read profile photos" on storage.objects;
create policy "Users and admins read profile photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_store_admin())
    )
  );

drop policy if exists "Users delete own profile photos" on storage.objects;
create policy "Users delete own profile photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create function public.touch_store_presence()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required.';
  end if;

  insert into public.store_presence (user_id, last_seen_at)
  values (current_user_id, now())
  on conflict (user_id) do update
  set last_seen_at = excluded.last_seen_at
  where public.store_presence.last_seen_at < now() - interval '20 seconds';
end;
$$;

revoke all on function public.touch_store_presence() from public, anon;
grant execute on function public.touch_store_presence() to authenticated;

create function public.get_store_customer_presence()
returns table (
  user_id uuid,
  customer_name text,
  customer_phone text,
  avatar_path text,
  last_seen_at timestamptz
)
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
  select
    profile.id,
    coalesce(
      nullif(btrim(profile.full_name), ''),
      nullif(btrim(latest_order.customer_name), ''),
      'Cliente'
    ),
    coalesce(profile.phone, latest_order.customer_phone, ''),
    profile.avatar_path,
    presence.last_seen_at
  from public.profiles as profile
  left join public.store_presence as presence on presence.user_id = profile.id
  left join lateral (
    select order_row.customer_name, order_row.customer_phone
    from public.orders as order_row
    where order_row.user_id = profile.id
    order by order_row.created_at desc
    limit 1
  ) as latest_order on true
  where not exists (
    select 1
    from public.store_admins as admin
    where admin.user_id = profile.id
  )
  order by
    (presence.last_seen_at >= now() - interval '2 minutes') desc nulls last,
    presence.last_seen_at desc nulls last,
    profile.full_name
  limit 500;
end;
$$;

revoke all on function public.get_store_customer_presence() from public, anon;
grant execute on function public.get_store_customer_presence() to authenticated;

create or replace function public.get_store_notification_recipients()
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
  select
    profile.id,
    coalesce(
      nullif(btrim(profile.full_name), ''),
      nullif(btrim(latest_order.customer_name), ''),
      'Cliente'
    ),
    coalesce(profile.phone, latest_order.customer_phone, '')
  from public.profiles as profile
  left join lateral (
    select order_row.customer_name, order_row.customer_phone
    from public.orders as order_row
    where order_row.user_id = profile.id
    order by order_row.created_at desc
    limit 1
  ) as latest_order on true
  where not exists (
    select 1
    from public.store_admins as admin
    where admin.user_id = profile.id
  )
  order by profile.full_name;
end;
$$;

revoke all on function public.get_store_notification_recipients() from public, anon;
grant execute on function public.get_store_notification_recipients() to authenticated;
