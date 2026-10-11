# product-pricing Specification

## Purpose

Permitir que lojistas informem e editem o preço base de produtos com valores decimais, distinguindo um campo vazio de um preço zero e impedindo o envio de valores inválidos.

## Requirements

### Requirement: Edição do preço base
O formulário SHALL permitir apagar e redigitar o preço base sem forçar zero enquanto o usuário edita, preservando os dígitos decimais informados em valores válidos.

#### Scenario: Apagar para redigitar
- **WHEN** o lojista apaga o conteúdo do preço base
- **THEN** o campo permanece vazio e permite digitar um novo valor
- **AND** nenhum produto é salvo automaticamente

#### Scenario: Reabrir um preço existente
- **WHEN** o lojista abre a edição de um produto com preço 19.90
- **THEN** o campo apresenta um valor equivalente a 19.90, sem truncar a parte decimal
- **AND** salvar sem alterar o preço preserva seu valor numérico

### Requirement: Envio de preço válido
O formulário SHALL enviar o preço base como número finito e não negativo, preservando seu valor decimal na criação e edição de produtos. Zero SHALL ser aceito. Os valores aceitos pelo campo numérico existente, com passo 0.01, SHALL continuar aceitos.

#### Scenario: Criar com preço decimal
- **WHEN** o lojista informa 19.90 e salva um novo produto com os demais campos válidos
- **THEN** a operação de criação recebe o preço numérico 19.9

#### Scenario: Editar com preço decimal
- **WHEN** o lojista altera o preço de um produto para 12.35 e salva
- **THEN** a operação de atualização recebe o preço numérico 12.35

#### Scenario: Preço zero
- **WHEN** o lojista informa 0 e salva com os demais campos válidos
- **THEN** o formulário aceita e envia o preço numérico 0

### Requirement: Rejeição de preço inválido
O formulário SHALL bloquear o envio de preço vazio, composto somente por espaços, não numérico, não finito ou negativo e apresentar feedback de validação. Campo vazio SHALL NOT ser interpretado como zero.

#### Scenario: Preço obrigatório
- **WHEN** o lojista tenta salvar com preço vazio ou composto somente por espaços
- **THEN** uma indicação de validação é apresentada
- **AND** nenhuma operação de criação ou atualização é chamada

#### Scenario: Preço inválido
- **WHEN** uma tentativa de envio contém preço não numérico, infinito ou negativo
- **THEN** o envio é bloqueado com feedback de validação
- **AND** nenhuma operação de criação ou atualização é chamada

### Requirement: Preservação do controle de acesso
As operações de preço SHALL manter a exigência de sessão com loja vinculada e o isolamento entre lojas já aplicado ao cadastro de produtos.

#### Scenario: Operação sem sessão
- **WHEN** uma operação de criação ou atualização é solicitada sem sessão com loja vinculada
- **THEN** o servidor rejeita a operação sem persistir alterações

#### Scenario: Edição de outra loja
- **WHEN** um lojista solicita alteração do preço de um produto pertencente a outra loja
- **THEN** o servidor rejeita a operação sem alterar o produto
