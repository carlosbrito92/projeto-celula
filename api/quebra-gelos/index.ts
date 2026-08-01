import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../_lib/db.js';
import { setCors } from '../_lib/cors.js';

// Espelha o CHECK constraint de quebra_gelos.tipo (db/migrations).
const TIPOS_VALIDOS = new Set(['instrucional', 'utilitario', 'instrucional_utilitario']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não suportado' });

  const { tipo } = req.query;
  let tipos: string[] | null = null;
  if (typeof tipo === 'string' && tipo.length > 0) {
    tipos = tipo.split(',');
    if (tipos.some((t) => !TIPOS_VALIDOS.has(t))) {
      return res.status(400).json({ erro: 'tipo inválido' });
    }
  }

  try {
    const rows = tipos
      ? await sql`select * from quebra_gelos where tipo = any(${tipos}) order by nome`
      : await sql`select * from quebra_gelos order by nome`;
    res.status(200).json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao consultar quebra-gelos' });
  }
}
