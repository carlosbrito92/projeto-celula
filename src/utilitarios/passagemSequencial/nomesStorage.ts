const CHAVE = 'celula:nomes-participantes';

/**
 * Persistência de nomes de participantes entre sessões (localStorage) — não
 * banco. Feedback real: mesma célula reusa a lista de nomes em quebra-gelos
 * diferentes ("Encontre o Líder" → sorteio de detetive), digitar tudo de novo
 * a cada abertura era atrito desnecessário. Nomes não são dado sensível (nem
 * PII com valor de permanência), então localStorage puro basta — sem
 * requisito de RLS/DB (CLAUDE.md item 3, dado efêmero de sessão).
 */
export function carregarNomes(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const nomes = JSON.parse(bruto);
    return Array.isArray(nomes) ? nomes.filter((n): n is string => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function salvarNomes(nomes: string[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(nomes));
  } catch {
    // localStorage indisponível (modo privado, quota) — persistência é
    // conveniência, não requisito; widget segue funcionando sem ela.
  }
}
