import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StoryOverlay } from '../StoryOverlay';
import { PADRAO_MINC } from '../../../../themes/registry';

describe('StoryOverlay', () => {
  it('alterna fonte, fundo e tamanho e fecha', () => {
    let fechou = false;
    render(
      <StoryOverlay
        trecho={{ itens: [{ texto: 'Frase', referencia: undefined }], titulo: 'Título' }}
        tema={PADRAO_MINC}
        aoFechar={() => (fechou = true)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Anton' }));
    expect(screen.getByRole('button', { name: 'Anton' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Itálico espaçado' }));
    expect(screen.getByRole('button', { name: 'Itálico espaçado' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Centro' }));
    expect(screen.getByRole('button', { name: 'Centro' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Fundo Âmbar' }));
    expect(screen.getByRole('button', { name: 'Fundo Âmbar' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(screen.getByRole('button', { name: 'G' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(fechou).toBe(true);
  });
});

describe('StoryOverlay com vários trechos', () => {
  const candidatos = [
    { id: 'a:1', secaoTitulo: 'Ponto 1', texto: 'Por graça sois salvos', referencia: 'Ef 2:8' },
    { id: 'a:2', secaoTitulo: 'Ponto 1', texto: 'A graça muda tudo' },
  ];

  it('adiciona, reordena e remove trechos, com o limite de 3', () => {
    render(
      <StoryOverlay
        trecho={{ itens: [{ texto: 'A graça muda tudo' }], titulo: 'T' }}
        candidatos={candidatos}
        tema={PADRAO_MINC}
        aoFechar={() => {}}
      />,
    );
    expect(screen.getByText('Trechos (1/3)')).toBeInTheDocument();
    // o trecho já na imagem não é oferecido de novo
    fireEvent.click(screen.getByRole('button', { name: '+ Adicionar trecho' }));
    expect(screen.queryByText(/Frase · Ponto 1/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Ef 2:8 — Por graça sois salvos/));
    expect(screen.getByText('Trechos (2/3)')).toBeInTheDocument();
    // sem mais candidatos, o botão some
    expect(screen.queryByRole('button', { name: '+ Adicionar trecho' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Subir trecho 2' }));
    expect(screen.getByRole('button', { name: 'Subir trecho 1' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Remover trecho 1' }));
    expect(screen.getByText('Trechos (1/3)')).toBeInTheDocument();
    // último trecho não pode ser removido
    expect(screen.getByRole('button', { name: 'Remover trecho 1' })).toBeDisabled();
  });
});
