import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MerchSection } from '../MerchSection';

describe('MerchSection', () => {
  it('renderiza título e itens quando presente', () => {
    render(
      <MerchSection
        dados={{
          titulo: 'Menções e Indicações',
          itens: [{ icone: '📖', titulo: 'Livro X', descricao: 'Descrição X' }],
        }}
      />,
    );
    expect(screen.getByText('Menções e Indicações')).toBeInTheDocument();
    expect(screen.getByText('Livro X')).toBeInTheDocument();
    expect(screen.getByText('Descrição X')).toBeInTheDocument();
  });

  it('não renderiza nada quando ausente', () => {
    const { container } = render(<MerchSection dados={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando null (schema real usa null em vez de omitir o campo)', () => {
    const { container } = render(<MerchSection dados={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
