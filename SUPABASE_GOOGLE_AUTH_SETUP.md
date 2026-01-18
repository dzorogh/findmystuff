# Настройка входа через Google с Supabase Auth

## Предварительные требования

1. **Создайте проект в Google Cloud Platform**
   - Перейдите на [Google Cloud Platform](https://console.cloud.google.com/)
   - Создайте новый проект или выберите существующий

2. **Настройте Google Auth Platform**
   - Перейдите в [Google Auth Platform Console](https://console.cloud.google.com/apis/credentials/consent)
   - Настройте **Audience** (какие пользователи Google могут войти)
   - Настройте **Data Access (Scopes)**:
     - `openid` (добавьте вручную)
     - `.../auth/userinfo.email` (добавлен по умолчанию)
     - `...auth/userinfo.profile` (добавлен по умолчанию)
   - Настройте **Branding** и **Verification** (рекомендуется для повышения доверия)

## Настройка проекта

### 1. Получение Client ID и Client Secret

**ВАЖНО:** При использовании Supabase Auth, Google должен перенаправлять на Supabase callback URL, а не на URL вашего приложения!

1. В Google Cloud Console перейдите в **Credentials** -> **Create Credentials** -> **OAuth client ID**
2. Выберите тип приложения: **Web application**
3. В разделе **Authorized JavaScript origins** добавьте:
   - `http://localhost:3000` (для локальной разработки)
   - URL вашего production приложения (например, `https://yourdomain.com`)
   - **И также добавьте:** `https://[project-ref].supabase.co` (замените `[project-ref]` на ID вашего Supabase проекта)
4. В разделе **Authorized redirect URIs** добавьте **ТОЛЬКО**:
   - `https://[project-ref].supabase.co/auth/v1/callback` (замените `[project-ref]` на ID вашего Supabase проекта)
   - **НЕ добавляйте** `http://localhost:3000/auth/callback` - это неправильно!
   
   **Как найти правильный callback URL:**
   - Перейдите в Supabase Dashboard -> Authentication -> Providers -> Google
   - Там будет показан точный callback URL, который нужно добавить в Google Cloud Console
   - Обычно это: `https://[project-ref].supabase.co/auth/v1/callback`
5. Нажмите **Create** и сохраните **Client ID** и **Client Secret**

### 2. Настройка в Supabase Dashboard

1. Перейдите в Supabase Dashboard вашего проекта
2. Откройте **Authentication** -> **Providers**
3. Найдите **Google** и включите провайдер
4. Вставьте **Client ID** и **Client Secret** из Google Cloud Console
5. Сохраните настройки

### 3. Переменные окружения

Убедитесь, что в вашем `.env.local` файле установлены следующие переменные:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

**Важно:** Client ID и Client Secret настраиваются в Supabase Dashboard, а не в переменных окружения.

## Локальная разработка

Если вы используете Supabase локально:

1. Добавьте переменную окружения:
```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET="<client-secret>"
```

2. Настройте провайдер в `supabase/config.toml`:
```toml
[auth.external.google]
enabled = true
client_id = "<client-id>"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

## Использование

Компонент `GoogleSignIn` уже настроен и использует Supabase Auth. При нажатии на кнопку:

1. Пользователь будет перенаправлен на Google для авторизации
2. После успешной авторизации Google перенаправит на `/auth/callback`
3. Callback route обменяет код на сессию и перенаправит пользователя на главную страницу

## Проверка работы

1. Убедитесь, что Google провайдер настроен в Supabase Dashboard
2. Убедитесь, что переменные окружения установлены
3. Запустите сервер разработки: `npm run dev`
4. Откройте `http://localhost:3000`
5. Нажмите на кнопку "Войти через Google"
6. Вы должны быть перенаправлены на Google для авторизации

## Дополнительные возможности

### Сохранение Google токенов

Если вам нужны Google OAuth 2.0 токены для доступа к Google API:

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

После входа токены будут доступны в `data.session.provider_token` и `data.session.provider_refresh_token`.

### Использование Google One Tap

Для лучшего UX можно использовать Google One Tap. См. пример в документации Supabase: https://supabase.com/docs/guides/auth/social-login/auth-google#one-tap-with-nextjs

## Устранение неполадок

### Ошибка "redirect_uri_mismatch" (Ошибка 400)

Это самая распространенная ошибка. Она возникает, когда redirect URI в Google Cloud Console не совпадает с тем, что использует Supabase.

**Решение:**
1. Откройте Supabase Dashboard -> Authentication -> Providers -> Google
2. Найдите точный callback URL (обычно `https://[project-ref].supabase.co/auth/v1/callback`)
3. Откройте Google Cloud Console -> Credentials -> ваш OAuth 2.0 Client ID
4. В разделе **Authorized redirect URIs** убедитесь, что добавлен **ТОЧНО** такой же URL, как в Supabase
5. **Удалите** любые другие redirect URIs, которые не совпадают (например, `http://localhost:3000/auth/callback`)
6. Сохраните изменения в Google Cloud Console
7. Подождите несколько минут для применения изменений
8. Попробуйте снова

**Важно:** 
- Google перенаправляет на Supabase callback URL (`https://[project-ref].supabase.co/auth/v1/callback`)
- Затем Supabase обрабатывает OAuth и перенаправляет на ваш `redirectTo` URL (`/auth/callback`)
- Поэтому в Google Cloud Console должен быть только Supabase callback URL

### Ошибка "invalid_client"

Проверьте, что Client ID и Client Secret правильно настроены в Supabase Dashboard:
- Authentication -> Providers -> Google
- Убедитесь, что провайдер включен
- Проверьте, что Client ID и Client Secret скопированы без лишних пробелов

### Пользователь не перенаправляется после входа

Проверьте, что callback route (`/auth/callback`) правильно настроен и доступен.
