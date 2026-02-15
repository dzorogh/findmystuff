-- Упрощаем MV: места могут быть только в мебели
DROP MATERIALIZED VIEW IF EXISTS public.mv_place_last_room_transition;
CREATE MATERIALIZED VIEW public.mv_place_last_room_transition AS
WITH place_last_transition AS (
  SELECT DISTINCT ON (t.place_id)
    t.place_id,
    t.destination_type,
    t.destination_id,
    t.created_at
  FROM transitions t
  WHERE t.place_id IS NOT NULL
    AND t.destination_type = 'furniture'
  ORDER BY t.place_id, t.created_at DESC
)
SELECT
  plt.place_id,
  plt.destination_type,
  plt.destination_id,
  (SELECT room_id FROM furniture WHERE id = plt.destination_id AND deleted_at IS NULL) AS room_id,
  plt.created_at
FROM place_last_transition plt;
CREATE UNIQUE INDEX IF NOT EXISTS mv_place_last_room_transition_place_id_idx
  ON public.mv_place_last_room_transition (place_id);
