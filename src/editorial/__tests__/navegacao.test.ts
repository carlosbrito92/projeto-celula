import { describe, expect, it } from 'vitest';
import { validarPregacao } from '../../content/validarPregacao';
import { adicionarPonto, limparParaPublicar, novaPregacao } from '../modelo';
import { contarPorGrupo, grupoDoCaminho } from '../navegacao';

describe('navegação do editor', () => {
  const c = adicionarPonto(novaPregacao());

  it('caminho de erro vira o grupo da tela onde se corrige', () => {
    expect(grupoDoCaminho(c, 'metadados.tema')).toBe('metadados');
    expect(grupoDoCaminho(c, 'banner_intro.frase_sintese')).toBe('banner_intro');
    expect(grupoDoCaminho(c, 'secoes[1].corpo[0].texto')).toBe('secao:ponto-2');
    expect(grupoDoCaminho(c, 'mapa_pontos[0].titulo')).toBe('secao:ponto-1');
    expect(grupoDoCaminho(c, 'resumo_lider.pontos[0].resumo')).toBe('resumo_lider');
    expect(grupoDoCaminho(c, 'mapa_pontos')).toBe('geral');
  });

  it('conta pendências por grupo de uma pregação nova', () => {
    const n = contarPorGrupo(c, validarPregacao(limparParaPublicar(c)).erros);
    expect(n.get('metadados')).toBe(2); // série e tema
    expect(n.get('banner_intro')).toBe(1);
    expect(n.get('secao:ponto-1')).toBeGreaterThan(0);
    expect(n.get('secao:ponto-2')).toBeGreaterThan(0);
  });
});
