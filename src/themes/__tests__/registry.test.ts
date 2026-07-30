import { describe, expect, it } from 'vitest';
import {
  ESTILO_3_CELULA,
  ESTILO_4_IGREJAR,
  ESTILO_5B_RELIGIAO_TOXICA,
  PADRAO_MINC,
  resolveTema,
  THEMES,
} from '../registry';

/**
 * Extrai os pesos (wght) que a googleFontsUrl realmente carrega para uma
 * família. Sem parâmetro wght@ na URL (ex: Anton, que só existe em 400),
 * o navegador só tem o peso default — [400].
 */
function pesosDisponiveis(googleFontsUrl: string, familiaCss: string): number[] {
  const nomeFamilia = familiaCss.split(',')[0].replace(/['"]/g, '').trim().replace(/ /g, '+');
  const marcador = `family=${nomeFamilia}`;
  const inicio = googleFontsUrl.indexOf(marcador);
  if (inicio === -1) return [400];

  const resto = googleFontsUrl.slice(inicio + marcador.length);
  const fim = resto.indexOf('&');
  const segmento = fim === -1 ? resto : resto.slice(0, fim);

  const wghtIndex = segmento.indexOf('wght@');
  if (wghtIndex === -1) return [400];

  return segmento
    .slice(wghtIndex + 'wght@'.length)
    .split(';')
    .map((parte) => Number(parte.includes(',') ? parte.split(',')[1] : parte));
}

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

  it('tema_override tem prioridade sobre a série — caso real: Avulsa + Estilo #3', () => {
    expect(resolveTema('Avulsa', 'Estilo #3')).toBe(ESTILO_3_CELULA);
  });

  it('tema_override também vence quando a série tem tema próprio', () => {
    expect(resolveTema('Igrejar', 'Estilo #3')).toBe(ESTILO_3_CELULA);
  });

  it('tema_override desconhecido/vazio não quebra — cai no fallback normal', () => {
    expect(resolveTema('Religião Tóxica', 'Estilo Que Não Existe')).toBe(ESTILO_5B_RELIGIAO_TOXICA);
    expect(resolveTema('Avulsa', null)).toBe(PADRAO_MINC);
    expect(resolveTema('Avulsa', undefined)).toBe(PADRAO_MINC);
  });
});

describe('pesoDisplay de cada tema', () => {
  it('é um peso que a fonte de display do tema realmente carrega (evita fallback silencioso de font-family)', () => {
    for (const tema of Object.values(THEMES)) {
      const pesos = pesosDisponiveis(tema.fonteDisplay.googleFontsUrl, tema.fonteDisplay.family);
      expect(pesos, `${tema.nome}: pesoDisplay=${tema.pesoDisplay} não está em [${pesos}]`).toContain(
        tema.pesoDisplay,
      );
    }
  });

  it('secaoTitulo.peso (quando definido) também é um peso realmente carregado', () => {
    for (const tema of Object.values(THEMES)) {
      if (tema.secaoTitulo?.peso === undefined) continue;
      const pesos = pesosDisponiveis(tema.fonteDisplay.googleFontsUrl, tema.fonteDisplay.family);
      expect(
        pesos,
        `${tema.nome}: secaoTitulo.peso=${tema.secaoTitulo.peso} não está em [${pesos}]`,
      ).toContain(tema.secaoTitulo.peso);
    }
  });
});

describe('tratamento de maiúsculas/itálico por tema (docs/estilos-pregacao.md)', () => {
  it('Estilo #5b (Anton) é maiúsculo no display — "peso único extra-bold, uppercase"', () => {
    expect(ESTILO_5B_RELIGIAO_TOXICA.maiusculoDisplay).toBe(true);
  });

  it('Estilo #4 (Igrejar) tem títulos de seção maiúsculos + itálico em peso 800, sem afetar o restante do display', () => {
    expect(ESTILO_4_IGREJAR.maiusculoDisplay).toBeFalsy();
    expect(ESTILO_4_IGREJAR.secaoTitulo).toEqual({ peso: 800, maiusculo: true, italico: true });
  });

  it('demais temas não forçam maiúsculas', () => {
    expect(PADRAO_MINC.maiusculoDisplay).toBeFalsy();
    expect(ESTILO_3_CELULA.maiusculoDisplay).toBeFalsy();
  });
});
