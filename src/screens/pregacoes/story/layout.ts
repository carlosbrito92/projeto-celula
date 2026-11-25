export type Medir = (texto: string) => number;

/** Quebra `texto` em linhas que cabem em `larguraMax` (guloso, por palavra). Palavra maior que a largura fica sozinha na linha. */
export function quebrarLinhas(texto: string, larguraMax: number, medir: Medir): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && medir(tentativa) > larguraMax) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export interface AjusteTexto {
  tamanho: number;
  linhas: string[];
}

/**
 * Maior tamanho de fonte (de `maximo` a `minimo`, em passos de 2) em que o
 * texto cabe em `alturaMax`. `medirCom(tamanho)` devolve o medidor de largura
 * para aquele tamanho. Se nem o mínimo couber, devolve o mínimo mesmo assim.
 */
export function ajustarTexto(
  texto: string,
  larguraMax: number,
  alturaMax: number,
  alturaLinha: number,
  maximo: number,
  minimo: number,
  medirCom: (tamanho: number) => Medir,
): AjusteTexto {
  let ultimo: AjusteTexto = { tamanho: minimo, linhas: [] };
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const linhas = quebrarLinhas(texto, larguraMax, medirCom(tamanho));
    ultimo = { tamanho, linhas };
    if (linhas.length * tamanho * alturaLinha <= alturaMax) return ultimo;
  }
  return ultimo;
}

export interface ItemBloco {
  texto: string;
  /** Altura extra (px) reservada abaixo do item, ex: linha da referência bíblica. */
  extra?: number;
}

export interface AjusteBlocos {
  tamanho: number;
  /** Linhas de cada item, na mesma ordem de `itens`. */
  linhas: string[][];
}

/**
 * Como `ajustarTexto`, mas para vários trechos empilhados com o MESMO tamanho
 * de fonte: o maior tamanho em que todos cabem juntos em `alturaMax`
 * (somando linhas, `extra` de cada item e `espaco` entre eles).
 */
export function ajustarBlocos(
  itens: ItemBloco[],
  larguraMax: number,
  alturaMax: number,
  alturaLinha: number,
  espaco: number,
  maximo: number,
  minimo: number,
  medirCom: (tamanho: number) => Medir,
): AjusteBlocos {
  let ultimo: AjusteBlocos = { tamanho: minimo, linhas: itens.map(() => []) };
  for (let tamanho = maximo; tamanho >= minimo; tamanho -= 2) {
    const medir = medirCom(tamanho);
    const linhas = itens.map((i) => quebrarLinhas(i.texto, larguraMax, medir));
    ultimo = { tamanho, linhas };
    const altura =
      linhas.reduce((s, l, i) => s + l.length * tamanho * alturaLinha + (itens[i].extra ?? 0), 0) +
      espaco * Math.max(0, itens.length - 1);
    if (altura <= alturaMax) return ultimo;
  }
  return ultimo;
}
