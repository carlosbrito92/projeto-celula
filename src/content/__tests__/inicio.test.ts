import { describe, expect, it } from 'vitest';
import { capituloCurto, daSerie, dataCurta, montarInicio, pregadorCurto, seriesDoFiltro } from '../inicio';
import { ordenarPregacoes } from '../usePregacoes';
import type { PregacaoRow } from '../types';

const p = (id: string, serie: string | null, data: string | null, extra: Partial<PregacaoRow> = {}) =>
  ({ id, serie, data, tema: id, capitulo: null, pregador: null, created_at: '2026-01-01', conteudo: { metadados: {} }, ...extra }) as unknown as PregacaoRow;

// Como chega da API: timestamp na coluna date, ordenado por data desc.
const lista = ordenarPregacoes([
  p('maranata-1', 'Maranata', '2026-11-08T00:00:00.000Z'),
  p('salvo-2', 'Uma Vez Salvo', '2026-08-30T00:00:00.000Z'),
  p('salvo-1', 'Uma Vez Salvo', '2026-08-23T00:00:00.000Z'),
  p('escola', 'Escola da Fé', '2026-10-25T00:00:00.000Z'),
  p('toxica-1', 'Religião Tóxica', '2026-07-19T00:00:00.000Z'),
  p('toxica-2', 'Religião Tóxica', '2026-07-26T00:00:00.000Z'),
  p('avulsa-sem-data', 'Avulsa', null),
  p('avulsa', 'Avulsa', '2026-04-21T00:00:00.000Z'),
]);

describe('montarInicio', () => {
  const inicio = montarInicio(lista);

  it('destaque é a mais recente', () => {
    expect(inicio.destaque?.id).toBe('maranata-1');
  });

  it('séries com 2+ mensagens viram faixa, pela mais recente, com capítulos em ordem de leitura', () => {
    expect(inicio.series.map((s) => s.nome)).toEqual(['Uma Vez Salvo', 'Religião Tóxica']);
    expect(inicio.series[0].itens.map((x) => x.id)).toEqual(['salvo-1', 'salvo-2']);
    expect(inicio.series[1].itens.map((x) => x.id)).toEqual(['toxica-1', 'toxica-2']);
  });

  it('o resto vai para "Outras", sem repetir o destaque', () => {
    expect(inicio.outras.map((x) => x.id)).toEqual(['escola', 'avulsa', 'avulsa-sem-data']);
  });
});

describe('filtro por série', () => {
  it('chips: séries por recência, Avulsa por último', () => {
    expect(seriesDoFiltro(lista)).toEqual(['Maranata', 'Escola da Fé', 'Uma Vez Salvo', 'Religião Tóxica', 'Avulsa']);
  });

  it('daSerie: em ordem de leitura; Avulsa inclui sem série', () => {
    expect(daSerie(lista, 'Religião Tóxica').map((x) => x.id)).toEqual(['toxica-1', 'toxica-2']);
    expect(daSerie([...lista, p('sem-serie', null, null)], 'Avulsa').map((x) => x.id)).toEqual(['avulsa', 'avulsa-sem-data', 'sem-serie']);
  });
});

describe('formatos curtos', () => {
  it('dataCurta aceita data e timestamp; sem data, usa a reserva', () => {
    expect(dataCurta('2026-11-08')).toBe('8 nov 2026');
    expect(dataCurta('2026-09-06T00:00:00.000Z')).toBe('6 set 2026');
    expect(dataCurta(null, '27-28 de maio de 2026')).toBe('27-28 de maio de 2026');
    expect(dataCurta(null, '')).toBeNull();
  });

  it('pregadorCurto', () => {
    expect(pregadorCurto('Pastor Pedro Estrella')).toBe('Pr. Pedro Estrella');
    expect(pregadorCurto('Pastora Anaily')).toBe('Pra. Anaily');
    expect(pregadorCurto('')).toBeNull();
  });

  it('capituloCurto; capítulo igual ao tema não aparece', () => {
    expect(capituloCurto({ capitulo: 'Capítulo 5 — Encerramento', tema: 'x' })).toBe('Cap. 5 · Encerramento');
    expect(capituloCurto({ capitulo: 'Capítulo 4 · Penúltimo Episódio', tema: 'x' })).toBe('Cap. 4 · Penúltimo Episódio');
    expect(capituloCurto({ capitulo: 'A Boca', tema: 'A Boca' })).toBeNull();
    expect(capituloCurto({ capitulo: null, tema: 'x' })).toBeNull();
  });
});
