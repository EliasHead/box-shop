# Proposal

## Why

A vitrine usa a mesma foto externa fixa para todos os produtos, e o cadastro não armazena imagens. A POC precisa permitir fotos reais, mantendo a escolha confirmada de disco local no desenvolvimento e NFS em produção.

## What Changes

- Permitir enviar, substituir e remover uma foto principal de produtos já salvos, pelo painel, com prévia e feedback.
- Aceitar JPEG, PNG e WebP de até 5 MiB, validar o conteúdo e salvar versão WebP sem metadados.
- Usar pasta persistente configurável, montada da máquina local no Docker ou de NFS em produção, com separação por loja.
- Exibir a foto na vitrine e usar estado visual neutro quando ausente ou indisponível, substituindo a foto fixa.
- Proteger mutações e prévias de rascunhos pelo vínculo atual do usuário no banco; permitir leitura pública somente de imagens de produtos publicados da loja correspondente.
- Preservar o produto e a foto anterior em falhas; tratar limpeza dos arquivos em substituição, remoção e exclusão do produto.
- Galeria, fotos por variação, CDN, S3/MinIO, edição manual de imagem e provisionamento do servidor NFS ficam fora desta etapa. Para produtos novos, primeiro salvar o cadastro e depois adicionar a foto; a interface explicará esse fluxo.

## Capabilities

### New Capabilities

- `product-images`: gestão da foto principal, armazenamento persistente, autorização de leitura e escrita, exibição e ciclo de vida dos arquivos.

### Modified Capabilities

Nenhuma. A visibilidade ACTIVE e o isolamento definidos em `storefront-catalog` permanecem; `product-pricing` e `store-settings` também são preservados.

## Impact

Campo opcional e migration em Product; serviço de arquivos e processamento; Server Actions de imagem; Route Handler de leitura; painel de produtos e vitrine; Docker, variáveis de ambiente, documentação e testes. Adicionar dependência direta de processamento de imagem, sem serviço externo. Decisões de armazenamento e foto única foram confirmadas pelo usuário nesta conversa; rotas e isolamento seguem `openspec/config.yaml`.
