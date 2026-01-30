-- View: для каждой вещи определяет итоговое помещение (прямо в помещении, в месте или в контейнере внутри помещения).
-- Используется для корректного подсчёта вещей в помещении и списка вещей на странице помещения.
create or replace view public.v_item_resolved_room as
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
select item_id, room_id
from resolved
where room_id is not null;

-- RPC для API: список id вещей в помещении (в т.ч. в контейнерах/местах). security definer — доступ к mv_*.
create or replace function public.get_item_ids_in_room(p_room_id bigint)
returns table (item_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ir.item_id
  from public.v_item_resolved_room ir
  join items i on i.id = ir.item_id and i.deleted_at is null
  where ir.room_id = p_room_id;
$$;

grant execute on function public.get_item_ids_in_room(bigint) to authenticated;

-- Обновляем get_rooms_with_counts: items_count = все вещи с resolved room = это помещение (в т.ч. в контейнерах/местах)
create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0
)
returns table (
  id bigint,
  name text,
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
    r.created_at,
    r.deleted_at,
    r.photo_url
  from rooms r
  where
    case
      when show_deleted then r.deleted_at is not null
      else r.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or r.name ilike '%' || search_query || '%'
    )
),
paged_rooms as (
  select *
  from filtered_rooms
  order by created_at desc
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
order by p.created_at desc;
$$;
