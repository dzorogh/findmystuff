# Как получить DATABASE_URL из Supabase

## Шаги:

1. Откройте [Supabase Dashboard](https://app.supabase.com/)
2. Выберите ваш проект
3. Перейдите в **Settings** (настройки) в левом меню
4. Выберите **Database** в списке настроек
5. Прокрутите вниз до раздела **Connection string**
6. Выберите вкладку **URI** (не Transaction или Session)
7. Скопируйте connection string - он будет выглядеть примерно так:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

## Важные моменты:

- **Замените `[password]`** на ваш реальный пароль базы данных
  - Если вы не помните пароль, вы можете сбросить его в разделе Database settings
- **URL-кодирование**: Если ваш пароль содержит специальные символы (например, `@`, `#`, `%`), их нужно закодировать:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - и т.д.

## Пример:

Если ваш пароль `myP@ss#word`, то в connection string он должен быть `myP%40ss%23word`:

```
postgresql://postgres.abcdefghijklmnop:[myP%40ss%23word]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Добавьте в .env.local:

```env
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:your-encoded-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Проверка подключения:

После добавления DATABASE_URL, перезапустите сервер разработки и попробуйте войти через Google снова.
