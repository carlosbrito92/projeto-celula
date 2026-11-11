import type { Bloco, MapaPonto, PregacaoConteudo, ResumoLider, Secao } from '../content/types';

// Operações puras do editor guiado (docs/painel-editorial.md §7.2) sobre o
// JSON da pregação. O líder nunca vê `id`, `numero` nem `mapa_pontos`: cada
// ponto do índice nasce, some e muda de lugar junto com a sua seção.

export type Conteudo = PregacaoConteudo;

/** Tipos de bloco que o editor sabe criar. Outros tipos de conteúdo carregado são preservados intactos. */
export type TipoNovoBloco =
  | 'paragrafo'
  | 'versiculo'
  | 'frase_chave'
  | 'callout'
  | 'lista'
  | 'subtitulo'
  | 'pergunta'
  | 'resposta'
  | 'citacao'
  | 'analogia'
  | 'stage'
  | 'diagnostico'
  | 'contraste';

export const ROTULO_TIPO_BLOCO: Record<TipoNovoBloco, string> = {
  paragrafo: 'Parágrafo',
  versiculo: 'Versículo',
  frase_chave: 'Frase-chave',
  callout: 'Destaque (aplicação prática)',
  lista: 'Lista',
  subtitulo: 'Subtítulo',
  pergunta: 'Pergunta',
  resposta: 'Resposta',
  citacao: 'Citação de autor',
  analogia: 'Analogia / ilustração',
  stage: 'Declaração',
  diagnostico: 'Diagnóstico (lista com rótulo)',
  contraste: 'Contraste (dois lados)',
};

export function novoBloco(tipo: TipoNovoBloco): Bloco {
  switch (tipo) {
    case 'versiculo':
      return { tipo, referencia: '', texto: '' };
    case 'lista':
      return { tipo, itens: [''] };
    case 'citacao':
      return { tipo, autor: '', texto: '' };
    case 'analogia':
      return { tipo: 'componente_tema', variante: 'analogia', dados: { label: 'Analogia', corpo: [''], conclusao: '' } };
    case 'stage':
      return { tipo: 'componente_tema', variante: 'stage', dados: { label: '', frase: '', subtitulo: '' } };
    case 'diagnostico':
      return { tipo: 'componente_tema', variante: 'diagnostico', dados: { label: '', itens: [''] } };
    case 'contraste':
      return {
        tipo: 'componente_tema',
        variante: 'contraste',
        dados: { lado_a: { label: '', titulo: '', texto: '' }, lado_b: { label: '', titulo: '', texto: '' } },
      };
    default:
      return { tipo, texto: '' };
  }
}

/** Tipo editável de um bloco existente, ou null se o editor só preserva (ex: timeline, glossario). */
export function tipoEditavel(bloco: Bloco): TipoNovoBloco | null {
  if (bloco.tipo === 'componente_tema') {
    const v = bloco.variante;
    return v === 'analogia' || v === 'stage' || v === 'diagnostico' || v === 'contraste' ? v : null;
  }
  return bloco.tipo in ROTULO_TIPO_BLOCO ? (bloco.tipo as TipoNovoBloco) : null;
}

const numeroDe = (i: number) => String(i + 1).padStart(2, '0');

function novoId(secoes: Secao[], mapa: MapaPonto[]): string {
  const usados = new Set([...secoes.map((s) => s.id), ...mapa.map((p) => p.id)]);
  let n = secoes.length + 1;
  while (usados.has(`ponto-${n}`)) n += 1;
  return `ponto-${n}`;
}

export function novaPregacao(): Conteudo {
  return {
    metadados: { serie: '', tema: '', capitulo: '', data: '', pregador: '', texto_base: '' },
    banner_intro: { frase_sintese: '' },
    mapa_pontos: [{ id: 'ponto-1', numero: '01', titulo: '' }],
    secoes: [{ id: 'ponto-1', numero: '01', titulo: '', sec_eyebrow: '', referencias: '', corpo: [novoBloco('paragrafo')], anotacoes: [] }],
  };
}

const ehObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Garante a forma mínima que o editor espera, sem descartar nada que já exista. */
export function normalizar(entrada: unknown): Conteudo {
  const base = novaPregacao();
  if (!ehObj(entrada) || Object.keys(entrada).length === 0) return base;
  const c = entrada as Partial<Conteudo>;
  return {
    ...c,
    metadados: { ...base.metadados, ...(ehObj(c.metadados) ? c.metadados : {}) },
    banner_intro: { ...base.banner_intro!, ...(ehObj(c.banner_intro) ? c.banner_intro : {}) },
    mapa_pontos: Array.isArray(c.mapa_pontos) ? c.mapa_pontos : [],
    secoes: Array.isArray(c.secoes) ? c.secoes : [],
  } as Conteudo;
}

/** Seção "extra" (encerramento, aplicação...) não tem número e não aparece no índice. */
const ehExtra = (s: Secao) => s.numero === undefined || s.numero === '';

/**
 * Reconstrói `mapa_pontos` na ordem das seções. Mantém o título curto e o
 * `pendente` de cada ponto existente; pontos pendentes (sem seção) vão ao fim.
 * Renumera "01", "02"... só quando toda a numeração atual já é desse formato
 * (conteúdo antigo com "·" ou numeração própria não é reescrito).
 */
function sincronizarMapa(c: Conteudo): Conteudo {
  const comNumero = c.secoes.filter((s) => !ehExtra(s));
  const renumerar = comNumero.every((s) => /^\d{2}$/.test(s.numero));
  const porId = new Map(c.mapa_pontos.map((p) => [p.id, p]));
  let n = 0;
  const secoes = c.secoes.map((s) => {
    if (ehExtra(s)) return s;
    const numero = renumerar ? numeroDe(n) : s.numero;
    n += 1;
    return numero === s.numero ? s : { ...s, numero };
  });
  const mapa: MapaPonto[] = secoes
    .filter((s) => !ehExtra(s))
    .map((s) => {
      const antigo = porId.get(s.id);
      return { ...antigo, id: s.id, numero: s.numero, titulo: antigo?.titulo ?? s.titulo };
    });
  const idsSecoes = new Set(secoes.map((s) => s.id));
  const pendentes = c.mapa_pontos.filter((p) => !idsSecoes.has(p.id));
  return { ...c, secoes, mapa_pontos: [...mapa, ...pendentes] };
}

export function adicionarPonto(c: Conteudo): Conteudo {
  const id = novoId(c.secoes, c.mapa_pontos);
  const secao: Secao = { id, numero: '00', titulo: '', sec_eyebrow: '', referencias: '', corpo: [novoBloco('paragrafo')], anotacoes: [] };
  return sincronizarMapa({ ...c, secoes: [...c.secoes, secao], mapa_pontos: [...c.mapa_pontos, { id, numero: '00', titulo: '' }] });
}

export function removerSecao(c: Conteudo, indice: number): Conteudo {
  const id = c.secoes[indice]?.id;
  return sincronizarMapa({
    ...c,
    secoes: c.secoes.filter((_, i) => i !== indice),
    mapa_pontos: c.mapa_pontos.filter((p) => p.id !== id),
  });
}

function mover<T>(lista: T[], i: number, delta: number): T[] {
  const j = i + delta;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

export function moverSecao(c: Conteudo, indice: number, delta: number): Conteudo {
  return sincronizarMapa({ ...c, secoes: mover(c.secoes, indice, delta) });
}

/** Título curto do ponto no índice (mapa_pontos) — o mesmo id da seção. */
export function definirTituloCurto(c: Conteudo, id: string, titulo: string): Conteudo {
  return { ...c, mapa_pontos: c.mapa_pontos.map((p) => (p.id === id ? { ...p, titulo } : p)) };
}

function comCorpo(c: Conteudo, s: number, f: (corpo: Bloco[]) => Bloco[]): Conteudo {
  return { ...c, secoes: c.secoes.map((secao, i) => (i === s ? { ...secao, corpo: f(secao.corpo) } : secao)) };
}

export function adicionarBloco(c: Conteudo, s: number, tipo: TipoNovoBloco): Conteudo {
  return comCorpo(c, s, (corpo) => [...corpo, novoBloco(tipo)]);
}

export function removerBloco(c: Conteudo, s: number, b: number): Conteudo {
  return comCorpo(c, s, (corpo) => corpo.filter((_, i) => i !== b));
}

export function moverBloco(c: Conteudo, s: number, b: number, delta: number): Conteudo {
  return comCorpo(c, s, (corpo) => mover(corpo, b, delta));
}

/**
 * Cria/atualiza `resumo_lider.pontos` a partir do índice: um item por ponto
 * desenvolvido, na mesma ordem. Textos já escritos são mantidos (casados pelo
 * título; senão pela posição).
 */
export function gerarPontosResumoLider(c: Conteudo): Conteudo {
  const atual: ResumoLider = c.resumo_lider ?? { frase_tema: '', pontos: [] };
  const desenvolvidos = c.mapa_pontos.filter((p) => !p.pendente);
  const pontos = desenvolvidos.map((p, i) => {
    const existente = atual.pontos.find((x) => x.titulo === p.titulo) ?? atual.pontos[i];
    return { numero: i + 1, titulo: p.titulo, resumo: existente?.resumo ?? '', frase_chave: existente?.frase_chave ?? '' };
  });
  return { ...c, resumo_lider: { ...atual, pontos } };
}

export function removerResumoLider(c: Conteudo): Conteudo {
  const copia = { ...c };
  delete copia.resumo_lider;
  return copia;
}

// ---------------------------------------------------------------------------
// Limpeza antes de validar/publicar: campos opcionais vazios saem do JSON
// (o arquivo fica igual ao que um humano escreveria) e linhas vazias de
// listas somem. Só remove campos de objetos — nunca itens de `secoes`/`corpo`,
// para os caminhos dos erros continuarem batendo com o que está na tela.

const vazio = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function semVazios<T extends Record<string, unknown>>(o: T, campos: string[]): T {
  const r: Record<string, unknown> = { ...o };
  for (const k of campos) if (vazio(r[k])) delete r[k];
  return r as T;
}

const semLinhasVazias = (l: unknown) => (Array.isArray(l) ? l.filter((x) => !vazio(x)) : l);

function limparVersiculo(v: unknown): { referencia: string; texto: string } | undefined {
  if (!ehObj(v)) return undefined;
  return vazio(v.referencia) && vazio(v.texto) ? undefined : (v as { referencia: string; texto: string });
}

function limparBloco(b: Bloco): Bloco {
  const bloco = b as unknown as Record<string, unknown>;
  if (b.tipo === 'lista') return { ...b, itens: semLinhasVazias(b.itens) as string[] };
  if (b.tipo === 'citacao') return semVazios(bloco, ['fidelidade']) as unknown as Bloco;
  if (b.tipo === 'componente_tema' && ehObj(b.dados)) {
    const d = { ...(b.dados as Record<string, unknown>) };
    if ('itens' in d && Array.isArray(d.itens) && d.itens.every((x) => typeof x === 'string')) d.itens = semLinhasVazias(d.itens);
    if (b.variante === 'analogia') d.corpo = semLinhasVazias(d.corpo);
    if (b.variante === 'stage' && vazio(d.subtitulo)) delete d.subtitulo;
    return { ...b, dados: d } as Bloco;
  }
  return b;
}

export function limparParaPublicar(c: Conteudo): Conteudo {
  const r: Conteudo = { ...c };
  r.metadados = semVazios(c.metadados as unknown as Record<string, unknown>, [
    'capitulo',
    'data',
    'pregador',
    'texto_base',
    'tema_override',
  ]) as unknown as Conteudo['metadados'];
  if (c.banner_intro) {
    const b = semVazios(c.banner_intro as unknown as Record<string, unknown>, ['contextualizacao']);
    const va = limparVersiculo(b.versiculo_ancora);
    if (va) b.versiculo_ancora = va;
    else delete b.versiculo_ancora;
    r.banner_intro = b as unknown as Conteudo['banner_intro'];
  }
  // O líder pode preencher só um dos dois títulos (índice ou seção): o outro herda.
  const tituloIndice = new Map(c.mapa_pontos.map((p) => [p.id, p.titulo]));
  r.secoes = c.secoes.map((s) => ({
    ...(semVazios(s as unknown as Record<string, unknown>, ['sec_eyebrow', 'referencias']) as unknown as Secao),
    titulo: vazio(s.titulo) ? (tituloIndice.get(s.id) ?? s.titulo) : s.titulo,
    corpo: s.corpo.map(limparBloco),
  }));
  const tituloSecao = new Map(c.secoes.map((s) => [s.id, s.titulo]));
  r.mapa_pontos = c.mapa_pontos.map((p) => (vazio(p.titulo) ? { ...p, titulo: tituloSecao.get(p.id) ?? p.titulo } : p));
  if (c.resumo_lider) {
    const rl = { ...c.resumo_lider };
    const vc = limparVersiculo(rl.versiculo_chave);
    if (vc) rl.versiculo_chave = vc;
    else delete rl.versiculo_chave;
    r.resumo_lider = rl;
  }
  return r;
}

/**
 * Título de seção vazio é coberto pelo título do índice (limparParaPublicar
 * herda um do outro). Se os dois estão vazios, o validador acusa os dois;
 * para o líder basta um aviso — o do índice.
 */
export function semErroDuplicadoDeTitulo<T extends { caminho: string }>(c: Conteudo, erros: T[]): T[] {
  const caminhos = new Set(erros.map((e) => e.caminho));
  return erros.filter((e) => {
    const m = /^secoes\[(\d+)\]\.titulo$/.exec(e.caminho);
    if (!m) return true;
    const iMapa = c.mapa_pontos.findIndex((p) => p.id === c.secoes[Number(m[1])]?.id);
    return iMapa < 0 || !caminhos.has(`mapa_pontos[${iMapa}].titulo`);
  });
}
