-- Переключить RPC на SECURITY INVOKER — доступ управляется RLS
-- filter_tenant_id + RLS (tenant_id = any(user_tenant_ids())) обеспечивают изоляцию

ALTER FUNCTION public.get_rooms_with_counts(text, boolean, integer, integer, text, text, boolean, boolean, boolean, bigint, bigint) SECURITY INVOKER;
ALTER FUNCTION public.get_places_with_room(text, boolean, integer, integer, text, text, bigint, bigint, bigint, bigint) SECURITY INVOKER;
ALTER FUNCTION public.get_containers_with_location(text, boolean, integer, integer, text, text, bigint, boolean, text, bigint) SECURITY INVOKER;
ALTER FUNCTION public.get_items_with_room(text, boolean, integer, integer, text, bigint, boolean, text, text, bigint) SECURITY INVOKER;
ALTER FUNCTION public.get_furniture_with_counts(text, boolean, integer, integer, text, text, bigint, bigint) SECURITY INVOKER;
