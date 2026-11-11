import { afterEach, describe, expect, it, vi } from 'vitest';
import { apagarRascunho, ErroEditorial, listarRascunhos } from '../api';

const resposta = (status: number, corpo?: unknown) =>
  new Response(corpo === undefined ? null : JSON.stringify(corpo), { status });

describe('cliente editorial', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('manda o código no header X-Editorial-Codigo', async () => {
    const f = vi.fn(async () => resposta(200, { rascunhos: [] }));
    vi.stubGlobal('fetch', f);
    await listarRascunhos('abc');
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/editorial\/rascunhos$/);
    expect((init.headers as Record<string, string>)['X-Editorial-Codigo']).toBe('abc');
  });

  it.each([
    [401, /Código inválido/],
    [403, /Espere um minuto/],
    [500, /indisponível/],
  ])('status %i vira mensagem para o líder', async (status, msg) => {
    vi.stubGlobal('fetch', vi.fn(async () => resposta(status, { erro: 'x' })));
    const e = await listarRascunhos('abc').catch((err: unknown) => err);
    expect(e).toBeInstanceOf(ErroEditorial);
    expect((e as ErroEditorial).status).toBe(status);
    expect((e as ErroEditorial).message).toMatch(msg);
  });

  it('falha de rede vira status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('offline'))));
    await expect(listarRascunhos('abc')).rejects.toMatchObject({ status: 0 });
  });

  it('DELETE com 204 resolve sem corpo', async () => {
    const f = vi.fn(async () => resposta(204));
    vi.stubGlobal('fetch', f);
    await expect(apagarRascunho('abc', 'id-1')).resolves.toBeUndefined();
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[1].method).toBe('DELETE');
  });
});
