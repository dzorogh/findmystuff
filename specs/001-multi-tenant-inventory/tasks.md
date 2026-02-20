# Tasks: Multi-Tenant Home Inventory

**Input**: Design documents from `specs/001-multi-tenant-inventory/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md

**Tests**: Constitution requires tests for user-facing and critical-path behavior. Unit tests for tenant logic + E2E for isolation (Phase 2, 6).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no dependencies)
- **[Story]**: US1, US2, US3 — maps to spec.md user stories
- Include exact file paths in descriptions

## Path Conventions

Next.js App Router: `app/`, `components/`, `lib/`, `contexts/`, `supabase/migrations/` at repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project structure and prepare for multi-tenancy

- [x] T001 Verify project structure per plan.md: app/, components/, lib/, contexts/, supabase/migrations/
- [x] T002 [P] Create lib/tenants/ directory structure for tenant API modules

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, tenant context, API contract — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create Supabase migration: tenants, tenant_memberships, tenant_invitations tables per data-model.md in supabase/migrations/
- [x] T004 Create Supabase migration: add tenant_id column to buildings, rooms, furniture, places, containers, items, transitions
- [x] T005 Create Supabase migration: tenant schema with user_tenant_ids() and is_member() functions per data-model.md
- [x] T006 Create Supabase migration: RLS policies for tenants, tenant_memberships, tenant_invitations; replace using(true) with tenant-scoped policies on entity tables
- [x] T007 Create Supabase migration: indexes on tenant_id (idx_rooms_tenant_id, idx_items_tenant_id, etc.) and membership/invitation tables
- [x] T008 Create Supabase migration: migrate existing data — create default tenant per user, assign all existing rows to that tenant
- [x] T009 Update RPCs (get_rooms_with_counts, get_items_with_room, etc.) to SECURITY INVOKER or add tenant_id filter so RLS applies
- [x] T010 Create contexts/tenant-context.tsx: TenantProvider, useTenant, active tenant state from cookie
- [x] T011 Create lib/tenants/api.ts: getTenants(), createTenant(), switchTenant() — tenant CRUD and switch API
- [x] T012 Add tenant_id cookie handling: persist/restore active tenant, read in middleware or layout
- [ ] T012a Add unit tests for lib/tenants/ and getActiveTenantId: membership validation, tenant list (Constitution II)

---

## Phase 3: User Story 1 - Isolated Data Access (Priority: P1) 🎯 MVP

**Goal**: All entity access scoped to active tenant; users see only their tenant's data.

**Independent Test**: Create two tenants with sample data. Log in as users from each. Verify each sees only their tenant's rooms, items, search results.

### Implementation for User Story 1

- [x] T013 [US1] Modify app/(app)/layout.tsx: wrap with TenantProvider; redirect users with no tenants to onboarding route
- [x] T014 [US1] Create lib/tenants/server.ts: getActiveTenantId() — read from cookie/header, validate user membership
- [x] T015 [US1] Modify app/api/rooms/route.ts: read tenant from X-Tenant-Id or cookie, pass to RPC; return 400 if no valid tenant
- [x] T016 [US1] Modify app/api/rooms/[id]/route.ts: enforce tenant context for GET/PATCH/DELETE
- [x] T017 [US1] Modify app/api/places/route.ts and app/api/places/[id]/route.ts: add tenant context
- [x] T018 [US1] Modify app/api/containers/route.ts and app/api/containers/[id]/route.ts: add tenant context
- [x] T019 [US1] Modify app/api/items/route.ts and app/api/items/[id]/route.ts: add tenant context
- [x] T020 [US1] Modify app/api/buildings/route.ts and app/api/buildings/[id]/route.ts: add tenant context
- [x] T021 [US1] Modify app/api/furniture/route.ts and app/api/furniture/[id]/route.ts: add tenant context
- [x] T022 [US1] Modify app/api/transitions/route.ts: add tenant context
- [x] T023 [US1] Modify app/api/search/route.ts: scope results to tenant_id
- [x] T024 [US1] Modify app/api/entities/[table]/[id]/route.ts and app/api/entities/[table]/[id]/duplicate/route.ts: add tenant context (validate membership, return 400 if no tenant)
- [x] T025 [US1] Modify app/api/items/[id]/transitions/route.ts: add tenant context
- [x] T026 [US1] Update lib/rooms/api.ts, lib/places/api.ts, lib/containers/api.ts, lib/items/api.ts, lib/buildings/api.ts, lib/furniture/api.ts: add tenantId param to all fetch calls
- [x] T027 [US1] Update entity list components (entity-list.tsx, list-page-content.tsx) to pass tenantId from TenantContext to API calls

**Checkpoint**: User Story 1 complete — data isolated by tenant; no cross-tenant leaks.

---

## Phase 4: User Story 2 - Tenant Onboarding and Selection (Priority: P2)

**Goal**: Create tenant, join via invitation, switch tenant; auto-select when single tenant.

**Independent Test**: New user creates tenant. User with two tenants switches. Invitee accepts link and sees tenant.

### Implementation for User Story 2

- [ ] T028 [US2] Create app/api/tenants/route.ts: GET (list user tenants), POST (create tenant) per contracts/tenant-api.yaml
- [ ] T029 [US2] Create app/api/tenants/[id]/route.ts: GET tenant by id (verify membership)
- [ ] T030 [US2] Create app/api/tenants/switch/route.ts: POST set active tenant, persist to cookie
- [ ] T031 [US2] Create components/tenant-switcher/tenant-switcher.tsx: dropdown to select tenant; visible for single tenant (collapsed)
- [ ] T032 [US2] Create components/tenant-onboarding/tenant-onboarding.tsx: create tenant form for users with no tenants
- [ ] T033 [US2] Create app/(auth)/onboarding/page.tsx or redirect: show TenantOnboarding when user has zero tenants
- [ ] T034 [US2] Add TenantSwitcher to AppSidebar or header in components/navigation/app-sidebar.tsx
- [ ] T035 [US2] Implement auto-select: when user has one tenant, set as active in TenantProvider; persist to cookie

**Checkpoint**: User Story 2 complete — onboarding and tenant switch work.

---

## Phase 5: User Story 3 - Tenant Member Management (Priority: P3)

**Goal**: Generate shareable invite link, accept/decline invitation, list members, revoke access.

**Independent Test**: Member generates link, sends to invitee. Invitee accepts. Member revokes another's access.

### Implementation for User Story 3

- [ ] T036 [US3] Create app/api/tenants/[id]/members/route.ts: GET list members, POST create invitation (generate token, return shareable URL)
- [ ] T037 [US3] Create app/api/tenants/[id]/members/[userId]/route.ts: DELETE revoke member
- [ ] T038 [US3] Create app/api/invitations/accept/route.ts: POST accept by token; create membership, mark invitation accepted
- [ ] T039 [US3] Create app/api/invitations/decline/route.ts: POST decline by token; mark invitation declined (FR-005)
- [ ] T040 [US3] Create app/invitations/accept/page.tsx: public page for invite link; show accept/decline UI; handle sign-up flow for new users
- [ ] T041 [US3] Create components/tenant-members/tenant-members-list.tsx: list members with revoke button
- [ ] T042 [US3] Create components/tenant-members/invite-link-dialog.tsx: generate and copy shareable link to clipboard

**Checkpoint**: User Story 3 complete — invitations and member management work.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, validation, cleanup

- [ ] T043 Handle edge case: user removed from last tenant → redirect to onboarding, prompt create or join
- [ ] T044 Handle edge case: user with multiple tenants and no selection → require tenant selection before app access
- [ ] T045 Add E2E test (Playwright): tenant isolation — two users, two tenants, verify no data cross-leak in tests/e2e/
- [ ] T046 Add unit tests for invitation accept/decline logic in lib/tenants/ or app/api/invitations/
- [ ] T047 [P] Update README.md with multi-tenancy section
- [ ] T048 Run quickstart.md validation; verify npm run check passes (includes coverage per Constitution II)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — data isolation
- **Phase 4 (US2)**: Depends on Phase 2 — tenant CRUD, onboarding, switcher
- **Phase 5 (US3)**: Depends on Phase 2, Phase 4 (needs tenant API) — invitations, members
- **Phase 6 (Polish)**: Depends on Phase 3, 4, 5

### User Story Dependencies

- **US1**: After Foundational — no deps on US2/US3
- **US2**: After Foundational — no deps on US1/US3 (can parallelize with US1)
- **US3**: After Foundational; uses tenant API from US2 — best after US2

### Parallel Opportunities

- T001, T002 in Phase 1
- T015–T027 (US1): different route files — can parallelize
- T028–T030 (US2): different API routes — can parallelize

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Tenant isolation working
3. **STOP and VALIDATE**: Two users, two tenants, verify isolation
4. Deploy/demo

### Incremental Delivery

1. Phase 1 + 2 → Foundation
2. Phase 3 (US1) → MVP (data isolation)
3. Phase 4 (US2) → Onboarding + switcher
4. Phase 5 (US3) → Invitations
5. Phase 6 → Polish

---

## Notes

- RPCs may need tenant_id parameter if SECURITY INVOKER causes performance issues
- tenant_memberships.role: data-model specifies 'member' only (no owner); invitee_email nullable for shareable links
- Invitation link format: `/invitations/accept?token=<token>` or similar
