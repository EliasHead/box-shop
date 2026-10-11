# BoxShop 📦✨

O **BoxShop** é uma plataforma SaaS (Software as a Service) de última geração focada na criação ultra-rápida de lojas virtuais. Nosso propósito é remover toda a fricção técnica do e-commerce tradicional, permitindo que lojistas criem vitrines digitais premium em minutos, integradas organicamente ao fluxo de vendas via WhatsApp.

---

## 🚀 Diferenciais & Regras de Negócio

- **Multi-tenancy White-label:** Arquitetura isolada que permite que cada lojista tenha seu próprio subdomínio ou domínio customizado, mantendo a performance e segurança.
- **Vendas via WhatsApp:** Diferente de carrinhos de compra complexos, o foco é a conversão direta. O cliente visualiza o catálogo e finaliza a compra enviando o pedido formatado diretamente para o WhatsApp do lojista.
- **Automação via IA (POC):** Ferramentas planejadas para geração de catálogo inteligente através de imagens de produtos e descrições curtas.
- **Mobile-First Experience:** Uma vitrine desenhada para ser fluida, rápida e intuitiva em dispositivos móveis, onde ocorre a maioria das conversões sociais.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Finalidade |
| :--- | :--- |
| **Next.js 16 (App Router)** | Framework principal com Server Components e routing dinâmico. |
| **React 19** | Biblioteca de interface estável e performática. |
| **Tailwind CSS v4** | Estilização por classes utilitárias de nova geração. |
| **shadcn/ui** | Componentes de UI acessíveis e altamente customizáveis (Emerald Theme). |
| **Prisma 7 & PostgreSQL** | ORM moderno e banco de dados relacional robusto. |
| **Auth.js v5 (NextAuth)** | Autenticação segura e integrada ao ecossistema Next.js. |
| **Vitest** | Framework de testes unitários e de integração de alta velocidade. |
| **Docker** | Conteinerização completa para ambientes de desenvolvimento e produção. |

---

## 📂 Arquitetura do Projeto

O projeto segue os padrões de mercado e a estrutura recomendada pelo Next.js:

- `src/app/(marketing)`: Site institucional e landing page do SaaS.
- `src/app/[domain]`: Motor da vitrine dinâmica que renderiza a loja do lojista com base no subdomínio.
- `src/app/app`: Dashboard administrativo onde o lojista gerencia produtos e configurações.
- `src/proxy.ts`: O "cérebro" da multi-tenancy, responsável pelo redirecionamento e rewrite de rotas dinâmicas (convenção `proxy` do Next.js 16, antigo `middleware.ts`).
- `docker/`: Configurações de infraestrutura isoladas por ambiente (dev/prod).

---

## 🚦 Como Inicializar

### Especificações e planejamento

Novas mudanças seguem o **OpenSpec**. Consulte o [guia do projeto](openspec/README.md)
para o fluxo de proposta, implementação, validação e arquivamento.
A pasta `.specs/` foi preservada como referência histórica.

### Pré-requisitos
- Docker & Docker Compose instalados.

### Rodando em Desenvolvimento (Recomendado)
Para subir o banco de dados e a aplicação com Hot Reload:
```bash
docker-compose -f docker/compose.dev.yml up --build
```

### Rodando Testes
```bash
npm test
```

---

## 🧪 Validando a Multi-locação (Multi-tenancy)

Com o sistema rodando, você pode acessar diferentes facetas da plataforma usando subdomínios no `localhost`:

1. **SaaS Root:** [http://localhost:3000](http://localhost:3000)
2. **Dashboard:** [http://app.localhost:3000](http://app.localhost:3000)
3. **Vitrine Exemplo:** [http://loja1.localhost:3000](http://loja1.localhost:3000)

---

> [!TIP]
> O BoxShop utiliza a paleta **Emerald (Esmeralda)** para criar uma conexão visual imediata e confiável com a experiência do WhatsApp, otimizando o fluxo cognitivo de compra do cliente final.
