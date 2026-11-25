import type { Secao } from '../../../content/types';
import { limparNegrito } from '../../../content/segmentos';

export interface TrechoItem {
  texto: string;
  /** Só versículo. */
  referencia?: string;
}

export interface Candidato extends TrechoItem {
  /** Estável por pregação: `${secaoId}:${índiceDoBloco}`. */
  id: string;
  secaoTitulo: string;
}

/** Blocos da pregação que podem virar trecho da imagem: versículo, frase-chave e callout. */
export function trechosDisponiveis(secoes: Secao[]): Candidato[] {
  const out: Candidato[] = [];
  for (const secao of secoes) {
    secao.corpo.forEach((bloco, i) => {
      if (bloco.tipo === 'versiculo') {
        out.push({
          id: `${secao.id}:${i}`,
          secaoTitulo: secao.titulo,
          texto: limparNegrito(bloco.texto).textoLimpo,
          referencia: bloco.referencia,
        });
      } else if (bloco.tipo === 'frase_chave' || bloco.tipo === 'callout') {
        out.push({
          id: `${secao.id}:${i}`,
          secaoTitulo: secao.titulo,
          texto: limparNegrito(bloco.texto).textoLimpo,
        });
      }
    });
  }
  return out;
}

export function mesmoTrecho(a: TrechoItem, b: TrechoItem): boolean {
  return a.texto === b.texto && a.referencia === b.referencia;
}
