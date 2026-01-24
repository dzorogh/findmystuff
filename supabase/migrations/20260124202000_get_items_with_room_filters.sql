create or replace function public.get_items_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 20,
  page_offset integer default 0,
  location_type text default null,
  room_id bigint default null,
  has_photo boolean default null
)
returns table (
  id bigint,
  name text,
  created_at timestamptz,
  deleted_at timestamptz,
  photo_url text,
  destination_type text,
  destination_id bigint,
  moved_at timestamptz,
  room_id bigint,
  room_name text,
  total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_items as (
  select
    i.id,
    i.name,
    i.created_at,
    i.deleted_at,
    i.photo_url
  from items i
  where
    case
      when show_deleted then i.deleted_at is not null
      else i.deleted_at is null
    end
    and (
      search_query is null
      or search_query = ''
      or i.name ilike '%' || search_query || '%'
    )
    and (
      has_photo is null
      or (has_photo = true and i.photo_url is not null)
      or (has_photo = false and i.photo_url is null)
    )
),
item_transition as (
  select
    f.id,
    it.destination_type,
    it.destination_id,
    it.created_at as moved_at
  from filtered_items f
  left join public.mv_item_last_transition it on it.item_id = f.id
),
place_room_transition as (
  select
    it.id,
    pr.room_id
  from item_transition it
  left join public.mv_place_last_room_transition pr
    on it.destination_type = 'place'
    and pr.place_id = it.destination_id
),
container_terminal as (
  select
    it.id,
    terminal.destination_type as terminal_type,
    terminal.destination_id as terminal_id
  from item_transition it
  left join lateral (
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
container_place_room_transition as (
  select
    ct.id,
    pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr
    on ct.terminal_type = 'place'
    and pr.place_id = ct.terminal_id
),
resolved_room as (
  select
    it.id,
    it.destination_type,
    it.destination_id,
    it.moved_at,
    case
      when it.destination_type = 'room' then it.destination_id
      when it.destination_type = 'place' then prt.room_id
      when it.destination_type = 'container' then
        case
          when ct.terminal_type = 'room' then ct.terminal_id
          when ct.terminal_type = 'place' then cprt.room_id
          else null
        end
      else null
    end as room_id
  from item_transition it
  left join place_room_transition prt on prt.id = it.id
  left join container_terminal ct on ct.id = it.id
  left join container_place_room_transition cprt on cprt.id = it.id
),
filtered_with_location as (
  select
    f.id,
    f.name,
    f.created_at,
    f.deleted_at,
    f.photo_url,
    rr.destination_type,
    rr.destination_id,
    rr.moved_at,
    rr.room_id,
    r.name as room_name
  from filtered_items f
  left join resolved_room rr on rr.id = f.id
  left join rooms r on r.id = rr.room_id and r.deleted_at is null
  where
    (location_type is null or rr.destination_type = location_type)
    and (room_id is null or rr.room_id = room_id)
),
paged_items as (
  select *
  from filtered_with_location
  order by created_at desc
  offset page_offset
  limit page_limit
)
select
  p.id,
  p.name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  p.destination_type,
  p.destination_id,
  p.moved_at,
  p.room_id,
  p.room_name,
  (select count(*) from filtered_with_location) as total_count
from paged_items p
order by p.created_at desc;
$$;

grant execute on function public.get_items_with_room(
  text,
  boolean,
  integer,
  integer,
  text,
  bigint,
  boolean
) to anon, authenticated;
