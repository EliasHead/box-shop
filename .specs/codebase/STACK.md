# Tech Stack

**Analyzed:** 2026-04-23

## Core

- Framework: Next.js 16.2.3 (App Router, Server Components)
- Language: TypeScript ^5
- Runtime: Node.js 22 (Alpine, via Docker)
- Package manager: npm (lockfile v3)

## Frontend

- UI Framework: React 19.2.4
- Styling: Tailwind CSS v4 (via `@tailwindcss/postcss`) + CSS Variables (OKLCH)
- Component Library: shadcn/ui v4.2.0 (style: `base-nova`, base color: `neutral`)
- UI Primitives: @base-ui/react ^1.4.0
- Icons: lucide-react ^1.8.0
- Utility: clsx ^2.1.1 + tailwind-merge ^3.5.0 (via `cn()` helper)
- Animations: tw-animate-css ^1.4.0
- Class Variants: class-variance-authority ^0.7.1
- State Management: None (Server Components + props)
- Form Handling: None implemented yet

## Backend

- API Style: Next.js App Router (Route Handlers)
- Database: Prisma 7.7.0 (ORM) + PostgreSQL 15 (Alpine, via Docker)
- Authentication: Auth.js v5 (next-auth ^5.0.0-beta.31) with PrismaAdapter
- Auth Strategy: JWT sessions with Credentials provider (POC mock)

## Testing

- Unit/Integration: Vitest ^4.1.4 + @testing-library/react ^16.3.2
- DOM Environment: jsdom ^29.0.2
- E2E: None configured

## External Services

- Image CDN: Unsplash (remote patterns configured in `next.config.ts`)
- Database: PostgreSQL 15 (Docker Compose)

## Development Tools

- Linting: ESLint ^9 with `eslint-config-next` 16.2.3 (core-web-vitals + typescript)
- Build: `next build` with `output: "standalone"` for Docker deployment
- Containerization: Docker (multi-stage Dockerfile) + Docker Compose (dev & prod)
- Environment: dotenv ^17.4.2 (for Prisma config)
- PostCSS: `@tailwindcss/postcss`
