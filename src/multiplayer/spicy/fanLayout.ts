/**
 * Posicionamento da mão em leque (docs/Tela de Jogo Spicy.dc.html §01/02) —
 * puro, sem CSS/React aqui, pra ser testável isolado. Cartas do meio ficam
 * retas e "altas"; cartas nas pontas giram mais e descem um pouco, imitando
 * o arco de um baralho seguro na mão em leque.
 */

export interface PosicaoFan {
  rotacaoDeg: number;
  deslocamentoY: number;
}

const PASSO_ANGULO = 6;
const FATOR_ARCO = 2;

/** `indice`/`total` 0-based — carta central (ou par central, se `total` par) fica em 0°/0px. */
export function calcularPosicaoFan(indice: number, total: number): PosicaoFan {
  if (total <= 1) return { rotacaoDeg: 0, deslocamentoY: 0 };
  const meio = (total - 1) / 2;
  const offset = indice - meio;
  return {
    rotacaoDeg: Number((offset * PASSO_ANGULO).toFixed(2)),
    deslocamentoY: Math.round(offset * offset * FATOR_ARCO),
  };
}
