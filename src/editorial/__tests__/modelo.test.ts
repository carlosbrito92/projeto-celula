import { describe, expect, it } from 'vitest';
import { validarPregacao } from '../../content/validarPregacao';
import {
  adicionarBloco,
  adicionarPonto,
  blocoVazio,
  novoBloco,
  definirTituloCurto,
  gerarPontosResumoLider,
  limparParaPublicar,
  moverBloco,
  moverSecao,
  normalizar,
  novaPregacao,
  removerSecao,
  type Conteudo,
} from '../modelo';
import { caminhoTexto, definirCaminho, lerCaminho, rotuloCaminho } from '../caminho';

/** Pregação nova com 2 pontos preenchidos — o mínimo que passa no validador. */
function preenchida(): Conteudo {
  let c = adicionarPonto(novaPregacao());
  c = definirCaminho(c, ['metadados', 'serie'], 'Avulsa');
  c = definirCaminho(c, ['metadados', 'tema'], 'Fé que move');
  c = definirCaminho(c, ['banner_intro', 'frase_sintese'], 'A fé move.');
  c = definirTituloCurto(c, 'ponto-1', 'Primeiro');
  c = definirTituloCurto(c, 'ponto-2', 'Segundo');
  c = definirCaminho(c, ['secoes', 0, 'corpo', 0, 'texto'], 'Texto 1');
  c = definirCaminho(c, ['secoes', 1, 'corpo', 0, 'texto'], 'Texto 2');
  return c;
}

describe('modelo do editor', () => {
  it('pregação nova vazia não passa no validador, preenchida passa', () => {
    expect(validarPregacao(limparParaPublicar(novaPregacao())).ok).toBe(false);
    const r = validarPregacao(limparParaPublicar(preenchida()));
    expect(r.erros).toEqual([]);
  });

  it('adicionar/remover ponto mantém índice e seções sincronizados e numerados', () => {
    let c = adicionarPonto(adicionarPonto(novaPregacao()));
    expect(c.secoes.map((s) => s.numero)).toEqual(['01', '02', '03']);
    expect(c.mapa_pontos.map((p) => p.id)).toEqual(c.secoes.map((s) => s.id));
    c = removerSecao(c, 0);
    expect(c.secoes.map((s) => s.numero)).toEqual(['01', '02']);
    expect(c.mapa_pontos.map((p) => p.id)).toEqual(c.secoes.map((s) => s.id));
    expect(new Set(c.secoes.map((s) => s.id)).size).toBe(2);
    c = adicionarPonto(c); // id novo não colide com os que sobraram
    expect(new Set(c.secoes.map((s) => s.id)).size).toBe(3);
  });

  it('mover ponto leva junto o título curto do índice e renumera', () => {
    let c = preenchida();
    c = moverSecao(c, 1, -1);
    expect(c.secoes.map((s) => s.id)).toEqual(['ponto-2', 'ponto-1']);
    expect(c.mapa_pontos.map((p) => [p.id, p.numero, p.titulo])).toEqual([
      ['ponto-2', '01', 'Segundo'],
      ['ponto-1', '02', 'Primeiro'],
    ]);
    expect(moverSecao(c, 0, -1)).toEqual(c); // fora dos limites: nada muda
  });

  it('não renumera conteúdo com numeração própria nem mexe em seções extras ou pontos pendentes', () => {
    const c = normalizar({
      metadados: { serie: 'S', tema: 'T' },
      mapa_pontos: [
        { id: 'a', numero: '·', titulo: 'Intro' },
        { id: 'b', numero: '01', titulo: 'Um' },
        { id: 'p', numero: '02', titulo: 'Pendente', pendente: true },
      ],
      secoes: [
        { id: 'a', numero: '·', titulo: 'Intro', corpo: [] },
        { id: 'b', numero: '01', titulo: 'Um', corpo: [] },
        { id: 'fim', numero: '', titulo: 'Encerramento', corpo: [] },
      ],
    });
    const m = moverSecao(c, 1, -1);
    expect(m.secoes.map((s) => s.numero)).toEqual(['01', '·', '']);
    expect(m.mapa_pontos.map((p) => p.id)).toEqual(['b', 'a', 'p']);
    expect(m.mapa_pontos[2].pendente).toBe(true);
  });

  it('blocos: adicionar, mover; tipos novos geram a forma que o validador exige', () => {
    let c = preenchida();
    for (const tipo of ['versiculo', 'lista', 'citacao', 'analogia', 'stage', 'diagnostico', 'contraste'] as const) {
      c = adicionarBloco(c, 0, tipo);
    }
    const erros = validarPregacao(limparParaPublicar(c)).erros.map((e) => e.caminho);
    expect(erros.every((e) => e.startsWith('secoes[0].corpo['))).toBe(true); // só campos vazios dos blocos novos
    c = moverBloco(c, 0, 1, -1);
    expect(c.secoes[0].corpo[0].tipo).toBe('versiculo');
  });

  it('blocos: insere na posição pedida, sem tocar nos vizinhos', () => {
    let c = preenchida();
    c = adicionarBloco(c, 0, 'versiculo', 0);
    c = adicionarBloco(c, 0, 'lista', 1);
    expect(c.secoes[0].corpo.map((b) => b.tipo)).toEqual(['versiculo', 'lista', 'paragrafo']);
    expect(c.secoes[0].corpo[2]).toEqual({ tipo: 'paragrafo', texto: 'Texto 1' });
    c = adicionarBloco(c, 0, 'subtitulo', 99);
    expect(c.secoes[0].corpo.at(-1)?.tipo).toBe('subtitulo');
    expect(c.secoes[1].corpo).toHaveLength(1);
  });

  it('bloco vazio: recém-criado é vazio; com qualquer texto, não', () => {
    for (const tipo of ['paragrafo', 'versiculo', 'lista', 'citacao', 'analogia', 'stage', 'diagnostico', 'contraste'] as const) {
      expect(blocoVazio(novoBloco(tipo))).toBe(true);
    }
    expect(blocoVazio({ tipo: 'paragrafo', texto: '  ' })).toBe(true);
    expect(blocoVazio({ tipo: 'paragrafo', texto: 'oi' })).toBe(false);
    expect(blocoVazio({ tipo: 'lista', itens: ['', 'x'] })).toBe(false);
    const c = definirCaminho(novoBloco('contraste'), ['dados', 'lado_b', 'texto'], 'Sara');
    expect(blocoVazio(c)).toBe(false);
  });

  it('limpeza: remove opcionais vazios e linhas vazias de lista, herda título entre índice e seção', () => {
    let c = preenchida();
    c = adicionarBloco(c, 0, 'lista');
    c = definirCaminho(c, ['secoes', 0, 'corpo', 1, 'itens'], ['um', '', 'dois', '  ']);
    c = definirCaminho(c, ['banner_intro', 'versiculo_ancora'], { referencia: '', texto: '' });
    const l = limparParaPublicar(c);
    expect(l.metadados).toEqual({ serie: 'Avulsa', tema: 'Fé que move' });
    expect(l.banner_intro).toEqual({ frase_sintese: 'A fé move.' });
    expect(l.secoes[0].corpo[1]).toEqual({ tipo: 'lista', itens: ['um', 'dois'] });
    expect(l.secoes[0].titulo).toBe('Primeiro');
    expect('sec_eyebrow' in l.secoes[0]).toBe(false);
  });

  it('resumo do líder: um ponto por item do índice, mantendo texto já escrito', () => {
    let c = gerarPontosResumoLider(preenchida());
    expect(c.resumo_lider?.pontos.map((p) => [p.numero, p.titulo])).toEqual([
      [1, 'Primeiro'],
      [2, 'Segundo'],
    ]);
    c = definirCaminho(c, ['resumo_lider', 'pontos', 1, 'resumo'], 'Resumo do segundo');
    c = moverSecao(c, 1, -1);
    c = gerarPontosResumoLider(c);
    expect(c.resumo_lider?.pontos[0]).toMatchObject({ numero: 1, titulo: 'Segundo', resumo: 'Resumo do segundo' });
  });

  it('normalizar preserva campos que o editor não conhece', () => {
    const c = normalizar({ metadados: { serie: 'S', tema: 'T' }, resumo_curto: { frase_tema: 'x' }, celula_box: { sugestao_uso: 'y' } });
    expect(c.resumo_curto).toEqual({ frase_tema: 'x' });
    expect(c.celula_box).toEqual({ sugestao_uso: 'y' });
    expect(normalizar({})).toEqual(novaPregacao());
  });
});

describe('caminhos', () => {
  it('formato igual ao do validador, leitura e escrita imutável', () => {
    expect(caminhoTexto(['secoes', 2, 'corpo', 0, 'referencia'])).toBe('secoes[2].corpo[0].referencia');
    const o = { a: [{ b: 1 }] };
    const n = definirCaminho(o, ['a', 0, 'b'], 2);
    expect(lerCaminho(n, ['a', 0, 'b'])).toBe(2);
    expect(o.a[0].b).toBe(1);
  });

  it('rótulo legível para o líder', () => {
    expect(rotuloCaminho('secoes[1].corpo[2].referencia')).toBe('Ponto 2 › Bloco 3 › referência');
    expect(rotuloCaminho('metadados.tema')).toBe('Dados gerais › tema');
    expect(rotuloCaminho('secoes[0].corpo[1].dados.lado_a.titulo')).toBe('Ponto 1 › Bloco 2 › lado A › título');
  });
});

describe('pendências de título', () => {
  it('com os dois títulos vazios, só o do índice aparece', async () => {
    const { semErroDuplicadoDeTitulo } = await import('../modelo');
    const c = novaPregacao();
    const erros = validarPregacao(limparParaPublicar(c)).erros;
    expect(erros.map((e) => e.caminho)).toEqual(expect.arrayContaining(['mapa_pontos[0].titulo', 'secoes[0].titulo']));
    const filtrados = semErroDuplicadoDeTitulo(c, erros).map((e) => e.caminho);
    expect(filtrados).toContain('mapa_pontos[0].titulo');
    expect(filtrados).not.toContain('secoes[0].titulo');
    expect(rotuloCaminho('mapa_pontos[0].titulo')).toBe('Ponto 1 › título do ponto');
  });
});

describe('arquivo enviado para revisão', () => {
  it('chaves na ordem do schema, mesmo editando em outra ordem', () => {
    let c = definirCaminho(preenchida(), ['metadados', 'tema_override'], 'Estilo #5b');
    const { secoes, ...resto } = c;
    c = { secoes, ...resto }; // simula a ordem de inserção vista no PR #80
    const l = limparParaPublicar(c);
    expect(Object.keys(l).slice(0, 4)).toEqual(['metadados', 'banner_intro', 'mapa_pontos', 'secoes']);
    expect(Object.keys(l.metadados)).toEqual(['serie', 'tema', 'tema_override']);
    expect(Object.keys(l.secoes[0]).slice(0, 4)).toEqual(['id', 'numero', 'titulo', 'corpo']);
  });

  it('remove marcador digitado em itens de lista ("* item", "- item", "1. item")', () => {
    let c = adicionarBloco(preenchida(), 0, 'lista');
    c = definirCaminho(c, ['secoes', 0, 'corpo', 1, 'itens'], ['* Teste de lista', '- dois', '• três', '1. quatro', '*negrito* fica']);
    expect((limparParaPublicar(c).secoes[0].corpo[1] as { itens: string[] }).itens).toEqual([
      'Teste de lista',
      'dois',
      'três',
      'quatro',
      '*negrito* fica',
    ]);
  });
});
