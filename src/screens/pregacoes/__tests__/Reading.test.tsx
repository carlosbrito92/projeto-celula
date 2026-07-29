import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PregacaoConteudo, PregacaoRow } from '../../../content/types';
import { Reading } from '../Reading';

const conteudo: PregacaoConteudo = {
  metadados: {
    serie: 'Religião Tóxica',
    tema: 'A Graça Não É o Que Você Pensa',
    pregador: 'Pastor Pedro Estrella',
  },
  banner_intro: {
    contextualizacao: 'Segundo capítulo da série. No episódio anterior...',
    componente_tema: {
      variante: 'label_box',
      dados: {
        titulo: 'Antídoto',
        campos: [{ campo: 'Status', valor: 'Instável' }],
      },
    },
    frase_sintese: 'Frase de abertura.',
  },
  mapa_pontos: [
    { id: 'bloco-0', numero: '·', titulo: 'Quem É a Graça?' },
    { id: 'bloco-1', numero: '01', titulo: 'A Lei Foi Feita Para Quem?' },
  ],
  secoes: [
    {
      id: 'bloco-0',
      numero: '·',
      titulo: 'Quem É a Graça?',
      sec_eyebrow: 'Fundação',
      referencias: 'Efésios 2.8-9',
      corpo: [{ tipo: 'paragrafo', texto: 'A **graça** é uma pessoa.' }],
    },
    {
      id: 'bloco-1',
      numero: '01',
      titulo: 'A Lei Foi Feita Para Quem?',
      sec_eyebrow: 'Subtema 1',
      corpo: [{ tipo: 'paragrafo', texto: 'A Lei revela o pecado.' }],
    },
  ],
  resumo_final: [{ ponto: 'Resumo do ponto 1', versiculo_ancora: 'João 1.14' }],
};

const pregacaoRow: PregacaoRow = {
  id: 'sermon-1',
  serie: 'Religião Tóxica',
  capitulo: 'Capítulo 2',
  tema: 'A Graça Não É o Que Você Pensa',
  data: '2026-07-26',
  pregador: 'Pastor Pedro Estrella',
  texto_base: 'Efésios 2.8-9',
  modo_origem: 'A',
  conteudo,
  created_at: '2026-07-26T00:00:00Z',
  updated_at: '2026-07-26T00:00:00Z',
};

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: pregacaoRow, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock('../../../router/Router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('Reading', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
  });

  it('clicar num item do índice rola para a seção certa via scrollIntoView (nunca via href puro)', async () => {
    render(<Reading id="sermon-1" />);

    const ocorrencias = await screen.findAllByText('A Lei Foi Feita Para Quem?');
    const cardIndice = ocorrencias.map((el) => el.closest('button')).find(Boolean);
    expect(cardIndice).toBeTruthy();

    fireEvent.click(cardIndice!);

    const secaoAlvo = document.getElementById('bloco-1');
    expect(secaoAlvo).not.toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', block: 'start' }),
    );
    // garante que foi chamado no elemento certo, não em qualquer um
    expect((Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.instances[0]).toBe(
      secaoAlvo,
    );
  });

  it('renderiza título, badge de série e conteúdo das seções', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    expect(screen.getAllByText('Religião Tóxica').length).toBeGreaterThan(0);
    expect(screen.getByText('Resumo do ponto 1')).toBeInTheDocument();
  });

  it('renderiza banner_intro.contextualizacao e banner_intro.componente_tema (label_box)', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    expect(
      screen.getByText('Segundo capítulo da série. No episódio anterior...'),
    ).toBeInTheDocument();
    expect(screen.getByText('Antídoto')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Instável')).toBeInTheDocument();
  });

  it('FAB aparece quando o índice sai da viewport — regressão: o observer precisa se anexar ao elemento real, não a um ref nulo capturado durante o estado de carregamento', async () => {
    let observedElement: Element | null = null;
    let intersectionCallback: ((entries: { isIntersecting: boolean }[]) => void) | null = null;

    class FakeIntersectionObserver {
      constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
        intersectionCallback = cb;
      }
      observe(el: Element) {
        observedElement = el;
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    // Se o bug do ref-nulo-no-carregamento voltar, observedElement fica null aqui.
    expect(observedElement).not.toBeNull();
    expect(observedElement).toBe(document.getElementById('indice'));
    expect(screen.queryByText('☰ Índice')).not.toBeInTheDocument();

    intersectionCallback!([{ isIntersecting: false }]);
    expect(await screen.findByText('☰ Índice')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
