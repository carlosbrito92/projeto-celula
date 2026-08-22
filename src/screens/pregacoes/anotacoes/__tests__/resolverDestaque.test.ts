import { describe, expect, it } from 'vitest';
import { resolverDestaque } from '../resolverDestaque';

describe('resolverDestaque', () => {
  it('offset ainda bate com o texto salvo — usa direto', () => {
    const resultado = resolverDestaque('A graça é livre para todos.', {
      offsetInicio: 2,
      offsetFim: 7,
      textoSelecionado: 'graça',
    });
    expect(resultado).toEqual({ offsetInicio: 2, offsetFim: 7 });
  });

  it('texto mudou antes do trecho (reflow) — realinha pelo texto salvo', () => {
    // texto original tinha "A graça...", agora ganhou uma palavra antes
    const resultado = resolverDestaque('Só que a graça é livre para todos.', {
      offsetInicio: 2,
      offsetFim: 7, // apontava pra "que a" no texto novo, errado
      textoSelecionado: 'graça',
    });
    expect(resultado).toEqual({ offsetInicio: 9, offsetFim: 14 });
    expect('Só que a graça é livre para todos.'.slice(9, 14)).toBe('graça');
  });

  it('trecho grifado removido da pregação — órfão, retorna null', () => {
    const resultado = resolverDestaque('Texto totalmente reescrito, sem relação.', {
      offsetInicio: 2,
      offsetFim: 7,
      textoSelecionado: 'graça',
    });
    expect(resultado).toBeNull();
  });
});
