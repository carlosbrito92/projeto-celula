import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { novaPregacao, type Conteudo } from '../../../editorial/modelo';
import { definirCaminho } from '../../../editorial/caminho';
import { Editor } from '../Editor';

const navigate = vi.fn();
vi.mock('../../../router/Router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useRouter: () => ({ navigate, path: '/editorial/r1' }),
}));

const CODIGO = 'codigo-bom-1234567';

function pronta(): Conteudo {
  let c = novaPregacao();
  c = definirCaminho(c, ['metadados', 'serie'], 'Avulsa');
  c = definirCaminho(c, ['metadados', 'tema'], 'Fé que move');
  c = definirCaminho(c, ['banner_intro', 'frase_sintese'], 'A fé move.');
  c = definirCaminho(c, ['mapa_pontos', 0, 'titulo'], 'Primeiro');
  c = definirCaminho(c, ['secoes', 0, 'corpo', 0, 'texto'], 'Texto do ponto.');
  return c;
}

interface Estado {
  conteudo: unknown;
  versao: number;
  arquivo: string | null;
  conflito?: boolean;
}

/** Servidor falso de rascunhos + publicação, guardando cada chamada. */
function servidor(inicial: Estado) {
  const estado = { ...inicial };
  const chamadas: { metodo: string; url: string; corpo?: Record<string, unknown> }[] = [];
  const json = (status: number, corpo: unknown) => new Response(JSON.stringify(corpo), { status });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET';
      const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;
      chamadas.push({ metodo, url, corpo });
      if (url.endsWith('/publicar')) {
        return json(200, { ok: true, prUrl: 'https://gh/pr/5', prNumero: 5, prNovo: !corpo.arquivo, arquivo: corpo.arquivo ?? 'fe-que-move.json' });
      }
      if (metodo === 'GET') return json(200, { id: 'r1', tema: '', atualizado_em: 't', ...estado });
      if (metodo === 'PUT') {
        if (estado.conflito || corpo.versao !== estado.versao) return json(409, { erro: 'mudou', versaoAtual: estado.versao });
        estado.conteudo = corpo.conteudo;
        estado.versao += 1;
        estado.arquivo = corpo.arquivo ?? estado.arquivo;
        return json(200, { id: 'r1', tema: '', atualizado_em: 't', versao: estado.versao, arquivo: estado.arquivo });
      }
      return json(500, {});
    }),
  );
  return { estado, chamadas };
}

describe('Editor guiado', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('celula:editorial:codigo', CODIGO);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sem código salvo: volta para o painel', () => {
    localStorage.clear();
    servidor({ conteudo: {}, versao: 1, arquivo: null });
    render(<Editor id="r1" />);
    expect(navigate).toHaveBeenCalledWith('/editorial');
  });

  it('edição vira autosave no servidor com a versão atual', async () => {
    const { estado, chamadas } = servidor({ conteudo: novaPregacao(), versao: 1, arquivo: null });
    render(<Editor id="r1" />);
    fireEvent.change(await screen.findByLabelText(/Tema \(título/), { target: { value: 'Graça' } });
    expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(5000));
    await waitFor(() => expect(screen.getByText('Salvo')).toBeInTheDocument());
    const put = chamadas.find((c) => c.metodo === 'PUT');
    expect(put?.corpo).toMatchObject({ versao: 1 });
    expect((estado.conteudo as Conteudo).metadados.tema).toBe('Graça');
    expect(localStorage.getItem('celula:editorial:rascunho:r1')).toBeNull();
  });

  it('enviar incompleto: não chama o servidor, lista pendências e leva ao campo', async () => {
    const { chamadas } = servidor({ conteudo: novaPregacao(), versao: 1, arquivo: null });
    render(<Editor id="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar para revisão' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Faltam \d+ ajuste/);
    expect(chamadas.some((c) => c.url.endsWith('/publicar'))).toBe(false);
    const item = screen.getByRole('button', { name: /Dados gerais › tema/ });
    fireEvent.click(item);
    expect(document.activeElement).toBe(screen.getByLabelText(/Tema \(título/));
  });

  it('enviar pronta: publica sem arquivo, grava o arquivo no rascunho e o próximo envio é correção', async () => {
    const { estado, chamadas } = servidor({ conteudo: pronta(), versao: 1, arquivo: null });
    render(<Editor id="r1" />);
    expect(await screen.findByText('Pronta para enviar')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar para revisão' }));
    expect(await screen.findByText(/Enviado para revisão/)).toBeInTheDocument();

    const pub = chamadas.find((c) => c.url.endsWith('/publicar'));
    expect(pub?.corpo).not.toHaveProperty('arquivo');
    const enviada = pub?.corpo?.pregacao as Conteudo;
    expect(enviada.metadados).toEqual({ serie: 'Avulsa', tema: 'Fé que move' }); // opcionais vazios saem
    expect(enviada.secoes[0].titulo).toBe('Primeiro'); // herdou o título do índice
    await waitFor(() => expect(estado.arquivo).toBe('fe-que-move.json'));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar correção' }));
    await waitFor(() => expect(chamadas.filter((c) => c.url.endsWith('/publicar'))).toHaveLength(2));
    expect(chamadas.filter((c) => c.url.endsWith('/publicar'))[1].corpo).toMatchObject({ arquivo: 'fe-que-move.json' });
  });

  it('conflito de versão: avisa e não sobrescreve; "Usar a versão salva" recarrega', async () => {
    const s = servidor({ conteudo: pronta(), versao: 1, arquivo: null, conflito: true });
    render(<Editor id="r1" />);
    fireEvent.change(await screen.findByLabelText(/Tema \(título/), { target: { value: 'Minha versão' } });
    await act(async () => vi.advanceTimersByTime(5000));
    expect(await screen.findByText('Conflito de versão')).toBeInTheDocument();
    s.estado.conflito = false;
    fireEvent.click(screen.getByRole('button', { name: 'Usar a versão salva' }));
    await waitFor(() => expect(screen.getByLabelText(/Tema \(título/)).toHaveValue('Fé que move'));
    expect(screen.getByText('Salvo')).toBeInTheDocument();
  });

  it('recupera alterações locais não salvas da mesma versão', async () => {
    const local = definirCaminho(pronta(), ['metadados', 'tema'], 'Editado offline');
    localStorage.setItem('celula:editorial:rascunho:r1', JSON.stringify({ versao: 3, conteudo: local }));
    servidor({ conteudo: pronta(), versao: 3, arquivo: null });
    render(<Editor id="r1" />);
    expect(await screen.findByText(/Recuperamos alterações/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tema \(título/)).toHaveValue('Editado offline');
  });

  it('cache local de versão antiga é descartado (servidor mais novo vence)', async () => {
    const local = definirCaminho(pronta(), ['metadados', 'tema'], 'Velho');
    localStorage.setItem('celula:editorial:rascunho:r1', JSON.stringify({ versao: 1, conteudo: local }));
    servidor({ conteudo: pronta(), versao: 2, arquivo: null });
    render(<Editor id="r1" />);
    expect(await screen.findByLabelText(/Tema \(título/)).toHaveValue('Fé que move');
    expect(localStorage.getItem('celula:editorial:rascunho:r1')).toBeNull();
  });

  it('adicionar ponto e bloco pela interface', async () => {
    servidor({ conteudo: pronta(), versao: 1, arquivo: null });
    render(<Editor id="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: '+ Adicionar ponto' }));
    expect(screen.getAllByLabelText(/Título no índice/)).toHaveLength(2);
    const select = screen.getAllByLabelText('Adicionar bloco')[1];
    fireEvent.change(select, { target: { value: 'versiculo' } });
    fireEvent.click(within(select.parentElement as HTMLElement).getByRole('button', { name: 'Adicionar' }));
    expect(screen.getAllByLabelText(/^Referência\s*\*?$/)).toHaveLength(1);
    expect(screen.getByLabelText(/Texto bíblico/)).toBeInTheDocument();
  });
});
