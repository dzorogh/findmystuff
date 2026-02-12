-- Устранение lint "Security Definer View": заменяем view v_item_resolved_room на функцию.
-- View имел SECURITY DEFINER по умолчанию (PostgreSQL 15+), что потенциально обходило RLS.
-- Функция SECURITY DEFINER допустима — используется только из других SECURITY DEFINER RPC.

create or replace function public.fn_item_resolved_room()
returns table (item_id bigint, room_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with item_transition as (
  select
    it.item_id,
    it.destination_type,
    it.destination_id
  from public.mv_item_last_transition it
),
place_room as (
  select
    it.item_id,
    pr.room_id
  from item_transition it
  join public.mv_place_last_room_transition pr
    on it.destination_type = 'place'
    and pr.place_id = it.destination_id
),
container_terminal as (
  select
    it.item_id,
    terminal.destination_type as terminal_type,
    terminal.destination_id as terminal_id
  from item_transition it
  join lateral (
    with recursive chain as (
      select t.destination_type, t.destination_id, 1 as depth
      from public.mv_container_last_transition t
      where t.container_id = it.destination_id
      union all
      select t2.destination_type, t2.destination_id, c.depth + 1
      from chain c
      join public.mv_container_last_transition t2
        on t2.container_id = c.destination_id
      where c.destination_type = 'container' and c.depth < 10
    )
    select destination_type, destination_id
    from chain
    where destination_type is distinct from 'container'
    limit 1
  ) terminal on it.destination_type = 'container'
),
container_place_room as (
  select
    ct.item_id,
    pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr
    on ct.terminal_type = 'place'
    and pr.place_id = ct.terminal_id
),
resolved as (
  select
    it.item_id,
    case
      when it.destination_type = 'room' then it.destination_id::bigint
      when it.destination_type = 'place' then pr.room_id
      when it.destination_type = 'container' then
        case
          when ct.terminal_type = 'room' then ct.terminal_id::bigint
          when ct.terminal_type = 'place' then cpr.room_id
          else null
        end
      else null
    end as room_id
  from item_transition it
  left join place_room pr on pr.item_id = it.item_id
  left join container_terminal ct on ct.item_id = it.item_id
  left join container_place_room cpr on cpr.item_id = it.item_id
)
select r.item_id, r.room_id
from resolved r
where r.room_id is not null;
$$;

-- Обновляем get_item_ids_in_room
create or replace function public.get_item_ids_in_room(p_room_id bigint)
returns table (item_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ir.item_id
  from public.fn_item_resolved_room() ir
  join items i on i.id = ir.item_id and i.deleted_at is null
  where ir.room_id = p_room_id;
$$;

-- Обновляем get_rooms_with_counts (последняя версия с has_items, has_containers, has_places)
create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  has_items boolean default null,
  has_containers boolean default null,
  has_places boolean default null
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
items_count as (
  select ir.room_id, count(*)::bigint as items_count
  from public.fn_item_resolved_room() ir
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
),
rooms_with_counts as (
  select
    p.id,
    p.name,
    p.name_sort,
    p.room_type_id,
    p.room_type_name,
    p.created_at,
    p.deleted_at,
    p.photo_url,
    coalesce(ic.items_count, 0) as items_count,
    coalesce(pc.places_count, 0) as places_count,
    coalesce(cc.containers_count, 0) as containers_count
  from filtered_rooms p
  left join items_count ic on ic.room_id = p.id
  left join places_count pc on pc.room_id = p.id
  left join containers_count cc on cc.room_id = p.id
  where
    (has_items is null or (has_items = true and coalesce(ic.items_count, 0) > 0) or (has_items = false and coalesce(ic.items_count, 0) = 0))
    and (has_containers is null or (has_containers = true and coalesce(cc.containers_count, 0) > 0) or (has_containers = false and coalesce(cc.containers_count, 0) = 0))
    and (has_places is null or (has_places = true and coalesce(pc.places_count, 0) > 0) or (has_places = false and coalesce(pc.places_count, 0) = 0))
),
total as (
  select count(*)::bigint as total_count from rooms_with_counts
),
paged_rooms as (
  select rwc.*, t.total_count
  from rooms_with_counts rwc
  cross join total t
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then rwc.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then rwc.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then rwc.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then rwc.created_at end desc,
    rwc.created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.room_type_id,
  p.room_type_name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.items_count,
  p.places_count,
  p.containers_count,
  p.total_count
from paged_rooms p;
$$;

grant execute on function public.get_rooms_with_counts(text, boolean, integer, integer, text, text, boolean, boolean, boolean) to anon, authenticated;

-- Удаляем view — устраняет lint Security Definer View
drop view if exists public.v_item_resolved_room;
