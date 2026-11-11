import type { Conteudo } from './modelo';

// Índice do editor: agrupa as pendências do validador pelo trecho da tela
// onde o líder vai corrigi-las (dados gerais, abertura, cada ponto, resumo).

export type Grupo = 'metadados' | 'banner_intro' | 'resumo_lider' | 'geral' | `secao:${string}`;

export function grupoDoCaminho(c: Conteudo, caminho: string): Grupo {
  if (caminho.startsWith('metadados')) return 'metadados';
  if (caminho.startsWith('banner_intro')) return 'banner_intro';
  if (caminho.startsWith('resumo_lider')) return 'resumo_lider';
  const s = /^secoes\[(\d+)\]/.exec(caminho);
  if (s) {
    const id = c.secoes[Number(s[1])]?.id;
    return id ? `secao:${id}` : 'geral';
  }
  const m = /^mapa_pontos\[(\d+)\]/.exec(caminho);
  if (m) {
    const id = c.mapa_pontos[Number(m[1])]?.id;
    return id && c.secoes.some((x) => x.id === id) ? `secao:${id}` : 'geral';
  }
  return 'geral';
}

export function contarPorGrupo(c: Conteudo, erros: { caminho: string }[]): Map<Grupo, number> {
  const r = new Map<Grupo, number>();
  for (const e of erros) {
    const g = grupoDoCaminho(c, e.caminho);
    r.set(g, (r.get(g) ?? 0) + 1);
  }
  return r;
}
