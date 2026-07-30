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
