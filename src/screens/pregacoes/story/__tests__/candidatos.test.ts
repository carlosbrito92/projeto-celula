import { describe, expect, it } from 'vitest';
import type { Secao } from '../../../../content/types';
import { mesmoTrecho, trechosDisponiveis } from '../candidatos';
import { ajustarBlocos } from '../layout';

const secoes = [
  {
    id: 'ponto-1',
    numero: '1',
    titulo: 'Primeiro',
    corpo: [
      { tipo: 'paragrafo', texto: 'ignorado' },
      { tipo: 'versiculo', texto: 'Por **graça** sois salvos', referencia: 'Ef 2:8' },
      { tipo: 'frase_chave', texto: 'A graça **muda** tudo' },
      { tipo: 'callout', texto: 'Um aviso' },
    ],
  },
] as unknown as Secao[];

describe('trechosDisponiveis', () => {
  it('lista só versículo, frase-chave e callout, sem marcação de negrito', () => {
    const c = trechosDisponiveis(secoes);
    expect(c.map((x) => x.id)).toEqual(['ponto-1:1', 'ponto-1:2', 'ponto-1:3']);
    expect(c[0]).toMatchObject({ texto: 'Por graça sois salvos', referencia: 'Ef 2:8' });
    expect(c[1].texto).toBe('A graça muda tudo');
    expect(c[1].secaoTitulo).toBe('Primeiro');
  });
  it('mesmoTrecho compara texto e referência', () => {
    expect(mesmoTrecho({ texto: 'a' }, { texto: 'a' })).toBe(true);
    expect(mesmoTrecho({ texto: 'a', referencia: 'x' }, { texto: 'a' })).toBe(false);
  });
});

describe('ajustarBlocos', () => {
  const medirCom = (t: number) => (s: string) => s.length * t;
  const itens = [{ texto: 'palavra '.repeat(10).trim(), extra: 70 }, { texto: 'outra '.repeat(10).trim() }];
  it('todos os trechos cabem juntos, com o mesmo tamanho', () => {
    const r = ajustarBlocos(itens, 1000, 900, 1.3, 60, 80, 20, medirCom);
    const altura =
      r.linhas.reduce((s, l, i) => s + l.length * r.tamanho * 1.3 + (itens[i].extra ?? 0), 0) + 60;
    expect(altura).toBeLessThanOrEqual(900);
    expect(r.linhas).toHaveLength(2);
  });
  it('devolve o mínimo se nada cabe', () => {
    expect(ajustarBlocos(itens, 1000, 10, 1.3, 60, 80, 20, medirCom).tamanho).toBe(20);
  });
});
