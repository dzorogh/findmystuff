-- Триггер: обновлять материализованные представления местоположений после INSERT/DELETE в transitions,
-- чтобы список вещей и счётчики помещений показывали актуальные данные (последний переход).
-- Даём владельцу триггера право вызывать refresh (для security definer триггера)
do $$
begin
  execute 'grant execute on function public.refresh_items_location_materialized_views() to postgres';
exception
  when others then null; -- игнорируем, если роль отсутствует или нет прав
end
$$;

create or replace function public.trigger_refresh_mvs_after_transition()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.refresh_items_location_materialized_views();
  return coalesce(new, old);
end;
$$;

drop trigger if exists tr_refresh_mvs_after_transition on public.transitions;
create trigger tr_refresh_mvs_after_transition
  after insert or delete on public.transitions
  for each statement
  execute function public.trigger_refresh_mvs_after_transition();
