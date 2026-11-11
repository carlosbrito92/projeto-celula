import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from './cors.js';
import { parseCodigos } from './editorialAuth.js';
import { executorNeon, repositorioSql, tratarRascunhos } from './rascunhos.js';

// Casca HTTP compartilhada por api/editorial/rascunhos/index.ts e [id].ts.
// Env vars (Vercel, nunca no client): EDITORIAL_CODIGOS e DATABASE_URL_RASCUNHOS
// (role editorial_rascunhos, migração 0004 — só rascunhos_pregacao).

export async function responderRascunhos(req: VercelRequest, res: VercelResponse, id?: unknown) {
  setCors(res, { metodos: 'GET, POST, PUT, DELETE, OPTIONS', headers: 'Content-Type, X-Editorial-Codigo' });
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = process.env.DATABASE_URL_RASCUNHOS;
  if (!url) {
    console.error('DATABASE_URL_RASCUNHOS não definida');
    return res.status(500).json({ erro: 'Rascunhos indisponíveis (configuração do servidor).' });
  }

  try {
    const r = await tratarRascunhos(
      { metodo: req.method, id, codigo: req.headers['x-editorial-codigo'], body: req.body },
      { lideres: parseCodigos(process.env.EDITORIAL_CODIGOS), repo: repositorioSql(executorNeon(url)) },
    );
    if (r.corpo === undefined) return res.status(r.status).end();
    return res.status(r.status).json(r.corpo);
  } catch (e) {
    console.error('Erro em rascunhos:', e instanceof Error ? e.message : e);
    return res.status(500).json({ erro: 'Erro ao acessar rascunhos.' });
  }
}
