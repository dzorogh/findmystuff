revoke all on table public.mv_item_last_transition from anon, authenticated;
revoke all on table public.mv_container_last_transition from anon, authenticated;
revoke all on table public.mv_place_last_room_transition from anon, authenticated;

grant select on table public.mv_item_last_transition to service_role;
grant select on table public.mv_container_last_transition to service_role;
grant select on table public.mv_place_last_room_transition to service_role;

create or replace function public.refresh_items_location_materialized_views()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  refresh materialized view public.mv_item_last_transition;
  refresh materialized view public.mv_container_last_transition;
  refresh materialized view public.mv_place_last_room_transition;
end;
$$;

revoke execute on function public.refresh_items_location_materialized_views() from public;
grant execute on function public.refresh_items_location_materialized_views() to service_role;

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
    it.destination_type,
    it.destination_id,
    it.created_at as moved_at
  from paged_items p
  left join public.mv_item_last_transition it on it.item_id = p.id
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

grant execute on function public.get_items_with_room(
  text,
  boolean,
  integer,
  integer
) to anon, authenticated;
