/** Linhas do banco cujo arquivo de origem não existe na pasta local (um truncate as apagaria sem recolocar). */
export function orfasNoBanco(noBanco: Array<string | null>, locais: string[]): string[] {
  const existentes = new Set(locais);
  return noBanco.map((a) => a ?? '(sem arquivo_origem)').filter((a) => a === '(sem arquivo_origem)' || !existentes.has(a));
}

/** Mensagem de erro se a cópia local não puder alimentar um seed completo; null se estiver ok. */
export function problemaDeCopiaLocal(branch: string, commitsAtras: number): string | null {
  if (branch !== 'main') {
    return `Você está na branch "${branch}". O seed completo só deve rodar na main (git checkout main).`;
  }
  if (commitsAtras > 0) {
    return `Sua main está ${commitsAtras} commit(s) atrás de origin/main. Rode: git pull origin main`;
  }
  return null;
}
