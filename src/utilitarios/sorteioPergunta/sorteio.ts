import type { Rng } from '../shuffle';

/** Perguntas ainda não sorteadas (comparação por texto, robusta a reordenação do conteúdo). */
export function restantes(perguntas: string[], usadas: string[]): string[] {
  const vistas = new Set(usadas);
  return perguntas.filter((p) => !vistas.has(p));
}

/** Sorteia uma pergunta que não esteja em `usadas`; null quando todas já saíram. */
export function sortearPergunta(
  perguntas: string[],
  usadas: string[],
  rng: Rng = Math.random,
): string | null {
  const candidatas = restantes(perguntas, usadas);
  if (candidatas.length === 0) return null;
  return candidatas[Math.min(candidatas.length - 1, Math.floor(rng() * candidatas.length))];
}
