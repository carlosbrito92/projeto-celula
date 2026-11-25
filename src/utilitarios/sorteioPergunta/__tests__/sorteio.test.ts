import { describe, expect, it } from 'vitest';
import { restantes, sortearPergunta } from '../sorteio';

describe('sortearPergunta', () => {
  const todas = ['a', 'b', 'c'];

  it('nunca devolve uma pergunta já usada', () => {
    for (const r of [0, 0.34, 0.99]) {
      expect(sortearPergunta(todas, ['a', 'c'], () => r)).toBe('b');
    }
  });

  it('esgota todas sem repetir e depois devolve null', () => {
    const usadas: string[] = [];
    for (let i = 0; i < 3; i++) usadas.push(sortearPergunta(todas, usadas)!);
    expect([...usadas].sort()).toEqual(['a', 'b', 'c']);
    expect(sortearPergunta(todas, usadas)).toBeNull();
  });

  it('rng próximo de 1 não estoura o índice', () => {
    expect(sortearPergunta(todas, [], () => 0.9999999)).toBe('c');
  });

  it('restantes ignora usadas que não existem mais no conteúdo', () => {
    expect(restantes(todas, ['x', 'a'])).toEqual(['b', 'c']);
  });
});
