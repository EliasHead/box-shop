# Tasks

## 1. Ambiente e referência

- [x] 1.1 Confirmar Node 22, versões Next/Prisma e dependências no Docker; preparar cópia temporária com saída de build isolada. Executar testes, lint, TypeScript e build para registrar baseline e códigos de saída nesta mudança, distinguindo falhas de código de rede/aprovação.
- [x] 1.2 Ler os guias locais de Next.js 16.2.3 sobre testes Vitest, imagens, componentes cliente e Server Actions antes de editar; registrar caminhos e convenções aplicáveis. Conferir o diff inicial para preservar a correção de tenant já existente.

## 2. Testes e fixtures

- [x] 2.1 Completar a fixture Prisma da vitrine e adicionar mock local tipado de `next/image`, preservando conteúdo e verificando a imagem pelo nome acessível. Executar o teste da vitrine no Docker e TypeScript para confirmar remoção do erro da fixture; registrar resultado.
- [x] 2.2 Tipar sessões e fixtures de dashboard, categorias, produtos e tenant, usando overload correto de auth e removendo casts `any` diagnosticados. Executar os testes correspondentes, lint desses arquivos e TypeScript; preservar todos os cenários e registrar resultados.

## 3. Tipagem dos clientes e ações

- [x] 3.1 Tipar props, estado, edição e callbacks de categorias e produtos, incluindo relações opcionais após mutações, combinações cartesianas e seleção de status. Verificar lint/TypeScript dos arquivos e testes existentes de produtos; complementar somente lacunas relevantes de criação/edição com variações introduzidas pela refatoração e registrar resultados.
- [x] 3.2 Estreitar erros `unknown` nos clientes e em `createTenant`, mantendo mensagens e fallback; verificar testes de tenant e feedback dos formulários, incluindo exceção sem mensagem quando houver lacuna de cobertura. Confirmar lint sem `any` nesses arquivos e registrar resultados.
- [x] 3.3 Remover imports sem uso nos arquivos diagnosticados, incluindo páginas, formulários, testes e declarações Auth.js; executar lint e TypeScript e confirmar zero erros/avisos sem reduzir regras, excluir arquivos ou remover testes.

## 4. Verificação integrada e documentação

- [x] 4.1 Executar `npm test`, `npm run lint`, `npx tsc --noEmit --incremental false` e `NODE_ENV=production npm run build` no Docker Node 22, exigindo código de saída zero e lint sem avisos. Registrar logs resumidos, versões e eventuais bloqueios externos; manter esta tarefa pendente enquanto alguma verificação não for aprovada.
- [x] 4.2 Validar no ambiente real vitrine com imagem e estados vazio/inexistente, criação/edição de categoria e produto com variações, preço decimal/zero e rejeição sem sessão/de outra loja. Registrar evidências e remover somente dados temporários criados para validação, preservando dados existentes.
- [x] 4.3 Atualizar `openspec/README.md` para distinguir pendências históricas das verificações resolvidas, incluindo instruções reproduzíveis de validação Docker. Conferir comandos contra execuções reais, executar `openspec validate stabilize-project-checks --strict` e `git diff --check`, revisar o diff e confirmar ausência de alterações de comportamento antes de arquivar. Não há specs para sincronizar enquanto `skip_specs: true` permanecer adequado.

## Evidências

- 12/10/2026: Docker Node 22.23.3, Next 16.2.3 e Prisma Client 7.7.0. Baseline: testes 54/55 (exit 1), lint 54 erros/10 avisos (exit 1), TypeScript somente fixture da vitrine (exit 2). Build (exit 1) revelou symlink de node_modules fora da raiz Turbopack na cópia temporária; limitação do ambiente de validação a corrigir antes da checagem final.
- Guias locais lidos em `/app/node_modules/next/dist/docs/`: `01-app/02-guides/testing/vitest.md`, `01-app/03-api-reference/02-components/image.md`, `01-app/03-api-reference/01-directives/use-client.md` e `use-server.md`. Vitest não cobre integração completa de Server Components async; haverá validação real complementar. Imagens externas exigem remotePatterns; autorização permanece nas ações. Diff inicial do item 1 preservado.

- Correções verificadas no Docker: 68/68 testes passaram (12 arquivos); lint sem erros ou avisos; `tsc --noEmit --incremental false` aprovado. Fixtures completas e tipadas, mock de imagem local com asserção acessível; testes adicionais de combinações/preservação ao remover dimensão, fallback e reenvio após erro.
- Build de produção concluído com sucesso (exit 0, Next 16.2.3/Turbopack). Dependências copiadas fisicamente para a raiz temporária após rejeição do symlink e impossibilidade de hardlinks entre volumes; nenhuma mudança de configuração da aplicação necessária.

- Chromium 156/Playwright 1.64.0 em container temporário com PostgreSQL real: login via endpoint real Auth.js, criação/edição de categoria, criação de produto com duas variantes, SKU preservado após recarregar, edição de preço 19.90→12.35→0 e reabertura passaram. A vitrine exibiu imagem otimizada real (`complete` e `naturalWidth > 0`), estado vazio e loja inexistente com HTTP 404. Reenvio da Server Action capturada, sem sessão e com ID de outra loja, foi rejeitado; consulta direta confirmou produto externo intacto. Usuário, três lojas e respectivos dados temporários removidos e ausência confirmada; scripts/credenciais temporários removidos do workspace.

- Comandos documentados em `openspec/README.md` conferidos em nova cópia temporária: testes 68/68, lint sem diagnósticos, TypeScript e build de produção aprovados, comando encadeado com exit 0. Revisão de diff: regras ESLint e configuração de produção preservadas; nenhum `any`, `eslint-disable`, `ts-ignore` ou teste removido. `openspec validate stabilize-project-checks --strict` e `git diff --check` aprovados. Sem deltas de requisitos para sincronizar.
