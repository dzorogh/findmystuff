-- entity_types: добавить tenant_id, RLS, привязать к тенанту

alter table public.entity_types
  add column if not exists tenant_id bigint references public.tenants(id);

-- Назначить существующие entity_types первому тенанту
update public.entity_types
set tenant_id = (select id from public.tenants order by id limit 1)
where tenant_id is null;

alter table public.entity_types
  alter column tenant_id set not null;

create index if not exists idx_entity_types_tenant_id on public.entity_types(tenant_id);

-- RLS для entity_types
alter table public.entity_types enable row level security;

drop policy if exists "Tenant read entity_types" on public.entity_types;
drop policy if exists "Tenant insert entity_types" on public.entity_types;
drop policy if exists "Tenant update entity_types" on public.entity_types;
drop policy if exists "Tenant delete entity_types" on public.entity_types;

create policy "Tenant read entity_types" on public.entity_types for select to authenticated
  using (tenant_id = any(tenant.user_tenant_ids()));

create policy "Tenant insert entity_types" on public.entity_types for insert to authenticated
  with check (tenant_id = any(tenant.user_tenant_ids()));

create policy "Tenant update entity_types" on public.entity_types for update to authenticated
  using (tenant_id = any(tenant.user_tenant_ids()));

create policy "Tenant delete entity_types" on public.entity_types for delete to authenticated
  using (tenant_id = any(tenant.user_tenant_ids()));
