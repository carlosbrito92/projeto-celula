import type { Rng } from '../../utilitarios/shuffle';

/**
 * Algoritmo de shuffle visual (docs/spicy-pesquisa-visual-animacao.md §2.4,
 * artigo de Juha Lindstedt) — puro, sem React/animação aqui, pra ser
 * testável isolado. `ShuffleAnimation.tsx` usa isso pra coreografar a
 * coreografia decorativa; o embaralhamento REAL do baralho continua sendo
 * `embaralhar()`/`criarBaralhoEmbaralhado()` (Fisher-Yates), que este
 * módulo não substitui.
 */

/** Sorteia cada item pra pilha esquerda ou direita — fase 1 (dividir). */
export function dividirEmDuasPilhas<T>(itens: T[], rng: Rng = Math.random): { esquerda: T[]; direita: T[] } {
  const esquerda: T[] = [];
  const direita: T[] = [];
  for (const item of itens) {
    (rng() < 0.5 ? esquerda : direita).push(item);
  }
  return { esquerda, direita };
}

/**
 * Reconstitui uma sequência puxando card a card de uma das duas pilhas,
 * sorteado a cada passo — fase 2 (intercalar), imita riffle shuffle físico.
 * Nunca puxa de uma pilha vazia.
 */
export function intercalarRiffle<T>(esquerda: T[], direita: T[], rng: Rng = Math.random): T[] {
  const filaEsquerda = [...esquerda];
  const filaDireita = [...direita];
  const resultado: T[] = [];
  while (filaEsquerda.length > 0 || filaDireita.length > 0) {
    const puxarDaEsquerda = filaDireita.length === 0 || (filaEsquerda.length > 0 && rng() < 0.5);
    resultado.push((puxarDaEsquerda ? filaEsquerda : filaDireita).shift() as T);
  }
  return resultado;
}
