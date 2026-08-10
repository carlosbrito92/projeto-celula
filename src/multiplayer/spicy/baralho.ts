import { embaralhar, type Rng } from '../../utilitarios/shuffle';
import { CORES, type Carta } from './types';

/**
 * Cópias por valor, por cor — docs/spicy-spec.md §3.1. Soma 33 por cor,
 * 99 no total (não 100: a 100ª carta virou a 4ª Wild de cor, ver abaixo).
 */
const COPIAS_POR_VALOR: Record<number, number> = {
  1: 5,
  2: 5,
  3: 4,
  4: 4,
  5: 3,
  6: 3,
  7: 3,
  8: 2,
  9: 2,
  10: 2,
};

function criarCartasNumeradas(): Carta[] {
  const cartas: Carta[] = [];
  for (const cor of CORES) {
    for (const [valorStr, copias] of Object.entries(COPIAS_POR_VALOR)) {
      const valor = Number(valorStr);
      for (let i = 0; i < copias; i++) {
        cartas.push({ id: `numerada_${cor}_${valor}_${i}`, tipo: 'numerada', cor, valor });
      }
    }
  }
  return cartas;
}

function criarCartasSimples(tipo: Carta['tipo'], quantidade: number): Carta[] {
  return Array.from({ length: quantidade }, (_, i) => ({ id: `${tipo}_${i}`, tipo }));
}

/**
 * 110 cartas jogáveis: 99 numeradas + 4 Wild de cor (3 originais + a 4ª,
 * vinda do ajuste 99→100 de §3.1) + 3 Wild de número + 3 Troféu + 1 Fim do
 * Mundo. As 6 cartas "Spice It Up!" ficam de fora — são catálogo de escolha
 * de variante no setup (§4), não entram na pilha de compra.
 *
 * Retorna em ordem canônica (não embaralhada) — embaralhar é responsabilidade
 * de quem monta a partida, via `embaralhar()` de utilitarios/shuffle.ts
 * (já testado ali, não reimplementado aqui).
 */
export function criarBaralho(): Carta[] {
  return [
    ...criarCartasNumeradas(),
    ...criarCartasSimples('wild_cor', 4),
    ...criarCartasSimples('wild_numero', 3),
    ...criarCartasSimples('trofeu', 3),
    ...criarCartasSimples('fim_do_mundo', 1),
  ];
}

export function criarBaralhoEmbaralhado(rng: Rng = Math.random): Carta[] {
  return embaralhar(criarBaralho(), rng);
}
