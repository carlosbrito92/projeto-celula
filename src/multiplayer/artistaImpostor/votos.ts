export interface ResultadoVotacao {
  /** id do jogador mais votado, ou `null` se não houver maioria única (empate/sem votos). */
  vencedorId: string | null;
  contagemPorId: Record<string, number>;
  impostorEncontrado: boolean;
}

/**
 * Apura a votação (Artista Impostor, V2): cada entrada de `votos` é o id do
 * jogador escolhido por um votante (`undefined` = não votou, votação é
 * opcional). "Maioria" exige um único mais-votado — empate no topo não
 * conta como decisão do grupo (`vencedorId: null`), mesma regra do jogo
 * físico original.
 */
export function apurarResultado(
  votos: Array<string | undefined>,
  impostorId: string,
): ResultadoVotacao {
  const contagemPorId: Record<string, number> = {};
  for (const voto of votos) {
    if (!voto) continue;
    contagemPorId[voto] = (contagemPorId[voto] ?? 0) + 1;
  }

  let vencedorId: string | null = null;
  let maiorContagem = 0;
  let empatado = false;
  for (const [id, contagem] of Object.entries(contagemPorId)) {
    if (contagem > maiorContagem) {
      maiorContagem = contagem;
      vencedorId = id;
      empatado = false;
    } else if (contagem === maiorContagem) {
      empatado = true;
    }
  }
  if (empatado || maiorContagem === 0) vencedorId = null;

  return { vencedorId, contagemPorId, impostorEncontrado: vencedorId === impostorId };
}
