# Документация проекта "Домашний склад"

## Оглавление

1. [Общее описание](#общее-описание)
2. [Технологический стек](#технологический-стек)
3. [Архитектура приложения](#архитектура-приложения)
4. [Структура базы данных](#структура-базы-данных)
5. [Основные подходы и решения](#основные-подходы-и-решения)
6. [Компоненты и их назначение](#компоненты-и-их-назначение)
7. [Аутентификация](#аутентификация)
8. [UI/UX решения](#uiux-решения)
9. [Особенности реализации](#особенности-реализации)
10. [Развертывание и настройка](#развертывание-и-настройка)

---

## Общее описание

**Домашний склад** — это веб-приложение для управления домашним складом и быстрого поиска вещей. Основная идея приложения — предоставить пользователю возможность быстро находить, где находится та или иная вещь, используя иерархическую систему организации: **Помещения → Места → Контейнеры → Вещи**.

### Ключевые возможности

- **Иерархическая организация**: Помещения содержат места, места могут содержать контейнеры, контейнеры и места могут содержать вещи
- **Быстрый поиск**: Единый поиск по всем сущностям (вещи, места, контейнеры, помещения)
- **Управление местоположением**: Возможность перемещения вещей и контейнеров между различными контейнерами, местами и помещениями
- **Мягкое удаление**: Все сущности поддерживают мягкое удаление с возможностью восстановления
- **Современный UI**: Интерфейс построен на ShadCN UI с использованием Tailwind CSS

---

## Технологический стек

### Frontend

- **Next.js 16.1.3** — React-фреймворк с App Router
- **React 19.2.3** — библиотека для построения пользовательского интерфейса
- **TypeScript 5** — типизированный JavaScript
- **Tailwind CSS 4** — utility-first CSS фреймворк
- **ShadCN UI** — библиотека компонентов на основе Radix UI
- **Lucide React** — библиотека иконок

### Backend & Database

- **Supabase** — Backend-as-a-Service (BaaS)
  - **PostgreSQL** — реляционная база данных
  - **Supabase Auth** — система аутентификации
  - **Row Level Security (RLS)** — безопасность на уровне строк
- **Google OAuth 2.0** — провайдер аутентификации

### Инструменты разработки

- **ESLint** — линтер для JavaScript/TypeScript
- **PostCSS** — обработка CSS
- **pnpm** — менеджер пакетов

---

## Архитектура приложения

### Структура проекта

```
storage/
├── app/                    # Next.js App Router страницы
│   ├── api/                # API routes
│   ├── auth/               # Обработка аутентификации
│   ├── containers/         # Страница контейнеров
│   ├── items/              # Страница вещей
│   ├── places/             # Страница мест
│   ├── rooms/              # Страница помещений
│   ├── layout.tsx          # Корневой layout
│   └── page.tsx            # Главная страница (поиск)
├── components/              # React компоненты
│   ├── ui/                 # ShadCN UI компоненты
│   ├── add-*-form.tsx      # Формы добавления
│   ├── edit-*-form.tsx     # Формы редактирования
│   ├── *-list.tsx          # Компоненты списков
│   ├── move-item-form.tsx  # Форма перемещения
│   └── navbar.tsx          # Навигация
├── hooks/                  # Custom React hooks
│   ├── use-user.ts         # Хук для работы с пользователем
│   └── use-toast.ts        # Хук для toast-уведомлений
├── lib/                    # Утилиты и конфигурация
│   ├── supabase/           # Supabase клиенты
│   │   ├── client.ts       # Браузерный клиент
│   │   └── server.ts       # Серверный клиент
│   └── utils.ts            # Общие утилиты
└── public/                 # Статические файлы
```

### Архитектурные принципы

1. **Client Components по умолчанию**: Большинство компонентов являются Client Components (`"use client"`), так как требуют интерактивности и работы с состоянием
2. **Разделение клиентов Supabase**: Отдельные клиенты для браузера и сервера для корректной работы с cookies и SSR
3. **Модальные формы**: Все формы добавления, редактирования и перемещения представлены в модальных окнах (Dialog)
4. **Централизованные хуки**: Переиспользуемая логика вынесена в custom hooks (`useUser`, `useToast`)
5. **Компонентный подход**: Каждая сущность имеет свой набор компонентов (список, форма добавления, форма редактирования)

---

## Структура базы данных

### Таблицы

#### 1. `rooms` (Помещения)
```sql
- id: bigint (PK, auto-increment)
- created_at: timestamptz (default: now())
- name: varchar (nullable)
- deleted_at: timestamptz (nullable) -- для мягкого удаления
```

**Назначение**: Самый верхний уровень иерархии. Помещения могут содержать места, контейнеры и вещи.

#### 2. `places` (Места)
```sql
- id: bigint (PK, auto-increment)
- created_at: timestamptz (default: now())
- name: varchar (nullable)
- deleted_at: timestamptz (nullable)
```

**Назначение**: Места размещения (например, полки шкафов, стеллажей). **Обязательно привязаны к помещениям** через таблицу `transitions`.

**Система маркировки**: Рекомендуется использовать систему маркировки вида `Ш1П1` (Шкаф 1, Полка 1), `С1П2` (Стеллаж 1, Полка 2) для удобной идентификации.

#### 3. `containers` (Контейнеры)
```sql
- id: bigint (PK, auto-increment)
- created_at: timestamptz (default: now())
- name: varchar (nullable)
- deleted_at: timestamptz (nullable)
```

**Назначение**: Контейнеры могут находиться в помещениях, местах или других контейнерах. Могут содержать вещи.

#### 4. `items` (Вещи)
```sql
- id: bigint (PK, auto-increment)
- created_at: timestamptz (default: now())
- name: varchar (nullable)
- deleted_at: timestamptz (nullable)
```

**Назначение**: Конечные объекты учета. Могут находиться в помещениях, местах или контейнерах.

#### 5. `transitions` (Перемещения)
```sql
- id: bigint (PK, auto-increment)
- created_at: timestamptz (default: now())
- item_id: bigint (nullable, FK → items.id)
- container_id: bigint (nullable, FK → containers.id)
- place_id: bigint (nullable, FK → places.id)
- destination_type: varchar (nullable) -- 'place', 'container', 'room'
- destination_id: bigint (nullable)
```

**Назначение**: Таблица истории перемещений. Каждая запись представляет собой перемещение:
- **Для вещей**: `item_id` указывает на вещь, `destination_type` и `destination_id` — куда перемещена
- **Для контейнеров**: `container_id` указывает на контейнер, `destination_type` и `destination_id` — куда перемещен
- **Для мест**: `place_id` указывает на место, `destination_type = 'room'` и `destination_id` — в какое помещение

**Важно**: Для определения текущего местоположения используется **последняя запись** по `created_at` для каждой сущности.

### Связи между таблицами

```
rooms (1) ──< transitions (N)
places (1) ──< transitions (N)
containers (1) ──< transitions (N)
items (1) ──< transitions (N)
```

### Row Level Security (RLS)

Все таблицы имеют включенный RLS. Политики безопасности настроены для обеспечения доступа только аутентифицированным пользователям.

---

## Основные подходы и решения

### 1. Система перемещений через таблицу `transitions`

**Проблема**: Нужно отслеживать историю перемещений и текущее местоположение сущностей.

**Решение**: Использование единой таблицы `transitions` для всех типов перемещений с полями:
- `item_id`, `container_id`, `place_id` — идентификатор перемещаемой сущности
- `destination_type` — тип назначения ('room', 'place', 'container')
- `destination_id` — ID назначения

**Преимущества**:
- Единая точка для истории перемещений
- Возможность отслеживания истории
- Гибкость в определении местоположения

**Определение текущего местоположения**:
```typescript
// Получаем последний переход для сущности
const { data: transitions } = await supabase
  .from("transitions")
  .select("*")
  .eq("item_id", itemId)
  .order("created_at", { ascending: false })
  .limit(1);

const lastTransition = transitions?.[0];
// lastTransition.destination_type и lastTransition.destination_id
// определяют текущее местоположение
```

### 2. Мягкое удаление (Soft Delete)

**Проблема**: Нужна возможность восстановления удаленных сущностей.

**Решение**: Добавление колонки `deleted_at` (TIMESTAMPTZ, nullable) во все таблицы сущностей.

**Реализация**:
- При удалении: устанавливается `deleted_at = NOW()`
- При восстановлении: устанавливается `deleted_at = NULL`
- При выборке: фильтрация по `.is("deleted_at", null)` для активных записей

**Преимущества**:
- Сохранение истории
- Возможность восстановления
- Безопасность данных

### 3. Иерархическое отображение местоположения

**Проблема**: Нужно показывать полную иерархию местоположения (Помещение → Место → Контейнер → Вещь).

**Решение**: Многоуровневая загрузка данных:

```typescript
// 1. Получаем последние transitions для вещей
const { data: itemTransitions } = await supabase
  .from("transitions")
  .select("*")
  .eq("item_id", itemId)
  .order("created_at", { ascending: false });

// 2. Определяем тип и ID назначения
const destinationType = lastTransition.destination_type; // 'place', 'container', 'room'
const destinationId = lastTransition.destination_id;

// 3. Если вещь в месте, получаем помещение места
if (destinationType === 'place') {
  const { data: placeTransitions } = await supabase
    .from("transitions")
    .select("*")
    .eq("place_id", destinationId)
    .eq("destination_type", "room")
    .order("created_at", { ascending: false });
  // Получаем название помещения
}

// 4. Если вещь в контейнере, получаем местоположение контейнера
if (destinationType === 'container') {
  const { data: containerTransitions } = await supabase
    .from("transitions")
    .select("*")
    .eq("container_id", destinationId)
    .order("created_at", { ascending: false });
  // Рекурсивно определяем местоположение контейнера
}
```

**Результат**: Отображение полной иерархии, например: "Гостиная → Ш1П1 → Коробка → Книга"

### 4. Обязательная привязка мест к помещениям

**Требование**: Места должны быть обязательно привязаны к помещениям.

**Решение**:
- В формах добавления/редактирования места: обязательное поле выбора помещения
- Валидация на клиенте: `required` атрибут и проверка перед отправкой
- При создании места: автоматическое создание записи в `transitions` с `place_id` и `destination_type = 'room'`

### 5. Debounced поиск

**Проблема**: Поиск должен быть быстрым и не перегружать сервер запросами.

**Решение**: Использование debounce для задержки запросов:

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, 300); // Задержка 300ms

  return () => clearTimeout(timeoutId);
}, [searchQuery]);
```

### 6. Централизованное управление пользователем

**Проблема**: Множество компонентов нуждаются в информации о текущем пользователе.

**Решение**: Custom hook `useUser`:

```typescript
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Загрузка пользователя и подписка на изменения
    const supabase = createClient();
    const getUser = async () => { /* ... */ };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isLoading };
};
```

### 7. Toast-уведомления вместо in-form сообщений

**Проблема**: Сообщения об успехе внутри форм мешали UX и быстро исчезали.

**Решение**: Использование ShadCN Toast компонентов:

```typescript
const { toast } = useToast();

// После успешного создания/редактирования
toast({
  title: "Успешно",
  description: "Вещь успешно добавлена",
});
```

**Преимущества**:
- Уведомления видны дольше
- Не мешают работе с формой
- Единый стиль по всему приложению

---

## Компоненты и их назначение

### UI Компоненты (ShadCN)

- **Button** — кнопки различных вариантов (default, ghost, secondary)
- **Input** — поля ввода текста
- **Card** — карточки для отображения контента
- **Dialog** — модальные окна для форм
- **Table** — таблицы для структурированного отображения данных
- **Toast/Toaster** — система уведомлений
- **Skeleton** — индикаторы загрузки
- **Badge** — метки и теги
- **Label** — подписи к полям
- **Select** — выпадающие списки

### Компоненты форм

#### `add-*-form.tsx` (Добавление)
- `AddItemForm` — добавление вещей с выбором местоположения
- `AddPlaceForm` — добавление мест с обязательным выбором помещения
- `AddContainerForm` — добавление контейнеров с выбором местоположения
- `AddRoomForm` — добавление помещений

**Общие особенности**:
- Модальное окно (Dialog)
- Toast-уведомления при успехе
- Автоматическое закрытие после успешного создания
- Валидация на клиенте

#### `edit-*-form.tsx` (Редактирование)
- `EditItemForm` — редактирование вещей
- `EditPlaceForm` — редактирование мест с обязательным помещением
- `EditContainerForm` — редактирование контейнеров
- `EditRoomForm` — редактирование помещений

**Общие особенности**:
- Предзаполнение текущих значений
- Toast-уведомления при успехе
- Автоматическое закрытие после сохранения

#### `move-item-form.tsx` (Перемещение)
- Перемещение вещей между помещениями, местами и контейнерами
- Порядок кнопок: Помещение → Место → Контейнер (от большего к меньшему)

### Компоненты списков

#### `*-list.tsx`
- `ItemsList` — таблица вещей с полной иерархией местоположения
- `PlacesList` — список мест с указанием помещения
- `ContainersList` — список контейнеров с местоположением
- `RoomsList` — список помещений с подсчетом вещей, мест и контейнеров

**Общие особенности**:
- Поиск с debounce
- Переключение показа удаленных сущностей
- Кнопки редактирования, удаления и восстановления
- Skeleton-загрузка
- Обновление через `refreshTrigger` prop

### Навигация

#### `navbar.tsx`
- Навигационное меню с иконками
- Отображение текущего пользователя
- Кнопка выхода
- Компонент входа через Google (`GoogleSignIn`)

### Главная страница

#### `app/page.tsx`
- Единый поиск по всем сущностям
- Быстрые действия (карточки для перехода к разделам)
- Модальное окно добавления вещей

---

## Аутентификация

### Провайдер: Google OAuth 2.0

**Настройка**:
1. Создание OAuth 2.0 Client ID в Google Cloud Console
2. Настройка Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
3. Добавление Client ID и Client Secret в Supabase Dashboard

### Реализация

**Браузерный клиент** (`lib/supabase/client.ts`):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**Серверный клиент** (`lib/supabase/server.ts`):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* ... */ }
      }
    }
  )
}
```

### Защита маршрутов

Компоненты проверяют наличие пользователя и показывают соответствующий UI:

```typescript
const { user, isLoading } = useUser();

if (isLoading) return <Skeleton />;
if (!user) return <div>Требуется авторизация</div>;
```

---

## UI/UX решения

### 1. Модальные формы

**Причина**: Улучшение UX — формы не занимают отдельную страницу, можно быстро открыть/закрыть.

**Реализация**: ShadCN Dialog компонент с контролируемым состоянием `open`/`onOpenChange`.

### 2. Табличное отображение вещей

**Причина**: Вещи часто имеют длинные названия (3-4 слова), карточки плохо справлялись с отображением.

**Решение**: Переход на таблицу с колонками:
- Название (с `break-words` для переноса)
- Местоположение (полная иерархия)
- Действия (редактирование, перемещение, удаление)

**Стилизация длинных названий**:
```tsx
<TableCell className="break-words leading-tight min-w-0">
  {item.name}
</TableCell>
```

### 3. Skeleton-загрузка

**Причина**: Улучшение восприятия времени загрузки.

**Реализация**: Компоненты `Skeleton` из ShadCN, показываемые во время загрузки данных.

### 4. Toast-уведомления

**Причина**: Централизованные уведомления более заметны и не мешают работе.

**Реализация**: 
- `Toaster` компонент в корневом layout
- `useToast` hook для вызова уведомлений
- Позиционирование: верхний правый угол (`sm:right-0 sm:top-0`)
- Автоматическое скрытие через 5 секунд

### 5. Адаптивная навигация

**Причина**: Удобство на мобильных устройствах.

**Реализация**: 
- Скрытие текста навигации на маленьких экранах (`hidden md:flex`)
- Иконки всегда видны
- Sticky позиционирование навигации

### 6. Цветовая схема

**Причина**: Современный и чистый вид.

**Реализация**: ShadCN UI "new-york" стиль с нейтральной базовой палитрой, поддержка темной темы через CSS переменные.

---

## Особенности реализации

### 1. Обработка длинных названий

**Проблема**: Названия вещей часто состоят из 3-4 слов и обрезались `truncate`.

**Решение**: Использование `break-words` вместо `truncate`:

```tsx
className="break-words leading-tight min-w-0"
```

**Дополнительно**:
- `leading-tight` — более компактный межстрочный интервал
- `min-w-0` — позволяет flex-элементам сжиматься
- `items-start` вместо `items-center` — выравнивание по верху для многострочного текста

### 2. Подсчет сущностей в помещениях

**Проблема**: Нужно показывать количество вещей, мест и контейнеров в каждом помещении.

**Решение**: Агрегация через таблицу `transitions`:

```typescript
// Получаем все transitions с room как destination
const { data: allTransitions } = await supabase
  .from("transitions")
  .select("*")
  .eq("destination_type", "room")
  .in("destination_id", roomIds);

// Подсчитываем уникальные item_id, place_id, container_id
const itemsByRoom = new Map<number, Set<number>>();
allTransitions.forEach((t) => {
  if (t.item_id) {
    if (!itemsByRoom.has(roomId)) {
      itemsByRoom.set(roomId, new Set());
    }
    itemsByRoom.get(roomId)!.add(t.item_id);
  }
  // Аналогично для places и containers
});
```

### 3. Предотвращение переполнения текста

**Проблема**: Метки вида "0 вещей" переносились и выходили за границы контейнера.

**Решение**: Использование `whitespace-nowrap` и правильной flex-структуры:

```tsx
<div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
  <span className="whitespace-nowrap flex-shrink-0">0 вещей</span>
  <span className="whitespace-nowrap flex-shrink-0">0 мест</span>
</div>
```

### 4. Обновление списков после операций

**Проблема**: После добавления/редактирования/удаления списки не обновлялись автоматически.

**Решение**: Использование `refreshTrigger` prop:

```typescript
const [refreshTrigger, setRefreshTrigger] = useState(0);

// После успешной операции
setRefreshTrigger(prev => prev + 1);

// В компоненте списка
useEffect(() => {
  loadItems();
}, [refreshTrigger]);
```

### 5. Параллельная загрузка данных

**Проблема**: Загрузка связанных данных последовательно замедляла рендеринг.

**Решение**: Использование `Promise.all`:

```typescript
const [placesData, containersData, roomsData] = await Promise.all([
  placeIds.length > 0 ? supabase.from("places").select(...) : { data: [] },
  containerIds.length > 0 ? supabase.from("containers").select(...) : { data: [] },
  roomIds.length > 0 ? supabase.from("rooms").select(...) : { data: [] },
]);
```

### 6. Обработка ошибок

**Подход**: Try-catch блоки с установкой состояния ошибки и отображением пользователю:

```typescript
try {
  // Операция
} catch (error) {
  setError(error instanceof Error ? error.message : "Произошла ошибка");
  console.error("Ошибка:", error);
}
```

---

## Развертывание и настройка

### Переменные окружения

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

### Установка зависимостей

```bash
pnpm install
```

### Запуск разработки

```bash
pnpm dev
```

### Сборка для продакшена

```bash
pnpm build
pnpm start
```

### Настройка Supabase

1. Создайте проект в [Supabase Dashboard](https://app.supabase.com)
2. Настройте Google OAuth в Authentication → Providers
3. Примените миграции базы данных (таблицы, RLS политики)
4. Настройте переменные окружения

### Миграции базы данных

Миграции применяются через Supabase MCP или напрямую через SQL Editor в Dashboard:

1. Создание таблиц (`rooms`, `places`, `containers`, `items`, `transitions`)
2. Добавление колонки `deleted_at` для мягкого удаления
3. Настройка RLS политик
4. Создание foreign key constraints

---

## Заключение

Проект "Домашний склад" демонстрирует современный подход к разработке веб-приложений с использованием Next.js, TypeScript, Supabase и ShadCN UI. Ключевые решения:

- **Иерархическая модель данных** через таблицу transitions
- **Мягкое удаление** для сохранения истории
- **Модальные формы** для улучшения UX
- **Централизованные хуки** для переиспользования логики
- **Toast-уведомления** для обратной связи с пользователем
- **Адаптивный дизайн** с поддержкой мобильных устройств

Проект готов к расширению и может быть дополнен такими функциями, как:
- Экспорт/импорт данных
- Категории вещей
- Фотографии вещей
- История изменений
- Множественные пользователи с разделением данных
- API для интеграций
