const CHAVE = 'celula:dicas-vistas';

/**
 * Ids das dicas de uso já vistas (localStorage, array JSON). Mesmo padrão de
 * nomesStorage.ts: conveniência, não requisito; sem storage, tudo continua
 * funcionando e a dica só volta a aparecer. Ids são versionados
 * (`leitura-aa-v1`): mudar o texto de uma dica de forma relevante = id novo,
 * e quem já viu a versão antiga vê a nova uma vez.
 */
export function carregarDicasVistas(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const ids = JSON.parse(bruto);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function dicaFoiVista(id: string): boolean {
  return carregarDicasVistas().includes(id);
}

const ouvintes = new Set<() => void>();

function avisar(): void {
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function marcarDicaVista(id: string): void {
  const vistas = carregarDicasVistas();
  if (vistas.includes(id)) return;
  try {
    localStorage.setItem(CHAVE, JSON.stringify([...vistas, id]));
  } catch {
    // modo privado, quota: a dica só aparece de novo na próxima abertura.
  }
  avisar();
}

/** "Rever as dicas" na tela Como usar. */
export function limparDicasVistas(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // idem
  }
  avisar();
}

/**
 * Assinatura para useSyncExternalStore: avisa nas mudanças feitas por este
 * app (mesma aba) e nas de outra aba (evento `storage`).
 */
export function assinarDicas(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  const aoMudarStorage = (e: StorageEvent) => {
    if (e.key === CHAVE || e.key === null) ouvinte();
  };
  window.addEventListener('storage', aoMudarStorage);
  return () => {
    ouvintes.delete(ouvinte);
    window.removeEventListener('storage', aoMudarStorage);
  };
}
