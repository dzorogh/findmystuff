---
name: Entity config expansion v2
overview: Перейти от list-config/list-fetch/behavior к единому entity-config на сущность и одному источнику правды для list + detail.
todos: []
isProject: false
---

# План v2: Entity Config Expansion

## 1. Цель

1. Получить один модуль `entity-config.ts` на каждую сущность.
2. Убрать дубли `list-fetch.ts` и `use-*-list-page-behavior.ts`.
3. Сделать единый контракт действий сущности для списка и detail-страницы.
4. Убрать переходные имена (`addDialog`, `getListDisplayName`, `listIcon`) в финальном API.

## 2. Текущее состояние (важные проблемы)

1. Несогласованность API: `useListPage` уже работает с `addForm`, страницы частично используют `addDialog`.
2. Логика одной сущности разбита на 3-4 файла.
3. `list-page-content` частично "items-specific" (хардкод заголовков/кнопок).
4. Настройки move (title/messages/destinationTypes) дублируются между list и detail.

## 3. Целевой контракт

1. Базовый тип `EntityConfig` в `/Users/dzorogh/Develop/findmystuff/lib/app/types/list-config.ts` (или отдельный `/Users/dzorogh/Develop/findmystuff/lib/app/types/entity-config.ts`).
2. Поля уровня сущности: `kind`, `basePath`, `apiTable`, `labels` (включая `results`), `actions`, `useActions`, `addForm?`, `getName?`, `icon?`.
3. Поля уровня списка: `filters` (внутри `fields` + `initial`), `columns`, `fetch`, `pagination?`.
4. `useActions({ refreshList }) => (entity) => EntityActionsCallbacks` используется и в list, и в detail.
5. Базовый контракт без дженериков: проще читать, проще поддерживать, меньше когнитивной нагрузки.
6. Для add-формы в публичном контракте есть один параметр `addForm`; тип пропсов формы не выносится в отдельный верхнеуровневый интерфейс.

### 3.1 Упрощенный нейминг (старое -> новое)

1. `apiTable` -> `apiTable` (оставляем без сокращения для ясности: это API-таблица, не UI-таблица)
2. `useEntityActions` -> `useActions`
3. `getDisplayName` -> `getName`
4. `entityIcon` -> `icon`
5. `filterFields` -> `filters.fields`
6. `resultsLabel` -> `labels.results`
7. `initialFilters` -> `filters.initial`
8. `fetchList` -> `fetch`
9. `EntityConfigLabels` -> `EntityLabels`
10. `EntityActionsConfig` -> `ActionsConfig`
11. `MoveFormConfig` -> `MoveConfig`

### 3.2 Финальный результат контракта (target)

```ts
type TableName = "items" | "places" | "containers" | "rooms";
type EntityKind = "item" | "place" | "container" | "room";
type Filters = { showDeleted: boolean } & Record<string, unknown>;

interface EntityDisplay {
  id: number;
  name: string | null;
  deleted_at?: string | null;
}

interface EntityLabels {
  singular: string;
  plural: string;
  results: { one: string; few: string; many: string };
  moveTitle: string;
  moveSuccess: (destinationName: string) => string;
  moveError: string;
  deleteConfirm?: string;
  deleteSuccess?: string;
  restoreSuccess?: string;
  duplicateSuccess?: string;
}

interface MoveConfig {
  enabled: boolean;
  destinationTypes?: Array<"room" | "place" | "container">;
}

interface ActionsConfig {
  actions: Array<"edit" | "move" | "printLabel" | "duplicate" | "delete">;
  showRestoreWhenDeleted?: boolean;
  move?: MoveConfig;
}

interface AddFormConfig {
  title: string;
  form: React.ComponentType<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
  }>;
}

interface FetchListParams {
  query?: string;
  filterValues: Filters;
  sortBy: "name" | "created_at";
  sortDirection: "asc" | "desc";
  page?: number;
}

interface FetchListResult {
  data: EntityDisplay[];
  totalCount?: number;
}

interface EntityConfig {
  kind: EntityKind;
  basePath: string;
  apiTable: TableName;
  labels: EntityLabels;
  actions: ActionsConfig;
  useActions: (params: { refreshList: () => void }) => (entity: EntityDisplay) => EntityActionsCallbacks;
  addForm?: AddFormConfig;
  getName?: (entity: EntityDisplay) => string;
  icon?: LucideIcon;

  filters: {
    fields: FilterFieldConfig[];
    initial: Filters;
  };
  columns: ListColumnConfig[];
  fetch: (params: FetchListParams) => Promise<FetchListResult>;
  pagination?: { pageSize: number };
}
```

### 3.3 Финальный способ использования

1. List page:

`const listPage = useListPage(itemsEntityConfig)`
`const getEntityActions = itemsEntityConfig.useActions({ refreshList: listPage.refreshList })`
2. Detail page:
использует тот же `itemsEntityConfig` для `basePath`, `labels`, `actions.move.destinationTypes`, `getName`.

## 4. Фазы миграции

## Фаза A. Стабилизация имен

1. Полностью зафиксировать нейминг `addForm` во всех list pages.
2. Зафиксировать, что `behavior`-хуки больше не возвращают `addDialog`.
3. Обновить unit-тесты behavior-хуков под новый контракт.

## Фаза B. Введение EntityConfig (с совместимостью)

1. Добавить/обновить типы `EntityConfig`, `EntityLabels`, `ActionsConfig`, `MoveConfig`, `AddFormConfig`.
2. Временно оставить compatibility-слой для старых импортов, чтобы мигрировать по сущностям поэтапно.
3. Обновить `/Users/dzorogh/Develop/findmystuff/lib/app/hooks/use-list-page.tsx` на прием единого конфига.
4. Явно переименовать ключ конфига `fetchList` -> `fetch` (и параметры вызова на `filterValues`).

## Фаза C. Пилот на items

1. Создать `/Users/dzorogh/Develop/findmystuff/lib/entities/items/entity-config.ts`.
2. Перенести туда `fetchItemsList` из `/Users/dzorogh/Develop/findmystuff/lib/entities/items/list-fetch.ts` и экспортировать как `fetch`.
3. Перевести `/Users/dzorogh/Develop/findmystuff/app/(app)/items/page.tsx` на `useListPage(itemsEntityConfig)`.
4. Перевести `/Users/dzorogh/Develop/findmystuff/app/(app)/items/[id]/page.tsx` на `labels/actions.move/getName` из того же конфига.
5. Удалить `/Users/dzorogh/Develop/findmystuff/lib/entities/items/list-fetch.ts` и `/Users/dzorogh/Develop/findmystuff/lib/entities/items/use-items-list-page-behavior.ts`.

## Фаза D. Унификация list UI

1. Сделать `/Users/dzorogh/Develop/findmystuff/components/lists/list-page-content.tsx` полностью конфигурируемым и не привязанным к `items`.
2. Перевести пропсы на финальные имена: `icon`, `getName`, `actions`.
3. Убедиться, что add-кнопка и заголовки берутся из конфига сущности.

## Фаза E. Раскатка на rooms/places/containers

1. Повторить паттерн items для:

`/Users/dzorogh/Develop/findmystuff/lib/entities/rooms/`
`/Users/dzorogh/Develop/findmystuff/lib/entities/places/`
`/Users/dzorogh/Develop/findmystuff/lib/entities/containers/`
2. Для каждой сущности: `entity-config.ts`, перенос fetch, перевод list/detail, удаление `list-fetch.ts` и `use-*-list-page-behavior.ts`.

## Фаза F. Финальная чистка

1. Удалить compatibility-слой и legacy-имена.
2. Проверить, что в коде не осталось `addDialog`, `list-fetch`, `use-*-list-page-behavior`.
3. Выровнять тексты/лейблы/пустые состояния между list и detail через config.

## 5. Definition of Done

1. На каждую сущность есть один `entity-config.ts`.
2. List и detail читают маршруты, labels, move-настройки и `getName` из одного источника.
3. Удалены `list-fetch.ts` и `use-*-list-page-behavior.ts`.
4. Нет использования `addDialog`, `getListDisplayName`, `entityIcon`, `fetchList` (проверяется grep по репозиторию).
5. `tsc` проходит по затронутым файлам без ошибок.
6. Проходят целевые сценарии:

открытие списка, фильтры, add form, move, delete/restore, duplicate, переход в detail и те же actions.

## 6. Порядок внедрения (рекомендуемо по PR)

1. PR1: Фаза A.
2. PR2: Фаза B.
3. PR3: Фаза C.
4. PR4: Фаза D.
5. PR5: Фаза E.
6. PR6: Фаза F.
