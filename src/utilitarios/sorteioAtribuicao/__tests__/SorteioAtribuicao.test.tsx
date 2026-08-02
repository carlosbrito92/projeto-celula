import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SorteioAtribuicao } from '../SorteioAtribuicao';

function digitarNomes(nomes: string[]) {
  const input = screen.getByPlaceholderText('nome');
  for (const nome of nomes) {
    fireEvent.change(input, { target: { value: nome } });
    fireEvent.keyDown(input, { key: 'Enter' });
  }
}

describe('SorteioAtribuicao — sem categorias (comportamento original)', () => {
  it('mostra o campo de valores livres, não o seletor de categoria', () => {
    render(<SorteioAtribuicao aoFechar={() => {}} />);
    expect(screen.getByPlaceholderText('valor/palavra')).toBeInTheDocument();
  });
});

describe('SorteioAtribuicao — com categorias (docs/spec-privacidade-sorteio.md § banco de categorias)', () => {
  const categorias = [
    { nome: 'Objetos da casa', palavras: ['Cadeira', 'Geladeira', 'Escada'] },
    { nome: 'Animais', palavras: ['Gato', 'Elefante', 'Borboleta'] },
  ];

  it('mostra o seletor de categoria, nunca o campo de valores livres nem as palavras', () => {
    render(<SorteioAtribuicao categorias={categorias} aoFechar={() => {}} />);
    expect(screen.queryByPlaceholderText('valor/palavra')).not.toBeInTheDocument();
    expect(screen.getByText('Objetos da casa')).toBeInTheDocument();
    for (const c of categorias) {
      for (const palavra of c.palavras) {
        expect(screen.queryByText(palavra)).not.toBeInTheDocument();
      }
    }
  });

  it('Sortear fica desabilitado sem categoria escolhida', () => {
    render(<SorteioAtribuicao categorias={categorias} aoFechar={() => {}} />);
    digitarNomes(['Ana', 'Beto']);
    expect(screen.getByText('Sortear').closest('button')).toBeDisabled();
  });

  it('escolhe categoria, sorteia, e a palavra revelada nunca apareceu na tela de setup', () => {
    render(<SorteioAtribuicao categorias={categorias} aoFechar={() => {}} />);
    digitarNomes(['Ana', 'Beto']);
    fireEvent.click(screen.getByText('Objetos da casa'));

    const botaoSortear = screen.getByText('Sortear').closest('button')!;
    expect(botaoSortear).not.toBeDisabled();
    fireEvent.click(botaoSortear);

    // Fase de passagem — "Passe para" a primeira pessoa, ainda sem revelar nada.
    expect(screen.getByText(/Passe para/)).toBeInTheDocument();
    for (const palavra of categorias[0].palavras) {
      expect(screen.queryByText(palavra)).not.toBeInTheDocument();
    }

    fireEvent.click(screen.getByText('Revelar'));
    const revelada = categorias[0].palavras.find((p) => screen.queryByText(p));
    expect(revelada).toBeDefined();
  });

  it('categoria com menos palavras que participantes bloqueia o sorteio', () => {
    render(<SorteioAtribuicao categorias={categorias} aoFechar={() => {}} />);
    digitarNomes(['Ana', 'Beto', 'Carla', 'Duda']);
    fireEvent.click(screen.getByText('Animais'));
    expect(screen.getByText(/só 3 palavra\(s\) — precisa de pelo menos 4/)).toBeInTheDocument();
    expect(screen.getByText('Sortear').closest('button')).toBeDisabled();
  });
});
