// O código do líder fica no localStorage só por conveniência (não redigitar a
// cada visita). Não é barreira: o servidor valida em toda request. Leitura e
// escrita protegidas — storage bloqueado/aba privada não pode quebrar a tela.

const CHAVE = 'celula:editorial:codigo';

export function lerCodigo(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}

export function salvarCodigo(codigo: string): void {
  try {
    localStorage.setItem(CHAVE, codigo);
  } catch {
    /* sem storage: o líder só redigita na próxima visita */
  }
}

export function esquecerCodigo(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* idem */
  }
}
