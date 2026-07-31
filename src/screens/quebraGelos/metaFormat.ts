export function formatarJogadores(jogadores?: { min: number; max?: number }): string | null {
  if (!jogadores) return null;
  return jogadores.max ? `${jogadores.min}–${jogadores.max} jogadores` : `${jogadores.min}+ jogadores`;
}

export function formatarIdade(idadeMinima?: number): string | null {
  return idadeMinima ? `${idadeMinima}+` : null;
}

export function formatarDuracao(minutos?: number): string | null {
  return minutos ? `${minutos} min` : null;
}
