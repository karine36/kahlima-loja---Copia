alter table public.profiles
  add column if not exists cpf text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_cpf_format'
  ) then
    alter table public.profiles
      add constraint profiles_cpf_format
      check (cpf is null or cpf ~ '^[0-9]{11}$');
  end if;
end;
$$;

create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cpf_digits text;
begin
  cpf_digits := regexp_replace(coalesce(new.raw_user_meta_data ->> 'cpf', ''), '[^0-9]', '', 'g');
  if cpf_digits !~ '^[0-9]{11}$' then
    raise exception 'A valid CPF is required to create a profile.'
      using errcode = '23514';
  end if;

  insert into public.profiles (id, full_name, phone, cpf)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30), ''),
    cpf_digits
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
