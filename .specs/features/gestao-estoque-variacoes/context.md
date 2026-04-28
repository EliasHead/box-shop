# Contexto: Gestão de Estoque e Variações

Este documento captura as decisões de negócio (Gray Areas) acordadas com o usuário para a feature de Gestão de Estoque e Variações, antes do início da fase de Design.

## Decisões Acordadas

1. **Complexidade das Variações**:
   - **Decisão**: Múltiplos SKUs (Matriz de variações).
   - **Impacto**: O sistema deverá suportar a criação de diferentes eixos de variação (ex: "Cor" e "Tamanho") e cruzar essas opções para gerar SKUs únicos combinados (ex: "Camiseta - Azul - M", "Camiseta - Vermelha - G").

2. **Preços Diferenciados**:
   - **Decisão**: Sim, variações poderão ter preços diferentes.
   - **Impacto**: Cada `Variant` gerada deverá ter a opção de sobrescrever o preço base do produto raiz. O banco de dados suportará um campo `price` em nível de variação.

3. **Comportamento Out of Stock**:
   - **Decisão**: O produto/variação deve continuar visível, porém com aviso "Esgotado/Indisponível".
   - **Impacto**: Não precisaremos alterar o status do produto (ex: de `ACTIVE` para `DRAFT`) de forma automatizada quando o estoque chegar a zero. Apenas a interface da vitrine tratará a renderização de acordo com a quantidade de estoque (`stock <= 0` resultará no selo "Esgotado", desativando o botão de compra). No dashboard, também utilizaremos indicadores visuais para destacar estoque 0.
