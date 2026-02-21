-- Covering index for FK tenant_invitations_inviter_id_fkey (tenant_invitations.inviter_id -> auth.users.id).
-- Improves JOINs and FK constraint checks; recommended for foreign key columns.

create index if not exists idx_tenant_invitations_inviter_id on public.tenant_invitations (inviter_id);
