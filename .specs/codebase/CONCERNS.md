# Concerns

*Última verificação: 25 de Setembro de 2026 (contra o código real, não apenas STATE.md).*

## 🔴 Critical

### SEC-01: Hardcoded Database Credentials

**Location:** `docker/compose.dev.yml:17,28-29`, `docker/compose.prod.yml:13,23-24`
**Risk:** Database credentials (`admin` / `admin_password`) are hardcoded in plain text across both dev and prod compose files.
**Impact:** Anyone with repo access has full DB access. Production credentials should never be in version control.
**Fix approach:** Use Docker secrets or environment variable injection from a secrets manager.

### SEC-03: AUTH_SECRET Status Unverified

**Location:** `.env` (not present in this environment; no `.env.example` in repo)
**Risk:** No reference to `AUTH_SECRET` found anywhere in code, config, or an example env file, so there's nothing documenting that it's required or how to generate it. Actual runtime value couldn't be verified here (`.env` read is sandboxed).
**Impact:** Sessions may be insecure or fail in production if unset; new developers have no documented way to know this variable is needed.
**Fix approach:** Generate with `npx auth secret`, confirm it's set wherever the app actually runs, and add a `.env.example` documenting required variables (without real values).

## 🟢 Resolved Since Last Review

### ~~SEC-02: Mock Authentication~~ — Resolved
`src/auth.ts` now does a real `prisma.user.findUnique` lookup with `bcrypt.compare` against a stored password hash (`authorizeUser`). No hardcoded credentials remain in the auth path.

### ~~ARCH-02: No Middleware Auth Protection~~ — Resolved
`src/middleware.ts` now wraps the handler in `auth()` and checks `req.auth` for all `app.*` routes, redirecting unauthenticated requests to `/login`.

### ~~DEBT-01: No Data Layer~~ — Resolved
Both the storefront (`src/app/[domain]/page.tsx`) and dashboard (`src/app/app/dashboard/page.tsx`) now query Prisma directly (`prisma.tenant.findUnique`, `prisma.product.findMany`/`count`). Products, categories, and inventory/variations CRUD are also wired through server actions (`src/lib/actions/*`).

## 🟡 High

### DEBT-02: Test Coverage — Improved but Middleware Still Untested

**Location:** `src/middleware.ts`
**Risk:** Test coverage has grown substantially since the last review (9 test files now, up from 1: auth integration, login, dashboard, storefront, categories, products, tenant actions). However, `middleware.ts` — the core multi-tenancy + auth-gating logic — still has no dedicated test file.
**Impact:** Routing/auth-redirect regressions in the middleware (subdomain rewrites, onboarding guard, domain guard) would not be caught by the current suite.
**Fix approach:** Add a test file exercising `middleware.ts`'s hostname/path branches (tenant subdomain rewrite, `app.` auth redirect, onboarding guard, login-page bypass).

### DEBT-03: No Error Handling or Error Boundaries

**Location:** Project-wide
**Risk:** No `error.tsx` or `loading.tsx` exist anywhere in the app. A `not-found.tsx` now exists for `src/app/[domain]`, but that's the only boundary/loading file in the project.
**Impact:** Unhandled errors will crash the app with default Next.js error pages; async Prisma queries (now wired in DEBT-01) render with no loading feedback.
**Fix approach:** Add `error.tsx` boundaries and `loading.tsx` skeletons at each route group level (`app/`, `[domain]/`).

## 🟠 Medium

### PERF-01: No Loading States

**Location:** All route segments
**Risk:** No `loading.tsx` files exist. Now that pages perform real async Prisma queries (see DEBT-01, resolved), users see no visual feedback during data fetches.
**Impact:** Perceived performance degradation, especially on mobile.
**Fix approach:** Add `loading.tsx` with skeleton UI to each route group.

### ARCH-01: Storefront Layout Hardcoded to Mobile Width

**Location:** `src/app/[domain]/layout.tsx:5`
**Risk:** The storefront uses `max-w-md` which caps the layout at ~448px on desktop. Still present, unchanged. While intentional for a mobile-first POC, this limits desktop usability.
**Impact:** Desktop users see a narrow phone-like experience.
**Fix approach:** Consider responsive breakpoints or a dedicated desktop layout when scaling.

### DOCKER-01: Production Compose Uses Hardcoded Credentials

**Location:** `docker/compose.prod.yml:13,23-24`
**Risk:** Same hardcoded credentials as dev (see SEC-01). No separation of environments.
**Impact:** Security vulnerability if deployed to any server.
**Fix approach:** Use `docker compose` with `.env` files or secrets for production.

## 🔵 Low

### DEBT-04: Package Named "temp-app"

**Location:** `package.json:2`
**Risk:** The package name is still `temp-app` instead of `box-shop`. Unchanged.
**Impact:** Cosmetic, but affects npm scripts, logging, and developer onboarding.
**Fix approach:** Rename to `box-shop` in `package.json`.

### DEBT-05: Unused shadcn Components

**Location:** `src/components/ui/`
**Risk:** Re-checked usage across `src/`: `dropdown-menu.tsx` is imported by 0 files and remains unused. `input.tsx`, `label.tsx`, `table.tsx`, `badge.tsx`, `dialog.tsx`, `select.tsx`, `sheet.tsx`, `textarea.tsx` are now all in use (products/categories/inventory UI pulled most of these in since the last review).
**Impact:** Minor bundle size increase (tree-shaking may mitigate).
**Fix approach:** Remove `dropdown-menu.tsx` or plan a feature that uses it (e.g. row actions in product/inventory tables).

### STYLE-01: Mixed Language in Codebase

**Location:** Project-wide
**Risk:** Comments and variable names are in English; UI strings and README/specs are in Portuguese (pt-BR). No i18n framework. Unchanged.
**Impact:** Scaling to other languages requires significant refactoring.
**Fix approach:** Implement `next-intl` or similar when internationalization is needed.
