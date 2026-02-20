# API Tenant Context Contract

All existing entity APIs (items, rooms, places, containers, buildings, furniture, transitions, search) MUST receive tenant context.

## How Tenant is Passed

- **Header**: `X-Tenant-Id: <tenant_id>` (preferred for API calls)
- **Cookie**: `tenant_id=<tenant_id>` (fallback for SSR / same-origin)
- **Query param** (optional): `?tenant_id=<id>` for GET requests

## Behavior

- If no tenant provided and user has exactly one tenant → use that tenant
- If no tenant provided and user has multiple tenants → 400 Bad Request with message to select tenant
- If no tenant provided and user has zero tenants → 400 with redirect to onboarding
- All responses are automatically tenant-scoped by Supabase RLS when using authenticated client

## Affected Routes

- GET/POST /api/rooms
- GET/POST /api/places
- GET/POST /api/containers
- GET/POST /api/items
- GET/POST /api/buildings
- GET/POST /api/furniture
- GET/POST /api/transitions
- GET /api/search
- GET /api/entity-types (no tenant — global)

## Client Contract (apiClient)

```typescript
// All entity methods accept tenantId or read from context
apiClient.rooms.list({ tenantId: number })
apiClient.items.create({ ...data, tenantId: number })
```
