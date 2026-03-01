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
  Покрытие: `npm run test:coverage`. **Покрытие считается только по коду в `lib/`** (в `jest.config.js` задано `collectCoverageFrom: ['lib/**/*...']`). Страницы `app/`, компоненты и контексты в отчёт не входят. Генерируется `coverage/coverage-summary.json`; проверка порога: `npm run test:coverage:check`.

- **E2E (Playwright)**  
  Тесты в `tests/*.spec.ts`. Запуск: `npm run test:e2e` (через Infisical для env). Для CI: `npm run test:e2e:ci`.  
  Установка браузеров: `npm run test:e2e:install`.

Новые API-маршруты желательно покрывать юнит-тестами (мок Supabase или вызов handler с тестовым `Request`). См. примеры в `__tests__/lib/shared/api/` и `__tests__/app/api/`.

**Контракт моков в тестах API и load-detail:**
- **Маршруты `app/api/*/route.ts`:** мокаются `requireAuthAndTenant`, `createClient`, а также доменные функции (например `loadPlaceDetail`, `getContainersWithLocationRpc`). При смене сигнатур (например, `params: Promise<{ id: string }>` в Next.js 15) нужно обновить вызов handler в тестах (передавать `{ params: Promise.resolve({ id: "1" }) }`).
- **load-detail (`lib/*/load-*-detail.ts`):** мокается цепочка Supabase (`from().select().eq().single()`, `order()` и т.д.). Минимальный контракт — какой `from()` и какой `select()` вызываются; при изменении структуры запросов в коде тесты нужно синхронизировать.
- При рефакторинге маршрутов или загрузчиков проверять связанные тесты и при необходимости обновлять ожидания и моки.

**Формы сущностей и move-модалки:** в формах добавления/редактирования (add-room, add-place, add-container, add-item, add-building, add-furniture, edit-*) повторяется паттерн: `useUser()`, `useEntityTypes(category)`, локальные `useState` для полей и `isSubmitting`. В move-room-form, move-place-form, move-entity-form дублируется логика открытия/закрытия модалки и блокировки закрытия. При желании уменьшить дублирование можно вынести общий хук `useEntityFormState(category)` и общий компонент/хук для move-модалок (internalOpen, blockClose, handleSheetOpenChange).

## Где смотреть при изменении списков и деталей

- **Списки:** конфиг сущности в `lib/entities/<entity>/entity-config.ts`, хук `useListPage` в `lib/app/hooks/use-list-page.tsx`, URL-состояние в `lib/app/hooks/list-page-url-state.ts`, рендер таблицы в `components/lists/entity-list.tsx` и общая обёртка страницы списка в `components/lists/entity-list-page.tsx`.
- **Детали:** загрузка данных — в `lib/<entity>/load-<entity>-detail.ts` или в API route; страница — `app/(app)/<entity>/[id]/page.tsx`.

## Конвенции

- В API везде использовать константы `HTTP_STATUS` вместо числовых литералов.
- **Именование API-клиентов в `lib/`:** для **новых** клиентов, обращающихся к маршрутам `/api/*`, использовать суффикс **`*ApiClient`** (например `PlacesApiClient`, `BarcodeLookupApiClient`, `RecognizeItemPhotoApiClient`). Экспортировать класс и синглтон, например: `export class BarcodeLookupApiClient extends HttpClient { ... }` и `export const barcodeLookupApiClient = new BarcodeLookupApiClient()`. Функции вида `*Api` (например устаревшие `barcodeLookupApi`, `recognizeItemPhotoApi`) не использовать для новых клиентов; в коде применять экземпляры `*ApiClient`.
- Логирование: отладочные логи только в dev или через единый логгер; в продакшене не оставлять `console.log` и `console.error` без проверки `process.env.NODE_ENV === "development"` (в т.ч. в `HttpClient` и других catch-блоках).

## Контексты

- **Корневой контекст:** `contexts/tenant-context.tsx` — текущий тенант, cookie, переключение склада. Единственный глобальный контекст в `contexts/`.
- **Контексты приложения:** `lib/app/contexts/` — add-item (добавление вещи по фото/штрихкоду/форме), quick-move (диалог быстрого перемещения), current-page. Используются на страницах и в формах.
- **Доменные контексты/хуки:** пользователи и настройки — в `lib/users/`, `lib/settings/`.

## API-маршруты: хелперы и конвенции

- **Аутентификация и тенант:** `requireAuthAndTenant(request)` — возвращает `{ tenantId }` или `NextResponse` с 401/выбором тенанта. Использовать в начале каждого маршрута.
- **ID из URL (динамический сегмент):** `requireIdParam(params, { entityLabel: "…" })` — для маршрутов `app/api/<entity>/[id]/route.ts`. Параметр `params` может быть `Promise<{ id: string }>` (Next.js 15+). Возвращает `{ id: number }` или `NextResponse` с 400/404.
- **ID из query или body:** `parseId(idString, { entityLabel: "…" })` — когда id приходит строкой из `searchParams.get("id")` или из `body.id`. Возвращает `{ id: number }` или `NextResponse`.
- **Опциональные query-параметры:** `parseOptionalInt(value)` — для числовых фильтров (roomId, entityTypeId и т.д.). `parseOptionalBool(value)` — для булевых (hasItems, showDeleted).
- **Сортировка:** `normalizeSortParams(sortBy, sortDirection)` из `lib/shared/api/list-params`.
- **Ошибки:** `apiErrorResponse(error, { context, defaultMessage })` в catch; ответ API с ошибкой — всегда `{ error: string }`.
- **Валидация:** `validateDestinationType(value)` для body/query при создании переходов и сущностей с локацией; `validateItemMoney(body)` для полей цены/текущей стоимости (items, furniture).

## Безопасность

- **RLS:** доступ к строкам таблиц (buildings, rooms, furniture, places, containers, items, transitions) ограничен по `tenant_id` через политики RLS. Сервер использует `createServerClient` с cookie пользователя — запросы идут от пользователя, RLS применяется автоматически.
- **Тенант в API:** после `requireAuthAndTenant` все вставки и фильтры должны использовать `tenantId`; не полагаться только на RLS при явной передаче `tenant_id` в insert/update.
- **Валидация входных данных:** проверять типы и допустимые значения (например, `destination_type`, числовые id) в маршрутах; при неверных данных возвращать 400.
