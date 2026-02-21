-- Auth RLS optimization: evaluate auth.uid() once per statement, not per row.
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

drop policy if exists "Members create tenants" on public.tenants;
drop policy if exists "Authenticated create tenants" on public.tenants;

create policy "Members create tenants" on public.tenants
  for insert to anon
  with check ((select auth.uid()) is not null);

create policy "Authenticated create tenants" on public.tenants
  for insert to authenticated
  with check ((select auth.uid()) is not null);
