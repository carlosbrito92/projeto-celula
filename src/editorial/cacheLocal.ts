// Cópia local de alterações ainda não salvas no servidor (docs/painel-editorial.md
// §5: localStorage é só cache de digitação, nunca a única cópia). Guarda a
// versão do servidor sobre a qual a edição foi feita: se o servidor já estiver
// numa versão mais nova, o cache é descartado em vez de sobrescrever.

const prefixo = 'celula:editorial:rascunho:';

export interface CacheRascunho {
  versao: number;
  conteudo: unknown;
}

export function lerCache(id: string): CacheRascunho | null {
  try {
    const bruto = localStorage.getItem(prefixo + id);
    if (!bruto) return null;
    const c = JSON.parse(bruto) as CacheRascunho;
    return typeof c?.versao === 'number' ? c : null;
  } catch {
    return null;
  }
}

export function gravarCache(id: string, cache: CacheRascunho): void {
  try {
    localStorage.setItem(prefixo + id, JSON.stringify(cache));
  } catch {
    /* storage cheio/bloqueado: o autosave do servidor continua valendo */
  }
}

export function apagarCache(id: string): void {
  try {
    localStorage.removeItem(prefixo + id);
  } catch {
    /* idem */
  }
}
