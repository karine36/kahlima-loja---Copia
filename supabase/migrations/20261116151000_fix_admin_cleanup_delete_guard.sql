create or replace function public.clear_admin_store_orders()
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

  delete from public.orders
  where true;
  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

create or replace function public.clear_admin_store_notifications()
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

  delete from public.order_notifications
  where true;
  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  delete from public.store_notifications
  where true;
  get diagnostics deleted_count = row_count;
  total_deleted := total_deleted + deleted_count;

  return total_deleted;
end;
$$;
