create function public.delete_store_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_store_admin()) then
    raise exception 'Store admin access required.';
  end if;

  delete from public.orders
  where id = p_order_id
    and payment_provider = 'manual_pix';

  if not found then
    raise exception 'Manual Pix order not found.';
  end if;

  return true;
end;
$$;

revoke all on function public.delete_store_order(uuid) from public, anon;
grant execute on function public.delete_store_order(uuid) to authenticated;
