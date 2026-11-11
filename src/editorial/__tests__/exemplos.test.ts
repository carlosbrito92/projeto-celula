import { describe, expect, it } from 'vitest';
import { EXEMPLOS } from '../exemplos';
import { ROTULO_TIPO_BLOCO } from '../modelo';

// Exemplos com `fonte` são trechos reais: cada texto precisa existir, igual,
// no JSON da pregação citada. Pega exemplo inventado ou desatualizado.
const pregacoes = import.meta.glob('../../../content/pregacoes/*.json', { eager: true, import: 'default' }) as Record<
  string,
  { metadados: { tema: string } }
>;

describe('exemplos do editor', () => {
  const porTema = new Map(Object.values(pregacoes).map((p) => [p.metadados.tema, JSON.stringify(p)]));

  it.each(Object.entries(EXEMPLOS).filter(([, e]) => e.fonte))('"%s" é trecho literal da pregação citada', (_, e) => {
    const json = porTema.get(e.fonte!);
    expect(json, `pregação "${e.fonte}" não encontrada`).toBeDefined();
    for (const l of e.linhas) expect(json).toContain(JSON.stringify(l.texto).slice(1, -1));
  });

  it('todo tipo de bloco que o editor cria tem exemplo', () => {
    for (const tipo of Object.keys(ROTULO_TIPO_BLOCO)) expect(EXEMPLOS).toHaveProperty(tipo);
  });
});
