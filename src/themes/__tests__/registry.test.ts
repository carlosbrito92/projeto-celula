import { describe, expect, it } from 'vitest';
import {
  ESTILO_4_IGREJAR,
  ESTILO_5B_RELIGIAO_TOXICA,
  PADRAO_MINC,
  resolveTema,
} from '../registry';

describe('resolveTema', () => {
  it('resolve séries conhecidas para seus temas registrados', () => {
    expect(resolveTema('Religião Tóxica')).toBe(ESTILO_5B_RELIGIAO_TOXICA);
    expect(resolveTema('Igrejar')).toBe(ESTILO_4_IGREJAR);
  });

  it('usa Padrão MINC para "Avulsa"', () => {
    expect(resolveTema('Avulsa')).toBe(PADRAO_MINC);
  });

  it('usa Padrão MINC como fallback para série desconhecida', () => {
    expect(resolveTema('Série Que Não Existe')).toBe(PADRAO_MINC);
  });

  it('usa Padrão MINC como fallback para série ausente', () => {
    expect(resolveTema(null)).toBe(PADRAO_MINC);
    expect(resolveTema(undefined)).toBe(PADRAO_MINC);
    expect(resolveTema('')).toBe(PADRAO_MINC);
  });
});
