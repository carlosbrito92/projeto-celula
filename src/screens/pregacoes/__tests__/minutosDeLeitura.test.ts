import { describe, expect, it } from 'vitest';
import { minutosDeLeitura } from '../minutosDeLeitura';

describe('minutosDeLeitura', () => {
  it('resumo curto vale 1 minuto (mínimo)', () => {
    expect(minutosDeLeitura({ frase_tema: 'Uma frase curta', pontos: ['a b c'] })).toBe(1);
  });

  it('não conta nomes de campo e arredonda por 200 palavras/min', () => {
    const texto = Array(400).fill('palavra').join(' ');
    expect(minutosDeLeitura({ frase_tema: texto })).toBe(2);
  });
});
