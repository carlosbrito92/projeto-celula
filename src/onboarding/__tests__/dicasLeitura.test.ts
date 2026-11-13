import { describe, expect, it } from 'vitest';
import { DICA_AA, DICA_ANOTACOES, escolherDicaLeitura } from '../dicasLeitura';

describe('escolherDicaLeitura', () => {
  it('primeiro o Aa', () => {
    expect(escolherDicaLeitura([])).toBe(DICA_AA);
  });

  it('depois do Aa, a de anotações', () => {
    expect(escolherDicaLeitura([DICA_AA])).toBe(DICA_ANOTACOES);
  });

  it('respeita a ordem mesmo se só a segunda foi vista (usou a caneta antes)', () => {
    expect(escolherDicaLeitura([DICA_ANOTACOES])).toBe(DICA_AA);
  });

  it('todas vistas: nenhuma', () => {
    expect(escolherDicaLeitura([DICA_AA, DICA_ANOTACOES])).toBeNull();
  });

  it('ids são versionados', () => {
    expect(DICA_AA).toMatch(/-v\d+$/);
    expect(DICA_ANOTACOES).toMatch(/-v\d+$/);
  });
});
