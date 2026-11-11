import { describe, expect, it } from 'vitest';
import { derivarStatus } from '../status';

describe('derivarStatus', () => {
  const publicados = new Set(['fe.json']);

  it('sem arquivo: rascunho (nunca enviado)', () => {
    expect(derivarStatus({ arquivo: null }, publicados)).toBe('rascunho');
  });

  it('enviado e ainda fora do app: em revisão', () => {
    expect(derivarStatus({ arquivo: 'graca.json' }, publicados)).toBe('em_revisao');
  });

  it('arquivo já em pregacoes.arquivo_origem: publicado', () => {
    expect(derivarStatus({ arquivo: 'fe.json' }, publicados)).toBe('publicado');
  });
});
