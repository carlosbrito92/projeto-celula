import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PregacaoConteudo, PregacaoRow } from '../../../content/types';
import { Reading } from '../Reading';

const RESUMO_ID = 'resumo-final';

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
    versiculo_ancora: {
      referencia: 'Efésios 2.8-9 — Texto-âncora',
      texto: 'Porque pela graça sois salvos, mediante a fé.',
    },
    aviso_proxima_serie: {
      texto: 'A partir do próximo domingo, nova série.',
    },
  },
  mapa_pontos: [
    { id: 'bloco-0', numero: '·', titulo: 'Quem É a Graça?' },
    { id: 'bloco-1', numero: '01', titulo: 'A Lei Foi Feita Para Quem?' },
    { id: 'bloco-2', numero: '02', titulo: 'Ponto Não Desenvolvido', pendente: true },
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
  resumo_curto: {
    frase_tema: 'A graça é maior que a Lei.',
    pontos: ['Ponto resumido 1.', 'Ponto resumido 2.'],
    versiculo_chave: { referencia: 'Efésios 2.8-9', texto: 'Porque pela graça sois salvos.' },
  },
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

vi.mock('../../../lib/api', () => ({
  apiGet: vi.fn(() => Promise.resolve(pregacaoRow)),
}));

vi.mock('../../../router/Router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

class FakeIntersectionObserver {
  static instancias: FakeIntersectionObserver[] = [];
  callback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  observados: Element[] = [];

  constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    this.callback = callback;
    FakeIntersectionObserver.instancias.push(this);
  }
  observe(el: Element) {
    this.observados.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }

  emitir(id: string, isIntersecting: boolean, intersectionRatio: number) {
    const target = this.observados.find((el) => el.id === id)!;
    this.callback([{ target, isIntersecting, intersectionRatio }]);
  }
}

describe('Reading', () => {
  beforeEach(() => {
    vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
    FakeIntersectionObserver.instancias = [];
  });

  it('clicar num item do índice (#indice) rola para a seção certa via scrollIntoView', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    const indice = document.getElementById('indice')!;
    const cardIndice = within(indice)
      .getByText('A Lei Foi Feita Para Quem?')
      .closest('button');
    expect(cardIndice).toBeTruthy();

    fireEvent.click(cardIndice!);

    const secaoAlvo = document.getElementById('bloco-1');
    expect(secaoAlvo).not.toBeNull();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth', block: 'start' }),
    );
    expect((Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.instances[0]).toBe(
      secaoAlvo,
    );
  });

  it('ponto pendente (mapa_pontos[].pendente): sem botão nem no índice nem na trilha', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    const ocorrencias = screen.getAllByText('Ponto Não Desenvolvido');
    expect(ocorrencias.length).toBe(2); // trilha + índice grid
    ocorrencias.forEach((el) => {
      expect(el.closest('button')).toBeNull();
    });

    const chamadasAntes = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls
      .length;
    fireEvent.click(ocorrencias[0].closest('div')!);
    expect(
      (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(chamadasAntes);
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

  it('renderiza banner_intro.versiculo_ancora entre a frase-síntese e o índice', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    expect(
      screen.getByText('“Porque pela graça sois salvos, mediante a fé.”'),
    ).toBeInTheDocument();
    expect(screen.getByText('Efésios 2.8-9 — Texto-âncora')).toBeInTheDocument();
  });

  it('renderiza banner_intro.aviso_proxima_serie com ícone, perto do rodapé', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    expect(
      screen.getByText('A partir do próximo domingo, nova série.'),
    ).toBeInTheDocument();
    expect(screen.getByText('✦')).toBeInTheDocument();
  });

  it('botão "Aa" cicla o tamanho de fonte de leitura', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    const { container } = render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    const wrapper = container.querySelector('[class*="wrapper"]') as HTMLElement;
    expect(wrapper.style.getPropertyValue('--leitura-escala')).toBe('1');

    const botaoFonte = screen.getByRole('button', { name: 'Ajustar tamanho da fonte de leitura' });
    fireEvent.click(botaoFonte);
    expect(wrapper.style.getPropertyValue('--leitura-escala')).toBe('1.15');

    fireEvent.click(botaoFonte);
    expect(wrapper.style.getPropertyValue('--leitura-escala')).toBe('1.3');

    fireEvent.click(botaoFonte);
    expect(wrapper.style.getPropertyValue('--leitura-escala')).toBe('1');

    vi.unstubAllGlobals();
  });

  it('trilha de tópicos: chip ativo muda quando a seção com maior interseção muda', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    await waitFor(() => expect(FakeIntersectionObserver.instancias.length).toBeGreaterThan(0));

    const trilha = screen.getByRole('navigation', { name: 'Trilha de tópicos' });
    const chipBloco1 = within(trilha).getByText('A Lei Foi Feita Para Quem?').closest('button')!;
    expect(chipBloco1.getAttribute('aria-hidden')).toBeNull();
    expect(chipBloco1.className).not.toMatch(/chipAtivo/);

    act(() => {
      FakeIntersectionObserver.instancias[0].emitir('bloco-1', true, 0.8);
    });

    expect(chipBloco1.className).toMatch(/chipAtivo/);

    vi.unstubAllGlobals();
  });

  it('nav inferior: avança/retrocede entre tópicos navegáveis e desabilita nas pontas', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    await waitFor(() => expect(FakeIntersectionObserver.instancias.length).toBeGreaterThan(0));

    // ativo inicial = índice 0 (bloco-0) -> anterior desabilitado, próximo = bloco-1
    const anteriorBotao = screen.getByRole('button', { name: 'Tópico anterior' });
    const proximoBotao = screen.getByRole('button', { name: 'Próximo tópico' });
    expect(anteriorBotao).toBeDisabled();
    expect(proximoBotao).not.toBeDisabled();
    const navInferior = screen.getByRole('navigation', { name: 'Navegação entre tópicos' });
    expect(within(navInferior).getByText('A Lei Foi Feita Para Quem?')).toBeInTheDocument();

    fireEvent.click(proximoBotao);
    const alvoClicado = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock
      .instances[0] as HTMLElement;
    expect(alvoClicado.id).toBe('bloco-1');

    // simula chegar no último ponto navegável (resumo) -> próximo desabilita
    act(() => {
      FakeIntersectionObserver.instancias[0].emitir(RESUMO_ID, true, 1);
    });
    expect(screen.getByRole('button', { name: 'Próximo tópico' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tópico anterior' })).not.toBeDisabled();

    vi.unstubAllGlobals();
  });

  it('botão "Ler versão resumida" abre o resumo_curto e "Ler a mensagem completa" volta para a leitura', async () => {
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    fireEvent.click(screen.getByRole('button', { name: /Ler versão resumida/ }));

    expect(screen.getByText('A graça é maior que a Lei.')).toBeInTheDocument();
    expect(screen.getByText('Ponto resumido 1.')).toBeInTheDocument();
    expect(screen.getByText('Ponto resumido 2.')).toBeInTheDocument();
    expect(screen.getByText('“Porque pela graça sois salvos.”')).toBeInTheDocument();
    expect(screen.getByText('Efésios 2.8-9')).toBeInTheDocument();
    expect(screen.queryByText('Índice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ler a mensagem completa' }));
    expect(screen.getByText('Índice')).toBeInTheDocument();
    expect(screen.queryByText('A graça é maior que a Lei.')).not.toBeInTheDocument();
  });

  it('trilha/nav inferior voltam a reagir ao scroll depois de fechar o resumo_curto (regressão)', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    await waitFor(() => expect(FakeIntersectionObserver.instancias.length).toBeGreaterThan(0));
    const instanciasAntes = FakeIntersectionObserver.instancias.length;

    fireEvent.click(screen.getByRole('button', { name: /Ler versão resumida/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Ler a mensagem completa' }));

    // o conteúdo principal desmontou e remontou (overlay substituiu a árvore
    // inteira) — o observer antigo ficou preso aos nós removidos; um novo
    // precisa ter sido criado e anexado aos nós reais atuais.
    await waitFor(() =>
      expect(FakeIntersectionObserver.instancias.length).toBeGreaterThan(instanciasAntes),
    );
    const instanciaAtual =
      FakeIntersectionObserver.instancias[FakeIntersectionObserver.instancias.length - 1];
    expect(instanciaAtual.observados.some((el) => el.id === 'bloco-1')).toBe(true);

    const trilha = screen.getByRole('navigation', { name: 'Trilha de tópicos' });
    const chipBloco1 = within(trilha).getByText('A Lei Foi Feita Para Quem?').closest('button')!;
    expect(chipBloco1.className).not.toMatch(/chipAtivo/);

    act(() => {
      instanciaAtual.emitir('bloco-1', true, 0.8);
    });

    expect(chipBloco1.className).toMatch(/chipAtivo/);

    vi.unstubAllGlobals();
  });

  it('sem resumo_curto: nenhum botão de versão resumida aparece', async () => {
    const { apiGet } = await import('../../../lib/api');
    const semResumoCurto = { ...conteudo, resumo_curto: undefined };
    vi.mocked(apiGet).mockResolvedValueOnce({ ...pregacaoRow, conteudo: semResumoCurto });

    render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');
    expect(screen.queryByRole('button', { name: 'Ler versão resumida' })).not.toBeInTheDocument();
  });

  it('barra de progresso reflete a posição de scroll do documento', async () => {
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'clientHeight', {
      value: 500,
      configurable: true,
    });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      configurable: true,
      writable: true,
    });

    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const { container } = render(<Reading id="sermon-1" />);
    await screen.findByText('A Graça Não É o Que Você Pensa');

    act(() => {
      (document.documentElement as unknown as { scrollTop: number }).scrollTop = 250;
      window.dispatchEvent(new Event('scroll'));
      rafCallback?.(0);
    });

    const preenchimento = container.querySelector(
      '[class*="progressoPreenchimento"]',
    ) as HTMLElement;
    expect(preenchimento.style.width).toBe('50%');

    vi.unstubAllGlobals();
  });
});
