# Implementation Plan: Multi-Tenant Home Inventory

**Branch**: `001-multi-tenant-inventory` | **Date**: 2025-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-multi-tenant-inventory/spec.md`

## Summary

Добавить мультитенантность в приложение домашнего склада: изоляция данных по тенантам (household), поддержка нескольких тенантов на пользователя, RLS в Supabase, контекст активного тенанта в Next.js. Использовать Supabase RLS с tenant_id и helper-функциями, Next.js Route Handlers и middleware для передачи tenant context.

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: Next.js 16, React 19, Supabase JS, Shadcn UI, Tailwind CSS 4  
**Storage**: PostgreSQL (Supabase), RLS для tenant isolation  
**Testing**: Jest, Playwright, MSW  
**Target Platform**: Web (Next.js), mobile-ready (Capacitor)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: CRUD <200ms p95, tenant switch <300ms  
**Constraints**: RLS MUST enforce isolation; API client MUST pass tenant context  
**Scale/Scope**: 10k tenants, 100k users, 1M+ items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify alignment with `.specify/memory/constitution.md`:

- **Code Quality**: ESLint rules, API client vs direct Supabase usage, TypeScript patterns — соблюдаем; API в `lib/`, `app/api/`, `contexts/`
- **Testing Standards**: Unit/E2E для tenant isolation, приглашений, tenant switch
- **UX Consistency**: Shadcn/Radix, mobile-first, единые паттерны для tenant switcher и onboarding
- **Performance**: SSR где возможно, RLS с индексами на tenant_id, избегать N+1

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-tenant-inventory/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by plan)
```

### Source Code (repository root)

```text
app/
├── (app)/               # Protected routes with tenant context
├── (auth)/              # Auth routes
├── api/                 # Route Handlers; tenant from header/cookie
├── layout.tsx
└── ...

components/
├── tenant-switcher/     # Tenant selection UI
├── tenant-onboarding/   # Create/join tenant flow
└── ...

contexts/
├── tenant-context.tsx    # Active tenant state
└── ...

lib/
├── supabase/            # Server/client Supabase
├── entities/            # Entity configs (add tenant scoping)
├── shared/api/          # apiClient (add tenant param)
└── tenants/             # Tenant API, membership, invitations

supabase/migrations/
└── YYYYMMDD_add_multi_tenancy.sql  # tenants, memberships, invitations, tenant_id columns, RLS
```

**Structure Decision**: Single Next.js App Router project. Tenant context via React Context + cookie/nuqs. API routes receive tenant from header `X-Tenant-Id` or session. RLS в Supabase гарантирует изоляцию на уровне БД.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | Все решения соответствуют конституции |
