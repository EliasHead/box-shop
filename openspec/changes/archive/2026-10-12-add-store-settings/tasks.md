# Tasks

## 1. Persistência e validação

- [x] 1.1 Adicionar description e whatsapp opcionais a Tenant e migration aditiva; verificar aplicação no banco de desenvolvimento com lojas existentes e gerar Prisma Client, sem reset de dados.
- [x] 1.2 Atualizar fixtures e mocks de Tenant com valores opcionais nulos; verificar TypeScript e testes existentes afetados.
- [x] 1.3 Implementar validação de nome, descrição e telefone com normalização explícita; testar limites, espaços, limpeza de opcionais, telefone formatado e rejeição de caracteres inválidos e tipos inesperados.
- [x] 1.4 Documentar no README do projeto os campos, formato internacional e procedimento de migration; conferir comandos com o ambiente disponível.

## 2. Consulta e atualização autorizadas

- [x] 2.1 Ler os guias locais relevantes em node_modules/next/dist/docs/ para Server Actions, redirecionamentos e revalidatePath; registrar no design os caminhos consultados e confirmar APIs antes de escrever código Next.js.
- [x] 2.2 Implementar consulta de configurações e atualização transacional pelo vínculo atual do usuário no banco, persistindo apenas campos permitidos; testar ausência de sessão, usuário removido, ausência de loja, JWT obsoleto, identificador de outra loja e preservação do domínio.
- [x] 2.3 Implementar resultado de erro seguro e revalidação das rotas internas de configurações, layout e vitrine; testar sucesso, rejeição de entrada sem escrita e falha do banco sem divulgação de detalhes.

## 3. Painel e vitrine

- [x] 3.1 Criar página de configurações com carregamento dos dados e redirecionamentos para login/onboarding; testar os caminhos de acesso e os campos opcionais ausentes.
- [x] 3.2 Criar formulário com rótulos, domínio somente para leitura, ajuda de WhatsApp, estados pendente/sucesso/erro e preservação das entradas em falhas; testar envio, bloqueio de duplicatas e nova tentativa após erro.
- [x] 3.3 Exibir descrição opcional no cabeçalho público e garantir nome atualizado no painel; testar vitrine sem sessão, com catálogo vazio, descrição ausente/removida e isolamento por domínio, preservando filtro ACTIVE.

## 4. Integração e conclusão

- [x] 4.1 Verificar fluxo completo com banco: abrir configurações, salvar, recarregar, remover opcionais e visitar vitrine sem sessão; verificar nome no painel e ausência de alterações em uma segunda loja, registrando evidências e limitações reais.
- [x] 4.2 Executar npm test, npm run lint, TypeScript e npm run build, usando cópia temporária no Docker quando necessário; registrar resultados e distinguir falhas preexistentes ou ambientais de regressões.
- [x] 4.3 Validar a mudança com openspec validate add-store-settings --strict, sincronizar a especificação e arquivar após implementação e verificação; confirmar especificação consolidada e ausência de mudança ativa concluída.

## Validation Notes

- Ambiente: Docker Desktop iniciado; containers existentes boxshop-web-dev e boxshop-db-dev. Dependências instaladas pelo comando original do container; guias Next.js 16.2.3 lidos na cópia de validação existente.
- Migration aditiva aplicada com `docker.exe exec boxshop-web-dev npx prisma db execute --file prisma/migrations/20261012120000_add_store_settings/migration.sql`; `npx prisma generate` produziu client 7.7.0. O banco local usa histórico de db push; nenhuma tabela ou dado existente foi removido.
- `npm test`: 101 testes passaram, 1 integração opt-in ignorada por padrão. `npm run lint`: sem erros ou avisos. `npx tsc --noEmit --incremental false`: sem diagnósticos.
- `RUN_DATABASE_TESTS=1 npx vitest run src/__tests__/integration/store-settings.test.tsx src/app/app/dashboard/settings/settings.test.tsx`: 6/6 passaram. O teste de integração usa PostgreSQL real, cobre leitura, gravação, recarga, nome no layout, vitrine sem identidade autenticada, remoção de opcionais e isolamento, com limpeza das entidades temporárias. Auth e revalidatePath são mocks nesse teste automatizado.
- Verificação HTTP real adicional pelo servidor Next.js: GET sem sessão retornou 307 para /login; sessão JWT temporária assinada permitiu abrir /dashboard/settings; POST real da Server Action confirmou sucesso; nova GET refletiu nome/telefone; vitrine sem cookie exibiu descrição; segunda loja permaneceu intacta; novo POST removeu os opcionais. Usuário e lojas de teste removidos no finally. Não houve inspeção visual em navegador.
- Build de produção em cópia física temporária `/tmp/boxshop-settings.*`, sem copiar .env nem alterar .next do servidor: compilação, TypeScript e geração de 11 páginas concluídos; /app/dashboard/settings aparece como rota dinâmica.
- Primeira execução encontrou sobrescrita acidental da descrição em fixture de produto e string de erro incompatível no mock novo; ambos corrigidos e verificações afetadas repetidas com sucesso. Nenhuma falha funcional preexistente observada.

Sincronização validada: cinco requisitos novos em `openspec/specs/store-settings/spec.md`; três specs passaram na validação estrita. Arquivamento concluído em `2026-10-12-add-store-settings`, com 13/13 tarefas concluídas.

Validação manual pelo usuário: caso de salvar configurações, recarregar e conferir a vitrine finalizado sem problemas, conforme confirmação na conversa.
