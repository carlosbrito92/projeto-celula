import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Painel } from '../Painel';

vi.mock('../../../router/Router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

const CHAVE = 'celula:editorial:codigo';
const BOM = 'codigo-bom-1234567';

const rascunhos = [
  { id: 'r1', arquivo: null, tema: 'Fé que move', versao: 1, atualizado_em: '2026-11-10T12:00:00Z' },
  { id: 'r2', arquivo: 'graca.json', tema: 'Graça', versao: 3, atualizado_em: '2026-11-09T12:00:00Z' },
  { id: 'r3', arquivo: 'esperanca.json', tema: '', versao: 2, atualizado_em: '2026-11-08T12:00:00Z' },
];

/** Servidor falso: rascunhos exigem o código BOM; /pregacoes é público. */
function servidor() {
  const lista = [...rascunhos];
  const f = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/api/pregacoes')) {
      return new Response(JSON.stringify([{ id: 'p', arquivo_origem: 'esperanca.json' }]), { status: 200 });
    }
    const codigo = (init?.headers as Record<string, string> | undefined)?.['X-Editorial-Codigo'];
    if (codigo !== BOM) return new Response(JSON.stringify({ erro: 'Código editorial inválido.' }), { status: 401 });
    if (init?.method === 'DELETE') {
      const id = url.split('/').pop();
      lista.splice(lista.findIndex((r) => r.id === id), 1);
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify({ rascunhos: lista }), { status: 200 });
  });
  vi.stubGlobal('fetch', f);
  return f;
}

function entrarCom(codigo: string) {
  fireEvent.change(screen.getByLabelText('Código de líder'), { target: { value: codigo } });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('Painel Editorial', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('sem código salvo: pede o código, não chama o servidor', () => {
    const f = servidor();
    render(<Painel />);
    expect(screen.getByLabelText('Código de líder')).toHaveAttribute('type', 'password');
    expect(f).not.toHaveBeenCalled();
  });

  it('código inválido: mensagem, nada salvo no localStorage', async () => {
    servidor();
    render(<Painel />);
    entrarCom('errado-errado-errado');
    expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido');
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('código válido: lista rascunhos com status derivado e lembra o código', async () => {
    servidor();
    render(<Painel />);
    entrarCom(BOM);
    expect(await screen.findByText('Fé que move')).toBeInTheDocument();
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Em revisão')).toBeInTheDocument();
    expect(screen.getByText('Publicado')).toBeInTheDocument();
    expect(screen.getByText('Sem título')).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBe(BOM);
  });

  it('código salvo: entra direto; código revogado volta para a entrada e é esquecido', async () => {
    servidor();
    localStorage.setItem(CHAVE, BOM);
    const { unmount } = render(<Painel />);
    expect(await screen.findByText('Graça')).toBeInTheDocument();
    unmount();

    localStorage.setItem(CHAVE, 'revogado-revogado-1');
    render(<Painel />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Código inválido');
    expect(screen.getByLabelText('Código de líder')).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBeNull();
  });

  it('apagar pede confirmação antes de chamar DELETE', async () => {
    const f = servidor();
    localStorage.setItem(CHAVE, BOM);
    render(<Painel />);
    await screen.findByText('Fé que move');

    fireEvent.click(screen.getAllByRole('button', { name: 'Apagar' })[0]);
    expect(f.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(() => expect(screen.queryByText('Fé que move')).not.toBeInTheDocument());
    expect(f.mock.calls.some(([url, init]) => init?.method === 'DELETE' && String(url).endsWith('/r1'))).toBe(true);
  });

  it('sair esquece o código', async () => {
    servidor();
    localStorage.setItem(CHAVE, BOM);
    render(<Painel />);
    await screen.findByText('Graça');
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(localStorage.getItem(CHAVE)).toBeNull();
    expect(screen.getByLabelText('Código de líder')).toBeInTheDocument();
  });

  it('servidor fora do ar (500): oferece tentar de novo sem esquecer o código', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    localStorage.setItem(CHAVE, BOM);
    render(<Painel />);
    expect(await screen.findByRole('alert')).toHaveTextContent('indisponível');
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
    expect(localStorage.getItem(CHAVE)).toBe(BOM);
  });
});
