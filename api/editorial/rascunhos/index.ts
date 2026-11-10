import type { VercelRequest, VercelResponse } from '@vercel/node';
import { responderRascunhos } from '../../_lib/rascunhosHandler.js';

// GET  /api/editorial/rascunhos  → lista os rascunhos do líder (sem conteudo)
// POST /api/editorial/rascunhos  → cria { conteudo, arquivo? }
// Header obrigatório: X-Editorial-Codigo. Ver api/_lib/rascunhos.ts.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return responderRascunhos(req, res);
}
