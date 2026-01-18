# Исправление ошибки "redirect_uri_mismatch" (Error 400)

## Проблема

Ошибка возникает, когда redirect URI в Google Cloud Console не совпадает с тем, что использует Supabase для OAuth.

## Решение

### Шаг 1: Найдите ваш Supabase Callback URL

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **Authentication** → **Providers** → **Google**
4. Найдите поле **Callback URL** (обычно это `https://[project-ref].supabase.co/auth/v1/callback`)
5. **Скопируйте этот URL полностью** - он понадобится в следующем шаге

### Шаг 2: Настройте Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в **APIs & Services** → **Credentials**
4. Найдите ваш **OAuth 2.0 Client ID** (который используется для Supabase)
5. Нажмите на него для редактирования

### Шаг 3: Исправьте Authorized redirect URIs

В разделе **Authorized redirect URIs**:

1. **УДАЛИТЕ** все неправильные redirect URIs, такие как:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`
   - Любые другие URL, которые НЕ являются Supabase callback URL

2. **ДОБАВЬТЕ** только один redirect URI:
   - Точный URL из Supabase Dashboard (из Шага 1)
   - Обычно это: `https://[project-ref].supabase.co/auth/v1/callback`
   - **ВАЖНО:** URL должен совпадать ТОЧНО, включая протокол (https), домен и путь

3. **Сохраните** изменения

### Шаг 4: Проверьте Authorized JavaScript origins

В разделе **Authorized JavaScript origins** должны быть:
- `http://localhost:3000` (для локальной разработки)
- `https://[project-ref].supabase.co` (ваш Supabase проект)
- URL вашего production приложения (если есть)

### Шаг 5: Подождите и попробуйте снова

1. Подождите **2-5 минут** для применения изменений в Google Cloud Console
2. Очистите кеш браузера или используйте режим инкогнито
3. Попробуйте войти через Google снова

## Как это работает

1. Пользователь нажимает "Войти через Google"
2. Приложение перенаправляет на Supabase OAuth endpoint
3. Supabase перенаправляет на Google для авторизации
4. **Google перенаправляет обратно на Supabase callback URL** (`https://[project-ref].supabase.co/auth/v1/callback`)
5. Supabase обрабатывает OAuth и перенаправляет на ваш `redirectTo` URL (`/auth/callback`)
6. Ваш callback route обменивает код на сессию

**Ключевой момент:** Google видит только Supabase callback URL, поэтому в Google Cloud Console должен быть только этот URL.

## Проверка правильности настроек

Убедитесь, что:

✅ В Google Cloud Console в **Authorized redirect URIs** есть ТОЛЬКО Supabase callback URL  
✅ URL совпадает ТОЧНО с тем, что показано в Supabase Dashboard  
✅ В Google Cloud Console НЕТ локальных или других redirect URIs  
✅ В Supabase Dashboard провайдер Google включен  
✅ Client ID и Client Secret правильно настроены в Supabase Dashboard  

## Дополнительная помощь

Если проблема сохраняется:

1. Проверьте, что вы используете правильный OAuth Client ID в Supabase Dashboard
2. Убедитесь, что в Google Cloud Console нет опечаток в redirect URI
3. Проверьте логи в Supabase Dashboard → Logs → Auth
4. Убедитесь, что переменные окружения `NEXT_PUBLIC_SUPABASE_URL` правильно настроены
