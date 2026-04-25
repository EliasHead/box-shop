# External Integrations

## Database

**Service:** PostgreSQL 15 (Alpine)
**Purpose:** Primary data store for tenants, users, and products.
**Implementation:** Managed via Docker Compose, accessed through Prisma ORM.
**Configuration:**
- Dev: `postgresql://admin:admin_password@db:5432/boxshop_dev` (via `docker/compose.dev.yml`)
- Prod: `postgresql://admin:admin_password@db:5432/boxshop_prod` (via `docker/compose.prod.yml`)
- Local: `DATABASE_URL` in `.env` pointing to `localhost:5432`
**Authentication:** Username/password (hardcoded in compose files — see CONCERNS.md)

## Authentication

**Service:** Auth.js v5 (NextAuth)
**Purpose:** User authentication and session management.
**Implementation:** `src/auth.ts` with PrismaAdapter
**Configuration:** JWT session strategy, Credentials provider
**Authentication:** Mock credentials only (POC): `admin@boxshop.com` / `admin`
**Route Handler:** `src/app/api/auth/[...nextauth]/route.ts`

## Image CDN

**Service:** Unsplash
**Purpose:** Product images for the storefront POC.
**Implementation:** `next/image` with remote patterns configured in `next.config.ts`.
**Configuration:**
```typescript
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }]
}
```
**Authentication:** None (public URLs)

## API Integrations

None implemented. Planned:
- WhatsApp Business API (for order finalization)
- AI/ML service (for product catalog generation from images)

## Webhooks

None implemented.

## Background Jobs

None implemented. No queue system.
