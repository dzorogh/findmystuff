# Feature Specification: Multi-Tenant Home Inventory

**Feature Branch**: `001-multi-tenant-inventory`  
**Created**: 2025-02-21  
**Status**: Draft  
**Input**: User description: "Построить приложение для домашнего учета вещей и склада, которое доступно разным пользователям (из разных тенантов)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Isolated Data Access by Tenant (Priority: P1)

A user belonging to a tenant logs in and sees only the inventory data (rooms, places, containers, items) of that tenant. Users from different tenants never see each other's data.

**Why this priority**: Data isolation is the core requirement for multi-tenancy. Without it, the feature has no value.

**Independent Test**: Create two tenants with sample data. Log in as users from each tenant. Verify that each user sees only their own tenant's data. Delivers guaranteed privacy and separation of households.

**Acceptance Scenarios**:

1. **Given** User A is a member of Tenant 1, **When** User A logs in and navigates the app, **Then** User A sees only rooms, places, containers, and items belonging to Tenant 1.
2. **Given** User B is a member of Tenant 2, **When** User B logs in and navigates the app, **Then** User B sees only rooms, places, containers, and items belonging to Tenant 2.
3. **Given** User A has created items in Tenant 1, **When** User B searches or browses, **Then** User B does not see User A's items under any circumstance.

---

### User Story 2 - Tenant Onboarding and Selection (Priority: P2)

A new user can create a tenant (household) or join an existing one. When a user belongs to multiple tenants, they can switch between them and work in the context of the selected tenant.

**Why this priority**: Enables users to start using the app and supports households where one person manages multiple spaces (e.g. home and office).

**Independent Test**: New user signs up and creates a tenant. Existing user receives invitation and joins a tenant. User with two tenants switches context and verifies data changes. Delivers onboarding and multi-context support.

**Acceptance Scenarios**:

1. **Given** a new authenticated user with no tenants, **When** the user completes onboarding, **Then** the user can create a new tenant (household) with a name and becomes its first member.
2. **Given** a user belongs to multiple tenants, **When** the user selects a different tenant from a tenant switcher, **Then** the app shows only that tenant's data and all actions (add, edit, search) apply to the selected tenant.
3. **Given** an existing user has received an invitation to join a tenant, **When** the user accepts the invitation, **Then** the user gains access to that tenant's data and can switch to it.

---

### User Story 3 - Tenant Member Management (Priority: P3)

Any tenant member can invite new members and revoke access. Invited members receive a clear way to accept or decline.

**Why this priority**: Enables shared households (family, roommates) to collaborate on the same inventory.

**Independent Test**: Tenant member generates shareable link and sends to invitee. Invitee opens link and accepts. Both users see the same tenant data. Any member can revoke another's access. Delivers shared household management.

**Acceptance Scenarios**:

1. **Given** User A is a member of Tenant 1, **When** User A generates a shareable invite link and sends it to User B manually, **Then** User B can open the link and accept to join Tenant 1.
2. **Given** User B has accepted the invitation, **When** User B logs in, **Then** User B sees Tenant 1 in their tenant list and can access its data.
3. **Given** User A (any member) wants to remove User B from Tenant 1, **When** User A revokes access, **Then** User B no longer sees Tenant 1 and cannot access its data.

---

### Edge Cases

- What happens when a user's last tenant is deleted or they are removed from it? User MUST be prompted to create a new tenant or join another; MUST NOT see empty or broken state.
- When a member deletes a tenant: tenant is soft-deleted (deleted_at). Data is hidden from all members but recoverable. A member MAY restore within a grace period (implementation detail).
- When user has one tenant: auto-select it as active. Tenant switcher remains visible (collapsed or compact) so user can add/switch when they join more tenants.
- What happens when an invited user already has an account vs. does not? Invitation MUST work for both; new users get sign-up + accept flow.
- Search scope: search MUST be limited to the currently selected tenant only.
- Soft-deleted items: MUST remain scoped to tenant; restored items stay in the same tenant.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST isolate all inventory data (rooms, places, containers, items, transitions) by tenant. A user MUST only access data of tenants they belong to.
- **FR-002**: System MUST allow a user to belong to one or more tenants. Each tenant has an isolated namespace of data.
- **FR-003**: System MUST provide a way for the user to select the active tenant. When user has one tenant, auto-select it. Tenant switcher MUST remain visible (for adding more tenants). All operations (view, add, edit, delete, search) MUST apply only to the selected tenant.
- **FR-004**: System MUST allow authenticated users to create a new tenant. The creator becomes the first member.
- **FR-005**: System MUST support inviting users to join a tenant. Invitations MUST be acceptable and declinable by the invitee.
- **FR-006**: System MUST allow any tenant member to revoke another member's access. Revoked users MUST lose access immediately.
- **FR-007**: System MUST prevent users from viewing, modifying, or searching data of tenants they do not belong to.
- **FR-008**: System MUST persist the user's last selected tenant and restore it on next login when applicable.

### Key Entities

- **Tenant**: Represents a household or organizational unit. Has a name. Contains rooms, places, containers, items. Users are members; creator is first member. Supports soft delete (deleted_at); data hidden but recoverable.
- **Tenant Membership**: Links a user to a tenant. All members have equal rights: any member can invite and revoke other members. No role distinction (owner/member) for permissions.
- **User**: Authenticated identity. Can belong to multiple tenants. Has one active tenant context at a time.
- **Invitation**: Pending offer for a user to join a tenant. Delivered via shareable link (inviter copies and sends manually). Has status (pending, accepted, declined, expired). Tied to tenant and inviter.

## Clarifications

### Session 2025-02-21

- Q: What happens when a member deletes a tenant (household)? → A: Soft delete: tenant marked as deleted (e.g. deleted_at), data hidden but recoverable.
- Q: Who can invite new members and revoke access? → A: Rights do not differ (any member can invite/revoke).
- Q: How does the invitee receive the invitation? → A: Shareable link only; inviter copies and sends manually.
- Q: When user has only one tenant, how is active tenant selected? → A: Auto-select + switcher visible: single tenant auto-selected, switcher remains visible for future tenants.
- Q: Is tenant data export needed in the first version? → A: No; out of scope for MVP; add later if needed.

## Assumptions

- A user can belong to multiple tenants (e.g. home and vacation property). Single-tenant users are a subset.
- Tenant creation is self-service; no admin approval required.
- Invitation is by shareable link only. Inviter copies the link and sends it to the invitee manually (messenger, etc.). No email delivery by the system.
- All tenant members have equal permissions (invite, revoke); no owner/member role distinction.
- Migration of existing single-tenant data: existing data is assigned to a default tenant for current users (migration handled separately).
- Data export (CSV, JSON, backup): out of scope for MVP; consider for future release.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users from different tenants complete a full session (login, browse, search, add item) without seeing any data from another tenant.
- **SC-002**: A user with two tenants can switch between them and complete at least one CRUD action in each within 30 seconds.
- **SC-003**: New user can create a tenant and add their first room within 2 minutes of sign-up.
- **SC-004**: Invited user can accept an invitation and see the shared tenant's data within 1 minute of receiving the invite link.
- **SC-005**: 100% of data access paths (direct and search) enforce tenant isolation with no cross-tenant leaks.
