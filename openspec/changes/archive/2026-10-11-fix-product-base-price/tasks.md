# Tasks

## 1. Representação editável do preço

- [x] 1.1 Ler o guia local relevante de Next.js indicado por AGENTS.md antes de implementar; verificar as convenções aplicáveis ao componente cliente e registrar eventual indisponibilidade do guia.
- [x] 1.2 Separar o tipo do formulário do contrato `ProductInput`, mantendo apenas o preço base como string; usar `"0"` ao criar e converter o número existente para texto ao editar. Verificar com testes de `ProductsClient` que o campo pode ficar vazio durante a edição e que um preço existente 19.90 é carregado sem truncamento.
- [x] 1.3 Validar vazio/espaços antes da conversão, rejeitar valores não numéricos, não finitos ou negativos e construir payload numérico somente após sucesso. Verificar nos testes que criação e edição enviam respectivamente 19.9 e 12.35, zero é aceito, salvar sem modificar preserva o valor e entradas inválidas não chamam ações; confirmar feedback e possibilidade de corrigir e reenviar.
- [x] 1.4 Executar os testes focados do formulário e das ações de produtos; verificar que os cenários de preço passam e que o contrato numérico permanece compatível. Complementar os testes de ações somente se faltar cobertura para rejeição sem sessão e edição de produto de outra loja, confirmando ausência de escrita nesses casos.

## 2. Verificação integrada

- [x] 2.1 Executar `npm test`, `npm run lint` e `npm run build` no ambiente disponível, preferindo Docker/Node 22. Registrar resultados e separar falhas novas das preexistentes; verificar que o erro de atribuição string para number no preço base desapareceu e reportar qualquer próximo bloqueio sem ampliar silenciosamente o escopo.
- [x] 2.2 Validar no ambiente local criação e edição com preço decimal, limpeza do campo, rejeição de vazio e aceitação de zero; verificar o valor após reabrir a edição. Usar registros temporários e remover os dados criados para a verificação.
- [x] 2.3 Conferir implementação e evidências contra cada cenário em `specs/product-pricing/spec.md` e executar `openspec validate fix-product-base-price --strict`; marcar como concluídas somente tarefas efetivamente verificadas e registrar limitações remanescentes antes do arquivamento.

## Evidências

- 11/10/2026: lidos os guias `01-app/03-api-reference/01-directives/use-client.md` e `01-app/02-guides/forms.md` da instalação local de Next.js 16.2.3 usada na validação temporária. Confirmada separação entre estado interativo no cliente e autorização nas Server Actions.

- Testes focados: 27/27 passaram (21 de preço e formulário, 6 de ações). Suíte completa no Docker: 50/51 passaram; única falha preexistente na vitrine/next-image. Lint: 54 erros e 10 avisos, contra 55/11 anteriores; nenhum diagnóstico novo.
- Build com NODE_ENV=production: erro do preço removido. Próximo bloqueio preexistente revelado em `src/lib/actions/products.ts:93`: tenantId pode ser null/undefined dentro da transação. Não corrigido por estar fora do escopo.

- Chromium/Playwright em container temporário com PostgreSQL real: criação 19.90, edição 12.35, reabertura sem perda de valor, salvar sem alterar, campo vazio obrigatório, negativo bloqueado e zero persistido passaram. Autenticação feita pela API real Auth.js no contexto do navegador. Loja, usuário e produto temporários removidos ao final.
- Checagem completa `tsc --noEmit --incremental false`: nenhum diagnóstico nos arquivos novos/alterados; permanecem dois erros preexistentes, na fixture de `src/app/[domain]/page.test.tsx:63` e no tenantId de `src/lib/actions/products.ts:93`.

### Conferência dos cenários

| Cenário | Evidência |
| --- | --- |
| Apagar para redigitar | Teste de componente e Chromium: campo permanece vazio sem salvar. |
| Reabrir um preço existente | Teste de edição sem alteração e Chromium: valor decimal preservado. |
| Criar com preço decimal | Teste de payload 19.9 e persistência real via Chromium. |
| Editar com preço decimal | Teste de payload 12.35 e reabertura no Chromium. |
| Preço zero | Testes de criação/edição e reabertura com zero no Chromium. |
| Preço obrigatório | Teste do componente bloqueia ação e permite corrigir; helper rejeita espaços; Chromium confirma required. |
| Preço inválido | Testes de componente para negativo/não numérico/overflow e helper para não finitos; Chromium confirma negativo bloqueado. |
| Operação sem sessão | Teste de ações: criação e edição rejeitadas, sem transação/escrita. |
| Edição de outra loja | Teste de ação: consulta filtrada por tenantId e nenhuma transação/escrita. |

- `openspec validate fix-product-base-price --strict` e `git diff --check` aprovados. Limitações preexistentes de build, lint e teste da vitrine registradas acima.
