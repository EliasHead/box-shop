# Design

## Context

Ver motivação em `proposal.md`. `createProduct` verifica a sessão antes de consultar slug e categoria, mas lê novamente uma propriedade opcional dentro do callback assíncrono. Os testes existentes cobrem criação, variações, ausência de sessão, slug duplicado e categoria inexistente.

## Goals / Non-Goals

**Goals:** manter uma identidade de loja validada e estável durante toda a criação, preservando o controle de acesso.

**Non-Goals:** alterar outras ações, o contrato do formulário ou o modelo de autorização.

## Decisions

Capturar `session?.user?.tenantId` em `const tenantId` imediatamente após obter a sessão e executar a guarda existente sobre essa constante. Reutilizar o valor nas consultas de slug/categoria e no `tx.product.create`. Uma constante validada preserva o narrowing dentro do callback, sem casts ou asserção de não nulidade. Não tornar `tenantId` obrigatório no tipo global da sessão: usuários sem loja continuam sendo um estado válido para onboarding.

Manter a transação, validação de entrada, mensagens e revalidação existentes. Não há alteração de schema, migração ou tratamento especial de dados existentes; a API mantém compatibilidade.

## Risks / Trade-offs

- Outros erros podem impedir o build após esta correção → executar o build e registrar o próximo bloqueio separadamente.
- Regressão de isolamento → verificar que slug, categoria e criação usam o mesmo tenant autenticado, e que sessão sem loja não inicia transação.
- Guia local Next.js indisponível no host, que não possui `node_modules/next/dist/docs/` → localizar instalação no ambiente de validação e ler o guia de Server Actions antes de editar código.
