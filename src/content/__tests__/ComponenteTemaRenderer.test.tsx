import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ComponenteTemaRenderer } from '../ComponenteTemaRenderer';
import type { BlocoComponenteTema } from '../types';

describe('ComponenteTemaRenderer', () => {
  it('renderiza stage', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'stage',
          dados: { label: 'Lição', frase: 'Frase projetada', subtitulo: 'Contexto' },
        }}
      />,
    );
    expect(screen.getByText('Lição')).toBeInTheDocument();
    expect(screen.getByText('Frase projetada')).toBeInTheDocument();
    expect(screen.getByText('Contexto')).toBeInTheDocument();
  });

  it('renderiza diagnostico com todos os itens', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'diagnostico',
          dados: { label: 'Sintomas', itens: ['Sintoma A', 'Sintoma B'] },
        }}
      />,
    );
    expect(screen.getByText('Sintomas')).toBeInTheDocument();
    expect(screen.getByText('Sintoma A')).toBeInTheDocument();
    expect(screen.getByText('Sintoma B')).toBeInTheDocument();
  });

  it('renderiza antidoto', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'antidoto',
          dados: { label: 'Tratamento', texto: 'A graça.' },
        }}
      />,
    );
    expect(screen.getByText('Tratamento')).toBeInTheDocument();
    expect(screen.getByText('A graça.')).toBeInTheDocument();
  });

  it('renderiza versus com os dois lados', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'versus',
          dados: {
            lado_a: { label: 'A Religião Ensina', citacao: 'Faça para merecer' },
            lado_b: { label: 'O Evangelho Ensina', citacao: 'Já foi feito por você' },
          },
        }}
      />,
    );
    expect(screen.getByText('A Religião Ensina')).toBeInTheDocument();
    expect(screen.getByText('“Faça para merecer”')).toBeInTheDocument();
    expect(screen.getByText('O Evangelho Ensina')).toBeInTheDocument();
    expect(screen.getByText('“Já foi feito por você”')).toBeInTheDocument();
  });

  it('renderiza analogia com múltiplos parágrafos e conclusão', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'analogia',
          dados: {
            label: 'Ilustração — X',
            corpo: ['Parágrafo um.', 'Parágrafo dois.'],
            conclusao: 'A virada.',
          },
        }}
      />,
    );
    expect(screen.getByText('Parágrafo um.')).toBeInTheDocument();
    expect(screen.getByText('Parágrafo dois.')).toBeInTheDocument();
    expect(screen.getByText('A virada.')).toBeInTheDocument();
  });

  it('renderiza banho_list numerando os itens', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{
          tipo: 'componente_tema',
          variante: 'banho_list',
          dados: { itens: ['Primeiro item', 'Segundo item'] },
        }}
      />,
    );
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('Primeiro item')).toBeInTheDocument();
  });

  it('renderiza humor', () => {
    render(
      <ComponenteTemaRenderer
        bloco={{ tipo: 'componente_tema', variante: 'humor', dados: { texto: 'Uma piada.' } }}
      />,
    );
    expect(screen.getByText('Uma piada.')).toBeInTheDocument();
  });

  it('ignora variante desconhecida sem quebrar', () => {
    const bloco = {
      tipo: 'componente_tema',
      variante: 'verb_block',
      dados: {},
    } as unknown as BlocoComponenteTema;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<ComponenteTemaRenderer bloco={bloco} />);
    expect(container).toBeEmptyDOMElement();
    warnSpy.mockRestore();
  });
});
