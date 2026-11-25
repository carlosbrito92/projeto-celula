const PREFIXO = 'celula:perguntas-sorteadas:';

/**
 * Histórico de perguntas já sorteadas (localStorage, por dinâmica) — mesmo
 * princípio de nomesStorage: dado efêmero de sessão, sem banco. Isolado: cada
 * `chave` tem o próprio histórico, e "Limpar histórico" só apaga o dela.
 */
export function carregarHistorico(chave: string): string[] {
  try {
    const bruto = localStorage.getItem(PREFIXO + chave);
    if (!bruto) return [];
    const itens = JSON.parse(bruto);
    return Array.isArray(itens) ? itens.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function salvarHistorico(chave: string, usadas: string[]): void {
  try {
    localStorage.setItem(PREFIXO + chave, JSON.stringify(usadas));
  } catch {
    // localStorage indisponível — o sorteio segue funcionando, só sem memória entre aberturas.
  }
}

export function limparHistorico(chave: string): void {
  try {
    localStorage.removeItem(PREFIXO + chave);
  } catch {
    // idem
  }
}
