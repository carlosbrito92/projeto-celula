/** docs/spec-privacidade-sorteio.md § Extensão: papéis múltiplos. */
export interface PapelConfig {
  nome: string;
  quantidade: number;
}

export function somaQuantidades(papeis: PapelConfig[]): number {
  return papeis.reduce((soma, p) => soma + p.quantidade, 0);
}

/** Expande cada papel em N "fichas" (mesmo nome repetido) — a lista final é
 * o que entra em `atribuir()` para sortear/distribuir 1:1 entre participantes. */
export function gerarFichas(papeis: PapelConfig[]): string[] {
  return papeis.flatMap((p) => Array(Math.max(0, p.quantidade)).fill(p.nome));
}
