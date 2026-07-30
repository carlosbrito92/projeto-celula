import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CelulaBox } from '../CelulaBox';

describe('CelulaBox', () => {
  it('renderiza anotado_por, compartilhado_por e sugestao_uso', () => {
    render(
      <CelulaBox
        dados={{
          anotado_por: 'Stefani',
          compartilhado_por: 'Jéssica',
          sugestao_uso: 'Escolha uma ou duas frases-chave para aprofundar.',
        }}
      />,
    );
    expect(screen.getByText('Stefani')).toBeInTheDocument();
    expect(screen.getByText('Jéssica')).toBeInTheDocument();
    expect(
      screen.getByText(/Escolha uma ou duas frases-chave para aprofundar\./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Resumo preparado a partir das anotações de/)).toBeInTheDocument();
  });

  it('não renderiza nada quando ausente', () => {
    const { container } = render(<CelulaBox dados={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando null', () => {
    const { container } = render(<CelulaBox dados={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('não renderiza nada quando todos os campos estão ausentes', () => {
    const { container } = render(<CelulaBox dados={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lida com apenas anotado_por presente', () => {
    render(<CelulaBox dados={{ anotado_por: 'Stefani' }} />);
    expect(screen.getByText('Stefani')).toBeInTheDocument();
  });
});
