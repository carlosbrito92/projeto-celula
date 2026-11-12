// "Continuar lendo" na página inicial: a última pregação lida neste aparelho.
// Só localStorage, nunca banco (mesmo princípio das anotações pessoais: dado
// do leitor, sem valor editorial). Toda leitura/escrita tolera storage
// indisponível (aba anônima, cota) e dado velho ou malformado.

const CHAVE = 'celula:leitura:ultima';
const CHAVE_RETOMAR = 'celula:leitura:retomar';

export interface UltimaLeitura {
  id: string;
  /** 0–100, posição da rolagem. */
  progresso: number;
  /** Id da seção onde o leitor estava (para voltar a ela). */
  pontoId: string | null;
  ponto: number;
  totalPontos: number;
}

/** A partir daqui o leitor está "começando", e abaixo daqui praticamente terminou. */
export const PROGRESSO_MINIMO = 3;
export const PROGRESSO_LIDO = 95;

export function lerUltimaLeitura(): UltimaLeitura | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const u = JSON.parse(bruto) as Partial<UltimaLeitura>;
    if (typeof u.id !== 'string' || typeof u.progresso !== 'number') return null;
    return {
      id: u.id,
      progresso: Math.min(100, Math.max(0, u.progresso)),
      pontoId: typeof u.pontoId === 'string' ? u.pontoId : null,
      ponto: typeof u.ponto === 'number' ? u.ponto : 0,
      totalPontos: typeof u.totalPontos === 'number' ? u.totalPontos : 0,
    };
  } catch {
    return null;
  }
}

export function salvarUltimaLeitura(u: UltimaLeitura): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(u));
  } catch {
    // sem storage: "Continuar lendo" só não aparece
  }
}

/** Clique em "Continuar lendo": a Leitura desta pregação volta para o ponto salvo. */
export function marcarRetomar(id: string): void {
  try {
    sessionStorage.setItem(CHAVE_RETOMAR, id);
  } catch {
    // sem storage: abre do início
  }
}

/** true uma vez só, se a Leitura de `id` foi aberta por "Continuar lendo". */
export function consumirRetomar(id: string): boolean {
  try {
    const alvo = sessionStorage.getItem(CHAVE_RETOMAR);
    if (alvo === null) return false;
    sessionStorage.removeItem(CHAVE_RETOMAR);
    return alvo === id;
  } catch {
    return false;
  }
}
