# Tasks

## 1. Correção da criação transacional

- [x] 1.1 Preparar o ambiente de validação e ler o guia local de Server Actions em `node_modules/next/dist/docs/` antes de editar código; registrar o caminho e confirmar as regras de autorização aplicáveis.
- [x] 1.2 Capturar e validar `tenantId` em constante local em `createProduct`, reutilizando-a nas consultas de slug/categoria e na criação transacional. Conferir o diff para ausência de casts e mudanças nas demais ações; executar os testes focados de produtos.
- [x] 1.3 Conferir cobertura de criação com tenant autenticado, rejeição sem sessão/sem loja e categoria de outra loja; complementar somente as lacunas e confirmar que operações rejeitadas não iniciam transação nem escrevem. Registrar resultados nesta mudança.

## 2. Verificação integrada

- [x] 2.1 Executar `npm test`, `npm run lint`, `npm run build` com ambiente de produção e checagem TypeScript; confirmar ausência do diagnóstico de `tenantId` em `products.ts` e registrar falhas preexistentes ou próximos bloqueios separadamente, sem ampliar escopo.
- [x] 2.2 Executar `openspec validate fix-product-tenant-transaction --strict` e `git diff --check`; conferir evidências e marcar somente tarefas verificadas. Confirmar que `skip_specs: true` permanece adequado antes do arquivamento, pois não há alteração de requisitos para sincronizar.

## Evidências

- Guia lido: `/tmp/boxshop-tenant-validation/node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md` (Next.js 16.2.3). Autenticação e autorização devem preceder operações sensíveis; identidade vem da sessão. Docker Desktop indisponível; validação em cópia temporária com Node 24.21.0.

- Correção limitada a `createProduct`, sem casts ou alteração das demais ações. Testes focados: 10/10 passaram, incluindo os quatro casos adicionados de isolamento/autorização.

- Suíte completa: 55/55 testes passaram no Node 24.21.0; a falha histórica de execução da vitrine/next-image não ocorreu neste ambiente.
- Lint: 54 erros e 10 avisos, mesmos totais históricos. Nenhum diagnóstico em `products.ts`; testes adicionados sem casts.
- TypeScript (`npx tsc --noEmit --incremental false`): somente erro preexistente TS2740 na fixture `src/app/[domain]/page.test.tsx:63`. Comparação na mesma cópia temporária com `products.ts` original do HEAD confirmou também TS2322 em `products.ts:93`; com a correção esse diagnóstico desaparece. Arquivo corrigido restaurado na cópia após comparação.
- Build (`NODE_ENV=production npm run build`): bloqueado no download de Inter em `fonts.googleapis.com`, antes da etapa de tipagem. Não é possível afirmar sucesso do build completo; a checagem TypeScript independente comprova a remoção do erro alvo e identifica a fixture como bloqueio de tipagem remanescente. Sem alteração de fontes ou configuração para contornar o ambiente.
- `openspec validate fix-product-tenant-transaction --strict` e `git diff --check` passaram. Refatoração preserva requisitos; nenhuma sincronização de specs necessária (`skip_specs: true`).

### Revalidação no Docker — 12/10/2026

- Docker Desktop disponível; container `boxshop-web-dev` com Node 22.23.3 e código corrigido confirmado. Verificações em `/tmp/boxshop-tenant-recheck`, cópia isolada do projeto, sem alterar o servidor de desenvolvimento ou dados do banco.
- `npm test`: 54/55 passaram. Única falha preexistente em `src/app/[domain]/page.test.tsx`, relativa à configuração de hostname do `next/image`. Testes de ações de produtos passaram, incluindo os casos adicionados nesta mudança. O resultado 55/55 anterior permanece específico ao ambiente Node 24.
- `npm run lint`: 54 erros e 10 avisos, mesmos totais anteriores.
- Build no Docker não executado: revisão automática de aprovação falhou com HTTP 429 (Too Many Requests), inclusive na tentativa sequencial posterior. A mensagem informa falha do serviço de revisão, não uma determinação de ação insegura. Permanecem válidas as evidências anteriores de TypeScript; sucesso do build Docker ainda não verificado.
