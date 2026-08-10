import type { Declaracao } from './types';

/**
 * Aviso NÃO-BLOQUEANTE de declaração fora de sequência (docs/spicy-spec.md
 * §4, linha "Declaração ilegal") — nunca impede a jogada, só sinaliza pra UI.
 *
 * Regra base (sem variante "Spice It Up!" ativa):
 * - Início de pilha (`anterior === null`): só 1, 2 ou 3 são declarações válidas.
 * - Meio de pilha: mesma cor do resto da pilha, valor >= anterior — exceto
 *   reset após 10 (anterior.valor === 10 permite voltar pra 1-3).
 *
 * Interpretação de "reset após 10" e "mesma cor durante a pilha" não vêm de
 * um texto literal da spec (que só cita a lógica de leve, §3.1) — assumido
 * a partir da distribuição de cartas documentada. Ajustar se Carlos jogar a
 * versão física e a regra real divergir.
 *
 * `varianteAtiva` (§5) modifica a exceção, quando ligada:
 * - `we_love_chili`: declarar 1-3 em Vermelho nunca quebra sequência, mesmo
 *   no meio da pilha e com cor estabelecida diferente — "a partir daí, a
 *   cor-alvo da pilha passa a ser Vermelho" já é consequência natural de
 *   `nova` virar o próximo `anterior` na chamada seguinte, não precisa de
 *   estado extra.
 * - `start_it_up`: reset pra 1-3 também vale depois de 8 ou 9 (não só 10),
 *   mantendo a mesma cor (diferente do Chili, que também troca a cor).
 */
export function quebraSequencia(
  anterior: Declaracao | null,
  nova: Declaracao,
  varianteAtiva?: string | null,
): boolean {
  if (varianteAtiva === 'we_love_chili' && nova.cor === 'vermelho' && nova.valor >= 1 && nova.valor <= 3) {
    return false;
  }

  if (anterior === null) {
    return nova.valor < 1 || nova.valor > 3;
  }
  if (nova.cor !== anterior.cor) {
    return true;
  }
  const valorPermiteReset =
    anterior.valor === 10 || (varianteAtiva === 'start_it_up' && anterior.valor >= 8);
  if (valorPermiteReset) {
    return nova.valor < 1 || nova.valor > 3;
  }
  return nova.valor < anterior.valor;
}
