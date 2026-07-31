export type Rng = () => number;

/** Fisher-Yates. rng injetável para testes determinísticos — default Math.random. */
export function embaralhar<T>(itens: T[], rng: Rng = Math.random): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function escolherUm<T>(itens: T[], rng: Rng = Math.random): T {
  const indice = Math.floor(rng() * itens.length);
  return itens[indice];
}

/**
 * Embaralha `valores` e atribui 1:1 a cada participante, na ordem dada.
 * Primitivo compartilhado por sorteio de atribuição escondida (valores livres)
 * e sorteio de papel especial (fichas geradas a partir de papéis múltiplos,
 * ver `sorteioPapel/papeis.ts`) — a distribuição é a mesma nos dois casos.
 */
export function atribuir(
  participantes: string[],
  valores: string[],
  rng: Rng = Math.random,
): Record<string, string> {
  const valoresEmbaralhados = embaralhar(valores, rng);
  return Object.fromEntries(participantes.map((p, i) => [p, valoresEmbaralhados[i] ?? '']));
}
