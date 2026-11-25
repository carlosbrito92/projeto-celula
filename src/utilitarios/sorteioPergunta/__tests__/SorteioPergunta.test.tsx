import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SorteioPergunta } from '../SorteioPergunta';

const perguntas = ['P1?', 'P2?'];

describe('SorteioPergunta', () => {
  beforeEach(() => localStorage.clear());

  it('sorteia sem repetir, bloqueia ao acabar e libera após limpar', () => {
    render(<SorteioPergunta perguntas={perguntas} chave="t" aoFechar={() => {}} />);
    const sortear = screen.getByRole('button', { name: 'Sortear' });
    fireEvent.click(sortear);
    const primeira = screen.getByRole('status').textContent;
    fireEvent.click(sortear);
    const segunda = screen.getByRole('status').textContent;
    expect(new Set([primeira, segunda])).toEqual(new Set(perguntas));
    expect(sortear).toBeDisabled();
    expect(screen.getByText('Nenhuma pergunta restante')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Limpar histórico' }));
    expect(screen.getByRole('button', { name: 'Sortear' })).toBeEnabled();
    expect(screen.getByText('2 de 2 perguntas restantes')).toBeInTheDocument();
  });

  it('lembra o histórico ao reabrir, isolado por chave', () => {
    const { unmount } = render(<SorteioPergunta perguntas={perguntas} chave="a" aoFechar={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sortear' }));
    unmount();
    render(<SorteioPergunta perguntas={perguntas} chave="a" aoFechar={() => {}} />);
    expect(screen.getByText('1 de 2 perguntas restantes')).toBeInTheDocument();
    unmount();
    render(<SorteioPergunta perguntas={perguntas} chave="b" aoFechar={() => {}} />);
    expect(screen.getByText('2 de 2 perguntas restantes')).toBeInTheDocument();
  });
});
