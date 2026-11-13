import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dica } from '../Dica';

describe('Dica', () => {
  it('mostra o texto num role="status" (não modal)', () => {
    render(<Dica texto="Toque em Aa para aumentar a letra." aoEntender={() => {}} />);
    const balao = screen.getByRole('status');
    expect(balao).toHaveTextContent('Toque em Aa para aumentar a letra.');
    expect(balao).not.toHaveAttribute('aria-modal');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('"Entendi" chama aoEntender', () => {
    const aoEntender = vi.fn();
    render(<Dica texto="x" aoEntender={aoEntender} />);
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
    expect(aoEntender).toHaveBeenCalledTimes(1);
  });

  it('aceita classe extra para o posicionamento', () => {
    render(<Dica texto="x" aoEntender={() => {}} className="posicao" />);
    expect(screen.getByRole('status')).toHaveClass('posicao');
  });
});
