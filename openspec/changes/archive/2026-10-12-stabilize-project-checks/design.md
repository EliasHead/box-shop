# Design

## Context

Ver `proposal.md` para motivação e limites. Evidências do item 1: Docker Node 22.23.3 com 54/55 testes, 54 erros/10 avisos de lint; TypeScript aponta fixture incompleta em `src/app/[domain]/page.test.tsx:63`. O build Docker não foi executado por falha de aprovação 429; no host, o download de Inter falhou. Estes resultados são históricos e serão reproduzidos antes da implementação.

O lint identifica `no-explicit-any` nos clientes de categorias/produtos, testes de dashboard e ações, e `createTenant`; os avisos são `no-unused-vars`. `next.config.ts` já permite `images.unsplash.com`, mas Vitest não carrega automaticamente toda a infraestrutura do Next. A fixture da vitrine omite campos obrigatórios do modelo Prisma.

## Goals / Non-Goals

**Goals:** verificações sem falhas de código, mocks compatíveis com os contratos reais e tipos que descrevam os dados efetivamente usados.

**Non-Goals:** alterar autorização, regras de catálogo, armazenamento, schema ou apresentação; modificar o funcionamento de fontes para contornar rede. Nenhuma migração ou transformação de dados existentes.

## Decisions

1. Completar fixtures usando tipos Prisma e sessões Auth.js, selecionando o overload de `auth` sem argumentos nos mocks. Evitar casts para silenciar incompatibilidades; preservar casos e asserções existentes. Preferir fixtures locais ou pequenas fábricas tipadas quando a repetição justificar, sem criar infraestrutura genérica.
2. Usar um mock local e tipado de `next/image` no teste da vitrine, renderizando imagem com `src` e `alt` e omitindo props internas como `fill`. Manter asserções de nome, descrição e preço e adicionar asserção da imagem por nome acessível. Não relaxar `remotePatterns` nem transformar o teste em teste de internals de otimização. Conferir renderização real da imagem em validação manual no Docker.
3. Derivar tipos de listagem a partir dos contratos das ações ou payloads Prisma, distinguindo produtos retornados por listagem com relações dos retornados por mutações. Preservar o estado e a edição imediatamente após criar/atualizar, usando relações opcionais quando o contrato assim exigir. Tipar combinações cartesianas, callbacks e seleção de status; manter schema e significado de ACTIVE/DRAFT. Não converter dados inválidos silenciosamente para obter aprovação do compilador.
4. Tratar exceções como `unknown`, estreitando antes de ler mensagens e preservando mensagens existentes para `Error`; fornecer fallback para valores sem mensagem. Remover imports sem uso. Não desabilitar regras ESLint, excluir arquivos, inserir `@ts-ignore`, usar `any` disfarçado ou alterar dependências para reduzir diagnósticos.
5. Executar checks em cópia temporária dentro do Docker com Node 22 e dependências correspondentes ao lockfile, isolando `.next` do servidor de desenvolvimento. Registrar código de saída real e versões. Não usar `db push --accept-data-loss` ou alterar dados de aplicação para validar manutenção.

## Risks / Trade-offs

- Tipos mais precisos expõem incompatibilidades entre payloads de leitura/mutação → verificar criação, edição, reabertura e variações; preservar contratos existentes.
- Mock de imagem não valida otimização real → limitar mock ao teste unitário e complementar com verificação no servidor real.
- Build pode revelar outros defeitos → corrigir somente problemas de testes/tipagem/manutenção deste escopo; mudanças de comportamento exigem revisão explícita do plano.
- Rede, Docker ou aprovação podem bloquear execução → registrar separadamente e manter validação correspondente pendente, sem afirmar conclusão completa.
- Alterações do item 1 ainda não commitadas → preservar seu diff e usar o estado atual como base da nova mudança.

## Migration Plan

Sem migração de banco ou alteração de dependências. Aplicar mudanças por grupo, verificar testes e tipagem correspondentes e depois executar integração completa. Rollback consiste em reverter somente o diff desta mudança. Atualizar as instruções de verificação com evidências reais, mantendo registros históricos identificados por data.
