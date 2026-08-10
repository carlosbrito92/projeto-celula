import type { Declaracao } from './types';

/**
 * Aviso NÃO-BLOQUEANTE de declaração fora de sequência (docs/spicy-spec.md
 * §4, linha "Declaração ilegal") — nunca impede a jogada, só sinaliza pra UI.
 *
 * Regra base (sem variante "Spice It Up!" ativa — variantes são Sprint B):
 * - Início de pilha (`anterior === null`): só 1, 2 ou 3 são declarações válidas.
 * - Meio de pilha: mesma cor do resto da pilha, valor >= anterior — exceto
 *   reset após 10 (anterior.valor === 10 permite voltar pra 1-3).
 *
 * Interpretação de "reset após 10" e "mesma cor durante a pilha" não vêm de
 * um texto literal da spec (que só cita a lógica de leve, §3.1) — assumido
 * a partir da distribuição de cartas documentada. Ajustar se Carlos jogar a
 * versão física e a regra real divergir.
 */
export function quebraSequencia(anterior: Declaracao | null, nova: Declaracao): boolean {
  if (anterior === null) {
    return nova.valor < 1 || nova.valor > 3;
  }
  if (nova.cor !== anterior.cor) {
    return true;
  }
  if (anterior.valor === 10) {
    return nova.valor < 1 || nova.valor > 3;
  }
  return nova.valor < anterior.valor;
}
