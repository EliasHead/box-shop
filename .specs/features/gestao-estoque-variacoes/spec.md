# Feature: Gestão de Estoque e Variações

## Objetivo
Permitir que lojistas controlem o inventário de seus produtos, suportando produtos simples e produtos com variações (ex: Tamanho, Cor). A gestão deve garantir precisão nas quantidades e refletir o status de disponibilidade do produto.

## Requisitos Funcionais (Traceable IDs)
- **[INV-01] Controle de Produto Simples**: Produtos sem variação devem ter um campo direto para controle de `stock` (quantidade em estoque).
- **[INV-02] Criação de Tipos de Variação**: Lojistas podem definir atributos de variação para um produto (ex: "Tamanho", "Cor").
- **[INV-03] Geração de SKUs Combinados**: O sistema deve permitir gerar combinações de variações (ex: "Camiseta - Azul - M"), cada uma possuindo seu próprio SKU, Preço (opcionalmente diferenciado) e Quantidade de Estoque.
- **[INV-04] Atualização de Estoque**: Lojistas podem incrementar ou decrementar o estoque manualmente no painel administrativo.
- **[INV-05] Indicadores de Disponibilidade**: Produtos e Variações com estoque zerado devem ser visualmente destacados no painel administrativo.

## Requisitos Não Funcionais
- **[NFR-INV-01] Consistência de Dados**: O estoque não pode ser negativo. Subtrações que levariam o estoque a menos que zero devem ser validadas e bloqueadas no backend.
- **[NFR-INV-02] Mutação via Server Actions**: Todas as operações (Create/Update) devem utilizar Next.js Server Actions e revalidar o path (Cache Revalidation).
- **[NFR-INV-03] UI Patterns**: Reutilizar o padrão visual do Dashboard (Data Tables e formulários modais/cards), utilizando componentes do Shadcn.
- **[NFR-INV-04] Isolamento Multi-Tenant**: Categorias e Produtos acessados no painel devem ser estritamente limitados ao `tenantId` da sessão atual.

## Áreas para Discussão (Gray Areas - Pendente)
Antes de iniciarmos o **Design** e a modelagem do banco de dados, precisamos definir algumas regras de negócio cruciais:

1. **Complexidade das Variações**: Queremos suportar combinações matriciais complexas (Cor x Tamanho gerando múltiplos SKUs automaticamente) ou uma abordagem mais simples inicial (uma lista de opções de variação)?
2. **Preços Diferenciados**: As variações poderão ter preços diferentes do produto raiz (ex: "Tamanho GG custa mais caro")?
3. **Comportamento Out of Stock**: O que acontece quando o estoque de um produto chega a 0? Ele fica invisível ou visível mas "Indisponível"? (Isso afeta como modelamos o status).
