import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComoUsar } from '../ComoUsar';
import { CARDS_COMO_USAR } from '../comoUsar';
import { carregarDicasVistas, marcarDicaVista } from '../../../onboarding/dicasStorage';

vi.mock('../../../router/Router', () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

describe('Como usar', () => {
  beforeEach(() => localStorage.clear());

  it('mostra um card por item do arquivo de dados, cada um com ícone e título', () => {
    render(<ComoUsar />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(CARDS_COMO_USAR.length);
    CARDS_COMO_USAR.forEach((card, i) => {
      expect(within(cards[i]).getByRole('heading', { name: card.titulo })).toBeInTheDocument();
      // ícone desconhecido renderiza null: pega nome de ícone sem SVG vendorizado
      expect(cards[i].querySelector('svg')).not.toBeNull();
      card.passos.forEach((passo) => expect(within(cards[i]).getByText(passo)).toBeInTheDocument());
    });
  });

  it('cobre os recursos combinados', () => {
    const ids = CARDS_COMO_USAR.map((c) => c.id);
    expect(ids).toEqual([
      'ler-pregacoes',
      'tamanho-letra',
      'anotacoes',
      'quebra-gelos',
      'utilitarios',
      'jogos-celular',
      'privacidade',
    ]);
  });

  it('texto sem emoji', () => {
    const tudo = CARDS_COMO_USAR.flatMap((c) => [c.titulo, ...c.passos]).join(' ');
    expect(tudo).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('volta para a Biblioteca', () => {
    render(<ComoUsar />);
    expect(screen.getByRole('link', { name: 'Voltar' })).toHaveAttribute('href', '/');
  });

  it('"Rever as dicas" limpa as dicas vistas e confirma', () => {
    marcarDicaVista('leitura-aa-v1');
    render(<ComoUsar />);
    fireEvent.click(screen.getByRole('button', { name: 'Rever as dicas' }));
    expect(carregarDicasVistas()).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent(/próxima pregação/);
  });
});
