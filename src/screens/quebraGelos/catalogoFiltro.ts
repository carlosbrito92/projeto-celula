import type { QuebraGeloRow } from '../../content/types';

export type FiltroTipo = 'todos' | 'leitura' | 'sorteio';

/** Pills do catálogo de quebra-gelos: Todos / Só leitura / Com sorteio. */
export function filtrarPorTipo(jogos: QuebraGeloRow[], filtro: FiltroTipo): QuebraGeloRow[] {
  if (filtro === 'todos') return jogos;
  if (filtro === 'leitura') return jogos.filter((j) => j.tipo === 'instrucional');
  return jogos.filter((j) => j.tipo === 'utilitario' || j.tipo === 'instrucional_utilitario');
}
