# Proposal

## Why

O painel já exibe o link de Configurações, mas a página não existe. A loja tem nome e domínio persistidos, sem descrição nem WhatsApp; permitir editar esses dados prepara a POC para pedidos via WhatsApp.

## What Changes

- Disponibilizar `/dashboard/settings` com nome obrigatório, descrição opcional e WhatsApp opcional.
- Carregar e atualizar exclusivamente a loja vinculada ao usuário autenticado no banco.
- Persistir descrição e WhatsApp em novos campos opcionais de Tenant, preservando lojas existentes.
- Exibir o nome atualizado e a descrição pública na vitrine, inclusive quando vazia.
- Validar os dados no servidor e apresentar confirmação, erros e estado de salvamento no formulário.
- Preservar o domínio atual. Upload, carrinho e botão de compra funcional ficam fora deste escopo.

## Capabilities

### New Capabilities

- `store-settings`: consulta e edição dos dados da loja pelo painel, validação e apresentação pública da identidade.

### Modified Capabilities

Nenhuma. O filtro de produtos ACTIVE e o isolamento do catálogo definidos em `storefront-catalog` permanecem, assim como as regras de `product-pricing`.

## Impact

Schema e migration Prisma de Tenant; Server Actions e validação de configurações; nova página e formulário do painel; cabeçalho da vitrine; fixtures e testes que usam Tenant. Não requer novas dependências. Segue as rotas públicas e a separação usuário/loja registradas em `openspec/config.yaml` e o estado funcional descrito em `openspec/README.md`.
