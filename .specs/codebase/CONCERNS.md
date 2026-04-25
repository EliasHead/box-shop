# Concerns

## 🔴 Critical

### SEC-01: Hardcoded Database Credentials

**Location:** `docker/compose.dev.yml:17`, `docker/compose.prod.yml:13`, `.env:2`
**Risk:** Database credentials (`admin` / `admin_password`) are hardcoded in plain text across compose files and committed `.env`.
**Impact:** Anyone with repo access has full DB access. Production credentials should never be in version control.
**Fix approach:** Use Docker secrets or environment variable injection from a secrets manager. Remove `.env` from version control (already gitignored via `.env*` pattern, but file exists locally).

### SEC-02: Mock Authentication in Production Path

**Location:** `src/auth.ts:21-23`
**Risk:** The Credentials provider uses a hardcoded email/password (`admin@boxshop.com` / `admin`) with no actual database lookup or password hashing.
**Impact:** No real authentication exists. This is acceptable for a POC but MUST be replaced before any deployment.
**Fix approach:** Implement proper credential verification against the User model with bcrypt hashing, or switch to OAuth providers (Google, GitHub).

### SEC-03: Missing AUTH_SECRET

**Location:** `.env` (absent)
**Risk:** `AUTH_SECRET` environment variable is not set. Auth.js v5 requires this for JWT signing.
**Impact:** Sessions may be insecure or fail in production.
**Fix approach:** Generate with `npx auth secret` and add to environment configuration.

## 🟡 High

### DEBT-01: No Data Layer — All Data is Mocked

**Location:** `src/app/[domain]/page.tsx:6-28`, `src/app/app/dashboard/page.tsx:20-51`
**Risk:** Storefront products and dashboard metrics are hardcoded. The Prisma schema exists but is not connected to any page.
**Impact:** No functional data flow. Significant effort needed to wire up the entire data layer.
**Fix approach:** Create server actions or API routes to fetch data from PostgreSQL. Use Prisma queries in server components.

### DEBT-02: Minimal Test Coverage

**Location:** `src/app/(marketing)/page.test.tsx` (only test file)
**Risk:** Only 1 test exists across the entire project. Critical paths (middleware, auth, storefront rendering) are untested.
**Impact:** High regression risk as features are added.
**Fix approach:** Prioritize tests for `middleware.ts` (routing logic), `auth.ts` (authentication flow), and `[domain]/page.tsx` (storefront rendering).

### DEBT-03: No Error Handling or Error Boundaries

**Location:** Project-wide
**Risk:** No try/catch blocks, no `error.tsx` pages, no `loading.tsx` states, no `not-found.tsx` pages.
**Impact:** Unhandled errors will crash the app with default Next.js error pages. Poor user experience.
**Fix approach:** Add error boundaries (`error.tsx`), loading states (`loading.tsx`), and not-found pages at each route group level.

## 🟠 Medium

### PERF-01: No Loading States

**Location:** All route segments
**Risk:** No `loading.tsx` files exist. When server components perform async operations (future DB queries), users will see no visual feedback.
**Impact:** Perceived performance degradation, especially on mobile.
**Fix approach:** Add `loading.tsx` with skeleton UI to each route group.

### ARCH-01: Storefront Layout Hardcoded to Mobile Width

**Location:** `src/app/[domain]/layout.tsx:5`
**Risk:** The storefront uses `max-w-md` which caps the layout at ~448px on desktop. While intentional for a mobile-first POC, this limits desktop usability.
**Impact:** Desktop users see a narrow phone-like experience.
**Fix approach:** Consider responsive breakpoints or a dedicated desktop layout when scaling.

### ARCH-02: No Middleware Auth Protection

**Location:** `src/middleware.ts`
**Risk:** The middleware handles multi-tenancy routing but does not protect the `/app` dashboard routes. Anyone can access the dashboard without authentication.
**Impact:** Unauthorized access to admin functionality.
**Fix approach:** Add auth checks in middleware for `/app/*` routes using `auth()` from NextAuth, or use a layout-level session check with redirect.

### DOCKER-01: Production Compose Uses Hardcoded Credentials

**Location:** `docker/compose.prod.yml:13,24-25`
**Risk:** Same hardcoded credentials as dev. No separation of environments.
**Impact:** Security vulnerability if deployed to any server.
**Fix approach:** Use `docker compose` with `.env` files or secrets for production.

## 🔵 Low

### DEBT-04: Package Named "temp-app"

**Location:** `package.json:2`
**Risk:** The package name is `temp-app` instead of `box-shop`.
**Impact:** Cosmetic, but affects npm scripts, logging, and developer onboarding.
**Fix approach:** Rename to `box-shop` in `package.json`.

### DEBT-05: Unused shadcn Components

**Location:** `src/components/ui/`
**Risk:** `dropdown-menu.tsx`, `input.tsx`, `label.tsx`, and `table.tsx` are installed but not imported by any page.
**Impact:** Minor bundle size increase (tree-shaking may mitigate).
**Fix approach:** Remove unused components or plan features that use them.

### STYLE-01: Mixed Language in Codebase

**Location:** Project-wide
**Risk:** Comments and variable names are in English; UI strings and README are in Portuguese (pt-BR). No i18n framework.
**Impact:** Scaling to other languages requires significant refactoring.
**Fix approach:** Implement `next-intl` or similar when internationalization is needed.
