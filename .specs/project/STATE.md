# STATE

*Persistent memory across sessions. Tracks decisions, blockers, lessons learned, and deferred ideas.*

## Current Status
**Última Atualização:** 25 de Abril de 2026
**Fase Atual:** Finalizando a Fase 1 (Autenticação e Testes) e prontos para iniciar a Fase 2 (Multi-Tenant Core).

## Decisions
- **Logout via Server Actions:** Implementação do botão de logout utilizando Server Actions (`src/lib/actions/auth.ts`) e formulários, permitindo manter o layout da aplicação (`src/app/app/layout.tsx`) como Server Components, o que melhora a performance e evita a necessidade de `"use client"`.
- **Arquitetura Auth Separada:** Para compatibilidade com Edge Runtime (Middleware), separamos o `auth.ts` (Prisma/Node.js) do `auth.config.ts` (Lógico/Edge-safe). Isso permite usar sessões no middleware sem importar o Prisma.
- **Prisma v7 + Driver Adapter:** Adotamos o padrão de Driver Adapter (`@prisma/adapter-pg` + `pg`) no Prisma v7 para conexões PostgreSQL diretas, pois a `url` no `schema.prisma` não é mais suportada em runtime.
- **Next.js 16 + Turbopack:** O projeto utiliza Next.js 16 com Turbopack. Configuramos `serverExternalPackages` no `next.config.ts` para evitar que o Turbopack injete stubs de browser/edge em bibliotecas nativas de Node.js como `@prisma/client` e `bcryptjs`.

## Blockers & Resolved Issues
- [x] *Module not found 'bcryptjs'* — Resolvido instalando a dependência diretamente dentro do container `boxshop-web-dev`.
- [x] *Vitest falhando no next/server* — Resolvido mockando o `next-auth` globalmente em `vitest.setup.ts` para testes de UI/Server Actions isolados.
- [x] *PrismaClientInitializationError no Middleware* — Resolvido removendo a dependência do Prisma do middleware através da separação do `auth.config.ts`.
- [x] *PrismaClientInitializationError no Server Action (Turbopack)* — Resolvido usando `serverExternalPackages` no `next.config.ts` para evitar resolução de stubs de browser.
- [x] *Unknown property datasourceUrl no Prisma v7* — Resolvido implementando o padrão de driver adapter com `pg.Pool`.

## Deferred Ideas
- Mudar para OAuth futuramente (Google/GitHub) para facilitar o onboarding de lojistas sem necessidade de senha.
- Testes E2E com Playwright para fluxo de checkout completo (deixado para a Fase 4).
