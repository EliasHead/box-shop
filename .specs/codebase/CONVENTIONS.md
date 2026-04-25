# Code Conventions

## Naming Conventions

**Files:**
- React components: `PascalCase` export, `kebab-case` or `camelCase` filename
- Pages/Layouts: `page.tsx`, `layout.tsx` (Next.js convention)
- Utilities: `camelCase.ts` (e.g., `prisma.ts`, `utils.ts`)
- Types: `kebab-case.d.ts` (e.g., `next-auth.d.ts`)
- Config files: `camelCase` or `kebab-case` (e.g., `vitest.config.ts`, `postcss.config.mjs`)

Examples: `button.tsx`, `card.tsx`, `dropdown-menu.tsx`, `prisma.ts`

**Functions/Methods:**
- React components: PascalCase (`MarketingPage`, `DashboardOverview`, `StorefrontPage`)
- Utilities: camelCase (`cn`)
- Auth exports: camelCase destructured (`auth`, `signIn`, `signOut`, `handlers`)

**Variables:**
- Constants (component-level): camelCase (`navItems`, `products`)
- CSS variables: kebab-case with `--` prefix (`--primary-foreground`, `--sidebar-accent`)
- Environment variables: SCREAMING_SNAKE_CASE (`DATABASE_URL`, `NEXT_PUBLIC_ROOT_DOMAIN`)

## Code Organization

**Import/Dependency Declaration:**
Observed ordering (not strictly enforced):
1. Framework imports (`next/*`, `react`)
2. Third-party libraries (`lucide-react`, `next-auth`)
3. Internal aliases (`@/components/*`, `@/lib/*`, `@/auth`)

Example from `src/app/app/layout.tsx`:
```tsx
import { Package, LayoutDashboard, Settings, LogOut, Menu } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ReactNode } from 'react'
```

**File Structure:**
- Components: imports → type/interface → component function → export
- Pages: imports → mock data (if any) → default export async function
- Config files: imports → config object → default export

## Type Safety/Documentation

**Approach:** TypeScript strict mode enabled. Types are augmented via declaration merging for third-party libraries.

Example from `src/types/next-auth.d.ts`:
```typescript
declare module "next-auth" {
  interface Session {
    user: { role: string } & DefaultSession["user"]
  }
  interface User { role?: string }
}
```

- `Readonly<>` wrapper used for component props (`RootLayout`)
- `Promise<>` used for async params in Next.js 16 (`StorefrontPage`)
- Prisma schema uses explicit types (`String`, `Float`, `DateTime`)

## Error Handling

**Pattern:** Minimal — POC stage. No try/catch blocks, no error boundaries, no custom error pages.

- Auth: returns `null` on failed authorization (silent failure)
- Prisma: `generate || true` in Dockerfile (silently ignores errors)
- No global error handling or monitoring

## Comments/Documentation

**Style:** Sparse, purposeful comments. Used for:
- Section separators in JSX (`{/* Product Image */}`, `{/* WhatsApp CTA */}`)
- Intent clarification (`// Mock implementation for the POC`)
- Architecture rationale (`// This is a typical mobile-first layout.`)
- Schema documentation (`// NextAuth Next.js Default Schema with Tenant Relation`)

**Language:** Mix of English (code comments) and Portuguese (UI strings, README).
