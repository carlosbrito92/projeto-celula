import { describe, expect, it } from 'vitest';
import { validarPregacao } from '../validarPregacao';

const minima = () => ({
  metadados: { serie: 'Igrejar', tema: 'Uma Igreja de Joelhos', data: '26 de julho de 2026' },
  mapa_pontos: [{ id: 'p1', numero: '01', titulo: 'Oração' }],
  secoes: [
    {
      id: 'p1',
      numero: '01',
      titulo: 'Oração',
      corpo: [
        { tipo: 'paragrafo', texto: 'A **oração** muda tudo.' },
        { tipo: 'versiculo', referencia: 'Tiago 5.16', texto: 'A oração de um justo...' },
      ],
    },
  ],
});

const caminhos = (r: ReturnType<typeof validarPregacao>) => r.erros.map((e) => e.caminho);

describe('validarPregacao', () => {
  it('aceita pregação mínima válida', () => {
    const r = validarPregacao(minima());
    expect(r.erros).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('rejeita entrada que não é objeto', () => {
    expect(validarPregacao(null).ok).toBe(false);
    expect(validarPregacao([]).ok).toBe(false);
    expect(validarPregacao('texto').ok).toBe(false);
  });

  it('exige metadados.serie e metadados.tema', () => {
    const p = minima() as Record<string, unknown>;
    p.metadados = { serie: '', data: '26 de julho de 2026' };
    expect(caminhos(validarPregacao(p))).toEqual(expect.arrayContaining(['metadados.serie', 'metadados.tema']));
  });

  it('data fora do formato PT-BR vira aviso (coluna date ficaria null)', () => {
    const p = minima();
    p.metadados.data = '2026-07-26';
    const r = validarPregacao(p);
    expect(r.ok).toBe(true);
    expect(r.avisos.map((a) => a.caminho)).toContain('metadados.data');
  });

  it('seção sem número (encerramento) não precisa estar em mapa_pontos', () => {
    const p = minima();
    p.secoes.push({ id: 'encerramento', numero: '', titulo: 'Encerramento', corpo: [{ tipo: 'paragrafo', texto: 'x' }] });
    expect(validarPregacao(p).erros).toEqual([]);
  });

  it('rejeita versículo sem referência', () => {
    const p = minima();
    p.secoes[0].corpo[1] = { tipo: 'versiculo', referencia: '  ', texto: 'x' };
    expect(caminhos(validarPregacao(p))).toContain('secoes[0].corpo[1].referencia');
  });

  it('rejeita tipo de bloco desconhecido', () => {
    const p = minima();
    (p.secoes[0].corpo as unknown[]).push({ tipo: 'analogia', texto: 'x' });
    expect(caminhos(validarPregacao(p))).toContain('secoes[0].corpo[2].tipo');
  });

  it('valida dados de analogia como componente_tema', () => {
    const p = minima();
    (p.secoes[0].corpo as unknown[]).push({
      tipo: 'componente_tema',
      variante: 'analogia',
      dados: { label: 'Analogia', corpo: [], conclusao: '' },
    });
    expect(caminhos(validarPregacao(p))).toEqual(
      expect.arrayContaining(['secoes[0].corpo[2].dados.corpo', 'secoes[0].corpo[2].dados.conclusao']),
    );
  });

  it('variante de componente_tema desconhecida é aviso, não erro', () => {
    const p = minima();
    (p.secoes[0].corpo as unknown[]).push({ tipo: 'componente_tema', variante: 'poeiras_grid', dados: {} });
    const r = validarPregacao(p);
    expect(r.ok).toBe(true);
    expect(r.avisos.map((a) => a.caminho)).toContain('secoes[0].corpo[2].variante');
  });

  it('exige correspondência entre mapa_pontos e secoes (exceto ponto pendente)', () => {
    const p = minima();
    p.mapa_pontos.push({ id: 'p2', numero: '02', titulo: 'Jejum' });
    expect(validarPregacao(p).ok).toBe(false);

    (p.mapa_pontos[1] as Record<string, unknown>).pendente = true;
    expect(validarPregacao(p).ok).toBe(true);

    p.secoes.push({ id: 'p9', numero: '09', titulo: 'Órfã', corpo: [{ tipo: 'paragrafo', texto: 'x' }] });
    expect(caminhos(validarPregacao(p))).toContain('secoes[1].id');
  });

  it('rejeita ids de seção repetidos', () => {
    const p = minima();
    p.secoes.push({ ...p.secoes[0] });
    expect(caminhos(validarPregacao(p))).toContain('secoes[1].id');
  });

  it('valida resumo_lider no formato pontos[{numero,titulo,resumo,frase_chave}]', () => {
    const p = minima() as Record<string, unknown>;
    p.resumo_lider = {
      frase_tema: 'Orar é depender',
      pontos: [{ numero: '1', titulo: 'Oração', resumo: '', frase_chave: 'Quem ora, depende.' }],
    };
    expect(caminhos(validarPregacao(p))).toEqual(
      expect.arrayContaining(['resumo_lider.pontos[0].numero', 'resumo_lider.pontos[0].resumo']),
    );
  });

  // Regressão: todo conteúdo real já publicado precisa passar — senão o
  // validador está mais estrito que o schema de fato usado em produção.
  //
  // Exceção explícita, por arquivo: erro conhecido de conteúdo que ainda não
  // foi corrigido. Manter vazio — qualquer entrada aqui é dívida aberta (ver
  // docs/progresso.md § Painel Editorial). Primeira rodada (stage com
  // texto/sub em vez de frase/subtitulo, 6 arquivos) corrigida no PR #68.
  const PENDENCIAS_CONHECIDAS: Record<string, string[]> = {};

  describe('conteúdo real de content/pregacoes/', () => {
    // import.meta.glob (não node:fs) — este arquivo é type-checked pelo
    // tsconfig.app.json, que não tem tipos de Node.
    const modulos = import.meta.glob('../../../content/pregacoes/*.json', { eager: true, import: 'default' });
    const casos = Object.entries(modulos).map(([caminho, dado]) => [caminho.split('/').pop()!, dado] as const);

    it('encontrou o conteúdo real', () => expect(casos.length).toBeGreaterThan(10));

    it.each(casos)('%s é válido', (arquivo, dado) => {
      expect(caminhos(validarPregacao(dado))).toEqual(PENDENCIAS_CONHECIDAS[arquivo] ?? []);
    });
  });
});
