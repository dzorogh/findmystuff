-- T009: RPCs must run as invoking user so RLS applies to tenant-scoped tables
-- Change SECURITY DEFINER to SECURITY INVOKER for list RPCs

do $$
declare
  r record;
begin
  for r in
    select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public'
    and p.proname in (
      'get_rooms_with_counts', 'get_items_with_room', 'get_places_with_room',
      'get_containers_with_location', 'get_buildings_with_counts', 'get_furniture_with_counts'
    )
  loop
    execute format('alter function public.%I(%s) security invoker', r.proname, r.args);
  end loop;
end $$;
