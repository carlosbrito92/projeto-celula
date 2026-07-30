import { embaralhar, type Rng } from '../shuffle';

/** Embaralha `valores` e atribui 1:1 a cada participante, na ordem dada. */
export function atribuir(
  participantes: string[],
  valores: string[],
  rng: Rng = Math.random,
): Record<string, string> {
  const valoresEmbaralhados = embaralhar(valores, rng);
  return Object.fromEntries(participantes.map((p, i) => [p, valoresEmbaralhados[i] ?? '']));
}
