/**
 * Получает DATABASE_URL из переменных окружения Supabase
 * 
 * Если DATABASE_URL не установлен, пытается построить его из Supabase переменных
 * или предоставляет инструкции по получению
 */
export const getDatabaseUrl = (): string => {
  // Если DATABASE_URL уже установлен, используем его
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Пытаемся построить из Supabase переменных
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const _supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseDbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (supabaseUrl && supabaseDbPassword) {
    // Извлекаем project-ref из URL
    // Формат: https://[project-ref].supabase.co
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      const region = process.env.SUPABASE_REGION || "us-east-1"; // По умолчанию
      
      // Строим connection string для Transaction Mode (лучше для serverless)
      return `postgresql://postgres.${projectRef}:${encodeURIComponent(supabaseDbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
    }
  }

  // При сборке возвращаем placeholder, чтобы не ломать build
  // В runtime это вызовет ошибку, что правильно
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }

  // Если не удалось построить, выбрасываем ошибку с инструкциями
  throw new Error(
    "DATABASE_URL не установлен. Установите одну из следующих переменных:\n" +
    "1. DATABASE_URL - полный connection string из Supabase Dashboard\n" +
    "   (Settings -> Database -> Connection string -> URI mode)\n" +
    "2. SUPABASE_DB_PASSWORD - пароль базы данных\n" +
    "   (также можно установить SUPABASE_REGION, по умолчанию us-east-1)\n\n" +
    "Или получите connection string через Supabase Dashboard:\n" +
    "Settings -> Database -> Connection string -> URI mode"
  );
};
