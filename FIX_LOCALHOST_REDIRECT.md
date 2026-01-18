# Исправление перенаправления на localhost:3000 на бою

## Проблема

После входа через Google на production сервере пользователь перенаправляется на `http://localhost:3000` вместо production URL.

## Причина

В Supabase Dashboard в настройках **Site URL** указан `http://localhost:3000`. Supabase использует этот URL для перенаправления после OAuth, если `redirectTo` не является полным разрешенным URL.

## Решение

### Шаг 1: Измените Site URL в Supabase Dashboard

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **Settings** → **API** (или **Project Settings** → **API**)
4. Найдите раздел **Site URL**
5. Измените значение с `http://localhost:3000` на ваш production URL:
   - Например: `https://yourdomain.com`
   - Или: `https://your-app.vercel.app`
6. **Сохраните** изменения

### Шаг 2: Добавьте Redirect URLs (опционально, но рекомендуется)

В том же разделе найдите **Redirect URLs** и добавьте:

1. `http://localhost:3000/**` (для локальной разработки)
2. `https://yourdomain.com/**` (ваш production URL)
3. `https://your-app.vercel.app/**` (если используете Vercel)

Это позволит Supabase перенаправлять на любые URL вашего приложения.

### Шаг 3: Убедитесь, что переменная окружения установлена

На вашем production сервере убедитесь, что установлена переменная окружения:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Эта переменная используется в компоненте `GoogleSignIn` для правильного формирования `redirectTo` URL.

### Шаг 4: Перезапустите приложение

После изменения настроек в Supabase Dashboard:
1. Подождите 1-2 минуты для применения изменений
2. Перезапустите ваше приложение (если необходимо)
3. Очистите кеш браузера или используйте режим инкогнито
4. Попробуйте войти через Google снова

## Как это работает

1. Пользователь нажимает "Войти через Google"
2. Приложение вызывает `supabase.auth.signInWithOAuth()` с `redirectTo: ${baseUrl}/auth/callback`
3. Supabase перенаправляет на Google для авторизации
4. Google перенаправляет обратно на Supabase callback URL
5. **Supabase обрабатывает OAuth и проверяет `redirectTo` URL:**
   - Если `redirectTo` является полным URL и находится в списке разрешенных Redirect URLs → использует его
   - Если `redirectTo` не разрешен или является относительным → использует Site URL
6. Ваш callback route обменивает код на сессию

## Проверка правильности настроек

Убедитесь, что:

✅ В Supabase Dashboard → Settings → API → **Site URL** указан ваш production URL  
✅ В Supabase Dashboard → Settings → API → **Redirect URLs** добавлены все необходимые URL  
✅ На production сервере установлена переменная `NEXT_PUBLIC_APP_URL` с production URL  
✅ В Google Cloud Console правильно настроены Authorized redirect URIs (только Supabase callback URL)

## Дополнительная информация

- **Site URL** используется как fallback, если `redirectTo` не разрешен
- **Redirect URLs** определяют, какие URL разрешены для перенаправления
- Для локальной разработки можно оставить `http://localhost:3000` в Redirect URLs, но Site URL должен быть production URL для боевого сервера

## Альтернативное решение (для разных окружений)

Если вам нужно использовать один и тот же Supabase проект для разработки и production, вы можете:

1. Установить **Site URL** на production URL
2. Добавить в **Redirect URLs** оба URL:
   - `http://localhost:3000/**`
   - `https://yourdomain.com/**`
3. Использовать переменную окружения `NEXT_PUBLIC_APP_URL` в коде (уже реализовано)

Таким образом, приложение будет автоматически использовать правильный URL в зависимости от окружения.
