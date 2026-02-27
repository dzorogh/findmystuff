# Руководство по внесению изменений

Проект использует **npm** для установки зависимостей и запуска скриптов (`npm install`, `npm run test` и т.д.).

Краткое руководство для разработчиков: как добавлять сущности, запускать тесты и где искать код при изменении списков и деталей.

## Как добавить новую сущность

1. **Миграции и схема БД**  
   Создайте миграции в Supabase (SQL Editor или MCP): таблица с полями `id`, `tenant_id`, `name`, `created_at`, `deleted_at` и нужными атрибутами. Настройте RLS для мультитенантности.

2. **Entity-config**  
   Добавьте конфиг в `lib/entities/<entity>/entity-config.ts`: колонки, фильтры, `fetch`, `labels`, `actions`, при необходимости `move`, `addForm`, `pagination`, `counts`. Типы — в `lib/app/types/entity-config.ts`.

3. **API-клиент**  
   Реализуйте функции загрузки списка (и при необходимости детали) в `lib/<entity>/api.ts`. Для списков можно использовать общий хелпер `createFetchListResult` из `lib/entities/helpers/fetch-list.ts`.

4. **API-маршруты**  
   Добавьте маршруты в `app/api/<entity>/route.ts` (GET список, POST создание) и `app/api/<entity>/[id]/route.ts` (GET деталь, PUT обновление). Используйте `requireAuthAndTenant(request)`, `parseId(params.id, { entityLabel: "…" })`, константы `HTTP_STATUS` из `lib/shared/api/http-status.ts` и `apiErrorResponse` в catch.

5. **Страницы**  
   - Список: в `app/(app)/<entity>/page.tsx` используйте `<EntityListPage config={…EntityConfig} />` (см. `components/lists/entity-list-page.tsx`). Для особых кейсов (как у items с добавлением по фото/штрихкоду) можно реализовать страницу по образцу `app/(app)/items/page.tsx`.  
   - Деталь: создайте `app/(app)/<entity>/[id]/page.tsx` и при необходимости вынесите загрузку в `lib/<entity>/load-<entity>-detail.ts`.

6. **Типы**  
   Добавьте тип сущности в `types/entity.ts` и при необходимости в `TableName` / `EntityKind` в `lib/app/types/entity-config.ts`.

Подробнее об архитектуре — в [README.md](README.md#архитектура-и-код).

## Тесты

- **Юнит-тесты (Jest)**  
  Файлы в `__tests__/`, структура зеркалит `lib/`. Запуск: `npm run test` или `npm run test:watch`.  
  Покрытие: `npm run test:coverage`. Генерируется `coverage/coverage-summary.json`; проверка порога: `npm run test:coverage:check`.

- **E2E (Playwright)**  
  Тесты в `tests/*.spec.ts`. Запуск: `npm run test:e2e` (через Infisical для env). Для CI: `npm run test:e2e:ci`.  
  Установка браузеров: `npm run test:e2e:install`.

Новые API-маршруты желательно покрывать юнит-тестами (мок Supabase или вызов handler с тестовым `Request`). См. примеры в `__tests__/lib/shared/api/`.

## Где смотреть при изменении списков и деталей

- **Списки:** конфиг сущности в `lib/entities/<entity>/entity-config.ts`, хук `useListPage` в `lib/app/hooks/use-list-page.tsx`, URL-состояние в `lib/app/hooks/list-page-url-state.ts`, рендер таблицы в `components/lists/entity-list.tsx` и общая обёртка страницы списка в `components/lists/entity-list-page.tsx`.
- **Детали:** загрузка данных — в `lib/<entity>/load-<entity>-detail.ts` или в API route; страница — `app/(app)/<entity>/[id]/page.tsx`.

## Конвенции

- В API везде использовать константы `HTTP_STATUS` вместо числовых литералов.
- **Именование API-клиентов в `lib/`:** в кодовой базе встречаются оба суффикса — `*Api` (SearchApi, PhotoApi, SoftDeleteApi) и `*ApiClient` (PlacesApiClient, RoomsApiClient и т.д.). Для **новых** API-клиентов использовать суффикс **`*ApiClient`** (например `MyEntityApiClient`), чтобы со временем прийти к единому стилю. Рефакторинг существующих классов оставить на отдельную задачу.
- Логирование: отладочные логи только в dev или через единый логгер; в продакшене не оставлять `console.log` без проверки `process.env.NODE_ENV === "development"`.
