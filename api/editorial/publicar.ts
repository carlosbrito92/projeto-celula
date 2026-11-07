import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_lib/cors.js';
import { identificarLider, parseCodigos } from '../_lib/editorialAuth.js';
import { ARQUIVO_REGEX, publicarViaPr, slugArquivo } from '../_lib/github.js';
import { validarPregacao } from '../../src/content/validarPregacao.js';

// POST /api/editorial/publicar
//   Header: X-Editorial-Codigo: <código do líder>
//   Body:   { pregacao: PregacaoConteudo, arquivo?: string }
//     - sem `arquivo`: pregação nova, nome derivado de metadados.tema/capitulo
//     - com `arquivo`: republicação (corrige arquivo já existente em content/pregacoes/)
//
// Nunca escreve no banco. Valida o schema e abre/atualiza um PR — ver
// api/_lib/github.ts e CLAUDE.md "Decisões de arquitetura (Painel Editorial)".
//
// Env vars (Vercel, nunca no client): EDITORIAL_CODIGOS, GITHUB_TOKEN_EDITORIAL
// (fine-grained PAT só deste repo: Contents + Pull requests read/write),
// GITHUB_REPO (opcional, default carlosbrito92/projeto-celula).

/** Pregação real mais longa do repo hoje tem ~60KB — 512KB é folga larga sem aceitar payload arbitrário. */
const TAMANHO_MAXIMO = 512 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res, { metodos: 'POST, OPTIONS', headers: 'Content-Type, X-Editorial-Codigo' });
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não suportado' });

  const lider = identificarLider(req.headers['x-editorial-codigo'], parseCodigos(process.env.EDITORIAL_CODIGOS));
  if (!lider) return res.status(401).json({ erro: 'Código editorial inválido.' });

  const token = process.env.GITHUB_TOKEN_EDITORIAL;
  if (!token) {
    console.error('GITHUB_TOKEN_EDITORIAL não definida');
    return res.status(500).json({ erro: 'Publicação indisponível (configuração do servidor).' });
  }

  const body = req.body as { pregacao?: unknown; arquivo?: unknown } | undefined;
  if (!body || typeof body !== 'object') return res.status(400).json({ erro: 'Corpo da requisição inválido.' });

  const validacao = validarPregacao(body.pregacao);
  if (!validacao.ok) {
    return res.status(422).json({ erro: 'A pregação tem problemas que impedem a publicação.', erros: validacao.erros, avisos: validacao.avisos });
  }

  const json = `${JSON.stringify(body.pregacao, null, 2)}\n`;
  if (Buffer.byteLength(json, 'utf8') > TAMANHO_MAXIMO) {
    return res.status(413).json({ erro: 'Pregação grande demais.' });
  }

  const meta = (body.pregacao as { metadados: { tema: string; capitulo?: string } }).metadados;
  const substituir = body.arquivo !== undefined;
  const arquivo = substituir ? body.arquivo : slugArquivo(meta.tema, meta.capitulo);
  if (typeof arquivo !== 'string' || !ARQUIVO_REGEX.test(arquivo)) {
    return res.status(400).json({ erro: 'Nome de arquivo inválido.' });
  }

  const [owner, repo] = (process.env.GITHUB_REPO ?? 'carlosbrito92/projeto-celula').split('/');
  const resultado = await publicarViaPr(
    { token, owner, repo, base: 'main' },
    { arquivo, json, lider, tema: meta.tema, substituir },
  );

  if (!resultado.ok) return res.status(resultado.status).json({ erro: resultado.erro });
  return res.status(200).json({ ...resultado, arquivo, avisos: validacao.avisos });
}
