import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, UUID_REGEX } from '../_lib/db';
import { setCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não suportado' });

  const { id } = req.query;
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return res.status(400).json({ erro: 'id inválido' });
  }

  try {
    const rows = await sql`select * from pregacoes where id = ${id}`;
    if (rows.length === 0) return res.status(404).json({ erro: 'Pregação não encontrada' });
    res.status(200).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao consultar pregação' });
  }
}
