# Design

## Context

Ver `proposal.md` para motivação. `ProductsClient` usa `ProductInput`, inferido da saída do schema de validação, para seu estado. Essa saída exige `price: number`, mas o evento do campo entrega texto. A conversão em `handleSave` ocorre depois da atribuição que falha na compilação. Criação e atualização recebem o mesmo payload e validam no servidor.

O comportamento de campo vazio exige uma decisão de modelagem do estado antes de implementar; por isso este design é incluído. Os testes de ações existentes usam preços numéricos e não cobrem a interação do formulário.

## Goals / Non-Goals

**Goals:** Separar representação editável e contrato persistido, mantendo o restante do formulário compatível com `ProductInput` e cobrindo o caminho real de envio.

**Non-Goals:** Alterar a representação monetária no banco, introduzir máscara de moeda, mudar a validação de variantes ou ampliar a tipagem de todo o componente. O escopo funcional está em `proposal.md` e `specs/product-pricing/spec.md`.

## Decisions

1. Usar um tipo local equivalente a `Omit<ProductInput, 'price'> & { price: string }` para o formulário. Inicializar o preço como `"0"`, preservando o padrão atual de criação; converter `product.price` para texto ao editar. Apenas o preço base muda de representação.
   - Alternativa rejeitada: converter em cada `onChange`, pois campo vazio e estados intermediários precisam continuar editáveis.
   - Alternativa rejeitada: ampliar `ProductInput` para string ou número, pois enfraquece o contrato das ações para acomodar um detalhe da interface.
2. No envio, verificar primeiro `price.trim()` vazio; depois converter com `Number` e exigir `Number.isFinite` e valor maior ou igual a zero. Somente então construir o payload numérico tipado e chamar a ação. Reutilizar a área de erro existente e manter o modal aberto quando a validação falhar, com loading liberado.
   - `Number('')` não serve como validação porque produz zero. `parseInt` perderia casas decimais; `parseFloat` pode aceitar parcialmente texto inválido.
   - Manter `type="number"`, `required`, `min="0"` e `step="0.01"` como assistência de validação nativa. A verificação no envio também protege caminhos que não acionam essa assistência.
3. Preservar o contrato e a validação do servidor. Não há mudança de schema, migração, dependência ou transformação dos registros existentes. Preços de variantes permanecem com o contrato atual.
4. Testar a interação de `ProductsClient` com ações mockadas, verificando valores realmente enviados e ausência de chamadas para entrada inválida. Usar as primitivas reais quando viável; evitar testes que apenas reproduzam a expressão de conversão. Valores impossíveis de digitar em `input[type=number]` podem ser cobertos por uma função pura de validação se sua extração for necessária, sem criar um módulo genérico sem uso.

## Risks / Trade-offs

- Campo numérico pode normalizar separadores conforme navegador/idioma → preservar o controle existente; máscara brasileira e suporte explícito a vírgula ficam fora do escopo.
- `Float` não garante precisão decimal arbitrária → preservar valores usuais como 19.90 e 12.35 sem truncamento ou arredondamento adicional; não prometer precisão financeira nova nem preservação visual de zeros finais após persistir.
- Tipagem mais correta pode revelar outros erros do build → reportá-los com localização; não tratar remoção deste primeiro bloqueio como prova de build completo aprovado.
- Suite/lint têm falhas preexistentes → executar as verificações e distinguir falhas relacionadas de problemas fora do escopo.

## Migration Plan

Aplicar como alteração de interface e testes, sem migration de banco. Validar criação e edição no ambiente local. Reverter o commit de implementação se necessário; nenhum registro exige reversão ou conversão de dados.
