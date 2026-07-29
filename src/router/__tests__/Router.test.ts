import { describe, expect, it } from 'vitest';
import { matchPath } from '../Router';

describe('matchPath', () => {
  it('extrai parâmetro dinâmico', () => {
    expect(matchPath('/pregacoes/:id', '/pregacoes/abc-123')).toEqual({ id: 'abc-123' });
  });

  it('decodifica o parâmetro', () => {
    expect(matchPath('/pregacoes/:id', '/pregacoes/a%20b')).toEqual({ id: 'a b' });
  });

  it('casa rota estática', () => {
    expect(matchPath('/quebra-gelos', '/quebra-gelos')).toEqual({});
  });

  it('retorna null quando o número de segmentos difere', () => {
    expect(matchPath('/pregacoes/:id', '/pregacoes')).toBeNull();
    expect(matchPath('/pregacoes/:id', '/pregacoes/a/b')).toBeNull();
  });

  it('retorna null quando um segmento estático não bate', () => {
    expect(matchPath('/quebra-gelos', '/utilitarios')).toBeNull();
  });
});
