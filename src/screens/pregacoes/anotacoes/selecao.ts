// Captura de seleção de texto livre (Range/Selection nativa do browser) e
// conversão pra offset em texto renderizado — técnica padrão de editor
// contenteditable (range do início do container até o ponto da seleção,
// `toString().length` dá o offset em caracteres), funciona mesmo com o texto
// quebrado em múltiplos nós (negrito **assim**, ver Keyword.tsx) porque soma
// o conteúdo de todos os nós de texto no caminho, não depende da estrutura.

export interface SelecaoCapturada {
  offsetInicio: number;
  offsetFim: number;
  textoSelecionado: string;
}

function offsetNoContainer(container: Node, node: Node, offset: number): number {
  const pre = document.createRange();
  pre.selectNodeContents(container);
  pre.setEnd(node, offset);
  return pre.toString().length;
}

/**
 * `null` quando a seleção está vazia/colapsada ou escapa do container (ex:
 * usuário arrastou a seleção pra outra unidade de texto) — fora do escopo de
 * V1, ver spec de anotações pessoais.
 */
export function capturarSelecao(container: Node, range: Range): SelecaoCapturada | null {
  if (range.collapsed) return null;
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }

  const textoSelecionado = range.toString();
  if (!textoSelecionado) return null;

  const offsetInicio = offsetNoContainer(container, range.startContainer, range.startOffset);
  const offsetFim = offsetNoContainer(container, range.endContainer, range.endOffset);

  return { offsetInicio, offsetFim, textoSelecionado };
}
