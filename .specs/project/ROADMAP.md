# ROADMAP

## Phase 1: Foundation & Security (🟢 Completo)
- [x] Mapeamento do Brownfield e estrutura base.
- [x] Autenticação com credenciais reais (Prisma + bcryptjs).
- [x] Funcionalidade de Logout com redirecionamento para login.
- [x] Middleware de proteção do painel de controle (subdomínio `app.`).
- [x] Suíte de Testes base implementada (Vitest + NextAuth Mock).

## Phase 2: Multi-Tenant Core (🟡 Próximo)
- [x] CRUD de Tenants (Criação e Gestão de Lojas).
- [x] Associação Automática Usuário ↔ Tenant.
- [ ] Resolução Dinâmica de Rotas de Lojas (Subdomínios).
- [ ] Criação do layout principal do Dashboard pós-login.

## Phase 3: Store Management (⚪ Futuro)
- [ ] Gestão de Produtos e Categorias (focada no Tenant atual).
- [ ] Gestão de Estoque e Variações.
- [ ] Upload de Imagens/Mídia.

## Phase 4: Storefront & Checkout (⚪ Futuro)
- [ ] Engine de renderização de vitrine da loja.
- [ ] Carrinho de compras unificado (Client-side / Cookies).
- [ ] Integração com Gateway de Pagamento.
