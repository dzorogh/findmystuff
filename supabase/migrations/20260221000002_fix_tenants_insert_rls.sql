-- Fix tenants INSERT: Supabase anon key uses role "anon" even when user is logged in
drop policy if exists "Members create tenants" on public.tenants;
drop policy if exists "Authenticated create tenants" on public.tenants;
create policy "Members create tenants" on public.tenants
  for insert to anon
  with check (auth.uid() is not null);
create policy "Authenticated create tenants" on public.tenants
  for insert to authenticated
  with check (auth.uid() is not null);
