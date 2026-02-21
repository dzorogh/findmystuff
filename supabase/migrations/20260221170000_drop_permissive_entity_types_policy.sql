-- Удалить политику с USING/WITH CHECK = true, обходящую RLS для authenticated.
-- Доступ к entity_types уже ограничен по тенанту политиками "Tenant read/insert/update/delete entity_types".
drop policy if exists "Allow authenticated users to manage entity_types" on public.entity_types;
