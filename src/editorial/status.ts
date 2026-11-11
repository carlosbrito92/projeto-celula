import type { ResumoRascunho } from './api';

// Status visto pelo líder é derivado, nunca editado à mão
// (docs/painel-editorial.md §3):
//   - Rascunho:   nunca enviado (sem `arquivo`)
//   - Em revisão: enviado (tem `arquivo`), ainda não está no app — PR aberto
//                 esperando o merge do Carlos (ou o seed ainda rodando)
//   - Publicado:  o `arquivo` já existe em `pregacoes` (arquivo_origem)
// Sem chamada ao GitHub: o app já lista as pregações publicadas.

export type StatusRascunho = 'rascunho' | 'em_revisao' | 'publicado';

export const ROTULO_STATUS: Record<StatusRascunho, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em revisão',
  publicado: 'Publicado',
};

export function derivarStatus(rascunho: Pick<ResumoRascunho, 'arquivo'>, arquivosPublicados: ReadonlySet<string>): StatusRascunho {
  if (!rascunho.arquivo) return 'rascunho';
  return arquivosPublicados.has(rascunho.arquivo) ? 'publicado' : 'em_revisao';
}
