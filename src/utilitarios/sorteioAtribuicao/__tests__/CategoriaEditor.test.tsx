import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategoriaEditor } from '../CategoriaEditor';

const categorias = [
  { nome: 'Objetos da casa', palavras: ['Cadeira', 'Geladeira', 'Escada'] },
  { nome: 'Animais', palavras: ['Gato', 'Elefante'] },
];

describe('CategoriaEditor', () => {
  it('renderiza só os nomes das categorias — nunca as palavras (garantia central da spec)', () => {
    render(
      <CategoriaEditor
        categorias={categorias}
        categoriaEscolhida={null}
        onEscolher={() => {}}
        totalParticipantes={3}
      />,
    );
    expect(screen.getByText('Objetos da casa')).toBeInTheDocument();
    expect(screen.getByText('Animais')).toBeInTheDocument();

    for (const c of categorias) {
      for (const palavra of c.palavras) {
        expect(screen.queryByText(palavra)).not.toBeInTheDocument();
      }
    }
  });

  it('clicar numa categoria chama onEscolher com o nome dela', () => {
    const onEscolher = vi.fn();
    render(
      <CategoriaEditor
        categorias={categorias}
        categoriaEscolhida={null}
        onEscolher={onEscolher}
        totalParticipantes={3}
      />,
    );
    fireEvent.click(screen.getByText('Animais'));
    expect(onEscolher).toHaveBeenCalledWith('Animais');
  });

  it('mostra aviso quando a categoria escolhida tem menos palavras que participantes', () => {
    render(
      <CategoriaEditor
        categorias={categorias}
        categoriaEscolhida="Animais"
        onEscolher={() => {}}
        totalParticipantes={3}
      />,
    );
    expect(screen.getByText(/só 2 palavra\(s\) para 3 participantes/)).toBeInTheDocument();
  });

  it('mostra confirmação quando a categoria escolhida tem palavras suficientes', () => {
    render(
      <CategoriaEditor
        categorias={categorias}
        categoriaEscolhida="Objetos da casa"
        onEscolher={() => {}}
        totalParticipantes={3}
      />,
    );
    expect(screen.getByText(/pronto para sortear/)).toBeInTheDocument();
  });

  it('sem categoria escolhida, não mostra nem aviso nem confirmação', () => {
    render(
      <CategoriaEditor
        categorias={categorias}
        categoriaEscolhida={null}
        onEscolher={() => {}}
        totalParticipantes={3}
      />,
    );
    expect(screen.queryByText(/pronto para sortear/)).not.toBeInTheDocument();
    expect(screen.queryByText(/participantes/)).not.toBeInTheDocument();
  });
});
