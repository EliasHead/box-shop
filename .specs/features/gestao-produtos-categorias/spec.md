# Feature: Gestão de Produtos e Categorias

## Objetivo
Permitir que os lojistas (Tenants) criem, editem, visualizem e excluam categorias e produtos exclusivos da sua loja, utilizando o painel administrativo (`app.` subdomain). Garantir total isolamento de dados por `tenantId`.

## Requisitos Funcionais (Traceable IDs)
- **[REQ-PROD-01] CRUD de Categorias**: Lojistas podem criar, visualizar, atualizar e excluir categorias de produtos.
- **[REQ-PROD-02] CRUD de Produtos**: Lojistas podem criar, visualizar, atualizar e excluir produtos.
- **[REQ-PROD-03] Vínculo Produto-Categoria**: Produtos devem ter a opção de ser vinculados a uma categoria.
- **[REQ-PROD-04] Isolamento Multi-Tenant**: Categorias e Produtos acessados no painel devem ser estritamente limitados ao `tenantId` da sessão atual.
- **[REQ-PROD-05] Listagem Administrativa**: A interface do painel deve exibir uma tabela (Data Table) para gerenciar produtos e outra para categorias, permitindo busca simples.
- **[REQ-PROD-06] Slugs Únicos (Tenant-Scoped)**: Cada produto e categoria deve possuir um `slug` (URL amigável), que deve ser único dentro do respectivo tenant.
- **[REQ-PROD-07] Status de Visibilidade**: Produtos devem ter um status (ex: `ACTIVE`, `DRAFT`) para controlar se estão disponíveis na futura vitrine pública.

## Requisitos Não Funcionais
- **[NFR-01] Mutação via Server Actions**: Todas as operações (Create/Update/Delete) devem utilizar Next.js Server Actions e revalidar o path (Cache Revalidation).
- **[NFR-02] Zod Validation**: Todo input de formulário deve ser validado via Zod antes de interagir com o banco de dados.
- **[NFR-03] UI Patterns**: Reutilizar o padrão visual do Dashboard recém-criado, utilizando os componentes do Radix/shadcn (se aplicável no projeto).

## Integração com a Base de Dados (Prisma)
- **Novo Model `Category`**: Campos `id`, `name`, `slug`, `tenantId`, relacionamentos com `Tenant` e `Product`.
- **Update no Model `Product`**: Adicionar `slug`, `categoryId`, `status`, e `sku` (opcional).

## Áreas para Discussão (Gray Areas)
1. **Relação Categoria-Produto**: A relação será 1:N (Um produto tem apenas 1 categoria) ou N:M (Um produto pode estar em várias categorias)? 
2. **Deleção de Categoria**: Se uma categoria for deletada, seus produtos devem ser excluídos (`Cascade`) ou a referência de categoria nos produtos deve ficar nula (`SetNull`)?
