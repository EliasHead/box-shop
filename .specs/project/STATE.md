# STATE

*Persistent memory across sessions. Tracks decisions, blockers, lessons learned, and deferred ideas.*

## Current Status
**Última Atualização:** 19 de Agosto de 2026
**Fase Atual:** Fase 3 (Store Management) em andamento. Gestão de Produtos e Categorias e Gestão de Estoque e Variações implementadas. Próximo item: Upload de Imagens/Mídia.

## Decisions
- **Estoque e Variações — Matriz de SKUs:** Adotada abordagem de matriz de variações (múltiplos eixos, ex. Cor x Tamanho, gerando SKUs combinados), cada variante com preço e estoque próprios (sobrescrevendo o produto raiz quando definido). Ver detalhes em `.specs/features/gestao-estoque-variacoes/context.md`.
- **Estoque Zerado — Comportamento "Esgotado":** Produto/variação com estoque 0 permanece visível no dashboard e na vitrine, exibindo selo "Esgotado/Indisponível" em vez de ser ocultado ou alterar o `status` automaticamente.
- **Domain Guard no Middleware:** Implementamos um redirecionamento automático para caminhos administrativos (`/dashboard`, `/onboarding`, `/login`) que sejam acessados a partir de subdomínios de lojistas, garantindo que a gestão da plataforma ocorra centralizadamente no subdomínio `app.`.
- **Atualização de Sessão JWT (Auth.js v5):** Para refletir o novo `tenantId` imediatamente após a criação da loja sem relogar, usamos o callback `jwt` com `trigger === "update"`. Foi necessário injetar explicitamente o `session.user.id = token.sub` no callback de `session` para que as Server Actions tivessem acesso ao ID do banco de dados na sessão do usuário.
- **Onboarding Guard no Middleware:** Requisições para rotas sob `app.` redirecionam automaticamente usuários logados sem tenant para a rota `/onboarding`.
- **Logout via Server Actions:** Implementação do botão de logout utilizando Server Actions (`src/lib/actions/auth.ts`) e formulários, permitindo manter o layout da aplicação (`src/app/app/layout.tsx`) como Server Components, o que melhora a performance e evita a necessidade de `"use client"`.
- **Arquitetura Auth Separada:** Para compatibilidade com Edge Runtime (Middleware), separamos o `auth.ts` (Prisma/Node.js) do `auth.config.ts` (Lógico/Edge-safe). Isso permite usar sessões no middleware sem importar o Prisma.
- **Prisma v7 + Driver Adapter:** Adotamos o padrão de Driver Adapter (`@prisma/adapter-pg` + `pg`) no Prisma v7 para conexões PostgreSQL diretas, pois a `url` no `schema.prisma` não é mais suportada em runtime.
- **Relação Produto-Categoria (1:N):** Decidido que cada produto pertencerá a no máximo uma categoria nesta fase inicial, para simplificar.
- **Deleção Set Null:** Ao apagar uma categoria, os produtos vinculados a ela não são apagados em cascata, mas o `categoryId` é definido como `null` para preservar o histórico do produto.
- **Next.js Server Actions para CRUD:** Utilizamos mutações em server actions com `revalidatePath` para atualizar a UI do Dashboard em tempo real sem expor APIs.
- **Isolamento via Zod & Prisma:** Cada ação valida os dados e a associação correta com o `tenantId` logado para evitar acesso indevido.
- **Next.js 16 + Turbopack:** O projeto utiliza Next.js 16 com Turbopack. Configuramos `serverExternalPackages` no `next.config.ts` para evitar que o Turbopack injete stubs de browser/edge em bibliotecas nativas de Node.js como `@prisma/client` e `bcryptjs`.

## Blockers & Resolved Issues
- [x] *`middleware.ts` depreciado no Next.js 16* — O Next.js 16 renomeou a convenção `middleware` para `proxy` (funcionalidade idêntica). O codemod oficial (`@next/codemod middleware-to-proxy`) não alterou nada porque o arquivo já usava `export default`; a migração foi feita manualmente com `git mv src/middleware.ts src/proxy.ts`. Corrigido em 25/09/2026 (commit `e1ad6b3`).
- [x] *`npx prisma db seed` quebrado no Prisma v7* — O Prisma v7 moveu a configuração de seed de `package.json` (`"prisma": {"seed": ...}`, agora silenciosamente ignorado) para `migrations.seed` em `prisma.config.ts`. Corrigido em 25/09/2026 (commit `555c201`).
- [x] *AUTH_SECRET e NEXT_PUBLIC_ROOT_DOMAIN ausentes no compose.dev.yml* — Descobertos ao testar o fluxo de login manualmente: sem `AUTH_SECRET`, o Auth.js disparava `MissingSecret` em todo request; sem `NEXT_PUBLIC_ROOT_DOMAIN`, o middleware tratava usuários não autenticados como logados e redirecionava `/login` para `http://app.undefined/`, bloqueando o login por completo. Corrigido em 25/09/2026 (commit `eeb070d`) carregando `AUTH_SECRET` via `.env` (gitignored, opcional) em vez de hardcoded no compose; adicionado `.env.example`.
- [x] *Module not found 'bcryptjs'* — Resolvido instalando a dependência diretamente dentro do container `boxshop-web-dev`.
- [x] *Vitest falhando no next/server* — Resolvido mockando o `next-auth` globalmente em `vitest.setup.ts` para testes de UI/Server Actions isolados.
- [x] *PrismaClientInitializationError no Middleware* — Resolvido removendo a dependência do Prisma do middleware através da separação do `auth.config.ts`.
- [x] *PrismaClientInitializationError no Server Action (Turbopack)* — Resolvido usando `serverExternalPackages` no `next.config.ts` para evitar resolução de stubs de browser.
- [x] *Unknown property datasourceUrl no Prisma v7* — Resolvido implementando o padrão de driver adapter com `pg.Pool`.
- [x] *Testes do Dashboard quebrados após auth loop fixes* — O commit de Estoque/Variações mudou `dashboard/page.tsx` (novo `prisma.user.findUnique` para validar JWT obsoleto, redirect de não-autenticado passou a ser `/login`), mas os mocks/asserts de `page.test.tsx` não haviam sido atualizados. Corrigido em 19/08/2026 adicionando `user` e `signOut` aos mocks e ajustando o redirect esperado.

## Deferred Ideas
- Mudar para OAuth futuramente (Google/GitHub) para facilitar o onboarding de lojistas sem necessidade de senha.
- Testes E2E com Playwright para fluxo de checkout completo (deixado para a Fase 4).
