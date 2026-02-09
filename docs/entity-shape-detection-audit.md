# Определение типа по форме сущности — аудит

Проверка кодовой базы на места, где тип сущности выводится по наличию полей в объекте (`"key" in entity`) вместо явного типа или конфига.

---

## 1. `components/lists/entity-row.tsx`

### 1.1 Subline под именем (тип записи)
**Строки 83–89.** Выбор подписи по форме:
- `"item_type" in entity` → item_type.name
- `"room_type" in entity` → room_type.name  
- `"entity_type" in entity` → entity_type.name

**Суть:** угадывание «item / room / place» по наличию `item_type`, `room_type`, `entity_type`.

---

### 1.2 Блоки под именем на мобильной (дубли колонок)
**Строки 118–206.** Какие блоки показывать под именем:
- `roomLabel !== undefined && "last_location" in entity` → блок «Помещение»
- `"places_count" in entity && "containers_count" in entity` → блок с counts (room)
- `"room" in entity && "items_count" in entity && !("places_count" in entity)` → блок с counts + room (place)
- `"last_location" in entity && ... destination_type` → блок «Расположение» (container)

**Суть:** угадывание room / place / container по полям `places_count`, `containers_count`, `room`, `last_location`.

---

### 1.3 Колонка `room`
**Строки 218–248.**
- `roomLabel !== undefined && "last_location" in entity` → показ roomLabel (items)
- `"room" in entity && !("places_count" in entity)` → показ ссылки на помещение (places)

**Суть:** по форме решается, показывать ли помещение и в каком виде.

---

### 1.4 Колонка `movedAt`
**Строки 252–266.**  
`"last_location" in entity && (entity as Item).last_location?.moved_at != null` → дата перемещения.

**Суть:** угадывание «это item» по `last_location.moved_at`.

---

### 1.5 Колонка `counts`
**Строки 269–289.**  
`"places_count" in entity && "containers_count" in entity` → три счётчика (room).

**Суть:** угадывание «это room» по полям counts.

---

### 1.6 Колонка `location`
**Строки 291–358.**  
`"last_location" in entity && (entity as Container).last_location?.destination_type != null` → расположение контейнера.

**Суть:** угадывание «это container» по `last_location.destination_type`.

---

## 2. `components/lists/entity-list.tsx`

### 2.1 Подпись помещения для строки
**Строки 47–52.** `getRoomLabelForRow(entity)`:
- читает `(entity as Item).last_location`
- если есть — возвращает подпись помещения.

**Суть:** «если есть last_location — считаем сущность item и берём roomLabel»; тип не передаётся явно, только по форме.

---

## 3. Остальные файлы

- **lib/entities/rooms/list-fetch.ts**, **places/list-fetch.ts**, **containers/list-fetch.ts** — типы известны из контекста (Room, Place, Container), фильтрация по полям, не определение типа по форме.
- **app/api/** — работа с конкретными типами (room, place, container, item), не угадывание.
- **app/(app)/items/page.tsx** — `"totalCount" in listPage` / `"itemsPerPage" in listPage` — проверка возвращаемого значения хука, не формы сущности.
- **app/(app)/containers/page.tsx**, **places/page.tsx** — `"setMovingId" in listPage` / `"movingId" in listPage` — то же, не сущность.

**Вывод:** определение типа по форме сущности сосредоточено в **entity-row.tsx** и **entity-list.tsx**.

---

## Рекомендации

1. **entity-list.tsx:** передавать `roomLabel` снаружи (или флаг «показывать room» + значение), считая его в странице/конфиге для списка items, чтобы список не обращался к `last_location`.
2. **entity-row.tsx:** вынести решение «что рендерить» в конфиг:
   - либо флаги/ключи в `columnsConfig` (например, для колонки `room`: откуда брать значение — `roomLabel` / `entity.room`),
   - либо рендер-функции из конфига по ключу колонки,
   - либо явный «тип строки» из конфига списка (item/room/place/container) и ветвление по нему, без проверок `"key" in entity`.
3. **Subline (item_type / room_type / entity_type):** либо общий доступ к полю подписи из конфига (например, `getListSubline(entity)`), либо одно поле в конфиге типа «ключ поля для subline» и использование только его.

После этого в `entity-row` и `entity-list` не должно остаться логики вида «если есть такие поля — считаем сущность таким типом».
