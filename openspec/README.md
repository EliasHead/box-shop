# OpenSpec no BoxShop

O OpenSpec é o fluxo ativo de especificação a partir de 11/10/2026. A adoção
substitui o uso de `.specs/features/` para novas mudanças, preservando os
documentos anteriores como referência. Esta migração não altera a aplicação.

## Organização

- `config.yaml`: contexto do projeto, idioma e regras dos artefatos.
- `specs/<domínio>/spec.md`: comportamento consolidado após mudanças concluídas.
- `changes/<mudança>/`: proposta, deltas de requisitos, design e tarefas em andamento.
- `changes/archive/`: histórico das mudanças concluídas.

As especificações consolidadas começam vazias. Não foi feita conversão em massa:
a documentação anterior mistura implementação, intenção e informações antigas.
Os domínios serão documentados conforme mudanças reais forem realizadas.

## Como trabalhar

1. Explore o código e os documentos relevantes quando houver dúvidas.
2. Proponha uma mudança pequena: gere `proposal.md`, deltas em `specs/`,
   `design.md` e `tasks.md`; revise o escopo antes da implementação.
3. Implemente a mudança acordada seguindo as tarefas.
4. Execute as verificações relevantes e registre o resultado. Validar o formato
   OpenSpec não substitui testes ou validação manual da aplicação.
5. Sincronize as especificações e arquive a mudança concluída.

| Etapa | Codex CLI/IDE | Claude Code |
| --- | --- | --- |
| Explorar | `$openspec-explore` | `/opsx:explore` |
| Propor | `$openspec-propose <ideia>` | `/opsx:propose <ideia>` |
| Implementar | `$openspec-apply-change` | `/opsx:apply` |
| Ajustar plano | `$openspec-update-change` | `/opsx:update` |
| Sincronizar | `$openspec-sync-specs` | `/opsx:sync` |
| Arquivar | `$openspec-archive-change` | `/opsx:archive` |

No aplicativo desktop do Codex, selecione a skill correspondente na interface.
Reinicie a sessão se as skills recém-geradas ainda não aparecerem.

Comandos de terminal:

```bash
openspec --version
openspec list
openspec list --specs
openspec status --change <nome>
openspec validate <nome> --strict
openspec validate --all --strict
```

Inicialização usada: OpenSpec CLI 1.14.0, schema `spec-driven`, perfil `core`,
integrações Codex e Claude Code. Para regenerar integrações após atualizar o CLI,
use `openspec update` e confira o diff dos arquivos gerados.

## Referências anteriores

| Material anterior | Uso no novo fluxo |
| --- | --- |
| `.specs/project/PROJECT.md` | Visão do produto; contexto resumido em `config.yaml`. |
| `.specs/project/ROADMAP.md` | Ideias e planejamento anteriores; não implica aprovação de novas funcionalidades. |
| `.specs/project/STATE.md` | Decisões e histórico; confirmar afirmações no código. |
| `.specs/codebase/` | Referência técnica; alguns trechos estão desatualizados. |
| `.specs/features/autenticacao/` e `logout-button/` | Referência para mudanças de autenticação. |
| `.specs/features/onboarding/` e `dashboard/` | Referência para criação da loja e painel. |
| `.specs/features/storefront-resolution/` | Referência para roteamento e vitrine. |
| `.specs/features/gestao-produtos-categorias/` | Referência para catálogo administrativo. |
| `.specs/features/gestao-estoque-variacoes/` | Referência para estoque, matriz de variações e decisões de contexto. |

Não usar caixas de requisitos pendentes nesses documentos como prova de que uma
funcionalidade não existe. Autenticação, dashboard e vitrine já consultam o banco.
O onboarding é verificado nas páginas; não há guard de tenant global no proxy.

## Pendências conhecidas na adoção

Na validação local de 11/10/2026, foram observados:

- Build bloqueado pelo tipo de `price` em `products-client.tsx`.
- Lint com 55 erros e 11 avisos.
- No Docker, 27 testes passaram e um teste da vitrine falhou em `next/image`.
- Produtos `DRAFT` aparecem na vitrine pública.
- Configurações da loja, upload de imagens e ação de compra via WhatsApp ainda
  precisam ser implementados.

Esses itens não foram corrigidos pela migração e não são mudanças já aprovadas.
Um primeiro uso sugerido é propor uma mudança pequena de estabilização.

## Documentação oficial

- [Primeiros passos](https://github.com/Fission-AI/OpenSpec/blob/main/docs/getting-started.md)
- [Adoção em projetos existentes](https://github.com/Fission-AI/OpenSpec/blob/main/docs/existing-projects.md)
- [Referência do CLI](https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md)
