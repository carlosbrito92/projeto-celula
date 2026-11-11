import type { PregacaoRow } from '../content/types';

// Corrigir uma pregação já publicada (docs/painel-editorial.md §7.5).
//
// O JSON vem do arquivo em `main` (raw.githubusercontent.com, repositório
// público, sem credencial), não da coluna `conteudo` do banco: `jsonb` não
// guarda a ordem das chaves, e o PR de correção viraria um diff do arquivo
// inteiro. A cópia do banco fica como reserva se o GitHub não responder.

const RAW_MAIN = 'https://raw.githubusercontent.com/carlosbrito92/projeto-celula/main/content/pregacoes/';

/** Mesmo formato aceito por /api/editorial/publicar (api/_lib/github.ts, ARQUIVO_REGEX). */
const ARQUIVO_VALIDO = /^[a-z0-9][a-z0-9-]{1,79}\.json$/;

export interface PregacaoPublicada {
  arquivo: string;
  tema: string;
  serie: string | null;
  /** Conteúdo vindo do banco, usado só se o arquivo do GitHub não carregar. */
  reserva: unknown;
}

/** Pregações que o painel consegue corrigir: com arquivo de origem em formato publicável. */
export function listarCorrigiveis(linhas: PregacaoRow[]): PregacaoPublicada[] {
  return linhas
    .filter((l): l is PregacaoRow & { arquivo_origem: string } => !!l.arquivo_origem && ARQUIVO_VALIDO.test(l.arquivo_origem))
    .map((l) => ({ arquivo: l.arquivo_origem, tema: l.tema, serie: l.serie, reserva: l.conteudo }))
    .sort((a, b) => (a.tema ?? '').localeCompare(b.tema ?? '', 'pt-BR'));
}

/** JSON da pregação como está em `main`; cai para a cópia do banco se o GitHub falhar. */
export async function carregarPublicada(p: PregacaoPublicada): Promise<{ conteudo: unknown; doGithub: boolean }> {
  try {
    const res = await fetch(RAW_MAIN + encodeURIComponent(p.arquivo), { cache: 'no-store' });
    if (res.ok) {
      const conteudo: unknown = await res.json();
      if (conteudo && typeof conteudo === 'object') return { conteudo, doGithub: true };
    }
  } catch {
    // sem rede para o GitHub: usa a reserva
  }
  return { conteudo: p.reserva, doGithub: false };
}
