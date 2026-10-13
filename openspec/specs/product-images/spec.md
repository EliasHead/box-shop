# product-images Specification

## Purpose

Permitir que cada loja gerencie uma foto principal por produto e a apresente na vitrine, com arquivos persistentes, isolamento e tratamento previsível de falhas.

## Requirements

### Requirement: Gestão da foto principal
O painel SHALL permitir enviar, substituir e remover uma foto principal de cada produto já salvo da própria loja. A imagem SHALL ser opcional e independente dos demais campos do cadastro.

#### Scenario: Primeiro envio
- **WHEN** o lojista envia uma imagem válida para um produto salvo sem foto
- **THEN** a foto fica associada ao produto e aparece após recarregar o painel

#### Scenario: Substituição
- **WHEN** o lojista substitui uma foto por outra válida
- **THEN** somente a nova foto é apresentada nas próximas consultas e a anterior é retirada do armazenamento conforme as regras de limpeza

#### Scenario: Remoção
- **WHEN** o lojista remove a foto
- **THEN** o produto continua cadastrado sem imagem e seus outros dados permanecem iguais

#### Scenario: Produto novo
- **WHEN** o lojista abre o cadastro de um produto ainda não salvo
- **THEN** a interface informa que a foto poderá ser adicionada após salvar o produto

### Requirement: Validação do arquivo
O servidor SHALL aceitar somente imagens estáticas JPEG, PNG e WebP decodificáveis, com tamanho maior que zero e até 5 MiB, dimensões positivas de até 4096 pixels por lado e no máximo 16 milhões de pixels. Extensão e tipo informados pelo cliente SHALL NOT ser suficientes para validar o conteúdo.

#### Scenario: Arquivo válido
- **WHEN** uma imagem JPEG, PNG ou WebP atende aos limites
- **THEN** o servidor aceita o arquivo e produz imagem WebP orientada corretamente, sem metadados de origem

#### Scenario: Arquivo inválido
- **WHEN** o envio contém arquivo vazio, corrompido, animado, formato não permitido, conteúdo falso ou tamanho/dimensões acima dos limites
- **THEN** o envio é rejeitado com mensagem em pt-BR e a foto existente permanece intacta

### Requirement: Autorização e isolamento
As mutações e prévias administrativas SHALL exigir usuário autenticado com vínculo atual no banco à loja proprietária do produto. Identificadores, nomes de arquivo e caminhos enviados pelo cliente SHALL NOT permitir acessar ou alterar arquivos de outras lojas ou fora do diretório de imagens.

#### Scenario: Sessão ausente ou vínculo inválido
- **WHEN** um envio, remoção ou acesso administrativo ocorre sem sessão, com usuário removido ou sem loja vinculada
- **THEN** a operação é negada sem escrita ou divulgação da imagem privada

#### Scenario: Produto de outra loja
- **WHEN** um usuário da loja A tenta gerenciar ou visualizar administrativamente a foto de produto da loja B
- **THEN** o acesso é negado e os arquivos e dados da loja B permanecem iguais

#### Scenario: Sessão obsoleta
- **WHEN** o vínculo no JWT difere do vínculo atual do usuário no banco
- **THEN** a autorização usa exclusivamente o vínculo atual no banco

#### Scenario: Caminho malicioso
- **WHEN** um pedido tenta usar caminhos absolutos, travessia de diretórios ou identificadores de arquivo não reconhecidos
- **THEN** nenhum arquivo fora da imagem autorizada é lido, escrito ou removido

### Requirement: Exibição pública da imagem
A vitrine SHALL apresentar a foto principal dos produtos ACTIVE da loja acessada, com texto alternativo referente ao produto. Produtos sem foto ou com falha de carregamento SHALL exibir estado neutro. O acesso público direto SHALL respeitar publicação e loja, inclusive após remoção, substituição ou mudança para DRAFT.

#### Scenario: Foto publicada
- **WHEN** um visitante sem sessão abre a vitrine de uma loja com produto ACTIVE e foto
- **THEN** a foto desse produto é exibida sem exigir login

#### Scenario: Imagem ausente ou indisponível
- **WHEN** o produto não tem foto ou seu arquivo não pode ser carregado
- **THEN** o card apresenta estado neutro, sem a foto externa fixa e sem impedir a leitura dos demais dados

#### Scenario: Rascunho e outra loja
- **WHEN** um visitante sem sessão tenta obter uma imagem de produto DRAFT ou por uma vitrine diferente da loja proprietária
- **THEN** a imagem não é entregue

#### Scenario: Foto antiga e publicação revogada
- **WHEN** uma foto é substituída/removida ou seu produto passa a DRAFT
- **THEN** novas requisições públicas da referência antiga ou não publicada não recebem a imagem, sem reaproveitar resposta pública armazenada em cache

### Requirement: Persistência em armazenamento configurável
O sistema SHALL persistir imagens em diretório configurável separado do código e conservar a associação após reiniciar ou recriar o container com a mesma montagem persistente. O mesmo mecanismo SHALL funcionar com disco local ou NFS montado, sem URLs ou caminhos absolutos de infraestrutura gravados no produto.

#### Scenario: Reinício do ambiente local
- **WHEN** o container é recriado mantendo a pasta montada da máquina
- **THEN** a imagem enviada anteriormente continua disponível

#### Scenario: Diretório NFS montado
- **WHEN** o diretório configurado aponta para montagem NFS com permissões adequadas
- **THEN** leitura, envio, substituição e remoção usam essa montagem com o mesmo contrato do disco local

### Requirement: Consistência e limpeza
Falhas de upload ou persistência SHALL preservar a associação anterior. Substituição, remoção e exclusão do produto SHALL remover arquivos que deixaram de ser usados; falhas de limpeza SHALL ser registradas para nova tentativa sem invalidar a operação já confirmada. Operações concorrentes SHALL NOT apagar a imagem que ficou associada ao produto.

#### Scenario: Falha de gravação ou banco
- **WHEN** uma tentativa de substituir a imagem falha antes de confirmar a associação
- **THEN** a imagem anterior permanece associada e arquivos novos sem associação são limpos ou registrados para limpeza posterior

#### Scenario: Exclusão do produto
- **WHEN** um produto com foto é excluído
- **THEN** sua imagem deixa de ser acessível e seu arquivo é removido ou registrado para nova tentativa se o armazenamento falhar

#### Scenario: Envios concorrentes
- **WHEN** duas tentativas simultâneas disputam a foto do mesmo produto
- **THEN** apenas uma referência final fica associada, conflitos são tratados e o arquivo associado permanece disponível

### Requirement: Feedback da operação
O painel SHALL oferecer prévia da foto atual, indicar formatos e limites, mostrar progresso de operação, impedir envios duplicados enquanto pendente e apresentar sucesso ou erro sem fechar a edição em falhas.

#### Scenario: Envio em andamento
- **WHEN** o envio ainda não terminou
- **THEN** os comandos conflitantes ficam indisponíveis e a interface indica processamento

#### Scenario: Falha e nova tentativa
- **WHEN** o envio é rejeitado ou o armazenamento fica indisponível
- **THEN** a interface apresenta erro compreensível e permite nova tentativa sem perder os dados do produto
