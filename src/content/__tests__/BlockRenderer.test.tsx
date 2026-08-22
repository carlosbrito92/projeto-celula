import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BlockRenderer } from '../BlockRenderer';
import type { Bloco } from '../types';

describe('BlockRenderer', () => {
  it('renderiza paragrafo com palavra-chave em destaque', () => {
    render(
      <BlockRenderer
        bloco={{ tipo: 'paragrafo', texto: 'A **graça** salva.' }}
        secaoId="sec-1"
        blocoIndex={0}
      />,
    );
    expect(screen.getByText('graça')).toBeInTheDocument();
    expect(screen.getByText('graça').tagName).toBe('STRONG');
  });

  it('renderiza versiculo com texto e referência', () => {
    render(
      <BlockRenderer
        bloco={{ tipo: 'versiculo', referencia: 'João 3.16', texto: 'Porque Deus amou o mundo' }}
        secaoId="sec-1"
        blocoIndex={0}
      />,
    );
    expect(screen.getByText(/Porque Deus amou o mundo/)).toBeInTheDocument();
    expect(screen.getByText('João 3.16')).toBeInTheDocument();
  });

  it('renderiza callout', () => {
    render(
      <BlockRenderer
        bloco={{ tipo: 'callout', texto: 'Citação-chave.' }}
        secaoId="sec-1"
        blocoIndex={0}
      />,
    );
    expect(screen.getByText('Citação-chave.')).toBeInTheDocument();
  });

  it('renderiza frase_chave', () => {
    render(
      <BlockRenderer
        bloco={{ tipo: 'frase_chave', texto: 'Uma síntese.' }}
        secaoId="sec-1"
        blocoIndex={0}
      />,
    );
    expect(screen.getByText('Uma síntese.')).toBeInTheDocument();
  });

  it('renderiza lista com todos os itens', () => {
    render(
      <BlockRenderer
        bloco={{ tipo: 'lista', itens: ['Item um', 'Item dois'] }}
        secaoId="sec-1"
        blocoIndex={0}
      />,
    );
    expect(screen.getByText('Item um')).toBeInTheDocument();
    expect(screen.getByText('Item dois')).toBeInTheDocument();
  });

  it('delega componente_tema para o ComponenteTemaRenderer', () => {
    const bloco: Bloco = {
      tipo: 'componente_tema',
      variante: 'humor',
      dados: { texto: 'Uma piada.' },
    };
    render(<BlockRenderer bloco={bloco} secaoId="sec-1" blocoIndex={0} />);
    expect(screen.getByText('Uma piada.')).toBeInTheDocument();
  });
});
