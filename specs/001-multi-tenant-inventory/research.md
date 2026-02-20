# Research: Multi-Tenancy with Supabase and Next.js

**Feature**: 001-multi-tenant-inventory  
**Date**: 2025-02-21

## 1. Multi-Tenancy Architecture (Supabase)

**Decision**: Shared tables with `tenant_id` column; RLS policies filter by tenant membership.

**Rationale**:
- Проще в поддержке, чем schema-per-tenant
- Один набор миграций, индексов и функций
- Supabase RLS отлично подходит для `tenant_id` + membership checks

**Alternatives considered**:
- Schema-per-tenant: сильная изоляция, но сложность миграций и масштабирования
- Отдельная БД на тенанта: избыточно для домашнего склада

---

## 2. RLS Policy Pattern (Supabase)

**Decision**: Helper-функция `tenant.user_tenant_ids()` возвращает массив `tenant_id`, к которым принадлежит `auth.uid()`. RLS policies: `tenant_id = ANY(tenant.user_tenant_ids())`.

**Rationale**:
- Индексируемый предикат
- Один источник правды для membership
- Обёртка `(SELECT tenant.user_tenant_ids())` позволяет кешировать в плане запроса

**Alternatives considered**:
- Inline subquery в каждой policy: дублирование, сложнее поддерживать
- Security definer функция с кешем: возможна оптимизация при росте нагрузки

---

## 3. Tenant Context in Next.js

**Decision**: React Context + cookie `tenant_id` для persistence. Route Handlers читают tenant из cookie или заголовка `X-Tenant-Id`.

**Rationale**:
- Next.js Server Components могут читать cookies
- API routes получают tenant без лишних round-trips
- Cookie доступна на сервере и клиенте

**Alternatives considered**:
- nuqs (URL): удобно для tenant switcher, но не для persistence между сессиями
- Session storage: только клиент, не подходит для SSR/API
- Итог: cookie для активного tenant + nuqs опционально для UI state

---

## 4. Invitation Flow (Supabase + Next.js)

**Decision**: Таблица `tenant_invitations` (tenant_id, inviter_id, invitee_email, status, token). Magic link или токен в URL для accept. Next.js Route Handler `/api/invitations/accept` проверяет token, создаёт membership.

**Rationale**:
- Supabase Auth уже даёт email; invitee может ещё не иметь аккаунта
- Token в URL = stateless, не требует Redis/кеша
- TTL для токена (e.g. 7 дней) в БД

**Alternatives considered**:
- Supabase Invites: привязан к проекту, сложнее кастомизация
- Email-only без токена: менее безопасно, проще перебор

---

## 5. Migration of Existing Data

**Decision**: Миграция создаёт дефолтный tenant "Мой склад" для каждого существующего пользователя (по `auth.users`), привязывает все его данные к этому tenant через `tenant_id`.

**Rationale**:
- Минимальный downtime
- Один tenant на пользователя = обратная совместимость
- Скрипт миграции выполняется в той же транзакции, что и schema changes

**Alternatives considered**:
- Один глобальный tenant: нарушает модель, все пользователи в одном tenant
- Ручная миграция: ошибки, долго

---

## 6. Entity Types and Transitions

**Decision**: `entity_types` — глобальная справочная таблица (без tenant_id). `transitions` получает tenant_id через item/container (косвенно через место назначения).

**Rationale**:
- Entity types общие (типы помещений, контейнеров)
- Transitions привязаны к item/container, которые уже tenant-scoped
- Упрощает RLS и запросы
