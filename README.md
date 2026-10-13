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

## Configurações da loja

Em `/dashboard/settings`, edite nome (1–100 caracteres), descrição opcional
(até 500 caracteres, pública na vitrine) e WhatsApp opcional. Informe código
do país e DDD, por exemplo `+55 (11) 99999-9999`; o número é armazenado
somente com dígitos (8–15). Campos opcionais vazios removem os valores.
O endereço da loja permanece somente para leitura.

Antes de executar esta versão, aplique a migration aditiva e gere o client:

```bash
npx prisma migrate deploy
npx prisma generate
```

Bancos legados criados por `prisma db push` precisam de baseline de migrations
antes de `migrate deploy`. No desenvolvimento legado, aplique somente o SQL
de `prisma/migrations/20261012120000_add_store_settings/migration.sql`
com `npx prisma db execute --file <arquivo>` e gere o client. Não use reset.

Para validar o fluxo com PostgreSQL de desenvolvimento, execute
`RUN_DATABASE_TESTS=1 npx vitest run src/__tests__/integration/store-settings.test.tsx`
no container. O teste cria e remove suas próprias lojas e usuário; sessão e
invalidação de cache são simuladas, enquanto consultas e gravações são reais.

## Armazenamento das fotos de produtos

Prepare o armazenamento antes de disponibilizar o envio de fotos. `PRODUCT_IMAGES_DIR` deve ser um
caminho absoluto gravável pelo usuário da aplicação. O Compose de desenvolvimento
monta `./data/product-images` em `/var/lib/boxshop/product-images`; essa pasta é
ignorada pelo Git e pelo contexto de build. Não armazene fotos na camada efêmera
do container nem em `public/`.

No banco legado criado por `db push`, aplique a migration de imagens sem reset:

```bash
docker exec boxshop-web-dev npx prisma db execute --file prisma/migrations/20261013001000_add_product_image/migration.sql
docker exec boxshop-web-dev npx prisma generate
```

Execute o SQL somente uma vez. Em instalações com histórico de migrations
regularizado, use `prisma migrate deploy` e depois `prisma generate`.
A migration adiciona `Product.imageKey` opcional e a fila `ImageCleanup`;
produtos existentes permanecem sem foto.

Para produção, monte primeiro o NFS no host (ou prepare uma pasta em disco
persistente) e defina `PRODUCT_IMAGES_HOST_DIR` com o caminho absoluto dessa
pasta ao executar `docker compose -f docker/compose.prod.yml up -d`.
O Compose exige essa variável e monta a pasta no mesmo destino interno do dev.
Confira com `mountpoint <pasta>` se o NFS está montado antes de subir o serviço,
para evitar escrever acidentalmente no disco local. Configure UID/GID e permissões
de escrita conforme o usuário do container e o export NFS, sem permissões globais
`777`. A aplicação não monta NFS nem recebe credenciais do servidor.

Valide a montagem local com:

```bash
docker compose -f docker/compose.dev.yml config --quiet
docker exec boxshop-web-dev sh -c 'test -d "$PRODUCT_IMAGES_DIR" && test -w "$PRODUCT_IMAGES_DIR"'
```

Faça backup coordenado do PostgreSQL e da pasta de imagens, incluindo a fila de
limpeza. Ao restaurar, recupere ambos no mesmo ponto de consistência. Rollback da
aplicação preserva campos e arquivos para permitir a retomada da versão nova.
O smoke test no NFS real deverá incluir envio, leitura, substituição, remoção,
indisponibilidade temporária e recriação do container; a montagem local não
comprova comportamento de um servidor NFS remoto.

### Usar fotos no painel

Salve primeiro o cadastro do produto. Na lista de produtos, clique em **Foto**,
escolha um JPEG, PNG ou WebP estático e use **Enviar foto**. O limite é de 5 MiB,
4096 pixels por lado e 16 milhões de pixels. O servidor verifica os bytes e
converte para WebP, aplicando orientação e removendo metadados. A foto é opcional.
No mesmo diálogo, use **Substituir foto** ou **Remover foto**. Erros mantêm a foto
anterior e permitem nova tentativa. A vitrine exibe somente imagens de produtos
publicados; produtos sem foto ou com falha de leitura mostram estado neutro.

### Limpar arquivos de imagens

Execute manualmente, com as mesmas variáveis de banco e armazenamento da aplicação:

```bash
docker exec boxshop-web-dev npm run images:cleanup
```

O comando tenta novamente a fila `ImageCleanup` e reconcilia arquivos WebP e temporários de escrita interrompida com
mais de 24 horas que não estejam associados a produtos. Chaves ainda associadas
são preservadas. Pode ser executado novamente; a POC não possui agendador.
Se o NFS falhar durante remoção, a operação já confirmada continua válida e a
chave fica registrada na fila. Se o banco também estiver indisponível, procure
`PRODUCT_IMAGE_CLEANUP_REQUIRED` nos logs, preserve as chaves para recuperação e
execute a limpeza após restabelecer banco e montagem. Não apague arquivos usando
caminhos fornecidos pelo visitante nem remova arquivos associados manualmente.


Os testes de imagens com banco real exigem um banco exclusivo
`boxshop_images_validation` (criado pelo operador) e uma pasta `.validation.*`.
A sessão e a invalidação de cache são simuladas; PostgreSQL e arquivos são reais.
Com esse banco vazio preparado no PostgreSQL de desenvolvimento:

```bash
docker exec boxshop-web-dev sh -c '
  export DATABASE_URL="${DATABASE_URL%/*}/boxshop_images_validation"
  export PRODUCT_IMAGES_DIR=$(mktemp -d /var/lib/boxshop/product-images/.validation.XXXXXX)
  npx prisma db push &&
  RUN_DATABASE_TESTS=1 npx vitest run src/__tests__/integration/product-images.test.ts
'
```

Não use o banco ou a pasta de mídia de uma loja existente para testes de limpeza.
