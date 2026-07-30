import { escolherUm, type Rng } from '../shuffle';

export const SEM_PAPEL_ESPECIAL = 'Sem papel especial';

/** Escolhe 1 participante entre N para o papel nomeado; os demais recebem um valor neutro. */
export function sortearPapel(
  participantes: string[],
  papelNome: string,
  rng: Rng = Math.random,
): Record<string, string> {
  const vencedor = escolherUm(participantes, rng);
  return Object.fromEntries(
    participantes.map((p) => [p, p === vencedor ? papelNome : SEM_PAPEL_ESPECIAL]),
  );
}
