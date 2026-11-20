create function public.get_store_customer_account_details(p_user_id uuid)
returns table (
  user_id uuid,
  customer_name text,
  customer_email text,
  customer_cpf text,
  customer_phone text
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
    auth_user.email::text,
    profile.cpf,
    coalesce(profile.phone, latest_order.customer_phone, '')
  from public.profiles as profile
  join auth.users as auth_user on auth_user.id = profile.id
  left join lateral (
    select order_row.customer_name, order_row.customer_phone
    from public.orders as order_row
    where order_row.user_id = profile.id
    order by order_row.created_at desc
    limit 1
  ) as latest_order on true
  where profile.id = p_user_id
    and not exists (
      select 1
      from public.store_admins as admin
      where admin.user_id = profile.id
    )
  limit 1;
end;
$$;

revoke all on function public.get_store_customer_account_details(uuid) from public, anon;
grant execute on function public.get_store_customer_account_details(uuid) to authenticated;
