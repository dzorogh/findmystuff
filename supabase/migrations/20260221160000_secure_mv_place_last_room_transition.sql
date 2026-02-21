-- Materialized view was recreated in 20260215114849; default privileges made it
-- selectable by anon/authenticated. Lock down for Data API: only service_role.
revoke all on table public.mv_place_last_room_transition from anon, authenticated;
grant select on table public.mv_place_last_room_transition to service_role;
