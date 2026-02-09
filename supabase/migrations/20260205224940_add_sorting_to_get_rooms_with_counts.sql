-- Добавление параметров сортировки в функцию get_rooms_with_counts

-- Удаляем старую версию функции (если существует)
drop function if exists public.get_rooms_with_counts(text, boolean, integer, integer);

-- Создаём функцию с параметрами сортировки (6 параметров)
create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc'
)
returns table (
  id bigint,
  name text,
  room_type_id bigint,
  room_type_name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  items_count bigint,
  places_count bigint,
  containers_count bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_rooms as (
  select
    r.id,
    r.name,
    nullif(btrim(r.name), '') as name_sort,
    r.room_type_id,
    r.created_at,
    r.deleted_at,
    r.photo_url,
    et.name as room_type_name
  from rooms r
  left join entity_types et
    on et.id = r.room_type_id
    and et.deleted_at is null
  where
    case
      when show_deleted then r.deleted_at is not null
      else r.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or r.name ilike '%' || search_query || '%'
      or et.name ilike '%' || search_query || '%'
    )
),
paged_rooms as (
  select *
  from filtered_rooms
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset
  limit page_limit
),
items_count as (
  select ir.room_id, count(*)::bigint as items_count
  from public.v_item_resolved_room ir
  join items i on i.id = ir.item_id and i.deleted_at is null
  group by ir.room_id
),
places_count as (
  select room_id, count(*)::bigint as places_count
  from public.mv_place_last_room_transition
  group by room_id
),
containers_count as (
  select destination_id as room_id, count(*)::bigint as containers_count
  from public.mv_container_last_transition
  where destination_type = 'room'
  group by destination_id
)
select
  p.id,
  p.name,
  p.room_type_id,
  p.room_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  coalesce(ic.items_count, 0) as items_count,
  coalesce(pc.places_count, 0) as places_count,
  coalesce(cc.containers_count, 0) as containers_count,
  (select count(*) from filtered_rooms) as total_count
from paged_rooms p
left join items_count ic on ic.room_id = p.id
left join places_count pc on pc.room_id = p.id
left join containers_count cc on cc.room_id = p.id
order by
  case when sort_by = 'name' and sort_direction = 'asc' then p.name_sort end asc nulls last,
  case when sort_by = 'name' and sort_direction = 'desc' then p.name_sort end desc nulls last,
  case when sort_by = 'created_at' and sort_direction = 'asc' then p.created_at end asc,
  case when sort_by = 'created_at' and sort_direction = 'desc' then p.created_at end desc,
  p.created_at desc;
$$;

-- Предоставляем права на выполнение функции
grant execute on function public.get_rooms_with_counts(text, boolean, integer, integer, text, text) to anon, authenticated;
