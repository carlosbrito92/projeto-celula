import { escolherUm, type Rng } from '../../utilitarios/shuffle';
import type { Declaracao } from './types';
import textos from '../../../docs/spicy-textos-declaracao-desafio.json';

/**
 * Fonte única: `docs/spicy-textos-declaracao-desafio.json` (conteúdo real de
 * Carlos, não gerado) — importado direto, nunca retranscrito aqui.
 */
const TEXTOS_DECLARACAO: string[] = textos.declaracao;
const TEXTOS_DESAFIO: string[] = textos.desafio;

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function corValorTexto(declaracao: Declaracao): string {
  return `${capitalizar(declaracao.cor)} ${declaracao.valor}`;
}

/** Sorteia a variação de texto de uma declaração, com placeholders já substituídos por valores reais. */
export function textoDeclaracao(nomeJogador: string, declaracao: Declaracao, rng: Rng = Math.random): string {
  const template = escolherUm(TEXTOS_DECLARACAO, rng);
  return template.replaceAll('[nome-jogador]', nomeJogador).replaceAll('[cor+número]', corValorTexto(declaracao));
}

/**
 * Sorteia a variação de texto de um desafio. `nomeDeclarante` = quem fez a
 * declaração contestada; `nomeDesafiante` = quem desafiou. `declaracao` é o
 * que foi alegado (não a carta real revelada — essa já tem exibição própria
 * na UI).
 */
export function textoDesafio(
  nomeDeclarante: string,
  nomeDesafiante: string,
  declaracao: Declaracao,
  rng: Rng = Math.random,
): string {
  const template = escolherUm(TEXTOS_DESAFIO, rng);
  return template
    .replaceAll('[nome-jogador-desafiante]', nomeDesafiante)
    .replaceAll('[nome-jogador]', nomeDeclarante)
    .replaceAll('[cor+número]', corValorTexto(declaracao));
}
