# Proposal

## Why

O formulário de produtos atribui texto do campo HTML a `price`, tipado como número, bloqueando o build de produção. Separar o valor em edição do valor enviado evita essa incompatibilidade e impede que um preço apagado seja convertido silenciosamente em zero.

## What Changes

- Manter o preço base como texto no estado do formulário de criação e edição.
- Converter o preço existente para texto ao abrir a edição e converter texto válido para número somente ao salvar.
- Bloquear envio de preço vazio, não numérico, não finito ou negativo, com feedback ao usuário; aceitar zero e preservar valores decimais válidos.
- Manter o contrato numérico das Server Actions e a validação atual no servidor.
- Adicionar testes do formulário para criação, edição e entradas inválidas.
- Fora do escopo: preço de variantes, estoque, máscara monetária/localização, migração de Float para Decimal, correção geral de lint e publicação de produtos DRAFT na vitrine.

## Capabilities

### New Capabilities

- `product-pricing`: edição e envio do preço base de produtos, com validação antes da persistência. É uma capacidade nova no inventário OpenSpec, embora o cadastro de preços já exista na aplicação.

### Modified Capabilities

Nenhuma: ainda não há especificações consolidadas em `openspec/specs/`.

## Impact

- Principal arquivo: `src/app/app/dashboard/products/products-client.tsx`; teste de componente próximo a esse arquivo.
- `src/lib/validations/product.ts` e `src/lib/actions/products.ts` permanecem como contrato numérico e validação no servidor; não há alteração planejada de schema, API ou dados existentes.
- Preservar isolamento por `tenantId` das ações atuais e a decisão de permitir preços próprios por variante, documentada em `.specs/features/gestao-estoque-variacoes/context.md`.
- A validação local anterior encontrou 55 erros de lint, 11 avisos e um teste de vitrine falhando em `next/image` no Docker. Registrar essas falhas separadamente, sem expandir esta correção. O build será reexecutado para confirmar a remoção deste bloqueio e revelar eventuais erros seguintes.
