import { API_BASE_URL } from '../lib/api';

// Cliente das rotas do Painel Editorial (api/editorial/*). O código do líder
// vai sempre no header X-Editorial-Codigo; o servidor valida em toda request.
// Nada aqui é barreira de segurança — só transporte e tradução de erro.

export interface ResumoRascunho {
  id: string;
  arquivo: string | null;
  tema: string;
  versao: number;
  atualizado_em: string;
}

export class ErroEditorial extends Error {
  readonly status: number;
  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroEditorial';
    this.status = status;
  }
}

/** Mensagem para o líder, por status. 403 = regra de rate limit do Vercel Firewall. */
export function mensagemDeErro(status: number, doServidor?: string): string {
  if (status === 401) return 'Código inválido. Confira com o Carlos.';
  if (status === 403 || status === 429) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  if (status === 0) return 'Sem conexão com o servidor. Confira a internet.';
  if (status >= 500) return 'O painel está indisponível agora. Tente mais tarde.';
  return doServidor ?? `Erro inesperado (${status}).`;
}

async function chamar<T>(codigo: string, caminho: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/editorial${caminho}`, {
      ...init,
      headers: { 'X-Editorial-Codigo': codigo, ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch {
    throw new ErroEditorial(0, mensagemDeErro(0));
  }
  if (res.status === 204) return undefined as T;
  const corpo = (await res.json().catch(() => ({}))) as { erro?: string };
  if (!res.ok) throw new ErroEditorial(res.status, mensagemDeErro(res.status, corpo.erro));
  return corpo as T;
}

export async function listarRascunhos(codigo: string): Promise<ResumoRascunho[]> {
  const r = await chamar<{ rascunhos: ResumoRascunho[] }>(codigo, '/rascunhos');
  return r.rascunhos;
}

export function apagarRascunho(codigo: string, id: string): Promise<void> {
  return chamar<void>(codigo, `/rascunhos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
