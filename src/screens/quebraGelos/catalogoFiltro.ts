import type { QuebraGeloJogoConteudo, QuebraGeloRow } from '../../content/types';

export type FiltroTipo = 'todos' | 'leitura' | 'sorteio';

/** Pills do catálogo de quebra-gelos: Todos / Só leitura / Com sorteio. */
export function filtrarPorTipo(jogos: QuebraGeloRow[], filtro: FiltroTipo): QuebraGeloRow[] {
  if (filtro === 'todos') return jogos;
  if (filtro === 'leitura') return jogos.filter((j) => j.tipo === 'instrucional');
  return jogos.filter((j) => j.tipo === 'utilitario' || j.tipo === 'instrucional_utilitario');
}

/**
 * Candidatos do botão "Sortear quebra-gelo": só dinâmicas de grupo. Ficam de
 * fora os utilitários puros e os jogos (os que têm versão "Jogar pelo
 * Celular"), que são uma escolha de noite inteira, não um quebra-gelo rápido.
 */
export function elegiveisAleatorio(jogos: QuebraGeloRow[]): QuebraGeloRow[] {
  return jogos.filter(
    (j) =>
      j.tipo !== 'utilitario' && !(j.conteudo as QuebraGeloJogoConteudo).jogar_pelo_celular,
  );
}

export function sortearQuebraGelo(
  jogos: QuebraGeloRow[],
  aleatorio: () => number = Math.random,
): QuebraGeloRow | null {
  const candidatos = elegiveisAleatorio(jogos);
  if (candidatos.length === 0) return null;
  return candidatos[Math.min(candidatos.length - 1, Math.floor(aleatorio() * candidatos.length))];
}
