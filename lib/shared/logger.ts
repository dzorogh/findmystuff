/**
 * Логирование только в development, чтобы не засорять прод и не утекали детали ошибок.
 */

export function logError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
}

export function logErrorOnly(error: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.error(error);
  }
}
