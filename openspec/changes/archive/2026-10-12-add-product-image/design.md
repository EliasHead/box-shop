# Design

## Context

Ver `proposal.md` para motivação. Product não tem campo de imagem. `products-client.tsx` mantém lista local e fecha o diálogo ao salvar. As ações de produtos validam tenantId da sessão; a nova gestão de imagem seguirá o vínculo atual no banco usado em configurações da loja. A vitrine usa next/image com URL fixa do Unsplash. O proxy ignora `/api/`, portanto handlers de imagem precisam aplicar seu próprio controle de acesso. Docker atual não tem volume de mídia.

## Goals / Non-Goals

**Goals:** separar processamento/arquivos do domínio, usar montagens persistentes e garantir consistência entre banco e arquivos sem transações distribuídas.

**Non-Goals:** provisionar NFS remoto, criar serviço S3, servir pastas arbitrárias ou modificar regras de preço, variações e estoque.

## Decisions

1. Adicionar `imageKey String?` a Product, contendo identificador relativo gerado no servidor. Registros existentes recebem null; não importar a foto fixa. Alternativa: URL absoluta, descartada porque vincula dados à infraestrutura.
2. Criar serviço servidor em `src/lib/storage/product-images.ts`, com raiz absoluta obrigatória `PRODUCT_IMAGES_DIR`, organização por tenantId/productId e UUID por versão. Validar identificadores e contenção na raiz; diretório controlado pela aplicação, sem aceitar links simbólicos para fora da raiz. Escrever arquivo temporário no mesmo diretório e renomear antes de associar. Não usar public/ para arquivos dinâmicos. Alternativa: MinIO/S3, rejeitada conforme escolha do usuário.
3. Usar sharp como dependência direta para detectar/decodificar conteúdo, aplicar orientação EXIF e reencodar WebP sem metadados. Validar 5 MiB, até 4096 por lado, até 16 milhões de pixels e uma única página/frame antes do processamento completo. Não confiar no MIME do navegador. Não há ferramenta de edição manual nesta etapa.
4. Ações específicas em `src/lib/actions/product-images.ts` recebem productId e FormData, resolvem user.id → tenantId atual e verificam produto antes de processar. Ler guias locais de Server Actions, limites do corpo e APIs antes de codificar; ajustar limite para 6 MiB (arquivo de 5 MiB mais multipart), com validação explícita do arquivo. Verificar Origin com comportamento nativo de Server Actions; não criar POST público sem controle equivalente.
5. Upload e troca usam chave imutável. Após gravação, uma transação revalida vínculo/propriedade e atualiza com condição na referência anterior; conflito limpa o arquivo novo e retorna mensagem para recarregar/tentar novamente. Remoção também condiciona a atualização à referência anterior. Limpar o arquivo substituído somente após confirmação; nunca remover chave ainda referenciada. Integrar exclusão do produto ao mesmo protocolo de limpeza. Nenhuma transação de banco ficará aberta durante processamento ou escrita no NFS.
6. Falha ao apagar arquivo gera registro persistente de limpeza (modelo `ImageCleanup`, chave relativa única, erro e datas), processado por comando administrativo idempotente com nova tentativa, que só apaga chaves sem associação. Se também falhar o registro no banco, registrar chave no log do servidor para recuperação operacional. Interrupção abrupta entre escrita e associação pode deixar órfãos: o mesmo comando fará reconciliação dos arquivos antigos sem referência, com janela mínima de 24h para não apagar uploads em andamento. Sem agendador automático na POC; documentar execução manual e futuro agendamento.
7. Leitura por `GET /api/product-images/[productId]/[version]`, runtime Node, consultando associação atual e validando versão. No host da vitrine, resolver Tenant pelo domínio e exigir produto ACTIVE dessa loja; no host do painel, exigir sessão e vínculo atual para prévias, inclusive DRAFT. Host raiz/desconhecido não oferece acesso público. Responder com Content-Type image/webp, nosniff e Cache-Control private, no-store; erros de autorização, arquivo ausente e referência antiga não divulgam caminhos. Alternativa: pasta pública direta, descartada por expor rascunhos e arquivos removidos.
8. Usar componente de imagem com fallback neutro e URL relativa, sem otimização intermediária que contorne validação de publicação ou retenha imagem privada (next/image unoptimized ou img conforme guias locais). Revogação vale para novas requisições, não apaga arquivos já baixados pelo visitante. Revalidar destinos internos de painel/vitrine após mutações; atualizar lista local do cliente explicitamente.
9. Gerenciar a imagem em diálogo próprio de produto salvo, com prévia, input de arquivo, enviar/substituir e remover; o cadastro novo explica que é necessário salvar primeiro. Evita produto parcialmente criado por falha de upload e preserva o fluxo de variações existente. Produto pode ser salvo sem imagem.
10. Desenvolvimento: bind mount de `./data/product-images` (fora do git e do contexto Docker) para `/var/lib/boxshop/product-images`. Produção: mount de pasta do host indicada por `PRODUCT_IMAGES_HOST_DIR` no mesmo destino; operador monta NFS nesse host e configura permissões antes de iniciar. A aplicação não recebe credenciais NFS nem grava em camada efêmera. Abstração de armazenamento permitirá implementação S3 futura sem incluir esse provedor agora.

## Risks / Trade-offs

- [Filesystem e banco não compartilham transação] → gravação antes de associação, comparação de versão, compensação e reconciliação; testar falhas em cada etapa.
- [NFS indisponível, cheio ou sem permissão] → erro seguro sem descartar referência anterior; testes de falha local e documentação de permissões e backup conjunto de banco/arquivos.
- [Caches expõem rascunhos ou versões antigas] → handler autoriza cada leitura, no-store e entrega sem otimizador intermediário nesta POC; CDN futura precisará rever revogação.
- [Arquivos comprimidos abusam de memória/CPU] → limites de bytes, pixels e frames e decodificação controlada antes de reencodar.
- [Concorrência e exclusão durante upload] → atualização condicional transacional, limpeza somente de referências não utilizadas e janela de reconciliação.
- [NFS real indisponível no desenvolvimento] → validar com diretório montado local; registrar explicitamente que teste em servidor NFS real fica dependente do ambiente de produção, sem afirmar que foi executado.

## Migration Plan

Aplicar migrations aditivas para imageKey e fila de limpeza, gerar Prisma Client e atualizar fixtures. Em banco legado de db push, seguir procedimento sem reset já documentado. Preparar diretório persistente e permissões antes da nova versão. Testar reinstanciação do container mantendo dados. Rollback preserva colunas, fila e arquivos; versão anterior ignora os campos. Backup deve abranger banco e pasta de mídia. Documentar comando de limpeza e smoke test para NFS real antes da implantação nesse ambiente. Sincronizar specs e arquivar somente depois da implementação e validação.

## Implementation Notes

Guias lidos em `node_modules/next/dist/docs/` no container: `01-app/01-getting-started/07-mutating-data.md`, `01-app/01-getting-started/15-route-handlers.md`, `01-app/03-api-reference/03-file-conventions/route.md`, `01-app/03-api-reference/05-config/01-next-config-js/serverActions.md`, `01-app/03-api-reference/02-components/image.md` e `01-app/03-api-reference/04-functions/revalidatePath.md`. Parâmetros de rota são Promise; revalidatePath usa destino dos rewrites. Next/Image autenticado exige unoptimized para preservar cookies e evitar cache intermediário. Limite multipart configurado em experimental.serverActions.bodySizeLimit.
