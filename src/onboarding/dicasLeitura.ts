import { useState } from 'react';
import { carregarDicasVistas } from './dicasStorage';

export const DICA_AA = 'leitura-aa-v1';
export const DICA_ANOTACOES = 'leitura-anotacoes-v1';

/** Ordem em que as dicas da Leitura aparecem, uma por abertura de pregação. */
const ORDEM = [DICA_AA, DICA_ANOTACOES] as const;

export const TEXTO_DICA: Record<(typeof ORDEM)[number], string> = {
  [DICA_AA]: 'Toque em Aa para aumentar a letra. Depois do maior tamanho, ela volta ao normal.',
  [DICA_ANOTACOES]: 'Toque na caneta para grifar trechos e escrever notas. Elas ficam só neste aparelho.',
};

export function escolherDicaLeitura(vistas: readonly string[]): (typeof ORDEM)[number] | null {
  return ORDEM.find((id) => !vistas.includes(id)) ?? null;
}

/**
 * Escolhe a dica desta abertura uma única vez, quando o conteúdo carrega, e
 * mantém a escolha enquanto a mesma pregação estiver aberta. Assim, dispensar
 * a primeira não faz a segunda aparecer na mesma abertura. A escolha fica no
 * Reading (que não desmonta ao abrir o resumo); a visibilidade, no storage
 * (useDica).
 */
export function useDicaDaAbertura(pregacaoId: string, pronta: boolean): (typeof ORDEM)[number] | null {
  const [escolha, setEscolha] = useState<{ pregacaoId: string; dica: (typeof ORDEM)[number] | null } | null>(null);
  if (pronta && escolha?.pregacaoId !== pregacaoId) {
    const nova = { pregacaoId, dica: escolherDicaLeitura(carregarDicasVistas()) };
    setEscolha(nova);
    return nova.dica;
  }
  return escolha?.pregacaoId === pregacaoId ? escolha.dica : null;
}
