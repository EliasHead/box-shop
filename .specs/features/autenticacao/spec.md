# Autenticação Specification

## Problem Statement

Atualmente, o projeto utiliza uma autenticação fictícia (mock) com credenciais chumbadas no código para acessar o painel administrativo (`/app`). Precisamos de um sistema real e seguro de autenticação integrado ao banco de dados PostgreSQL usando NextAuth e Prisma, além de proteger as rotas do painel contra acessos não autorizados.

## Goals

- [ ] Implementar autenticação real com credenciais (e-mail e senha) criptografadas.
- [ ] Proteger as rotas do dashboard (`/app/*`) redirecionando usuários não logados.
- [ ] Criar uma interface gráfica agradável e profissional para a página de Login.
- [ ] Garantir que exista um usuário inicial via script de Seed para permitir o primeiro acesso.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature     | Reason         |
| ----------- | -------------- |
| Autenticação Social (Google/GitHub) | Não é o foco do MVP atual, adiciona complexidade desnecessária neste momento. |
| Recuperação de Senha (Esqueci minha senha) | Requer configuração de envio de e-mails (SMTP/Serviço externo), deixaremos para um segundo momento. |
| MFA (Autenticação em Dois Fatores) | Fora do escopo do MVP. |

---

## User Stories

### P1: Login Seguro ⭐ MVP

**User Story**: Como lojista/administrador, eu quero fazer login com meu e-mail e senha cadastrados para acessar meu painel administrativo com segurança.

**Why P1**: É a porta de entrada obrigatória para gerenciar o SaaS. Sem isso, não há segurança.

**Acceptance Criteria**:

1. WHEN o usuário preencher credenciais válidas na tela de login THEN system SHALL autenticá-lo e redirecioná-lo para o dashboard (`/app`).
2. WHEN o usuário preencher credenciais inválidas THEN system SHALL exibir uma mensagem de erro clara na interface.
3. WHEN a senha for verificada no backend THEN system SHALL usar comparação de hash (`bcrypt`) em vez de texto puro.

**Independent Test**: Tentar logar com credenciais erradas (deve falhar) e com credenciais corretas do Seed (deve passar e redirecionar).

---

### P1: Proteção de Rotas do Dashboard ⭐ MVP

**User Story**: Como dono do sistema, eu quero que as rotas do painel administrativo sejam bloqueadas para visitantes anônimos para proteger os dados das lojas.

**Why P1**: Uma autenticação não serve de nada se as rotas puderem ser acessadas diretamente pela URL.

**Acceptance Criteria**:

1. WHEN um usuário anônimo tentar acessar qualquer rota iniciada por `/app` ou no subdomínio `app.` THEN system SHALL redirecioná-lo para a tela de login.
2. WHEN um usuário autenticado tentar acessar o dashboard THEN system SHALL permitir o acesso normalmente.

**Independent Test**: Tentar acessar `app.localhost:3000/` em uma aba anônima e verificar se é redirecionado para a rota de login.

---

### P1: Interface de Login (UI) ⭐ MVP

**User Story**: Como usuário, quero uma tela de login com design moderno e profissional para me passar credibilidade sobre o SaaS.

**Why P1**: O usuário solicitou explicitamente "uma boa página de login". A primeira impressão do sistema importa.

**Acceptance Criteria**:

1. WHEN o usuário acessar a página de login THEN system SHALL exibir um formulário responsivo (Mobile/Desktop) com campos de e-mail, senha e botão de entrar.

**Independent Test**: Acessar a página de login em diferentes tamanhos de tela e verificar a fidelidade visual e usabilidade.

---

### P2: Script de Seed do Banco de Dados

**User Story**: Como desenvolvedor, quero um script automatizado que insira um usuário administrador no banco de dados para facilitar a configuração inicial do ambiente.

**Why P2**: Necessário para o fluxo de desenvolvimento, já que não temos funcionalidade de "Criar Conta" aberta para o painel.

**Acceptance Criteria**:

1. WHEN eu rodar o script de seed THEN system SHALL criar o usuário "admin@boxshop.com" com a senha criptografada caso ele não exista.

**Independent Test**: Rodar o comando de seed e conferir via Prisma Studio se o usuário foi criado corretamente com a senha hasheada.

---

## Edge Cases

- WHEN o banco de dados estiver fora do ar no momento do login THEN system SHALL exibir um erro genérico de falha de conexão sem expor dados sensíveis.
- WHEN o usuário logado tentar acessar a página de login novamente THEN system SHALL redirecioná-lo de volta para o dashboard.

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story       | Phase  | Status  |
| -------------- | ----------- | ------ | ------- |
| AUTH-01        | P1: Login Seguro | Design | Pending |
| AUTH-02        | P1: Proteção de Rotas | Design | Pending |
| AUTH-03        | P1: Interface de Login | Design | Pending |
| AUTH-04        | P2: Script de Seed | Design | Pending |

**Coverage:** 4 total, 0 mapped to tasks, 4 unmapped ⚠️

---

## Success Criteria

How we know the feature is successful:

- [ ] É impossível acessar o painel `/app` sem estar logado.
- [ ] O login é feito validando senhas criptografadas no banco (Prisma + bcrypt).
- [ ] A tela de login possui um design profissional.
- [ ] O desenvolvedor consegue criar o usuário inicial facilmente via comando.
