create or replace function public.get_items_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 20,
  page_offset integer default 0
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
),
paged_items as (
  select *
  from filtered_items
  order by created_at desc
  offset page_offset
  limit page_limit
),
item_transition as (
  select
    p.id,
    t.destination_type,
    t.destination_id,
    t.created_at as moved_at
  from paged_items p
  left join lateral (
    select t.destination_type, t.destination_id, t.created_at
    from transitions t
    where t.item_id = p.id
    order by t.created_at desc
    limit 1
  ) t on true
),
place_room_transition as (
  select
    it.id,
    pr.destination_id as room_id
  from item_transition it
  left join lateral (
    select t.destination_id
    from transitions t
    where t.place_id = it.destination_id
      and t.destination_type = 'room'
    order by t.created_at desc
    limit 1
  ) pr on it.destination_type = 'place'
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
      from transitions t
      where t.container_id = it.destination_id
      order by t.created_at desc
      limit 1
      union all
      select t2.destination_type, t2.destination_id, c.depth + 1
      from chain c
      join lateral (
        select t2.destination_type, t2.destination_id
        from transitions t2
        where t2.container_id = c.destination_id
        order by t2.created_at desc
        limit 1
      ) t2 on c.destination_type = 'container'
      where c.depth < 10
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
    pr.destination_id as room_id
  from container_terminal ct
  left join lateral (
    select t.destination_id
    from transitions t
    where t.place_id = ct.terminal_id
      and t.destination_type = 'room'
    order by t.created_at desc
    limit 1
  ) pr on ct.terminal_type = 'place'
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
)
select
  p.id,
  p.name,
  p.created_at,
  p.deleted_at,
  p.photo_url,
  rr.destination_type,
  rr.destination_id,
  rr.moved_at,
  rr.room_id,
  r.name as room_name,
  (select count(*) from filtered_items) as total_count
from paged_items p
left join resolved_room rr on rr.id = p.id
left join rooms r on r.id = rr.room_id and r.deleted_at is null
order by p.created_at desc;
$$;
