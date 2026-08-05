import { describe, expect, it } from 'vitest';
import { CATEGORIAS } from '../categorias';

describe('CATEGORIAS', () => {
  it('tem pelo menos 3 categorias', () => {
    expect(CATEGORIAS.length).toBeGreaterThanOrEqual(3);
  });

  it('cada categoria tem nome e pelo menos 10 palavras', () => {
    for (const categoria of CATEGORIAS) {
      expect(categoria.nome.length).toBeGreaterThan(0);
      expect(categoria.palavras.length).toBeGreaterThanOrEqual(10);
    }
  });

  it('nenhuma categoria tem palavra vazia ou só espaço', () => {
    for (const categoria of CATEGORIAS) {
      for (const palavra of categoria.palavras) {
        expect(palavra.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('nenhuma categoria tem palavra duplicada', () => {
    for (const categoria of CATEGORIAS) {
      const unicas = new Set(categoria.palavras);
      expect(unicas.size).toBe(categoria.palavras.length);
    }
  });

  it('nomes de categoria são únicos', () => {
    const nomes = CATEGORIAS.map((c) => c.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});
