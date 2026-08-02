import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SorteioPapel } from '../SorteioPapel';

function digitarNomes(nomes: string[]) {
  const input = screen.getByPlaceholderText('nome');
  for (const nome of nomes) {
    fireEvent.change(input, { target: { value: nome } });
    fireEvent.keyDown(input, { key: 'Enter' });
  }
}

describe('SorteioPapel — sem categorias (modo Detetive, comportamento original)', () => {
  it('mostra o editor de papéis (nome + quantidade), não o seletor de categoria', () => {
    render(<SorteioPapel aoFechar={() => {}} />);
    expect(screen.getByPlaceholderText('Nome do papel')).toBeInTheDocument();
  });
});

describe('SorteioPapel — com categorias (modo Artista Impostor, docs/spec-privacidade-sorteio.md § Correção)', () => {
  const categorias = [{ nome: 'Animais', palavras: ['Gato', 'Cachorro', 'Elefante'] }];

  it('mostra o seletor de categoria, não o editor de papéis livres', () => {
    render(<SorteioPapel categorias={categorias} aoFechar={() => {}} />);
    expect(screen.queryByPlaceholderText('Nome do papel')).not.toBeInTheDocument();
    expect(screen.getByText('Animais')).toBeInTheDocument();
  });

  it('Sortear fica desabilitado com só 1 participante (precisa de pelo menos 1 impostor + 1 outro)', () => {
    render(<SorteioPapel categorias={categorias} aoFechar={() => {}} />);
    digitarNomes(['Ana']);
    fireEvent.click(screen.getByText('Animais'));
    expect(screen.getByText('Sortear').closest('button')).toBeDisabled();
  });

  it('1 pessoa vira impostor, o resto do grupo recebe a MESMA palavra — nunca palavras diferentes entre si', () => {
    render(<SorteioPapel categorias={categorias} aoFechar={() => {}} />);
    digitarNomes(['Ana', 'Beto', 'Carla', 'Duda']);
    fireEvent.click(screen.getByText('Animais'));

    const botaoSortear = screen.getByText('Sortear').closest('button')!;
    expect(botaoSortear).not.toBeDisabled();
    fireEvent.click(botaoSortear);

    // Nenhuma palavra da categoria apareceu na tela de setup antes do sorteio.
    expect(screen.getByText(/Passe para/)).toBeInTheDocument();

    const revelados: string[] = [];
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByText('Revelar'));
      const impostor = screen.queryByText('Você é o Impostor!');
      const palavra = categorias[0].palavras.find((p) => screen.queryByText(p));
      revelados.push(impostor ? 'Você é o Impostor!' : palavra!);
      fireEvent.click(screen.getByText('Continuar'));
      fireEvent.click(screen.getByText('Próximo'));
    }

    const impostores = revelados.filter((v) => v === 'Você é o Impostor!');
    const palavrasReveladas = revelados.filter((v) => v !== 'Você é o Impostor!');
    expect(impostores).toHaveLength(1);
    expect(palavrasReveladas).toHaveLength(3);
    // O resto do grupo inteiro recebeu a MESMA palavra — não palavras diferentes.
    expect(new Set(palavrasReveladas).size).toBe(1);
  });
});
