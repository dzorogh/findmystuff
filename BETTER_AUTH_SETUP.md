# Настройка Better Auth с Google и Supabase

## Переменные окружения

Добавьте следующие переменные в ваш `.env.local` файл:

```env
# Better Auth Secret (сгенерируйте с помощью: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-secret-key-here

# Base URL вашего приложения
BETTER_AUTH_URL=http://localhost:3000
# Или для production:
# BETTER_AUTH_URL=https://yourdomain.com

# Supabase Database Connection String
# Получите из Supabase Dashboard -> Settings -> Database -> Connection string (URI mode)
# Формат: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
# Или используйте Connection pooling (Session mode) для транзакций
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# ВАЖНО: 
# - Используйте Connection string (URI mode) из Supabase Dashboard
# - Для production используйте Connection pooling (Transaction mode) на порту 5432
# - Убедитесь, что пароль правильно экранирован в URL (замените специальные символы на %XX)

# Google OAuth Credentials
# Получите из Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 Client ID:
   - Перейдите в "Credentials" -> "Create Credentials" -> "OAuth client ID"
   - Выберите "Web application"
   - Добавьте Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (для разработки)
     - `https://yourdomain.com/api/auth/callback/google` (для production)
5. Скопируйте Client ID и Client Secret в `.env.local`

## Миграция базы данных

После настройки переменных окружения выполните миграцию:

```bash
npx @better-auth/cli migrate
```

Это создаст необходимые таблицы в вашей Supabase базе данных.

## Использование

Компонент `GoogleSignIn` уже добавлен на главную страницу. При нажатии на кнопку пользователь будет перенаправлен на Google для авторизации.

## Проверка работы

1. Убедитесь, что все переменные окружения установлены
2. Запустите миграцию базы данных
3. Запустите сервер разработки: `npm run dev`
4. Откройте `http://localhost:3000`
5. Нажмите на кнопку "Войти через Google"
