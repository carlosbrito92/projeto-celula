import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StoryOverlay } from '../StoryOverlay';
import { PADRAO_MINC } from '../../../../themes/registry';

describe('StoryOverlay', () => {
  it('alterna fonte, fundo e tamanho e fecha', () => {
    let fechou = false;
    render(
      <StoryOverlay
        trecho={{ texto: 'Frase', titulo: 'Título' }}
        tema={PADRAO_MINC}
        aoFechar={() => (fechou = true)}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Anton' }));
    expect(screen.getByRole('button', { name: 'Anton' })).toHaveAttribute('aria-pressed', 'true');
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
