-- Списки rooms, places, containers, items пустые при SECURITY INVOKER + v_* (контекст auth в RPC).
-- Переводим эти RPC и fn_item_resolved_room на SECURITY DEFINER и чтение из MVs.
-- Изоляция по тенанту: filter_tenant_id = any(tenant.user_tenant_ids()) и tenant_id = filter_tenant_id.

-- 1) fn_item_resolved_room: читать mv_*, SECURITY DEFINER
create or replace function public.fn_item_resolved_room()
returns table (item_id bigint, room_id bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with item_transition as (
  select it.item_id, it.destination_type, it.destination_id
  from public.mv_item_last_transition it
),
place_room as (
  select it.item_id, pr.room_id
  from item_transition it
  join public.mv_place_last_room_transition pr
    on it.destination_type = 'place' and pr.place_id = it.destination_id
),
container_terminal as (
  select it.item_id, terminal.destination_type as terminal_type, terminal.destination_id as terminal_id
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
    select destination_type, destination_id from chain
    where destination_type is distinct from 'container'
    limit 1
  ) terminal on it.destination_type = 'container'
),
container_place_room as (
  select ct.item_id, pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr
    on ct.terminal_type = 'place' and pr.place_id = ct.terminal_id
),
resolved as (
  select it.item_id,
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
select r.item_id, r.room_id from resolved r where r.room_id is not null;
$$;

-- 2) get_rooms_with_counts: mv_*, SECURITY DEFINER
create or replace function public.get_rooms_with_counts(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  has_items boolean default null,
  has_containers boolean default null,
  has_places boolean default null,
  filter_building_id bigint default null,
  filter_tenant_id bigint default null
)
returns table (
  id bigint,
  name text,
  room_type_id bigint,
  room_type_name text,
  building_id bigint,
  building_name text,
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
    r.id, r.name, nullif(btrim(r.name), '') as name_sort,
    r.room_type_id, r.building_id, r.created_at, r.deleted_at, r.photo_url,
    et.name as room_type_name, b.name as building_name
  from rooms r
  left join entity_types et on et.id = r.room_type_id and et.deleted_at is null
  left join buildings b on b.id = r.building_id and b.deleted_at is null
  where
    (filter_tenant_id is null or (filter_tenant_id = any(tenant.user_tenant_ids()) and r.tenant_id = filter_tenant_id))
    and case when show_deleted then r.deleted_at is not null else r.deleted_at is null end
    and (filter_building_id is null or r.building_id = filter_building_id)
    and (search_query is null or search_query = '' or r.name ilike '%' || search_query || '%' or et.name ilike '%' || search_query || '%')
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
  where room_id is not null
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
    p.id, p.name, p.name_sort, p.room_type_id, p.room_type_name, p.building_id, p.building_name,
    p.created_at, p.deleted_at, p.photo_url,
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
total as (select count(*)::bigint as total_count from rooms_with_counts),
paged_rooms as (
  select rwc.*, t.total_count from rooms_with_counts rwc cross join total t
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then rwc.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then rwc.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then rwc.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then rwc.created_at end desc,
    rwc.created_at desc
  offset page_offset limit page_limit
)
select p.id, p.name, p.room_type_id, p.room_type_name, p.building_id, p.building_name,
  p.created_at, p.deleted_at, p.photo_url,
  p.items_count, p.places_count, p.containers_count, p.total_count
from paged_rooms p;
$$;

-- 3) get_places_with_room: mv_*, SECURITY DEFINER
create or replace function public.get_places_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 100,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  filter_entity_type_id bigint default null,
  filter_room_id bigint default null,
  filter_furniture_id bigint default null,
  filter_tenant_id bigint default null
)
returns table (
  id bigint, name text, entity_type_id bigint, entity_type_name text,
  created_at timestamptz, deleted_at timestamptz, photo_url text,
  room_id bigint, room_name text, furniture_id bigint, furniture_name text,
  items_count bigint, containers_count bigint, total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with place_last_furniture as (
  select distinct on (t.place_id) t.place_id, t.destination_id as furniture_id
  from transitions t
  where t.place_id is not null and t.destination_type = 'furniture'
  order by t.place_id, t.created_at desc
),
filtered_places as (
  select p.id, p.name, nullif(btrim(p.name), '') as name_sort, p.entity_type_id, p.created_at, p.deleted_at, p.photo_url, et.name as entity_type_name
  from places p
  left join entity_types et on et.id = p.entity_type_id and et.deleted_at is null
  left join public.mv_place_last_room_transition pr on pr.place_id = p.id
  left join place_last_furniture pf on pf.place_id = p.id
  where
    (filter_tenant_id is null or (filter_tenant_id = any(tenant.user_tenant_ids()) and p.tenant_id = filter_tenant_id))
    and case when show_deleted then p.deleted_at is not null else p.deleted_at is null end
    and (search_query is null or search_query = '' or p.name ilike '%' || search_query || '%' or et.name ilike '%' || search_query || '%')
    and (filter_entity_type_id is null or p.entity_type_id = filter_entity_type_id)
    and (filter_room_id is null or pr.room_id = filter_room_id)
    and (filter_furniture_id is null or pf.furniture_id = filter_furniture_id)
),
paged_places as (
  select * from filtered_places
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset limit least(greatest(coalesce(nullif(page_limit, 0), 100), 1), 500)
),
items_count as (
  select destination_id as place_id, count(*)::bigint as items_count
  from public.mv_item_last_transition where destination_type = 'place' group by destination_id
),
containers_count as (
  select destination_id as place_id, count(*)::bigint as containers_count
  from public.mv_container_last_transition where destination_type = 'place' group by destination_id
)
select p.id, p.name, p.entity_type_id, p.entity_type_name, p.created_at, p.deleted_at, p.photo_url,
  pr.room_id, r.name as room_name, pf.furniture_id, f.name as furniture_name,
  coalesce(ic.items_count, 0) as items_count, coalesce(cc.containers_count, 0) as containers_count,
  (select count(*) from filtered_places) as total_count
from paged_places p
left join public.mv_place_last_room_transition pr on pr.place_id = p.id
left join place_last_furniture pf on pf.place_id = p.id
left join rooms r on r.id = pr.room_id and r.deleted_at is null
left join furniture f on f.id = pf.furniture_id and f.deleted_at is null
left join items_count ic on ic.place_id = p.id
left join containers_count cc on cc.place_id = p.id
order by
  case when sort_by = 'name' and sort_direction = 'asc' then p.name_sort end asc nulls last,
  case when sort_by = 'name' and sort_direction = 'desc' then p.name_sort end desc nulls last,
  case when sort_by = 'created_at' and sort_direction = 'asc' then p.created_at end asc,
  case when sort_by = 'created_at' and sort_direction = 'desc' then p.created_at end desc,
  p.created_at desc;
$$;

-- 4) get_containers_with_location: mv_*, SECURITY DEFINER
create or replace function public.get_containers_with_location(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 2000,
  page_offset integer default 0,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  p_entity_type_id bigint default null,
  p_has_items boolean default null,
  p_destination_type text default null,
  filter_tenant_id bigint default null
)
returns table (
  id bigint, name text, entity_type_id bigint, entity_type_name text,
  created_at timestamptz, deleted_at timestamptz, photo_url text,
  destination_type text, destination_id bigint, destination_name text,
  moved_at timestamptz, items_count bigint, total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if sort_by is null or sort_by not in ('name', 'created_at') then
    raise exception 'invalid sort_by: %. Allowed: name, created_at', coalesce(sort_by, 'NULL');
  end if;
  if sort_direction is null or sort_direction not in ('asc', 'desc') then
    raise exception 'invalid sort_direction: %. Allowed: asc, desc', coalesce(sort_direction, 'NULL');
  end if;
  return query
  with filtered_containers as (
    select c.id, c.name, nullif(btrim(c.name), '') as name_sort, c.entity_type_id, c.created_at, c.deleted_at, c.photo_url, et.name as entity_type_name
    from containers c
    left join entity_types et on et.id = c.entity_type_id and et.deleted_at is null
    where
      (filter_tenant_id is null or (filter_tenant_id = any(tenant.user_tenant_ids()) and c.tenant_id = filter_tenant_id))
      and case when show_deleted then c.deleted_at is not null else c.deleted_at is null end
      and (search_query is null or search_query = '' or c.name ilike '%' || search_query || '%' or et.name ilike '%' || search_query || '%')
      and (p_entity_type_id is null or c.entity_type_id = p_entity_type_id)
  ),
  with_transition as (
    select f.id, f.name, f.name_sort, f.entity_type_id, f.entity_type_name, f.created_at, f.deleted_at, f.photo_url,
      ct.destination_type, ct.destination_id, ct.created_at as moved_at
    from filtered_containers f
    left join public.mv_container_last_transition ct on ct.container_id = f.id
    where (p_destination_type is null or p_destination_type = 'all' or p_destination_type = '' or ct.destination_type = p_destination_type)
  ),
  items_count_all as (
    select t.destination_id as container_id, count(*)::bigint as items_count
    from public.mv_item_last_transition t
    inner join with_transition w on w.id = t.destination_id
    where t.destination_type = 'container' group by t.destination_id
  ),
  with_items_filter as (
    select w.* from with_transition w
    left join items_count_all ic on ic.container_id = w.id
    where (p_has_items is null or (p_has_items and coalesce(ic.items_count, 0) > 0) or (not p_has_items and coalesce(ic.items_count, 0) = 0))
  ),
  paged_containers as (
    select w.* from with_items_filter w
    order by
      case when sort_by = 'name' and sort_direction = 'asc' then w.name_sort end asc nulls last,
      case when sort_by = 'name' and sort_direction = 'desc' then w.name_sort end desc nulls last,
      case when sort_by = 'created_at' and sort_direction = 'asc' then w.created_at end asc,
      case when sort_by = 'created_at' and sort_direction = 'desc' then w.created_at end desc,
      w.created_at desc
    offset page_offset limit page_limit
  ),
  container_transition as (select p.id, p.destination_type, p.destination_id, p.moved_at from paged_containers p),
  items_count as (
    select t.destination_id as container_id, count(*)::bigint as items_count
    from public.mv_item_last_transition t
    inner join paged_containers pc on pc.id = t.destination_id
    where t.destination_type = 'container' group by t.destination_id
  )
  select p.id::bigint, p.name::text, p.entity_type_id::bigint, p.entity_type_name::text,
    p.created_at::timestamptz, p.deleted_at::timestamptz, p.photo_url::text,
    ct.destination_type::text, ct.destination_id::bigint,
    (case when ct.destination_type = 'room' then r.name when ct.destination_type = 'place' then pl.name when ct.destination_type = 'container' then c2.name else null end)::text as destination_name,
    ct.moved_at::timestamptz, coalesce(ic.items_count, 0)::bigint as items_count,
    (select count(*)::bigint from with_items_filter) as total_count
  from paged_containers p
  left join container_transition ct on ct.id = p.id
  left join rooms r on r.id = ct.destination_id and r.deleted_at is null and ct.destination_type = 'room'
  left join places pl on pl.id = ct.destination_id and pl.deleted_at is null and ct.destination_type = 'place'
  left join containers c2 on c2.id = ct.destination_id and c2.deleted_at is null and ct.destination_type = 'container'
  left join items_count ic on ic.container_id = p.id
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then p.name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then p.name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then p.created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then p.created_at end desc,
    p.created_at desc;
end;
$$;

-- 5) get_items_with_room: mv_*, SECURITY DEFINER
create or replace function public.get_items_with_room(
  search_query text default null,
  show_deleted boolean default false,
  page_limit integer default 20,
  page_offset integer default 0,
  location_type text default null,
  room_id bigint default null,
  has_photo boolean default null,
  sort_by text default 'created_at',
  sort_direction text default 'desc',
  filter_tenant_id bigint default null
)
returns table (
  id bigint, name text, item_type_id bigint, item_type_name text,
  created_at timestamptz, deleted_at timestamptz, photo_url text,
  price_amount bigint, price_currency text, current_value_amount bigint, current_value_currency text,
  quantity integer, purchase_date date,
  destination_type text, destination_id bigint, moved_at timestamptz,
  room_id bigint, room_name text, total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
with filtered_items as (
  select i.id, i.name, nullif(btrim(i.name), '') as name_sort, i.item_type_id, i.created_at, i.deleted_at, i.photo_url,
    i.price_amount, i.price_currency, i.current_value_amount, i.current_value_currency, i.quantity, i.purchase_date, et.name as item_type_name
  from items i
  left join entity_types et on et.id = i.item_type_id and et.deleted_at is null
  where
    (filter_tenant_id is null or (filter_tenant_id = any(tenant.user_tenant_ids()) and i.tenant_id = filter_tenant_id))
    and case when show_deleted then i.deleted_at is not null else i.deleted_at is null end
    and (search_query is null or search_query = '' or i.name ilike '%' || search_query || '%' or et.name ilike '%' || search_query || '%')
    and (has_photo is null or (has_photo = true and i.photo_url is not null) or (has_photo = false and i.photo_url is null))
),
item_transition as (
  select f.id, f.name, f.name_sort, f.item_type_id, f.item_type_name, f.created_at, f.deleted_at, f.photo_url,
    f.price_amount, f.price_currency, f.current_value_amount, f.current_value_currency, f.quantity, f.purchase_date,
    it.destination_type, it.destination_id, it.created_at as moved_at
  from filtered_items f
  left join public.mv_item_last_transition it on it.item_id = f.id
),
place_room_transition as (
  select it.id, pr.room_id
  from item_transition it
  left join public.mv_place_last_room_transition pr on it.destination_type = 'place' and pr.place_id = it.destination_id
),
container_terminal as (
  select it.id, terminal.destination_type as terminal_type, terminal.destination_id as terminal_id
  from item_transition it
  left join lateral (
    with recursive chain as (
      select t.destination_type, t.destination_id, 1 as depth from public.mv_container_last_transition t where t.container_id = it.destination_id
      union all
      select t2.destination_type, t2.destination_id, c.depth + 1 from chain c
      join public.mv_container_last_transition t2 on t2.container_id = c.destination_id
      where c.destination_type = 'container' and c.depth < 10
    )
    select destination_type, destination_id from chain where destination_type is distinct from 'container' limit 1
  ) terminal on it.destination_type = 'container'
),
container_place_room_transition as (
  select ct.id, pr.room_id
  from container_terminal ct
  left join public.mv_place_last_room_transition pr on ct.terminal_type = 'place' and pr.place_id = ct.terminal_id
),
resolved_room as (
  select it.id, it.name, it.name_sort, it.item_type_id, it.item_type_name, it.created_at, it.deleted_at, it.photo_url,
    it.price_amount, it.price_currency, it.current_value_amount, it.current_value_currency, it.quantity, it.purchase_date,
    it.destination_type, it.destination_id, it.moved_at,
    case
      when it.destination_type = 'room' then it.destination_id
      when it.destination_type = 'place' then prt.room_id
      when it.destination_type = 'container' then case when ct.terminal_type = 'room' then ct.terminal_id when ct.terminal_type = 'place' then cprt.room_id else null end
      else null
    end as room_id
  from item_transition it
  left join place_room_transition prt on prt.id = it.id
  left join container_terminal ct on ct.id = it.id
  left join container_place_room_transition cprt on cprt.id = it.id
),
filtered_with_location as (
  select rr.id, rr.name, rr.name_sort, rr.item_type_id, rr.item_type_name, rr.created_at, rr.deleted_at, rr.photo_url,
    rr.price_amount, rr.price_currency, rr.current_value_amount, rr.current_value_currency, rr.quantity, rr.purchase_date,
    rr.destination_type, rr.destination_id, rr.moved_at, rr.room_id, r.name as room_name
  from resolved_room rr
  left join rooms r on r.id = rr.room_id and r.deleted_at is null
  where (location_type is null or rr.destination_type = location_type)
    and (get_items_with_room.room_id is null or rr.room_id = get_items_with_room.room_id)
),
filtered_count as (select count(*)::bigint as total_count from filtered_with_location),
paged_items as (
  select * from filtered_with_location
  order by
    case when sort_by = 'name' and sort_direction = 'asc' then name_sort end asc nulls last,
    case when sort_by = 'name' and sort_direction = 'desc' then name_sort end desc nulls last,
    case when sort_by = 'created_at' and sort_direction = 'asc' then created_at end asc,
    case when sort_by = 'created_at' and sort_direction = 'desc' then created_at end desc,
    created_at desc
  offset page_offset limit page_limit
)
select p.id, p.name, p.item_type_id, p.item_type_name, p.created_at, p.deleted_at, p.photo_url,
  p.price_amount, p.price_currency, p.current_value_amount, p.current_value_currency, p.quantity, p.purchase_date,
  p.destination_type, p.destination_id, p.moved_at, p.room_id, p.room_name, fc.total_count
from paged_items p cross join filtered_count fc;
$$;

grant execute on function public.get_rooms_with_counts(text, boolean, integer, integer, text, text, boolean, boolean, boolean, bigint, bigint) to anon, authenticated;
grant execute on function public.get_places_with_room(text, boolean, integer, integer, text, text, bigint, bigint, bigint, bigint) to anon, authenticated;
grant execute on function public.get_containers_with_location(text, boolean, integer, integer, text, text, bigint, boolean, text, bigint) to anon, authenticated;
grant execute on function public.get_items_with_room(text, boolean, integer, integer, text, bigint, boolean, text, text, bigint) to anon, authenticated;
