# Proposal

## Why

Após a correção de `tenantId`, as verificações ainda impedem uma validação integrada confiável: fixture incompleta da vitrine, falha de `next/image` no Vitest Docker e 54 erros/10 avisos de lint. Precisamos corrigir testes e tipagem para detectar regressões e confirmar o build em Node 22.

## What Changes

- Completar e tipar as fixtures, preservando as asserções de comportamento existentes.
- Tornar o teste da vitrine independente da configuração interna de otimização de imagens do Next.js no Vitest, mantendo verificações de conteúdo e imagem acessível.
- Substituir os `any` diagnosticados por tipos específicos e tratar erros como `unknown`, removendo imports sem uso.
- Alcançar suíte completa, TypeScript e lint sem diagnósticos e build de produção concluído no Docker, sem desativar regras ou excluir testes/arquivos para obter sucesso.
- Registrar versões, comandos, resultados e bloqueios externos separadamente.

## Capabilities

### New Capabilities

Nenhuma. Mudança de testes, tipagem e manutenção; `skip_specs: true`.

### Modified Capabilities

Nenhuma. Preservar os requisitos de `product-pricing`, incluindo autorização e isolamento. Alterações de comportamento de produto exigem outra mudança.

## Impact

Áreas identificadas: testes da vitrine, dashboard e ações; clientes de categorias/produtos; tratamento de erros em `tenant.ts`; imports não utilizados em páginas e declarações Auth.js. Sem migração, dependências novas ou alteração de API. Preservar as alterações ainda não commitadas do item 1, arquivado em `2026-10-12-fix-product-tenant-transaction`.

Fora do escopo: filtrar produtos DRAFT, configurações da loja, WhatsApp, upload, redesenho visual e mudança na política de fontes. Falha de rede ao baixar Inter e falha 429 na revisão automática são limitações históricas de ambiente, não evidência de defeito no código. Não declarar build aprovado enquanto não executado com sucesso.
