import { resolveTema } from '../themes/registry';
import type { PregacaoRow } from './types';

// Organização da página inicial (Biblioteca): destaque, séries agrupadas com os
// capítulos em ordem, e o resto ("Outras mensagens"). Funções puras; a lista
// chega já ordenada por data desc (usePregacoes/ordenarPregacoes).

export const SERIE_AVULSA = 'Avulsa';

export interface Serie {
  nome: string;
  /** Cor de acento do tema da série: só faixa e selo, nunca a tipografia. */
  cor: string;
  /** Capítulos em ordem de leitura (data asc; sem data por último). */
  itens: PregacaoRow[];
}

export interface Inicio {
  destaque: PregacaoRow | null;
  series: Serie[];
  outras: PregacaoRow[];
}

export function corDaPregacao(p: PregacaoRow): string {
  return resolveTema(p.serie, p.conteudo?.metadados?.tema_override).cores.accent1;
}

function emOrdemDeLeitura(itens: PregacaoRow[]): PregacaoRow[] {
  return [...itens].sort((a, b) => {
    if (a.data && b.data) return a.data.localeCompare(b.data);
    if (a.data) return -1;
    if (b.data) return 1;
    return a.created_at.localeCompare(b.created_at);
  });
}

/** Séries na ordem da mensagem mais recente de cada uma; "Avulsa" e sem série ficam de fora. */
export function agruparPorSerie(pregacoes: PregacaoRow[]): Serie[] {
  const grupos = new Map<string, PregacaoRow[]>();
  for (const p of pregacoes) {
    if (!p.serie || p.serie === SERIE_AVULSA) continue;
    grupos.set(p.serie, [...(grupos.get(p.serie) ?? []), p]);
  }
  return [...grupos.entries()].map(([nome, itens]) => ({ nome, cor: corDaPregacao(itens[0]), itens: emOrdemDeLeitura(itens) }));
}

/** Séries com 2+ mensagens viram faixa; o resto (avulsas e séries de uma mensagem só) vai para "Outras". */
export function montarInicio(pregacoes: PregacaoRow[]): Inicio {
  const [destaque = null, ...resto] = pregacoes;
  const series = agruparPorSerie(pregacoes).filter((s) => s.itens.length >= 2);
  const emFaixa = new Set(series.flatMap((s) => s.itens.map((p) => p.id)));
  return { destaque, series, outras: resto.filter((p) => !emFaixa.has(p.id)) };
}

/** Nomes para os chips de filtro: séries por recência, "Avulsa" por último se existir. */
export function seriesDoFiltro(pregacoes: PregacaoRow[]): string[] {
  const nomes = agruparPorSerie(pregacoes).map((s) => s.nome);
  return pregacoes.some((p) => !p.serie || p.serie === SERIE_AVULSA) ? [...nomes, SERIE_AVULSA] : nomes;
}

/** Mensagens de uma série em ordem de leitura ("Avulsa" inclui as sem série). */
export function daSerie(pregacoes: PregacaoRow[], serie: string): PregacaoRow[] {
  if (serie === SERIE_AVULSA) return pregacoes.filter((p) => !p.serie || p.serie === SERIE_AVULSA);
  return emOrdemDeLeitura(pregacoes.filter((p) => p.serie === serie));
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-11-08" ou "2026-11-08T00:00:00.000Z" -> "8 nov 2026"; sem data válida, o texto de reserva. */
export function dataCurta(iso: string | null | undefined, reserva?: string | null): string | null {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(iso) : null;
  if (!m) return reserva?.trim() || null;
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}`;
}

/** "Pastor Pedro Estrella" -> "Pr. Pedro Estrella"; "Pastora Anaily" -> "Pra. Anaily". */
export function pregadorCurto(nome: string | null | undefined): string | null {
  if (!nome?.trim()) return null;
  return nome.trim().replace(/^Pastora\s+/i, 'Pra. ').replace(/^Pastor\s+/i, 'Pr. ');
}

/** "Capítulo 5 — Encerramento" -> "Cap. 5 · Encerramento". Igual ao tema (dado repetido) ou vazio: null. */
export function capituloCurto(p: Pick<PregacaoRow, 'capitulo' | 'tema'>): string | null {
  const c = p.capitulo?.trim();
  if (!c || c === p.tema) return null;
  return c.replace(/^Capítulo\s+/i, 'Cap. ').replace(/\s+[—–-]\s+/g, ' · ');
}
