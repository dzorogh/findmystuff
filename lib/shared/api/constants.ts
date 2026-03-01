/**
 * Общие константы для API и списков.
 */

/** Максимальное количество записей в одном ответе списков (RPC page_limit, fallback limit). */
export const DEFAULT_PAGE_LIMIT = 2000;

/** Размер страницы по умолчанию для пагинированных списков в UI. */
export const DEFAULT_LIST_PAGE_SIZE = 20;

/** Максимальный размер загружаемого файла (фото) в байтах — 10 MB. */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Лимит мест при загрузке детали мебели (GET /api/furniture/[id]). При росте данных рассмотреть пагинацию. */
export const FURNITURE_DETAIL_PLACES_LIMIT = 500;

/** Лимит вещей и контейнеров при загрузке детали мебели (GET /api/furniture/[id]). */
export const FURNITURE_DETAIL_CHILDREN_LIMIT = 100;
