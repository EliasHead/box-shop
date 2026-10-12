# Proposal

## Why

A validação anterior da mudança `fix-product-base-price` revelou um bloqueio de build em `src/lib/actions/products.ts:93`: o TypeScript considera `session.user.tenantId` possivelmente nulo dentro do callback da transação. A autorização já existe; precisamos preservar sua garantia de tipo ao criar o produto.

## What Changes

- Capturar o identificador da loja em uma constante local, validá-lo e reutilizá-lo nas consultas e na criação transacional de `createProduct`.
- Preservar as rejeições de sessão ausente, loja ausente, slug duplicado e categoria de outra loja.
- Executar verificações e registrar separadamente outros bloqueios preexistentes, sem ampliar o escopo.

## Capabilities

### New Capabilities

Nenhuma. Refatoração de tipagem sem alteração de comportamento; `skip_specs: true` dispensa deltas de requisitos.

### Modified Capabilities

Nenhuma. O contrato existente de `product-pricing` permanece aplicável.

## Impact

Mudança restrita a `createProduct` e, se necessário, seus testes em `src/lib/actions/products.test.ts`. Sem mudanças de schema, dados, dependências ou API. Fora do escopo: lint geral, teste/fixture da vitrine, publicação de rascunhos e outras funcionalidades. A evidência histórica está nas tarefas arquivadas de `2026-10-11-fix-product-base-price`; o sucesso completo do build dependerá da ausência de outros erros.
