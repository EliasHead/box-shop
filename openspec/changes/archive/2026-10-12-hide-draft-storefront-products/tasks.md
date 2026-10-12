# Tasks

## 1. Publicação na vitrine

- [x] 1.1 Ler o guia local relevante em `node_modules/next/dist/docs/` e adicionar o filtro `status: 'ACTIVE'` junto de `tenantId`; verificar a consulta com teste de regressão e manter ordenação decrescente.
- [x] 1.2 Ajustar a fixture exibida para `ACTIVE` e testar catálogo misto, isolamento entre duas lojas, somente rascunhos e loja vazia; verificar que os testes da vitrine passam e que o caso misto falha sem o novo filtro.
- [x] 1.3 Atualizar o registro de pendências em `openspec/README.md`; verificar que a documentação distingue a correção atual dos registros históricos.

## 2. Verificação integrada e conclusão

- [x] 2.1 Executar `npm test`, `npm run lint` e `npm run build` no ambiente adequado; registrar resultados e eventuais falhas preexistentes ou limitações de ambiente separadamente neste arquivo.
- [x] 2.2 Validar a mudança com `openspec validate hide-draft-storefront-products --strict`, sincronizar a especificação e arquivar após a implementação; verificar a presença da especificação consolidada e do histórico arquivado.

## Evidências

- Guias lidos no container em `/app/node_modules/next/dist/docs/`: `01-app/01-getting-started/06-fetching-data.md` e `01-app/02-guides/testing/vitest.md`. Consultas por ORM permanecem no Server Component. Testes com mocks não substituem integração de Server Components async com banco real.
- Antes do filtro: três testes existentes passaram e os dois novos cenários falharam por ausência de `status: ACTIVE`. Após a correção: cinco testes da vitrine passaram. Fixture pública explicitamente ACTIVE; catálogo misto e somente rascunhos incluem um produto ativo de outra loja para verificar isolamento.
- O acesso inicial ao Docker exigiu execução fora do sandbox; o caminho alternativo por docker.exe falhou por integração WSL. Validação realizada via Docker Linux autorizado, com Node 22.23.3, em `/tmp/boxshop-publication.HfKNhD`, sem alterar a saída do servidor de desenvolvimento.
- A primeira checagem TypeScript identificou o retorno Promise do novo mock incompatível com PrismaPromise. Mock corrigido com a identificação de PrismaPromise; verificações repetidas após o ajuste. Nenhuma falha preexistente de código identificada nesta mudança.
- Verificação final em Docker: `npm test` 70/70 testes (12 arquivos), `npm run lint` sem diagnósticos, `npx tsc --noEmit --incremental false` e `NODE_ENV=production npm run build` aprovados; comando completo com exit 0. `openspec validate --specs --strict`, validação estrita da mudança e `git diff --check` aprovados.
