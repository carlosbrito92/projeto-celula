import type { Carta, Declaracao, Traco } from './types';

const PAR_TURN_IT_UP = [6, 9];

/**
 * Verifica se a declaração bate com a carta real, no traço pedido.
 *
 * Wilds são assimétricas por design (docs/spicy-spec.md §3.2, texto literal
 * da spec — a nomenclatura é contraintuitiva mas intencional, confirmada
 * duas vezes no documento):
 * - `wild_cor` cobre (sempre acerta) o traço 'valor', e sempre falha em 'cor'.
 * - `wild_numero` cobre (sempre acerta) o traço 'cor', e sempre falha em 'valor'.
 *
 * `trofeu`/`fim_do_mundo` não são cartas declaradas em blefe normal — não
 * têm traço cor/valor, então nunca "acertam" um desafio (fora do escopo do
 * motor de declaração/desafio da Sprint A; ver fimDePartida.ts para o papel
 * real dessas duas).
 *
 * `varianteAtiva === 'turn_it_up'` (§5): 6 e 9 são equivalentes no traço
 * 'valor' — declarado 6 ou 9, carta real 6 ou 9 (qualquer combinação),
 * declarante vence esse traço.
 */
export function verificarTraco(
  cartaReal: Carta,
  declaracao: Declaracao,
  traco: Traco,
  varianteAtiva?: string | null,
): boolean {
  if (traco === 'ambos') {
    return (
      verificarTraco(cartaReal, declaracao, 'cor', varianteAtiva) &&
      verificarTraco(cartaReal, declaracao, 'valor', varianteAtiva)
    );
  }

  if (
    traco === 'valor' &&
    varianteAtiva === 'turn_it_up' &&
    cartaReal.tipo === 'numerada' &&
    PAR_TURN_IT_UP.includes(declaracao.valor) &&
    PAR_TURN_IT_UP.includes(cartaReal.valor!)
  ) {
    return true;
  }

  switch (cartaReal.tipo) {
    case 'numerada':
      return traco === 'cor' ? declaracao.cor === cartaReal.cor : declaracao.valor === cartaReal.valor;
    case 'wild_cor':
      return traco === 'valor';
    case 'wild_numero':
      return traco === 'cor';
    case 'trofeu':
    case 'fim_do_mundo':
      return false;
  }
}

/**
 * `true` = declarante estava certo, vence o desafio (fica com a pilha).
 * `false` = desafiante tinha razão, vence o desafio.
 *
 * `traco === 'ambos'` só é usado no modo especial do Copy Cat (§5) — nesse
 * caso os dois traços (cor E valor) precisam bater para o declarante vencer.
 */
export function resolverDesafio(
  cartaReal: Carta,
  declaracao: Declaracao,
  traco: Traco,
  varianteAtiva?: string | null,
): boolean {
  return verificarTraco(cartaReal, declaracao, traco, varianteAtiva);
}
