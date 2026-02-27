/**
 * Общие константы для API и списков.
 */

/** Максимальное количество записей в одном ответе списков (RPC page_limit, fallback limit). */
export const DEFAULT_PAGE_LIMIT = 2000;

/** Размер страницы по умолчанию для пагинированных списков в UI. */
export const DEFAULT_LIST_PAGE_SIZE = 20;

/** Максимальный размер загружаемого файла (фото) в байтах — 10 MB. */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
