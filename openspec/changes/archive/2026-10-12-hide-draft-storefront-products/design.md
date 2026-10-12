# Design

## Context

Ver `proposal.md` para a motivação. A página pública resolve o tenant pelo domínio e consulta produtos por `tenantId`, sem filtrar `status`. O schema já possui `status` textual com padrão `DRAFT`. Os testes existentes usam mocks do Prisma.

## Goals / Non-Goals

**Goals:** aplicar a regra de publicação na leitura pública, junto ao filtro de tenant.

**Non-Goals:** alterar cadastro, estoque, painel administrativo ou modelo de status.

## Decisions

- Acrescentar `status: 'ACTIVE'` ao `where` da consulta existente. Filtrar no banco evita carregar rascunhos; filtrar apenas na renderização manteria dados indevidos na leitura.
- Preservar `orderBy: { createdAt: 'desc' }` e a interface de estado vazio existente.
- Testar a consulta e a renderização com dados mistos, usando mock que respeite os filtros recebidos, e exigir explicitamente ambos os filtros. Isso cobre a regressão sem tratar o mock como integração real com PostgreSQL.
- Nenhuma alteração de schema ou migração: os dados existentes mantêm seus status e os rascunhos continuam disponíveis no painel.

## Risks / Trade-offs

- Produtos existentes em `DRAFT` deixarão de aparecer publicamente → comportamento esperado; devem ser publicados pelo painel.
- Mocks não validam a execução real do banco → registrar essa limitação e verificar os argumentos completos da consulta.

## Migration Plan

Publicar a alteração da página sem migração. Reverter a alteração de código restaura o comportamento anterior, inclusive a exposição de rascunhos.
