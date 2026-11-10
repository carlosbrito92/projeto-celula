import type { VercelRequest, VercelResponse } from '@vercel/node';
import { responderRascunhos } from '../../_lib/rascunhosHandler.js';

// GET    /api/editorial/rascunhos/:id → rascunho completo
// PUT    /api/editorial/rascunhos/:id → salva { conteudo, versao, arquivo? } (409 se versao mudou)
// DELETE /api/editorial/rascunhos/:id → apaga
// Header obrigatório: X-Editorial-Codigo. Ver api/_lib/rascunhos.ts.
export default function handler(req: VercelRequest, res: VercelResponse) {
  return responderRascunhos(req, res, req.query.id);
}
