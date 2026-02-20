-- Устранить предупреждения Supabase Database Linter:
-- 1) materialized_view_in_api: MV не должны быть доступны anon/authenticated через Data API
-- 2) rls_policy_always_true: убрать политику с USING(true)/WITH CHECK(true) на entity_types
-- 3) auth_leaked_password_protection: включить в Dashboard → Authentication → Settings (Leaked password protection)

-- 1. Materialized views: только service_role может читать (API будет использовать admin-клиент для запросов к MV)
revoke all on table public.mv_item_last_transition from anon, authenticated;
revoke all on table public.mv_container_last_transition from anon, authenticated;
revoke all on table public.mv_place_last_room_transition from anon, authenticated;

grant select on table public.mv_item_last_transition to service_role;
grant select on table public.mv_container_last_transition to service_role;
grant select on table public.mv_place_last_room_transition to service_role;

-- 2. entity_types: удалить избыточную/старую политику с полным доступом (tenant-политики уже заданы в 20260221100000)
drop policy if exists "Allow authenticated users to manage entity_types" on public.entity_types;
