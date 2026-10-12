# Design

## Context

Ver `proposal.md` para motivação. `Tenant` contém nome e domínio, mas não descrição nem telefone. `src/app/app/layout.tsx` já oferece `/dashboard/settings`; a página não existe. O dashboard consulta o usuário no banco para tratar JWT obsoleto, enquanto outras ações usam tenantId da sessão. A vitrine consulta a loja pelo domínio e já filtra produtos ACTIVE.

## Goals / Non-Goals

**Goals:** adicionar edição pequena e tipada seguindo Server Actions e componentes existentes; definir vínculo da loja no servidor; manter compatibilidade dos registros.

**Non-Goals:** mudar autorização de outros módulos, criar novo sistema de permissões, mudar domínio, verificar titularidade do telefone, integrar envio de mensagens ou criar novas dependências.

## Decisions

1. Adicionar `description String?` e `whatsapp String?` a Tenant. Campos anuláveis dispensam backfill e mudanças no onboarding. Alternativa: tabela separada de configurações; complexidade desnecessária para três campos.
2. Criar validação compartilhada em `src/lib/validations/tenant-settings.ts`, seguindo o padrão local de validação sem bibliotecas adicionais. Trim e limites serão aplicados no servidor. Telefone aceita dígitos, espaços, parênteses e hífens, além de um `+` inicial; após remover apenas esses separadores, exigir `[1-9]` seguido de 7 a 14 dígitos. Não remover caracteres arbitrários nem inferir DDI. Alternativa: aceitar somente números nacionais; impediria uso internacional e criaria ambiguidade.
3. Criar ações específicas de consulta e atualização em `src/lib/actions/tenant-settings.ts`. Obter user.id de auth, consultar tenantId atual no banco e selecionar a loja por esse vínculo. Na atualização, resolver vínculo e escrita na mesma transação; persistir somente os três campos explicitamente permitidos. Não confiar em tenantId, domínio ou role enviados pelo cliente. Alternativa: usar tenantId do JWT, descartada por poder estar obsoleto. Seguir a política atual de usuários vinculados à loja, sem introduzir restrição OWNER ausente nos demais módulos.
4. Implementar página servidor em `src/app/app/dashboard/settings/page.tsx` e formulário cliente ao lado, com componentes Input, Textarea, Label e Button existentes. A página trata redirecionamentos de autenticação/onboarding; a ação retorna resultado discriminado com mensagens seguras em pt-BR, sem detalhes do banco. Estado pendente e mensagens acessíveis no formulário preservam dados em falhas. Domínio aparece somente para leitura.
5. Revalidar página de configurações, layout do painel e rota pública da loja após sucesso, usando caminhos internos compatíveis com rewrites; ler os guias locais de Server Actions e revalidatePath antes de codificar. Atualizar o cabeçalho público com descrição como texto escapado pelo React. Alternativa: apenas router.refresh, insuficiente para explicitar invalidação das rotas afetadas.

## Risks / Trade-offs

- [Telefone com formato válido pode não existir no WhatsApp] → orientar formato internacional; verificação de titularidade não integra esta POC.
- [Migration desatualizada em ambiente existente] → aplicar migration e gerar Prisma Client antes de executar a versão nova; verificar fluxo com registros antigos.
- [Fixtures de Tenant deixam de compilar] → atualizar fixtures e mocks afetados com campos nulos, preservando cobertura anterior.
- [Falha de banco] → retornar erro seguro, preservar entrada e registrar detalhes apenas no servidor.
- [Cache e rewrites ocultam alterações] → validar nome no painel e descrição pública após salvar, com sessão e sem sessão.

## Migration Plan

Criar migration aditiva com duas colunas opcionais, sem apagar dados; testar aplicação em banco de desenvolvimento com registros existentes e regenerar o client. Executar testes, lint, TypeScript e build em cópia temporária conforme `openspec/README.md`, se Docker for necessário. Publicar aplicação após schema atualizado. Em rollback, restaurar aplicação anterior e manter colunas opcionais para preservar os dados; remoção de colunas exige decisão separada. Ao concluir, sincronizar specs e arquivar via OpenSpec.

## Implementation Notes

Guias consultados no container, sob `/tmp/boxshop-stabilize/node_modules/next/dist/docs/`: `01-app/01-getting-started/07-mutating-data.md`, `01-app/03-api-reference/04-functions/redirect.md` e `01-app/03-api-reference/04-functions/revalidatePath.md`. Revalidação usa destino interno dos rewrites; redirect fica fora de try/catch.
