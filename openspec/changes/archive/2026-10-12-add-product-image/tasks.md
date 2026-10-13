# Tasks

## 1. Persistência e ambiente

- [x] 1.1 Ler guias locais Next.js de Server Actions, limite de corpo, Route Handlers, parâmetros assíncronos, imagens e revalidatePath antes de editar código; registrar os caminhos consultados no design e confirmar compatibilidade das APIs.
- [x] 1.2 Adicionar imageKey opcional a Product e modelo ImageCleanup com migration aditiva; gerar client e atualizar fixtures, verificando banco existente sem reset e TypeScript dos modelos afetados.
- [x] 1.3 Configurar diretório obrigatório e montagens persistentes em Docker dev/prod, exemplo de ambiente, gitignore e dockerignore; verificar resolução do Compose e escrita/leitura em pasta local montada, sem incluir mídia no Git ou build.
- [x] 1.4 Documentar configuração local, montagem NFS no host, permissões, migration sem reset e backup conjunto de banco/arquivos; conferir os comandos no ambiente local e identificar o smoke test reservado ao NFS real.

## 2. Processamento e armazenamento

- [x] 2.1 Adicionar sharp como dependência direta e implementar validação/normalização JPEG, PNG e WebP; testar bytes, limites de tamanho/dimensões/pixels, corrupção, MIME falso, animação, orientação e ausência de metadados na saída.
- [x] 2.2 Implementar serviço de arquivos com chaves imutáveis, diretórios por loja/produto, escrita temporária e rename; testar conteúdo persistido, isolamento, travessia de diretórios, links para fora da raiz e falhas de permissão/escrita.
- [x] 2.3 Implementar fila de limpeza, comando idempotente de nova tentativa e reconciliação de órfãos antigos; testar preservação de chaves associadas, janela de 24h, falha/reexecução e remoção dos arquivos elegíveis.
- [x] 2.4 Documentar execução da limpeza e recuperação por logs quando o banco também falha; verificar execução segura do comando em diretório de teste com arquivos associados e órfãos.

## 3. Gestão autorizada e entrega

- [x] 3.1 Implementar ações de envio/substituição/remoção com vínculo atual no banco e limite de multipart adequado; testar ausência de sessão/loja, usuário removido, JWT obsoleto, produto de outra loja e arquivo inválido sem alteração da imagem anterior.
- [x] 3.2 Aplicar atualização condicional por versão, compensação e limpeza após confirmação, incluindo exclusão do produto; testar dois uploads concorrentes, remoção/exclusão durante envio e falhas de banco/armazenamento sem apagar arquivo associado.
- [x] 3.3 Implementar GET de imagem por produto/versão com autorização própria, validação de host, publicação e Cache-Control no-store; testar vitrine sem sessão, rascunho acessível só ao dono no painel, host desconhecido/outra loja, arquivo ausente e versão antiga inacessível.
- [x] 3.4 Revalidar destinos internos corretos de painel e vitrine e atualizar referência no retorno das ações; testar chamadas e leitura da nova versão sem imagem antiga após substituir/remover.

## 4. Painel e vitrine

- [x] 4.1 Adicionar gestão da foto no painel para produtos salvos, com orientação no cadastro novo, prévia, limites, mensagens e bloqueio de operações conflitantes; testar envio, substituição, remoção, falha com nova tentativa e preservação dos demais campos do produto.
- [x] 4.2 Substituir foto fixa da vitrine por imagem própria com texto alternativo e fallback neutro; testar produto ACTIVE com/sem foto, falha de carregamento e manutenção do isolamento/publicação existentes sem cache intermediário de imagem privada.
- [x] 4.3 Documentar no README o fluxo de salvar produto e depois adicionar foto, formatos, limites e remoção; conferir correspondência dos rótulos e passos com a interface implementada.

## 5. Integração e encerramento

- [x] 5.1 Executar fluxo com PostgreSQL e pasta persistente reais: salvar produto, enviar foto, recarregar, abrir vitrine sem sessão, substituir, remover e excluir; verificar outra loja intacta e arquivo associado preservado nas falhas, registrando evidências.
- [x] 5.2 Recriar o container mantendo o bind mount e conferir que a imagem continua disponível; registrar o caminho persistente utilizado e a limitação de não testar servidor NFS real quando indisponível.
- [x] 5.3 Executar npm test, npm run lint, TypeScript e build em cópia temporária, conforme README OpenSpec; registrar resultados e separar falhas ambientais/preexistentes de regressões.
- [x] 5.4 Validar mudança com openspec validate add-product-image --strict e preparar sincronização dos requisitos após todas as verificações; confirmar equivalência do delta e spec consolidada e concluir arquivamento pelo OpenSpec.

## Evidências de implementação

- 12/10/2026: schema validado; SQL aditivo executado com `prisma db execute` no PostgreSQL legado, sem reset (0 produtos antes da execução); Prisma Client 7.7.0 gerado. TypeScript sem diagnósticos; 101 testes passaram, 1 teste de integração opt-in não executado.
- Compose dev/prod validado com `config --quiet`; serviço dev recriado preservando volumes. Escrita/leitura/remoção de arquivo temporário em `/var/lib/boxshop/product-images` confirmadas. Bind mount local: `data/product-images`. NFS remoto não testado.

- Validação de processamento/arquivos: JPEG, PNG, WebP, EXIF, ausência de metadados, corrupção, limites de bytes/lados/pixels, WebP animado/APNG, travessia, symlinks, raiz inválida e falhas de escrita. Interface: envio/substituição/remoção, bloqueio pendente, erro e nova tentativa; fallback e recuperação por chave nova.
- PostgreSQL real: 3 testes opt-in passaram em banco exclusivo `boxshop_images_validation` e pastas `.validation.*`: ciclo completo, isolamento administrativo/público, JWT obsoleto, rascunhos, concorrência entre uploads e com remoção/exclusão, preservação após falha de escrita, órfão antigo e arquivo associado. Sessão e revalidação simuladas; banco/arquivos reais. Comando `npm run images:cleanup` executado no banco/pasta exclusivos.
- Persistência: fixture própria com Product ACTIVE e WebP criada, serviço `boxshop-web-dev` recriado com bind mount `data/product-images`; associação e bytes mantidos e GET público real retornou HTTP 200, `private, no-store`, sem sessão. Fixture removida após confirmação. NFS remoto não disponível/testado.
- Ajustes de validação: primeira leitura HTTP antecipou inicialização; cliente fetch não preservou Host customizado. Repetição aguardou HTTP e usou cliente `node:http` com Host explícito, concluindo com sucesso. Primeira cópia de build foi interrompida pela recriação do container; checks finais repetidos após estabilização.
- A revisão automática rejeitou limpeza no diretório geral por possível alcance fora das fixtures. Validação foi feita em banco e diretório exclusivos de teste. Os testes opt-in exigem explicitamente esse isolamento.

- Checks finais em `/tmp/boxshop-images-checks.PnfeDB`: 150 testes passaram; 4 testes opt-in não executados nessa suíte (os 3 de imagens passaram separadamente com PostgreSQL). Lint sem diagnósticos, TypeScript sem diagnósticos e build Next.js 16.2.3 concluído, incluindo rota dinâmica de imagens. Reconciliação de temporários antigos coberta por teste adicional. `git diff --check` aprovado.

- OpenSpec: requisitos consolidados em `openspec/specs/product-images/spec.md` com conteúdo equivalente ao delta; `openspec validate --all --strict` aprovou os 5 itens. Arquivamento concluído via CLI em `2026-10-12-add-product-image`, após sincronização; tarefa administrativa 5.4 marcada após confirmar o arquivamento.
