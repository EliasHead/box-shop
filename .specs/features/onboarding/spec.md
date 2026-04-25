# Feature Spec: Tenant Onboarding

## Goal
Provide a flow for new users (who do not have a linked `Tenant`) to create their store. This links their `User` account to a newly created `Tenant` and upgrades their role to `OWNER`.

## Requirements
- **REQ-1**: Middleware must redirect authenticated users without a `tenantId` to `/app/onboarding`.
- **REQ-2**: Middleware must prevent users WITH a `tenantId` from accessing `/app/onboarding` (redirect to `/app/dashboard`).
- **REQ-3**: A form at `/app/onboarding` must ask for:
  - Store Name (e.g., "Minha Loja")
  - Subdomain (e.g., "minhaloja") - must be unique.
- **REQ-4**: A Server Action `createTenant` must:
  - Validate uniqueness of the subdomain.
  - Create the `Tenant` in the database.
  - Update the `User` setting `tenantId` and `role = "OWNER"`.
- **REQ-5**: The session must be updated so the middleware immediately recognizes the new `tenantId` and allows access to `/app/dashboard`.

## Technical Details
- **Location**: `src/app/app/onboarding/page.tsx`
- **Server Action**: `src/lib/actions/tenant.ts`
- **Session Update**: We will update `auth.config.ts` to handle `trigger === "update"` in the `jwt` callback. The client component will call `useSession().update({ tenantId })` or we use a redirect to a route that forces a session refresh. Wait, `useSession` is client-side. If the server action updates the DB, we can return the `tenantId` and have the client call `update()`.

## Open Questions
- Should we allow users to belong to multiple tenants in the future? (For now, the schema is 1:1 user -> tenant via `tenantId`).
