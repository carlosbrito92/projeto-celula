import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ListaChips } from '../ListaChips';

describe('ListaChips', () => {
  it('renderiza um chip por item', () => {
    render(<ListaChips itens={['Ana', 'Beto']} onChange={() => {}} placeholder="nome" />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Beto')).toBeInTheDocument();
  });

  it('adiciona um item ao digitar e apertar Enter', () => {
    const onChange = vi.fn();
    render(<ListaChips itens={['Ana']} onChange={onChange} placeholder="nome" />);
    const input = screen.getByPlaceholderText('nome');
    fireEvent.change(input, { target: { value: 'Carla' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Ana', 'Carla']);
  });

  it('adiciona um item ao clicar no botão "+ nome"', () => {
    const onChange = vi.fn();
    render(<ListaChips itens={[]} onChange={onChange} placeholder="nome" />);
    fireEvent.change(screen.getByPlaceholderText('nome'), { target: { value: 'Duda' } });
    fireEvent.click(screen.getByText('+ nome'));
    expect(onChange).toHaveBeenCalledWith(['Duda']);
  });

  it('não adiciona string vazia/só espaços', () => {
    const onChange = vi.fn();
    render(<ListaChips itens={[]} onChange={onChange} placeholder="nome" />);
    fireEvent.change(screen.getByPlaceholderText('nome'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('+ nome'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('remove um item ao clicar no chip', () => {
    const onChange = vi.fn();
    render(<ListaChips itens={['Ana', 'Beto']} onChange={onChange} placeholder="nome" />);
    fireEvent.click(screen.getByText('Ana'));
    expect(onChange).toHaveBeenCalledWith(['Beto']);
  });
});
