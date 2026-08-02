const CHAVE = 'projeto-celula:nomes-participantes';

/**
 * Persistência client-side de nomes de participantes entre sorteios na mesma
 * visita — docs/spec-privacidade-sorteio.md § Extensão: nomes persistentes.
 * Efêmero por natureza (mesmo espírito da camada de utilitários): sem sync
 * entre dispositivos, sem expiração explícita — só evita redigitar nomes ao
 * abrir outro quebra-gelo/utilitário na mesma sessão do navegador.
 */
export function lerNomesPersistidos(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const valor = JSON.parse(bruto);
    return Array.isArray(valor) && valor.every((v) => typeof v === 'string') ? valor : [];
  } catch {
    return [];
  }
}

export function salvarNomesPersistidos(nomes: string[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(nomes));
  } catch {
    // Sem localStorage (modo privado, quota excedida) — degrada pra "sem persistência", não quebra o app.
  }
}
