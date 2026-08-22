import { describe, expect, it } from 'vitest';
import { limparNegrito, mesclarSegmentos } from '../segmentos';

describe('limparNegrito', () => {
  it('remove marcadores e mantém spans em coordenadas do texto limpo', () => {
    const { textoLimpo, spans } = limparNegrito('A **graça** não é o que você pensa.');
    expect(textoLimpo).toBe('A graça não é o que você pensa.');
    expect(spans).toEqual([{ inicio: 2, fim: 7 }]);
  });

  it('texto sem negrito retorna igual, sem spans', () => {
    const { textoLimpo, spans } = limparNegrito('Sem marcação nenhuma aqui.');
    expect(textoLimpo).toBe('Sem marcação nenhuma aqui.');
    expect(spans).toEqual([]);
  });

  it('múltiplos trechos em negrito', () => {
    const { textoLimpo, spans } = limparNegrito('**Um** e **dois**.');
    expect(textoLimpo).toBe('Um e dois.');
    expect(spans).toEqual([
      { inicio: 0, fim: 2 },
      { inicio: 5, fim: 9 },
    ]);
  });
});

describe('mesclarSegmentos', () => {
  it('sem destaques, comporta-se como negrito puro', () => {
    const segmentos = mesclarSegmentos('A **graça** é livre.');
    expect(segmentos.map((s) => [s.texto, s.negrito, s.destaque])).toEqual([
      ['A ', false, null],
      ['graça', true, null],
      [' é livre.', false, null],
    ]);
  });

  it('destaque totalmente fora do negrito', () => {
    const segmentos = mesclarSegmentos('A graça é livre.', [
      { id: 'd1', inicio: 2, fim: 7, temNota: false },
    ]);
    expect(segmentos.map((s) => [s.texto, s.negrito, s.destaque?.id ?? null])).toEqual([
      ['A ', false, null],
      ['graça', false, 'd1'],
      [' é livre.', false, null],
    ]);
  });

  it('destaque parcialmente sobreposto a um trecho em negrito', () => {
    // "graça" em negrito (2-7), destaque cobre "aça é" (4-9)
    const segmentos = mesclarSegmentos('A **graça** é livre.', [
      { id: 'd1', inicio: 4, fim: 9, temNota: true },
    ]);
    expect(segmentos.map((s) => [s.texto, s.negrito, s.destaque?.id ?? null])).toEqual([
      ['A ', false, null],
      ['gr', true, null],
      ['aça', true, 'd1'],
      [' é', false, 'd1'],
      [' livre.', false, null],
    ]);
  });

  it('destaque cobrindo texto inteiro', () => {
    const segmentos = mesclarSegmentos('Tudo destacado.', [
      { id: 'd1', inicio: 0, fim: 15, temNota: false },
    ]);
    expect(segmentos).toHaveLength(1);
    expect(segmentos[0]).toEqual({
      texto: 'Tudo destacado.',
      negrito: false,
      destaque: { id: 'd1', inicio: 0, fim: 15, temNota: false },
    });
  });
});
