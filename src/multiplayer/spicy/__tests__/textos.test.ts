import { describe, expect, it } from 'vitest';
import { textoDeclaracao, textoDesafio } from '../textos';

describe('textoDeclaracao', () => {
  it('substitui [nome-jogador] e [cor+número] por valores reais', () => {
    const texto = textoDeclaracao('Carlos', { cor: 'verde', valor: 7 }, () => 0);
    expect(texto).not.toContain('[');
    expect(texto).not.toContain(']');
    expect(texto).toContain('Carlos');
    expect(texto).toContain('Verde 7');
  });

  it('rng diferente escolhe template diferente (não sempre o primeiro)', () => {
    const primeiro = textoDeclaracao('Ana', { cor: 'azul', valor: 3 }, () => 0);
    const ultimo = textoDeclaracao('Ana', { cor: 'azul', valor: 3 }, () => 0.999);
    expect(primeiro).not.toBe(ultimo);
  });
});

describe('textoDesafio', () => {
  it('substitui [nome-jogador], [nome-jogador-desafiante] e [cor+número], sem colchete residual', () => {
    const texto = textoDesafio('Fernanda', 'Marcelo', { cor: 'vermelho', valor: 10 }, () => 0);
    expect(texto).not.toContain('[');
    expect(texto).not.toContain(']');
    expect(texto).toContain('Fernanda');
    expect(texto).toContain('Marcelo');
    expect(texto).toContain('Vermelho 10');
  });

  it('rng diferente escolhe template diferente', () => {
    const primeiro = textoDesafio('Ana', 'Bruno', { cor: 'azul', valor: 3 }, () => 0);
    const ultimo = textoDesafio('Ana', 'Bruno', { cor: 'azul', valor: 3 }, () => 0.999);
    expect(primeiro).not.toBe(ultimo);
  });
});
