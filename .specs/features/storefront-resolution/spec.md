# Spec: Resolução Dinâmica de Rotas de Lojas (Storefront)
**Status**: 📝 Draft
**Story**: Como cliente final, quero acessar a URL da loja (ex: `http://minhaloja1.localhost:3000`) e ver os produtos e informações reais daquele lojista. Se a loja não existir, quero ver uma página de erro clara (404).

## 1. Contexto e Objetivos
Atualmente o subdomínio é roteado corretamente para a pasta `src/app/[domain]/page.tsx` graças ao nosso Middleware, mas a página da vitrine possui dados fixos (mockados).
O objetivo é transformar essa página para buscar o `Tenant` real no banco de dados e exibir os `Products` a ele vinculados.

## 2. Requisitos (Acceptance Criteria)

### 2.1. Resolução do Tenant
- [ ] O componente deve extrair o subdomínio a partir do parâmetro `domain` (ex: "minhaloja1.localhost:3000" -> "minhaloja1").
- [ ] Deve consultar o banco de dados via Prisma buscando um `Tenant` cujo campo `domain` seja idêntico ao extraído.
- [ ] Se o `Tenant` não for encontrado no banco de dados, o sistema deve disparar a função `notFound()` do Next.js, redirecionando o usuário para uma página de "Loja não encontrada".

### 2.2. Vitrine Dinâmica
- [ ] O cabeçalho da vitrine deve exibir o `name` real do `Tenant` encontrado.
- [ ] O sistema deve buscar todos os produtos (`Product`) associados àquele `tenantId`.
- [ ] Se a loja não tiver produtos cadastrados, deve exibir um "Empty State" elegante: "Esta loja ainda não possui produtos cadastrados."
- [ ] Se houver produtos, renderizar os cards de produto usando as informações reais (Nome, Descrição e Preço). As imagens podem continuar usando um placeholder provisório, já que o upload de mídia é uma feature da Fase 3.

## 3. Estratégia Técnica
- Usar `params` do Next.js App Router para capturar a URL.
- Processar o nome do domínio para evitar problemas com portas (como `.localhost:3000`).
- Usar `prisma.tenant.findUnique` seguido de `prisma.product.findMany`.
- A página continuará sendo um Server Component para garantir SEO e performance perfeitos (Server-Side Rendering).

## 4. Casos de Borda e Erros
- **Acesso direto sem subdomínio:** O middleware já previne isso e joga para a página de marketing.
- **Loja não existe:** Função `notFound()` cuidará disso. Pode ser interessante no futuro (se der tempo) ter um arquivo `not-found.tsx` na pasta `[domain]` customizado com a cara do BoxShop.
