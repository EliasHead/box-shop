# Testing Infrastructure

## Test Frameworks

**Unit/Integration:** Vitest ^4.1.4 + @testing-library/react ^16.3.2
**E2E:** None configured
**Coverage:** None configured

## Test Organization

**Location:** Co-located with source files (e.g., `page.test.tsx` next to `page.tsx`)
**Naming:** `*.test.tsx` / `*.test.ts`
**Structure:** `describe` → `it` blocks with Testing Library queries

## Testing Patterns

### Unit Tests

**Approach:** Component rendering tests using Testing Library
**Location:** Co-located in route directories
**Pattern:**
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarketingPage from './page'

describe('MarketingPage', () => {
  it('should render the main heading', () => {
    render(<MarketingPage />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toContain('Venda por WhatsApp com o BoxShop')
  })
})
```

**Only 1 test file exists:** `src/app/(marketing)/page.test.tsx`

### Integration Tests

**Approach:** None implemented
**Location:** N/A

### E2E Tests

**Approach:** None implemented
**Location:** N/A

## Test Execution

**Commands:**
- `npm test` → `vitest run` (single run, no watch)
- `npx vitest` → watch mode (implicit)

**Configuration:** `vitest.config.ts`
- Environment: `jsdom`
- Globals: `true` (describe/it/expect available globally)
- Path alias: `@` → `./src`
- Plugin: `@vitejs/plugin-react` for JSX transform

## Coverage Targets

**Current:** Not measured
**Goals:** Not documented
**Enforcement:** Not automated

## Test Coverage Matrix

| Code Layer           | Required Test Type | Location Pattern          | Run Command |
| -------------------- | ------------------ | ------------------------- | ----------- |
| UI Components        | unit               | `*.test.tsx` (co-located) | `npm test`  |
| Pages (Server)       | unit               | `*.test.tsx` (co-located) | `npm test`  |
| API Routes           | none               | —                         | —           |
| Middleware            | none               | —                         | —           |
| Auth                 | none               | —                         | —           |
| Database (Prisma)    | none               | —                         | —           |
| Storefront ([domain])| none               | —                         | —           |
| Dashboard (app/)     | none               | —                         | —           |

## Parallelism Assessment

| Test Type | Parallel-Safe? | Isolation Model           | Evidence                                          |
| --------- | -------------- | ------------------------- | ------------------------------------------------- |
| Unit      | Yes            | No shared state, jsdom    | Only component rendering tests, no DB interaction |

## Gate Check Commands

| Gate Level | When to Use                      | Command        |
| ---------- | -------------------------------- | -------------- |
| Quick      | After UI component changes       | `npm test`     |
| Full       | N/A (no integration/E2E tests)   | `npm test`     |
| Build      | After phase completion           | `npm run lint && npm test && npm run build` |
