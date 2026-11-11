import { describe, expect, it } from 'vitest';
import { alternarNegrito } from '../negrito';

describe('alternarNegrito', () => {
  it('envolve a seleção e mantém a seleção no miolo', () => {
    expect(alternarNegrito('a graça salva', 2, 7)).toEqual({ texto: 'a **graça** salva', inicio: 4, fim: 9 });
  });

  it('ignora espaços nas pontas da seleção', () => {
    expect(alternarNegrito('a graça salva', 1, 8).texto).toBe('a **graça** salva');
  });

  it('sem seleção: insere exemplo selecionado', () => {
    expect(alternarNegrito('fé ', 3, 3)).toEqual({ texto: 'fé **palavra**', inicio: 5, fim: 12 });
  });

  it('desliga quando a seleção já está em negrito (por dentro ou com as marcas)', () => {
    expect(alternarNegrito('a **graça** salva', 4, 9)).toEqual({ texto: 'a graça salva', inicio: 2, fim: 7 });
    expect(alternarNegrito('a **graça** salva', 2, 11)).toEqual({ texto: 'a graça salva', inicio: 2, fim: 7 });
  });
});
