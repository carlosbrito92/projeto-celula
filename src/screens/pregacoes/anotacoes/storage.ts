import type { AnotacaoPessoal } from './types';

// Mesmo padrão de src/utilitarios/passagemSequencial/nomesStorage.ts:
// localStorage puro, persistência indefinida, sem RLS/DB (dado 100% pessoal
// e local — ver spec de anotações pessoais §Privacidade e CLAUDE.md item 3).
const CHAVE_PREFIXO = 'celula:anotacoes:';

function chave(pregacaoId: string): string {
  return `${CHAVE_PREFIXO}${pregacaoId}`;
}

export function carregarAnotacoes(pregacaoId: string): AnotacaoPessoal[] {
  try {
    const bruto = localStorage.getItem(chave(pregacaoId));
    if (!bruto) return [];
    const dado = JSON.parse(bruto);
    return Array.isArray(dado) ? dado : [];
  } catch {
    return [];
  }
}

export function salvarAnotacoes(pregacaoId: string, anotacoes: AnotacaoPessoal[]): void {
  try {
    localStorage.setItem(chave(pregacaoId), JSON.stringify(anotacoes));
  } catch {
    // localStorage indisponível (modo privado, quota) — persistência é
    // conveniência, não requisito; tela de leitura segue funcionando sem ela.
  }
}
