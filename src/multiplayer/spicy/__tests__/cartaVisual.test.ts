import { describe, expect, it } from 'vitest';
import specMarkdown from '../../../../docs/spicy-spec.md?raw';
import { cartaParaVisual, VERSO } from '../cartaVisual';
import type { Carta } from '../types';

/**
 * Fidelidade ao mock: extrai os blocos ```json``` de docs/spicy-spec.md
 * §6.1/§6.1.1 (fonte de verdade visual, aprovada por Carlos) e compara
 * contra a saída de `cartaParaVisual` — se alguém editar um dos dois lados
 * sem atualizar o outro, este teste pega a divergência. Não redigita os
 * dados (evitaria o mesmo erro de transcrição nos dois lugares). `?raw`
 * (Vite) em vez de `node:fs` — mesmo padrão de `src/icons/Icon.tsx`.
 */
function blocosJsonDoSpec(): unknown[] {
  return [...specMarkdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map((m) => JSON.parse(m[1]));
}

const carta = (parcial: Partial<Carta>): Carta => ({ id: 'x', tipo: 'numerada', ...parcial });

describe('cartaParaVisual — fidelidade ao mock (docs/spicy-spec.md §6.1/§6.1.1)', () => {
  const blocos = blocosJsonDoSpec();

  it('encontra os 6 blocos JSON esperados no spec', () => {
    expect(blocos).toHaveLength(6);
  });

  it('numerada vermelho 7 bate com o exemplo de §6.1', () => {
    const esperado = blocos[0] as { background: string; border: string; shapes: unknown; texts: unknown };
    const visual = cartaParaVisual(carta({ cor: 'vermelho', valor: 7 }));
    expect(visual.background).toBe(esperado.background);
    expect(visual.border).toBe(esperado.border);
    expect(visual.shapes).toEqual(esperado.shapes);
    expect(visual.texts).toEqual(esperado.texts);
  });

  it('wild_cor bate com §6.1.1', () => {
    const esperado = blocos[1];
    const visual = cartaParaVisual(carta({ tipo: 'wild_cor', cor: undefined, valor: undefined }));
    expect({ background: visual.background, border: visual.border, shapes: visual.shapes, texts: visual.texts }).toEqual(
      { background: (esperado as any).background, border: (esperado as any).border, shapes: (esperado as any).shapes, texts: (esperado as any).texts },
    );
  });

  it('wild_numero bate com §6.1.1', () => {
    const esperado = blocos[2] as any;
    const visual = cartaParaVisual(carta({ tipo: 'wild_numero', cor: undefined, valor: undefined }));
    expect(visual.shapes).toEqual(esperado.shapes);
    expect(visual.texts).toEqual(esperado.texts);
  });

  it('trofeu bate com §6.1.1', () => {
    const esperado = blocos[3] as any;
    const visual = cartaParaVisual(carta({ tipo: 'trofeu', cor: undefined, valor: undefined }));
    expect(visual.background).toBe(esperado.background);
    expect(visual.shapes).toEqual(esperado.shapes);
    expect(visual.texts).toEqual(esperado.texts);
  });

  it('fim_do_mundo bate com §6.1.1', () => {
    const esperado = blocos[4] as any;
    const visual = cartaParaVisual(carta({ tipo: 'fim_do_mundo', cor: undefined, valor: undefined }));
    expect(visual.background).toBe(esperado.background);
    expect(visual.shapes).toEqual(esperado.shapes);
    expect(visual.texts).toEqual(esperado.texts);
  });

  it('verso (não revelada) bate com §6.1.1, qualquer que seja o tipo real', () => {
    const esperado = blocos[5] as any;
    expect(VERSO.background).toBe(esperado.background);
    expect(VERSO.shapes).toEqual(esperado.shapes);
    expect(VERSO.texts).toEqual(esperado.texts);

    const visualNaoRevelada = cartaParaVisual(carta({ tipo: 'trofeu', cor: undefined, valor: undefined }), false);
    expect(visualNaoRevelada).toBe(VERSO);
  });
});

describe('cartaParaVisual — cartas numeradas', () => {
  it('azul e verde usam a cor certa em texto e forma central', () => {
    const azul = cartaParaVisual(carta({ cor: 'azul', valor: 3 }));
    expect(azul.shapes[0]).toMatchObject({ type: 'rect', rotate: 45, stroke: '#0B63C5' });
    expect(azul.texts[0]).toMatchObject({ content: '3', fill: '#0B63C5' });

    const verde = cartaParaVisual(carta({ cor: 'verde', valor: 9 }));
    expect(verde.shapes[0]).toMatchObject({ type: 'polygon', stroke: '#0E8A4F' });
    expect(verde.texts[0]).toMatchObject({ content: '9', fill: '#0E8A4F' });
  });

  it('cada carta tem forma central + 2 marcas de canto + 2 textos de canto + 1 texto central', () => {
    const visual = cartaParaVisual(carta({ cor: 'vermelho', valor: 5 }));
    expect(visual.shapes).toHaveLength(3);
    expect(visual.texts).toHaveLength(3);
  });
});
