import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Library } from '../Library';

const navigate = vi.fn();
vi.mock('../../../router/Router', () => ({
  Link: ({ children, to, className, onClick }: { children: React.ReactNode; to: string; className?: string; onClick?: () => void }) => (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  ),
}));

const linha = (id: string, serie: string, data: string | null, capitulo: string | null = null) => ({
  id,
  serie,
  data,
  tema: `Tema ${id}`,
  capitulo,
  pregador: 'Pastor Pedro Estrella',
  created_at: '2026-01-01',
  conteudo: { metadados: {}, banner_intro: { frase_sintese: `Frase ${id}` } },
});

const API = [
  linha('m1', 'Maranata', '2026-11-08T00:00:00.000Z', 'Capítulo 1'),
  linha('s1', 'Uma Vez Salvo', '2026-08-23T00:00:00.000Z', 'Capítulo 1'),
  linha('s2', 'Uma Vez Salvo', '2026-08-30T00:00:00.000Z', 'Capítulo 2'),
  linha('a1', 'Avulsa', '2026-04-21T00:00:00.000Z'),
];

describe('Página inicial', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    navigate.mockClear();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(API), { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('destaque, faixa da série com capítulos em ordem e outras mensagens', async () => {
    render(<Library />);
    const destaque = await screen.findByRole('region', { name: 'Mais recente' });
    expect(within(destaque).getByText('Tema m1')).toBeInTheDocument();
    expect(within(destaque).getByText('Frase m1')).toBeInTheDocument();

    const serie = screen.getByRole('region', { name: 'Uma Vez Salvo' });
    const titulos = within(serie).getAllByText(/^Tema s/).map((el) => el.textContent);
    expect(titulos).toEqual(['Tema s1', 'Tema s2']);
    expect(within(serie).getByText('Cap. 1')).toBeInTheDocument();
    expect(within(serie).getAllByText('Pr. Pedro Estrella · 23 ago 2026')).toHaveLength(1);

    const outras = screen.getByRole('region', { name: 'Outras mensagens' });
    expect(within(outras).getByText('Tema a1')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Continuar lendo' })).toBeNull();
  });

  it('chip de série mostra só ela, em ordem; "Todas" volta', async () => {
    render(<Library />);
    await screen.findByRole('region', { name: 'Mais recente' });
    fireEvent.click(screen.getByRole('button', { name: 'Uma Vez Salvo' }));
    expect(screen.getByRole('button', { name: 'Uma Vez Salvo' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('region', { name: 'Mais recente' })).toBeNull();
    expect(screen.getAllByText(/^Tema /).map((el) => el.textContent)).toEqual(['Tema s1', 'Tema s2']);

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }));
    expect(screen.getByRole('region', { name: 'Mais recente' })).toBeInTheDocument();
  });

  it('"N mensagens" da faixa abre a série', async () => {
    render(<Library />);
    fireEvent.click(await screen.findByRole('button', { name: '2 mensagens →' }));
    expect(screen.getByRole('heading', { name: 'Uma Vez Salvo' })).toBeInTheDocument();
  });

  it('busca mostra resultados e ignora o filtro', async () => {
    render(<Library />);
    await screen.findByRole('region', { name: 'Mais recente' });
    fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'tema a1' } });
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.getByText('Tema a1')).toBeInTheDocument();
  });

  it('continuar lendo: mostra o progresso e marca a retomada ao clicar', async () => {
    localStorage.setItem('celula:leitura:ultima', JSON.stringify({ id: 's1', progresso: 62, pontoId: 'p4', ponto: 4, totalPontos: 7 }));
    render(<Library />);
    const continuar = await screen.findByRole('region', { name: 'Continuar lendo' });
    expect(within(continuar).getByRole('progressbar', { name: '62% lido' })).toBeInTheDocument();
    expect(within(continuar).getByText('62% lido · ponto 4 de 7')).toBeInTheDocument();
    fireEvent.click(within(continuar).getByText('Tema s1'));
    expect(navigate).toHaveBeenCalledWith('/pregacoes/s1');
    expect(sessionStorage.getItem('celula:leitura:retomar')).toBe('s1');
  });

  it('continuar lendo some quando a leitura terminou ou a pregação não existe mais', async () => {
    localStorage.setItem('celula:leitura:ultima', JSON.stringify({ id: 's1', progresso: 97, pontoId: null, ponto: 7, totalPontos: 7 }));
    const { unmount } = render(<Library />);
    await screen.findByRole('region', { name: 'Mais recente' });
    expect(screen.queryByRole('region', { name: 'Continuar lendo' })).toBeNull();
    unmount();
    localStorage.setItem('celula:leitura:ultima', JSON.stringify({ id: 'sumiu', progresso: 40 }));
    render(<Library />);
    await screen.findByRole('region', { name: 'Mais recente' });
    expect(screen.queryByRole('region', { name: 'Continuar lendo' })).toBeNull();
  });
});
