-- Пересоздать mv_place_last_room_transition: поддержка destination_type=room и destination_type=furniture
drop materialized view if exists public.mv_place_last_room_transition;

create materialized view public.mv_place_last_room_transition as
with place_last_transition as (
  select distinct on (t.place_id)
    t.place_id,
    t.destination_type,
    t.destination_id,
    t.created_at
  from transitions t
  where t.place_id is not null
    and t.destination_type in ('room', 'furniture')
  order by t.place_id, t.created_at desc
)
select
  plt.place_id,
  case
    when plt.destination_type = 'room' then plt.destination_id
    when plt.destination_type = 'furniture' then (select room_id from furniture where id = plt.destination_id and deleted_at is null)
    else null
  end as room_id,
  plt.created_at
from place_last_transition plt;

create unique index if not exists mv_place_last_room_transition_place_id_idx
  on public.mv_place_last_room_transition (place_id);
