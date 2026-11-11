// Caminhos dentro do JSON da pregação, no mesmo formato que validarPregacao
// devolve (`secoes[0].corpo[2].referencia`). O editor amarra cada campo a um
// caminho: assim um erro do validador acha o campo certo sem tabela à parte.

export type Caminho = (string | number)[];

export function caminhoTexto(caminho: Caminho): string {
  return caminho.reduce<string>((acc, parte) => {
    if (typeof parte === 'number') return `${acc}[${parte}]`;
    return acc ? `${acc}.${parte}` : parte;
  }, '');
}

/** id de elemento HTML estável para um caminho (foco a partir da lista de erros). */
export function idCampo(caminho: Caminho | string): string {
  const t = typeof caminho === 'string' ? caminho : caminhoTexto(caminho);
  return `campo-${t.replace(/[^a-zA-Z0-9]+/g, '-')}`;
}

export function lerCaminho(obj: unknown, caminho: Caminho): unknown {
  let atual: unknown = obj;
  for (const parte of caminho) {
    if (atual === null || typeof atual !== 'object') return undefined;
    atual = (atual as Record<string | number, unknown>)[parte];
  }
  return atual;
}

/** Cópia com o valor trocado no caminho; cria objetos intermediários que faltarem. */
export function definirCaminho<T>(obj: T, caminho: Caminho, valor: unknown): T {
  if (caminho.length === 0) return valor as T;
  const [cabeca, ...resto] = caminho;
  const base: Record<string | number, unknown> | unknown[] = Array.isArray(obj)
    ? [...obj]
    : { ...((obj as Record<string, unknown> | undefined) ?? {}) };
  const filho = (base as Record<string | number, unknown>)[cabeca];
  (base as Record<string | number, unknown>)[cabeca] = definirCaminho(filho, resto, valor);
  return base as T;
}

const NOMES_CAMPO: Record<string, string> = {
  metadados: 'Dados gerais',
  serie: 'série',
  tema: 'tema',
  capitulo: 'capítulo',
  data: 'data',
  pregador: 'pregador',
  texto_base: 'texto-base',
  tema_override: 'tema visual',
  banner_intro: 'Abertura',
  frase_sintese: 'frase-síntese',
  contextualizacao: 'contextualização',
  versiculo_ancora: 'versículo-âncora',
  referencia: 'referência',
  texto: 'texto',
  mapa_pontos: 'Pontos',
  titulo: 'título',
  sec_eyebrow: 'rótulo da seção',
  referencias: 'referências',
  itens: 'itens',
  label: 'rótulo',
  frase: 'frase',
  subtitulo: 'subtítulo',
  corpo: 'parágrafos',
  conclusao: 'conclusão',
  autor: 'autor',
  lado_a: 'lado A',
  lado_b: 'lado B',
  resumo_lider: 'Resumo do líder',
  frase_tema: 'frase-tema',
  pontos: 'pontos',
  resumo: 'resumo',
  frase_chave: 'frase-chave',
  versiculo_chave: 'versículo-chave',
  dados: '',
};

/** "secoes[1].corpo[2].referencia" → "Ponto 2 › Bloco 3 › referência". */
export function rotuloCaminho(caminho: string): string {
  const partes: string[] = [];
  const re = /([a-z_]+)(?:\[(\d+)\])?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(caminho))) {
    const [, nome, idx] = m;
    const i = idx === undefined ? undefined : Number(idx) + 1;
    if (nome === 'secoes') partes.push(i ? `Ponto ${i}` : 'Pontos');
    else if (nome === 'corpo' && i) partes.push(`Bloco ${i}`);
    else if (nome === 'pontos' && i) partes.push(`Ponto ${i}`);
    else if (nome === 'mapa_pontos' && i) partes.push(`Ponto ${i}`);
    else {
      const rotulo = NOMES_CAMPO[nome] ?? nome.replace(/_/g, ' ');
      if (rotulo) partes.push(i ? `${rotulo} ${i}` : rotulo);
    }
  }
  if (/^mapa_pontos\[\d+\]\.titulo$/.test(caminho)) partes[partes.length - 1] = 'título no índice';
  return partes.join(' › ');
}
