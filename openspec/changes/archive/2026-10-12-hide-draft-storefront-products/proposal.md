# Proposal

## Why

A vitrine pública consulta todos os produtos da loja, expondo também rascunhos. A POC precisa respeitar a publicação antes de permitir acesso público ao catálogo.

## What Changes

- Exibir somente produtos com status `ACTIVE` da loja resolvida pelo domínio.
- Preservar a ordenação por criação decrescente e o estado vazio quando não houver produtos publicados.
- Cobrir publicação e isolamento entre lojas com testes de regressão.

## Capabilities

### New Capabilities

- `storefront-catalog`: visibilidade pública dos produtos publicados por loja.

### Modified Capabilities

Nenhuma.

## Impact

Consulta em `src/app/[domain]/page.tsx` e testes adjacentes. Sem migração ou novas dependências. O painel mantém acesso aos rascunhos. Upload, configurações e compra pelo WhatsApp ficam fora do escopo. Preserva a resolução de loja existente e atende à pendência funcional registrada em `openspec/README.md`.
