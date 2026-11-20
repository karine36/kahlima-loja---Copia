create function public.clear_admin_store_orders()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  delete from public.orders;
  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

revoke all on function public.clear_admin_store_orders() from public, anon;
grant execute on function public.clear_admin_store_orders() to authenticated;

create function public.clear_admin_store_notifications()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count bigint;
  total_deleted bigint := 0;
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  delete from public.order_notifications;
  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  delete from public.store_notifications;
  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  return total_deleted;
end;
$$;

revoke all on function public.clear_admin_store_notifications() from public, anon;
grant execute on function public.clear_admin_store_notifications() to authenticated;
