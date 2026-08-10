import { describe, expect, it } from 'vitest';
import { criarBaralho, criarBaralhoEmbaralhado } from '../baralho';

describe('criarBaralho', () => {
  it('gera 110 cartas no total', () => {
    expect(criarBaralho()).toHaveLength(110);
  });

  it('99 numeradas, 4 wild_cor, 3 wild_numero, 3 trofeu, 1 fim_do_mundo', () => {
    const baralho = criarBaralho();
    const contagem = (tipo: string) => baralho.filter((c) => c.tipo === tipo).length;
    expect(contagem('numerada')).toBe(99);
    expect(contagem('wild_cor')).toBe(4);
    expect(contagem('wild_numero')).toBe(3);
    expect(contagem('trofeu')).toBe(3);
    expect(contagem('fim_do_mundo')).toBe(1);
  });

  it('33 numeradas por cor, distribuição 5/5/4/4/3/3/3/2/2/2 para valores 1-10', () => {
    const baralho = criarBaralho();
    const esperado: Record<number, number> = {
      1: 5,
      2: 5,
      3: 4,
      4: 4,
      5: 3,
      6: 3,
      7: 3,
      8: 2,
      9: 2,
      10: 2,
    };
    for (const cor of ['vermelho', 'azul', 'verde'] as const) {
      const doCor = baralho.filter((c) => c.tipo === 'numerada' && c.cor === cor);
      expect(doCor).toHaveLength(33);
      for (const [valorStr, copias] of Object.entries(esperado)) {
        const valor = Number(valorStr);
        expect(doCor.filter((c) => c.valor === valor)).toHaveLength(copias);
      }
    }
  });

  it('todas as cartas têm id único', () => {
    const ids = criarBaralho().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wilds e especiais não têm cor/valor', () => {
    const baralho = criarBaralho();
    const naoNumeradas = baralho.filter((c) => c.tipo !== 'numerada');
    expect(naoNumeradas.every((c) => c.cor === undefined && c.valor === undefined)).toBe(true);
  });
});

describe('criarBaralhoEmbaralhado', () => {
  it('mesma composição de criarBaralho, só ordem muda — determinístico com rng fixa', () => {
    const baralho = criarBaralhoEmbaralhado(() => 0);
    expect(baralho).toHaveLength(110);
    expect(new Set(baralho.map((c) => c.id)).size).toBe(110);
  });

  it('não muta a ordem canônica de criarBaralho()', () => {
    const antes = criarBaralho().map((c) => c.id);
    criarBaralhoEmbaralhado(Math.random);
    expect(criarBaralho().map((c) => c.id)).toEqual(antes);
  });
});
