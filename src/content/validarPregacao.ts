// Validação estrutural de uma pregação (schema de `PregacaoConteudo`, ver
// types.ts e docs/geracao-pregacao.md) antes de ela virar arquivo em
// content/pregacoes/. Compartilhado entre o endpoint de publicação
// (api/editorial/publicar.ts — fonte de verdade, roda no servidor) e o editor
// do painel (validação em tempo real, só conveniência de UX).
//
// Sem dependências além de parseData — este arquivo é importado tanto pelo
// bundle do Vite (moduleResolution bundler) quanto pelas Vercel Functions
// (nodenext), então imports relativos usam extensão `.js` explícita.
import { parseDataPtBr } from './parseData.js';
import type { PregacaoConteudo } from './types.js';

export interface ProblemaValidacao {
  /** Caminho no JSON, ex: `secoes[2].corpo[0].referencia`. */
  caminho: string;
  mensagem: string;
}

export interface ResultadoValidacao {
  ok: boolean;
  erros: ProblemaValidacao[];
  /** Não bloqueiam a publicação (ex: variante de componente_tema desconhecida, que o renderer ignora com segurança). */
  avisos: ProblemaValidacao[];
}

type Obj = Record<string, unknown>;

const ehObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
/** Raiz do documento é '$' — não vira prefixo no caminho exibido (`secoes[0]`, não `$.secoes[0]`). */
const juntar = (base: string, campo: string) => (base === '$' ? campo : `${base}.${campo}`);
const ehTextoPreenchido = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

class Coletor {
  erros: ProblemaValidacao[] = [];
  avisos: ProblemaValidacao[] = [];

  erro(caminho: string, mensagem: string) {
    this.erros.push({ caminho, mensagem });
  }

  aviso(caminho: string, mensagem: string) {
    this.avisos.push({ caminho, mensagem });
  }

  texto(o: Obj, campo: string, base: string, obrigatorio = true) {
    const v = o[campo];
    if (v === undefined || v === null) {
      if (obrigatorio) this.erro(`${base}.${campo}`, 'campo obrigatório ausente');
      return;
    }
    if (typeof v !== 'string') {
      this.erro(`${base}.${campo}`, 'deve ser texto');
      return;
    }
    if (obrigatorio && v.trim().length === 0) this.erro(`${base}.${campo}`, 'não pode ficar vazio');
  }

  listaDeTextos(o: Obj, campo: string, base: string, obrigatorio = true) {
    const v = o[campo];
    if (v === undefined || v === null) {
      if (obrigatorio) this.erro(`${base}.${campo}`, 'campo obrigatório ausente');
      return;
    }
    if (!Array.isArray(v)) {
      this.erro(`${base}.${campo}`, 'deve ser uma lista');
      return;
    }
    if (obrigatorio && v.length === 0) this.erro(`${base}.${campo}`, 'lista não pode ficar vazia');
    v.forEach((item, i) => {
      if (!ehTextoPreenchido(item)) this.erro(`${base}.${campo}[${i}]`, 'item deve ser texto não vazio');
    });
  }

  objeto(o: Obj, campo: string, base: string): Obj | undefined {
    const v = o[campo];
    if (!ehObj(v)) {
      this.erro(juntar(base, campo), v === undefined ? 'campo obrigatório ausente' : 'deve ser um objeto');
      return undefined;
    }
    return v;
  }

  listaDeObjetos(o: Obj, campo: string, base: string, cadaItem: (item: Obj, caminho: string) => void) {
    const v = o[campo];
    if (!Array.isArray(v) || v.length === 0) {
      this.erro(juntar(base, campo), v === undefined ? 'campo obrigatório ausente' : 'deve ser uma lista não vazia');
      return;
    }
    v.forEach((item, i) => {
      const caminho = `${juntar(base, campo)}[${i}]`;
      if (!ehObj(item)) this.erro(caminho, 'deve ser um objeto');
      else cadaItem(item, caminho);
    });
  }
}

/** Valida `dados` de cada variante conhecida de componente_tema. Variante desconhecida = aviso, não erro (ComponenteTemaRenderer ignora com segurança). */
function validarComponenteTema(c: Coletor, o: Obj, base: string) {
  const variante = o.variante;
  if (!ehTextoPreenchido(variante)) {
    c.erro(`${base}.variante`, 'campo obrigatório ausente');
    return;
  }
  const dados = c.objeto(o, 'dados', base);
  if (!dados) return;
  const b = `${base}.dados`;

  const lado = (campos: string[]) => (ladoNome: string) => {
    const l = c.objeto(dados, ladoNome, b);
    if (l) campos.forEach((campo) => c.texto(l, campo, `${b}.${ladoNome}`));
  };

  switch (variante) {
    case 'stage':
      c.texto(dados, 'label', b);
      c.texto(dados, 'frase', b);
      c.texto(dados, 'subtitulo', b, false);
      break;
    case 'diagnostico':
      c.texto(dados, 'label', b);
      c.listaDeTextos(dados, 'itens', b);
      break;
    case 'antidoto':
      c.texto(dados, 'label', b);
      c.texto(dados, 'texto', b);
      break;
    case 'versus':
      ['lado_a', 'lado_b'].forEach(lado(['label', 'citacao']));
      break;
    case 'contraste':
      ['lado_a', 'lado_b'].forEach(lado(['label', 'titulo', 'texto']));
      break;
    case 'analogia':
      c.texto(dados, 'label', b);
      c.listaDeTextos(dados, 'corpo', b);
      c.texto(dados, 'conclusao', b);
      break;
    case 'banho_list':
      c.listaDeTextos(dados, 'itens', b);
      break;
    case 'humor':
      c.texto(dados, 'texto', b);
      break;
    case 'label_box':
      c.texto(dados, 'titulo', b);
      c.listaDeObjetos(dados, 'campos', b, (item, cam) => {
        c.texto(item, 'campo', cam);
        c.texto(item, 'valor', cam);
      });
      break;
    case 'duplice_grid':
      c.listaDeObjetos(dados, 'itens', b, (item, cam) => {
        c.texto(item, 'num', cam);
        c.texto(item, 'nome', cam);
        c.texto(item, 'texto', cam);
      });
      break;
    case 'timeline':
      c.listaDeObjetos(dados, 'itens', b, (item, cam) => {
        c.texto(item, 'icon', cam);
        c.texto(item, 'titulo', cam);
        c.texto(item, 'desc', cam);
      });
      break;
    case 'razoes_grid':
    case 'poeiras_grid':
      // Retiradas por decisão de Carlos (2026-11-09): nunca tiveram renderer e
      // sumiam da leitura. Conteúdo existente migrado para `timeline`.
      c.erro(`${base}.variante`, `variante "${variante}" foi retirada — use "timeline" (itens com icon, titulo, desc)`);
      break;
    default:
      c.aviso(`${base}.variante`, `variante "${variante}" não tem renderer na plataforma — será ignorada na leitura`);
  }
}

function validarBloco(c: Coletor, bloco: Obj, base: string) {
  switch (bloco.tipo) {
    case 'paragrafo':
    case 'callout':
    case 'frase_chave':
    case 'subtitulo':
    case 'pergunta':
    case 'resposta':
      c.texto(bloco, 'texto', base);
      break;
    case 'versiculo':
      c.texto(bloco, 'referencia', base);
      c.texto(bloco, 'texto', base);
      break;
    case 'lista':
      c.listaDeTextos(bloco, 'itens', base);
      break;
    case 'citacao':
      c.texto(bloco, 'autor', base);
      c.texto(bloco, 'texto', base);
      c.texto(bloco, 'fidelidade', base, false);
      break;
    case 'glossario':
      c.texto(bloco, 'termo', base);
      c.texto(bloco, 'etimologia', base);
      c.texto(bloco, 'significado_no_texto', base);
      c.texto(bloco, 'uso_indevido', base, false);
      break;
    case 'componente_tema':
      validarComponenteTema(c, bloco, base);
      break;
    default:
      // Diferente de variante de componente_tema: BlockRenderer não tem
      // fallback útil pra bloco de corpo desconhecido — texto sumiria da leitura.
      c.erro(`${base}.tipo`, `tipo de bloco desconhecido: ${JSON.stringify(bloco.tipo)}`);
  }
}

export function validarPregacao(entrada: unknown): ResultadoValidacao {
  const c = new Coletor();

  if (!ehObj(entrada)) {
    c.erro('$', 'pregação deve ser um objeto JSON');
    return { ok: false, erros: c.erros, avisos: c.avisos };
  }

  // metadados
  const meta = c.objeto(entrada, 'metadados', '$');
  if (meta) {
    c.texto(meta, 'serie', 'metadados');
    c.texto(meta, 'tema', 'metadados');
    for (const campo of ['capitulo', 'pregador', 'texto_base', 'tema_override']) c.texto(meta, campo, 'metadados', false);
    if (meta.data !== undefined && meta.data !== null && meta.data !== '') {
      if (typeof meta.data !== 'string') c.erro('metadados.data', 'deve ser texto');
      else if (parseDataPtBr(meta.data) === null) {
        // Aviso, não erro: conteúdo real já tem datas como "27-28 de maio de 2026"
        // (pregação em 2 dias). db-seed grava null na coluna `data` nesse caso —
        // a pregação aparece, só perde a ordenação por data.
        c.aviso('metadados.data', 'data não reconhecida (formato esperado: "26 de julho de 2026") — pregação ficará sem data na ordenação');
      }
    }
    if (meta.modo_origem !== undefined && meta.modo_origem !== 'A' && meta.modo_origem !== 'B') {
      c.erro('metadados.modo_origem', 'deve ser "A" ou "B"');
    }
  }

  // banner_intro (opcional, mas frase_sintese é obrigatória se o banner existir)
  if (entrada.banner_intro !== undefined) {
    const banner = c.objeto(entrada, 'banner_intro', '$');
    if (banner) {
      c.texto(banner, 'frase_sintese', 'banner_intro');
      c.texto(banner, 'contextualizacao', 'banner_intro', false);
      if (banner.componente_tema !== undefined) {
        const ct = c.objeto(banner, 'componente_tema', 'banner_intro');
        if (ct) validarComponenteTema(c, ct, 'banner_intro.componente_tema');
      }
      if (banner.versiculo_ancora !== undefined) {
        const va = c.objeto(banner, 'versiculo_ancora', 'banner_intro');
        if (va) {
          c.texto(va, 'referencia', 'banner_intro.versiculo_ancora');
          c.texto(va, 'texto', 'banner_intro.versiculo_ancora');
        }
      }
    }
  }

  // mapa_pontos
  const idsMapa = new Map<string, boolean>(); // id -> pendente
  c.listaDeObjetos(entrada, 'mapa_pontos', '$', (ponto, cam) => {
    c.texto(ponto, 'id', cam);
    c.texto(ponto, 'numero', cam);
    c.texto(ponto, 'titulo', cam);
    if (ehTextoPreenchido(ponto.id)) {
      if (idsMapa.has(ponto.id)) c.erro(`${cam}.id`, `id "${ponto.id}" repetido`);
      idsMapa.set(ponto.id, ponto.pendente === true);
    }
  });

  // secoes
  const idsSecoes = new Set<string>();
  c.listaDeObjetos(entrada, 'secoes', '$', (secao, cam) => {
    c.texto(secao, 'id', cam);
    // numero vazio = seção extra fora do mapa (ex: "encerramento", "aplicacao"
    // — padrão real em igrejar-cap4, jamais-sera-em-vao, vida-abundante).
    c.texto(secao, 'numero', cam, false);
    const semNumero = secao.numero === undefined || secao.numero === '';
    c.texto(secao, 'titulo', cam);
    c.texto(secao, 'sec_eyebrow', cam, false);
    c.texto(secao, 'referencias', cam, false);
    if (ehTextoPreenchido(secao.id)) {
      if (idsSecoes.has(secao.id)) c.erro(`${cam}.id`, `id "${secao.id}" repetido`);
      idsSecoes.add(secao.id);
      if (!semNumero && idsMapa.size > 0 && !idsMapa.has(secao.id)) {
        c.erro(`${cam}.id`, `seção "${secao.id}" não tem ponto correspondente em mapa_pontos`);
      }
    }
    c.listaDeObjetos(secao, 'corpo', cam, (bloco, camBloco) => validarBloco(c, bloco, camBloco));
    if (secao.anotacoes !== undefined) {
      if (!Array.isArray(secao.anotacoes)) c.erro(`${cam}.anotacoes`, 'deve ser uma lista');
      else
        secao.anotacoes.forEach((a, i) => {
          const camA = `${cam}.anotacoes[${i}]`;
          if (!ehObj(a)) c.erro(camA, 'deve ser um objeto');
          else {
            c.texto(a, 'autor', camA);
            c.texto(a, 'texto', camA);
          }
        });
    }
  });

  for (const [id, pendente] of idsMapa) {
    if (!pendente && !idsSecoes.has(id)) {
      c.erro('mapa_pontos', `ponto "${id}" não tem seção correspondente (marque como pendente se não foi desenvolvido)`);
    }
  }

  // resumo_curto (opcional)
  if (entrada.resumo_curto !== undefined) {
    const rc = c.objeto(entrada, 'resumo_curto', '$');
    if (rc) {
      c.texto(rc, 'frase_tema', 'resumo_curto');
      c.listaDeTextos(rc, 'pontos', 'resumo_curto');
      const vc = c.objeto(rc, 'versiculo_chave', 'resumo_curto');
      if (vc) {
        c.texto(vc, 'referencia', 'resumo_curto.versiculo_chave');
        c.texto(vc, 'texto', 'resumo_curto.versiculo_chave');
      }
    }
  }

  // resumo_lider (opcional) — pontos espelham mapa_pontos
  if (entrada.resumo_lider !== undefined) {
    const rl = c.objeto(entrada, 'resumo_lider', '$');
    if (rl) {
      c.texto(rl, 'frase_tema', 'resumo_lider');
      c.listaDeObjetos(rl, 'pontos', 'resumo_lider', (p, cam) => {
        if (typeof p.numero !== 'number') c.erro(`${cam}.numero`, 'deve ser um número');
        c.texto(p, 'titulo', cam);
        c.texto(p, 'resumo', cam);
        c.texto(p, 'frase_chave', cam);
      });
      if (rl.versiculo_chave !== undefined) {
        const vc = c.objeto(rl, 'versiculo_chave', 'resumo_lider');
        if (vc) {
          c.texto(vc, 'referencia', 'resumo_lider.versiculo_chave');
          c.texto(vc, 'texto', 'resumo_lider.versiculo_chave');
        }
      }
    }
  }

  // resumo_final (opcional)
  if (entrada.resumo_final !== undefined) {
    if (!Array.isArray(entrada.resumo_final)) c.erro('resumo_final', 'deve ser uma lista');
    else
      entrada.resumo_final.forEach((item, i) => {
        const cam = `resumo_final[${i}]`;
        if (!ehObj(item)) c.erro(cam, 'deve ser um objeto');
        else {
          c.texto(item, 'ponto', cam);
          c.texto(item, 'versiculo_ancora', cam, false);
        }
      });
  }

  return { ok: c.erros.length === 0, erros: c.erros, avisos: c.avisos };
}

/** Type guard conveniente pra quem já validou e quer o tipo forte. */
export function ehPregacaoValida(entrada: unknown): entrada is PregacaoConteudo {
  return validarPregacao(entrada).ok;
}
