import { describe, expect, it } from 'vitest';
import { quebraSequencia } from '../sequencia';
import type { Declaracao } from '../types';

const d = (valor: number, cor: Declaracao['cor'] = 'vermelho'): Declaracao => ({ cor, valor });

describe('quebraSequencia — início de pilha (anterior null)', () => {
  it('1, 2 ou 3 são válidos', () => {
    expect(quebraSequencia(null, d(1))).toBe(false);
    expect(quebraSequencia(null, d(2))).toBe(false);
    expect(quebraSequencia(null, d(3))).toBe(false);
  });

  it('4+ quebra sequência', () => {
    expect(quebraSequencia(null, d(4))).toBe(true);
    expect(quebraSequencia(null, d(10))).toBe(true);
  });
});

describe('quebraSequencia — meio de pilha', () => {
  it('valor igual ou maior, mesma cor: não quebra', () => {
    expect(quebraSequencia(d(3), d(3))).toBe(false);
    expect(quebraSequencia(d(3), d(7))).toBe(false);
  });

  it('valor menor: quebra', () => {
    expect(quebraSequencia(d(5), d(2))).toBe(true);
  });

  it('cor diferente: quebra, mesmo com valor crescente', () => {
    expect(quebraSequencia(d(3, 'vermelho'), d(4, 'azul'))).toBe(true);
  });

  it('reset após 10: volta pra 1-3 não quebra', () => {
    expect(quebraSequencia(d(10), d(1))).toBe(false);
    expect(quebraSequencia(d(10), d(3))).toBe(false);
  });

  it('após 10, valor fora de 1-3 quebra (não é reset válido, nem crescente)', () => {
    expect(quebraSequencia(d(10), d(5))).toBe(true);
  });
});

describe('quebraSequencia — variante we_love_chili', () => {
  it('1-3 em Vermelho nunca quebra, mesmo com cor estabelecida diferente', () => {
    expect(quebraSequencia(d(5, 'azul'), d(2, 'vermelho'), 'we_love_chili')).toBe(false);
    expect(quebraSequencia(d(9, 'verde'), d(1, 'vermelho'), 'we_love_chili')).toBe(false);
  });

  it('1-3 em outra cor continua seguindo a regra base (quebra se cor diferente)', () => {
    expect(quebraSequencia(d(5, 'azul'), d(2, 'verde'), 'we_love_chili')).toBe(true);
  });

  it('4+ em Vermelho não ganha a exceção — regra base normal', () => {
    expect(quebraSequencia(d(5, 'azul'), d(7, 'vermelho'), 'we_love_chili')).toBe(true);
  });

  it('sem a variante ativa, mesma jogada quebra normalmente', () => {
    expect(quebraSequencia(d(5, 'azul'), d(2, 'vermelho'))).toBe(true);
  });
});

describe('quebraSequencia — variante start_it_up', () => {
  it('reset pra 1-3 também vale depois de 8 ou 9, mesma cor', () => {
    expect(quebraSequencia(d(8, 'verde'), d(1, 'verde'), 'start_it_up')).toBe(false);
    expect(quebraSequencia(d(9, 'verde'), d(3, 'verde'), 'start_it_up')).toBe(false);
  });

  it('reset não muda a cor — cor diferente ainda quebra', () => {
    expect(quebraSequencia(d(8, 'verde'), d(1, 'azul'), 'start_it_up')).toBe(true);
  });

  it('sem a variante, 8/9 não habilitam reset (só 10, regra base)', () => {
    expect(quebraSequencia(d(8, 'verde'), d(1, 'verde'))).toBe(true);
    expect(quebraSequencia(d(9, 'verde'), d(1, 'verde'))).toBe(true);
  });

  it('reset após 10 continua funcionando com a variante ligada', () => {
    expect(quebraSequencia(d(10, 'verde'), d(2, 'verde'), 'start_it_up')).toBe(false);
  });
});
