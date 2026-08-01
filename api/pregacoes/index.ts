import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db';
import { setCors } from '../_lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não suportado' });

  try {
    const rows = await sql`select * from pregacoes`;
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao consultar pregações' });
  }
}
