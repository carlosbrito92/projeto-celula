import { describe, expect, it } from 'vitest';
import doc from '../../../docs/geracao-pregacao.md?raw';
import { validarPregacao } from '../../content/validarPregacao';
import { SERIES_COM_TEMA } from '../../themes/registry';
import { definirCaminho } from '../caminho';
import { adicionarPonto, definirTituloCurto, limparParaPublicar, novaPregacao } from '../modelo';
import { montarPrompt, PAYLOADS_COMPONENTE } from '../promptIA';

function base() {
  let c = adicionarPonto(novaPregacao());
  c = definirCaminho(c, ['metadados', 'serie'], 'Avulsa');
  c = definirCaminho(c, ['metadados', 'tema'], 'T');
  c = definirCaminho(c, ['banner_intro', 'frase_sintese'], 'F');
  c = definirTituloCurto(c, 'ponto-1', 'A');
  c = definirTituloCurto(c, 'ponto-2', 'B');
  c = definirCaminho(c, ['secoes', 0, 'corpo', 0, 'texto'], 'x');
  return definirCaminho(c, ['secoes', 1, 'corpo', 0, 'texto'], 'y');
}

describe('prompt para IA', () => {
  it('cada payload do apêndice passa no validador, sem erro nem aviso', () => {
    for (const [variante, dados] of Object.entries(PAYLOADS_COMPONENTE)) {
      const c = definirCaminho(base(), ['secoes', 0, 'corpo', 1], { tipo: 'componente_tema', variante, dados });
      const r = validarPregacao(limparParaPublicar(c));
      expect({ variante, erros: r.erros, avisos: r.avisos }).toEqual({ variante, erros: [], avisos: [] });
    }
  });

  it('leva o doc inteiro, o apêndice e as séries', () => {
    const p = montarPrompt(doc, SERIES_COM_TEMA);
    expect(p.startsWith(doc.trim())).toBe(true);
    expect(p).toContain('`timeline`');
    for (const s of SERIES_COM_TEMA) expect(p).toContain(`- ${s}`);
    expect(p).toContain('Responda **só com o JSON**');
  });
});
