import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Secao } from '../../../content/types';
import { limparNegrito } from '../../../content/segmentos';
import type { DestaqueSpan } from '../../../content/segmentos';
import { carregarAnotacoes, salvarAnotacoes } from './storage';
import { resolverDestaque } from './resolverDestaque';
import type { AnotacaoPessoal, UnidadeId } from './types';

interface DestaqueResolvidoParaExibir extends AnotacaoPessoal {
  offsetInicio: number;
  offsetFim: number;
}

function textoAtualDaUnidade(secoes: Secao[], secaoId: string, unidade: UnidadeId): string | null {
  const secao = secoes.find((s) => s.id === secaoId);
  if (!secao) return null;

  const [blocoIndiceStr, itemIndiceStr] = unidade.split(':');
  const bloco = secao.corpo[Number(blocoIndiceStr)];
  if (!bloco) return null;

  let textoBruto: string | null = null;
  if (bloco.tipo === 'lista') {
    if (itemIndiceStr === undefined) return null;
    textoBruto = bloco.itens[Number(itemIndiceStr)] ?? null;
  } else if ('texto' in bloco) {
    textoBruto = bloco.texto;
  }
  if (textoBruto == null) return null;

  return limparNegrito(textoBruto).textoLimpo;
}

/**
 * Estado de anotações pessoais (destaques + notas) de uma pregação — 100%
 * local (localStorage), nunca sincronizado com o banco (ver spec anotações
 * pessoais §Privacidade e CLAUDE.md item 3). `secoes` é usado só pra resolver
 * destaques contra o texto atual (resiliência a recalibração), nunca gravado.
 */
export function useAnotacoes(pregacaoId: string, secoes: Secao[]) {
  const [anotacoes, setAnotacoes] = useState<AnotacaoPessoal[]>(() => carregarAnotacoes(pregacaoId));
  const [modoAnotacao, setModoAnotacao] = useState(false);

  useEffect(() => {
    setAnotacoes(carregarAnotacoes(pregacaoId));
    setModoAnotacao(false);
  }, [pregacaoId]);

  useEffect(() => {
    salvarAnotacoes(pregacaoId, anotacoes);
  }, [pregacaoId, anotacoes]);

  const { destaques, orfas, notasSoltas } = useMemo(() => {
    const destaques: DestaqueResolvidoParaExibir[] = [];
    const orfas: AnotacaoPessoal[] = [];
    const notasSoltas: AnotacaoPessoal[] = [];

    for (const a of anotacoes) {
      if (a.unidade == null) {
        notasSoltas.push(a);
        continue;
      }
      const textoAtual = textoAtualDaUnidade(secoes, a.secaoId, a.unidade);
      if (textoAtual == null || a.offsetInicio == null || a.offsetFim == null || a.textoSelecionado == null) {
        orfas.push(a);
        continue;
      }
      const resolvido = resolverDestaque(textoAtual, {
        offsetInicio: a.offsetInicio,
        offsetFim: a.offsetFim,
        textoSelecionado: a.textoSelecionado,
      });
      if (!resolvido) {
        orfas.push(a);
        continue;
      }
      destaques.push({ ...a, ...resolvido });
    }
    return { destaques, orfas, notasSoltas };
  }, [anotacoes, secoes]);

  const destaquesPorUnidade = useCallback(
    (secaoId: string, unidade: UnidadeId): DestaqueSpan[] =>
      destaques
        .filter((d) => d.secaoId === secaoId && d.unidade === unidade)
        .map((d) => ({ id: d.id, inicio: d.offsetInicio, fim: d.offsetFim, temNota: !!d.nota })),
    [destaques],
  );

  const criarDestaque = useCallback(
    (
      secaoId: string,
      unidade: UnidadeId,
      offsetInicio: number,
      offsetFim: number,
      textoSelecionado: string,
      nota?: string,
    ): { ok: true; id: string } | { ok: false; erro: 'sobreposto' } => {
      const sobreposto = destaquesPorUnidade(secaoId, unidade).some(
        (d) => offsetInicio < d.fim && offsetFim > d.inicio,
      );
      if (sobreposto) return { ok: false, erro: 'sobreposto' };

      const id = crypto.randomUUID();
      setAnotacoes((prev) => [
        ...prev,
        {
          id,
          secaoId,
          unidade,
          offsetInicio,
          offsetFim,
          textoSelecionado,
          nota,
          criadoEm: new Date().toISOString(),
        },
      ]);
      return { ok: true, id };
    },
    [destaquesPorUnidade],
  );

  const editarNota = useCallback((id: string, nota: string) => {
    setAnotacoes((prev) => prev.map((a) => (a.id === id ? { ...a, nota } : a)));
  }, []);

  const criarNotaSolta = useCallback((secaoId: string, nota: string): string => {
    const id = crypto.randomUUID();
    setAnotacoes((prev) => [...prev, { id, secaoId, nota, criadoEm: new Date().toISOString() }]);
    return id;
  }, []);

  const apagar = useCallback((id: string) => {
    setAnotacoes((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    modoAnotacao,
    alternarModoAnotacao: useCallback(() => setModoAnotacao((m) => !m), []),
    destaques,
    orfas,
    notasSoltas,
    destaquesPorUnidade,
    criarDestaque,
    editarNota,
    criarNotaSolta,
    apagar,
  };
}
