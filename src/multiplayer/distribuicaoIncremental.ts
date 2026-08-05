import { embaralhar, type Rng } from '../utilitarios/shuffle';

export interface DistribuidorIncremental<T> {
  /** Entrega o próximo valor não distribuído, ou `undefined` se o pool já se esgotou. */
  proximo(): T | undefined;
  /** Quantos valores ainda não foram entregues. */
  restantes(): number;
}

/**
 * Embaralha `valores` uma vez e entrega um por chamada de `proximo()`, na ordem
 * embaralhada — pull-based, para distribuir por `onPlayerJoin` (V2) em vez de
 * de uma vez com lista de participantes já fechada (`atribuir()`, V1).
 */
export function criarDistribuidorIncremental<T>(
  valores: T[],
  rng: Rng = Math.random,
): DistribuidorIncremental<T> {
  const fila = embaralhar(valores, rng);
  let indice = 0;

  return {
    proximo(): T | undefined {
      if (indice >= fila.length) return undefined;
      return fila[indice++];
    },
    restantes(): number {
      return fila.length - indice;
    },
  };
}
