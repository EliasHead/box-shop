# Spec: Dashboard & Tenant Context
**Status**: 📝 Draft
**Story**: Como lojista, quero ver um painel de controle que me reconheça (nome da minha loja) e mostre um resumo real dos meus dados, além do link da minha vitrine, para que eu possa ter a visão geral do meu negócio.

## 1. Contexto e Objetivos
Atualmente, o Dashboard possui dados mockados e o layout principal (`src/app/app/layout.tsx`) mostra "Minha Loja" de forma estática.
O objetivo desta feature é conectar o front-end ao banco de dados (Prisma) e exibir o contexto real do usuário logado (o `Tenant`).

## 2. Requisitos (Acceptance Criteria)

### 2.1. Layout Global (App)
- [ ] O header mobile e desktop devem exibir o `name` real da loja (`Tenant.name`) ao invés do texto estático "Minha Loja".
- [ ] Para isso, o `layout.tsx` (ou o header específico) deve consultar o banco de dados usando o `tenantId` presente na sessão.

### 2.2. Visão Geral (Dashboard)
- [ ] **Card de Acesso Rápido (Vitrine):** Adicionar uma área ou Card de destaque no topo mostrando o link público da loja (ex: `http://minhaloja.localhost:3000`).
- [ ] **Estatística Real:** O card de "Produtos Cadastrados" deve fazer uma consulta real (`prisma.product.count`) retornando a quantidade de produtos vinculados ao `tenantId`.
- [ ] **Cards Futuros:** Os cards de "Vendas via WhatsApp" e "Acessos na Vitrine" podem continuar existindo como preview, mas devem receber um selo visível de "Em Breve" (Badge) para não confundir o usuário.

## 3. UI / UX
- Utilizar os componentes do `shadcn/ui` já instalados (`Card`, `Badge` para os status "Em Breve", etc).
- Para o link da loja, seria interessante um botão "Visitar Loja" que abre uma nova aba (`target="_blank"`).

## 4. Estratégia Técnica
- **Acesso a Dados:** Como `src/app/app/layout.tsx` e `src/app/app/dashboard/page.tsx` são Server Components, faremos chamadas diretas via Prisma, recuperando o `tenantId` do NextAuth (`await auth()`).
- O `Badge` pode ser puxado do `lucide-react` ou do componente `Badge` do shadcn se existir (se não existir, usamos um estilo simples com Tailwind).

## 5. Casos de Borda e Erros
- O que acontece se o banco demorar? O Server Component vai segurar a renderização. Para o MVP local, não é um problema.
- O que acontece se a loja for acessada por um usuário sem permissão? O Middleware já protege e não deixa chegar nessa página sem um `tenantId`.
