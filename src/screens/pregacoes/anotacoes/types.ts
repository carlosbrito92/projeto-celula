// Tipos de anotação PESSOAL (destaque + nota do leitor, 100% local) — não
// confundir com `Anotacao`/`AnnotationBox` em src/content/types.ts, que é
// conteúdo EDITORIAL (autor da pregação, vem do JSON, igual pra todo mundo).

/**
 * Identifica a unidade de texto anotável dentro de `secao.corpo[]]`: índice
 * do bloco (`"2"`) ou, pra item de lista, `"${blocoIndex}:${itemIndex}"`
 * (ex: `"3:1"`). Só blocos com texto corrido (paragrafo/versiculo/callout/
 * frase_chave/itens de lista) são unidades válidas — ver BlockRenderer.
 */
export type UnidadeId = string;

export interface AnotacaoPessoal {
  id: string;
  secaoId: string;
  /** Ausente = nota "solta" da seção, sem destaque de texto associado. */
  unidade?: UnidadeId;
  offsetInicio?: number;
  offsetFim?: number;
  /** Snapshot do texto grifado no momento da criação — usado por resolverDestaque para resistir a recalibração de conteúdo. */
  textoSelecionado?: string;
  nota?: string;
  criadoEm: string;
}
