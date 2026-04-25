# Project Structure

**Root:** `/home/elias/repos/box-shop`

## Directory Tree

```
box-shop/
├── docker/
│   ├── compose.dev.yml          # Dev environment (app + PostgreSQL)
│   └── compose.prod.yml         # Prod environment (built image + PostgreSQL)
├── prisma/
│   └── schema.prisma            # Database schema (Tenant, User, Product)
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   ├── (marketing)/         # SaaS landing page
│   │   │   ├── page.tsx
│   │   │   └── page.test.tsx
│   │   ├── [domain]/            # Dynamic tenant storefront
│   │   │   ├── layout.tsx       # Mobile-first shell
│   │   │   └── page.tsx         # Product catalog (mocked)
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/
│   │   │       └── route.ts     # NextAuth route handler
│   │   ├── app/                 # Admin dashboard
│   │   │   ├── layout.tsx       # Sidebar layout
│   │   │   └── dashboard/
│   │   │       ├── page.tsx     # Overview cards
│   │   │       └── products/
│   │   │           └── page.tsx # Product management (empty state)
│   │   ├── globals.css          # Design tokens + Tailwind config
│   │   ├── layout.tsx           # Root layout (Inter font, metadata)
│   │   └── favicon.ico
│   ├── components/
│   │   └── ui/                  # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── sheet.tsx
│   │       └── table.tsx
│   ├── lib/
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── utils.ts             # cn() utility
│   ├── types/
│   │   └── next-auth.d.ts       # Auth type augmentation
│   ├── auth.ts                  # NextAuth v5 configuration
│   └── middleware.ts            # Multi-tenancy routing
├── Dockerfile                   # Multi-stage production build
├── components.json              # shadcn/ui configuration
├── eslint.config.mjs            # ESLint flat config
├── next.config.ts               # Next.js config (standalone, images)
├── package.json
├── postcss.config.mjs           # Tailwind PostCSS plugin
├── prisma.config.ts             # Prisma config (dotenv + datasource)
├── tsconfig.json                # TypeScript strict config
└── vitest.config.ts             # Vitest + jsdom + path aliases
```

## Module Organization

### Marketing Surface

**Purpose:** Public SaaS landing page for customer acquisition
**Location:** `src/app/(marketing)/`
**Key files:** `page.tsx` (single landing page)

### Tenant Storefront

**Purpose:** Dynamic product catalog rendered per tenant subdomain
**Location:** `src/app/[domain]/`
**Key files:** `layout.tsx` (mobile shell), `page.tsx` (product grid + WhatsApp CTA)

### Admin Dashboard

**Purpose:** Tenant owner's management interface
**Location:** `src/app/app/`
**Key files:** `layout.tsx` (sidebar + mobile sheet), `dashboard/page.tsx` (overview), `dashboard/products/page.tsx` (catalog management)

### Shared UI

**Purpose:** Reusable component primitives from shadcn/ui
**Location:** `src/components/ui/`
**Key files:** `button.tsx`, `card.tsx`, `sheet.tsx`, `table.tsx`

### Core Infrastructure

**Purpose:** Auth, database, and utility functions
**Location:** `src/lib/`, `src/auth.ts`, `src/middleware.ts`
**Key files:** `prisma.ts`, `utils.ts`, `auth.ts`, `middleware.ts`

## Where Things Live

**Multi-Tenancy:**
- Routing logic: `src/middleware.ts`
- Data isolation: `prisma/schema.prisma` (Tenant model with relations)

**Authentication:**
- Config: `src/auth.ts`
- API Route: `src/app/api/auth/[...nextauth]/route.ts`
- Type augmentation: `src/types/next-auth.d.ts`

**Storefront:**
- UI/Interface: `src/app/[domain]/`
- Business Logic: None yet (mocked data inline)
- Data Access: None yet (should use Prisma via server components)

**Dashboard:**
- UI/Interface: `src/app/app/`
- Business Logic: None yet (mocked stats)
- Data Access: None yet

## Special Directories

**`docker/`:**
**Purpose:** Docker Compose configs separated by environment.
**Files:** `compose.dev.yml` (hot reload + PostgreSQL), `compose.prod.yml` (built image)

**`src/components/ui/`:**
**Purpose:** Auto-generated shadcn/ui components. Do NOT manually edit these files; use `npx shadcn add` to install new components.

**`src/generated/prisma/`:**
**Purpose:** Generated Prisma client (gitignored). Regenerated via `npx prisma generate`.
