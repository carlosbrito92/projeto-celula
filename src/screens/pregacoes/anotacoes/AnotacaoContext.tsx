import { createContext, useContext } from 'react';
import type { DestaqueSpan } from '../../../content/segmentos';

export interface SelecaoNova {
  secaoId: string;
  unidade: string;
  offsetInicio: number;
  offsetFim: number;
  textoSelecionado: string;
  rect: DOMRect;
}

export interface AnotacaoContextValue {
  modoAnotacao: boolean;
  destaquesPorUnidade: (secaoId: string, unidade: string) => DestaqueSpan[];
  iniciarSelecao: (selecao: SelecaoNova) => void;
  abrirDestaque: (id: string, rect: DOMRect) => void;
}

// `null` = árvore renderizada sem AnotacaoProvider (fora da tela de Leitura,
// ex: nenhum consumidor hoje) — UnidadeAnotavel degrada pra renderização
// estática sem interatividade nesse caso, mesmo padrão de "nome desconhecido
// não quebra" já usado em Icon/ComponenteTemaRenderer.
export const AnotacaoContext = createContext<AnotacaoContextValue | null>(null);

export function useAnotacaoContext(): AnotacaoContextValue | null {
  return useContext(AnotacaoContext);
}
