# Spec Delta

## Purpose

Permitir que o lojista mantenha a identidade e o contato da própria loja pelo painel, preservando isolamento e compatibilidade com lojas existentes.

## ADDED Requirements

### Requirement: Consulta das configurações da própria loja
O painel SHALL oferecer `/dashboard/settings` com nome, descrição e WhatsApp atuais da loja vinculada ao usuário autenticado no banco e domínio somente para leitura.

#### Scenario: Loja existente
- **WHEN** um usuário com loja vinculada acessa Configurações
- **THEN** o formulário apresenta os dados persistidos dessa loja, com campos opcionais nulos apresentados vazios

#### Scenario: Acesso sem sessão
- **WHEN** um visitante sem sessão acessa Configurações
- **THEN** é redirecionado para `/login` sem receber os dados de configuração

#### Scenario: Usuário sem loja
- **WHEN** um usuário existente sem loja vinculada acessa Configurações
- **THEN** é redirecionado para `/onboarding`

#### Scenario: Usuário removido
- **WHEN** uma sessão se refere a um usuário que não existe mais no banco
- **THEN** o acesso às configurações é negado e o usuário é redirecionado para `/login`

### Requirement: Persistência e isolamento das configurações
O sistema SHALL salvar somente nome, descrição e WhatsApp da loja vinculada ao usuário autenticado no banco, sem aceitar identificadores de loja enviados pelo cliente como autorização. Operações sem usuário válido ou sem loja SHALL ser rejeitadas sem escrita.

#### Scenario: Salvar e recarregar
- **WHEN** um usuário salva dados válidos e recarrega Configurações
- **THEN** os novos dados persistidos são exibidos e o domínio permanece igual

#### Scenario: Tentativa de alterar outra loja
- **WHEN** um usuário da loja A envia dados com identificador ou domínio da loja B
- **THEN** nenhum dado da loja B é alterado e nenhum domínio é alterado

#### Scenario: Vínculo desatualizado na sessão
- **WHEN** a sessão informa loja A mas o vínculo atual do usuário no banco aponta para loja B
- **THEN** a consulta e o salvamento de configurações usam exclusivamente a loja B

#### Scenario: Mutação sem acesso válido
- **WHEN** uma tentativa de salvar ocorre sem sessão, com usuário removido ou sem loja vinculada
- **THEN** a operação retorna erro e nenhuma loja é atualizada

### Requirement: Validação dos dados da loja
O servidor SHALL aceitar nome com 1 a 100 caracteres após trim, descrição opcional com até 500 caracteres após trim e WhatsApp opcional em formato internacional com 8 a 15 dígitos, iniciando de 1 a 9. O sistema SHALL normalizar a formatação permitida do telefone e persistir campos opcionais vazios como nulos.

#### Scenario: Nome inválido
- **WHEN** o nome está vazio, contém somente espaços ou excede 100 caracteres após trim
- **THEN** o salvamento é rejeitado com mensagem de validação e sem escrita

#### Scenario: Descrição longa
- **WHEN** a descrição excede 500 caracteres após trim
- **THEN** o salvamento é rejeitado com mensagem de validação e sem escrita

#### Scenario: Telefone formatado
- **WHEN** o usuário informa `+55 (11) 99999-9999`
- **THEN** o número é persistido como `5511999999999`, sem acrescentar código de país automaticamente

#### Scenario: Telefone inválido
- **WHEN** o WhatsApp não vazio contém letras, caracteres diferentes de dígitos, espaços, parênteses, hífens ou um sinal de mais inicial, ou não satisfaz o comprimento e primeiro dígito exigidos
- **THEN** o salvamento é rejeitado com mensagem de validação e sem escrita

#### Scenario: Remover dados opcionais
- **WHEN** o lojista salva descrição e WhatsApp vazios ou compostos somente por espaços
- **THEN** ambos são removidos dos dados persistidos, mantendo o nome válido

### Requirement: Feedback de salvamento
O formulário SHALL identificar campos com rótulos, explicar o formato internacional do WhatsApp, indicar salvamento em andamento, impedir envios duplicados enquanto pendente e apresentar sucesso ou erro. Falhas SHALL preservar os valores digitados para correção e nova tentativa.

#### Scenario: Salvamento bem-sucedido
- **WHEN** o servidor confirma a atualização
- **THEN** o formulário mostra confirmação e permite uma nova edição

#### Scenario: Erro ao salvar
- **WHEN** a validação ou persistência falha
- **THEN** o formulário mostra erro, mantém os valores digitados e permite tentar novamente

#### Scenario: Requisição em andamento
- **WHEN** uma operação de salvamento ainda não terminou
- **THEN** o formulário indica o estado pendente e desabilita novo envio

### Requirement: Identidade pública e compatibilidade
A vitrine SHALL exibir o nome atualizado e, quando preenchida, a descrição da loja identificada pelo domínio, inclusive sem produtos e sem sessão. Lojas existentes SHALL continuar acessíveis com descrição e WhatsApp ausentes. Salvar configurações SHALL atualizar o nome exibido no painel nas próximas renderizações.

#### Scenario: Descrição publicada
- **WHEN** um visitante sem sessão abre a vitrine após a alteração do nome e da descrição
- **THEN** vê a identidade atualizada da loja correspondente, mesmo quando o catálogo está vazio

#### Scenario: Loja sem descrição
- **WHEN** um visitante acessa uma loja cuja descrição está ausente ou foi removida
- **THEN** o nome é exibido sem texto de descrição vazio nem placeholder de descrição

#### Scenario: Nome no painel
- **WHEN** o lojista salva outro nome e o painel é renderizado novamente
- **THEN** o painel apresenta o nome atualizado nos locais que mostram o nome da loja
