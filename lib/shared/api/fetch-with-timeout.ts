/**
 * Обёртка над fetch с таймаутом для использования в Supabase и других клиентах.
 * Вызов fetch разрешён только в lib/shared/api/** — этот модуль отсюда импортируется.
 */

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export function fetchWithTimeout(
  timeoutMs: number,
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort());
  }
  const signal = controller.signal;
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(timeoutId));
}
