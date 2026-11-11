// Importação de JSON gerado por IA (docs/painel-editorial.md §7.3). A resposta
// de um chat costuma vir com texto em volta e cercas ```json; aqui só se tira
// o objeto JSON de dentro. Validar o conteúdo é trabalho do editor (a lista de
// pendências usa o mesmo validarPregacao da publicação).

export type ResultadoImportacao = { ok: true; conteudo: Record<string, unknown> } | { ok: false; erro: string };

/** Mesmo teto do servidor (api/_lib/rascunhos.ts, TAMANHO_MAXIMO). */
export const TAMANHO_MAXIMO_IMPORTACAO = 512 * 1024;

export function extrairJson(texto: string): ResultadoImportacao {
  const limpo = texto.replace(/^﻿/, '').trim();
  if (!limpo) return { ok: false, erro: 'Cole o JSON ou escolha um arquivo.' };
  if (new Blob([limpo]).size > TAMANHO_MAXIMO_IMPORTACAO) return { ok: false, erro: 'Arquivo grande demais (máximo 512 KB).' };

  const cerca = /```(?:json)?\s*([\s\S]*?)```/i.exec(limpo);
  let candidato = cerca ? cerca[1].trim() : limpo;
  const inicio = candidato.indexOf('{');
  const fim = candidato.lastIndexOf('}');
  if (inicio < 0 || fim <= inicio) return { ok: false, erro: 'Não encontrei um JSON no texto. Ele começa com { e termina com }.' };
  candidato = candidato.slice(inicio, fim + 1);

  let valor: unknown;
  try {
    valor = JSON.parse(candidato);
  } catch {
    return { ok: false, erro: 'O JSON está incompleto ou com erro de formato. Peça à IA para gerar de novo, inteiro, num único bloco.' };
  }
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return { ok: false, erro: 'O JSON precisa ser um objeto { ... }.' };
  const o = valor as Record<string, unknown>;
  if (!('metadados' in o) && !('secoes' in o)) {
    return { ok: false, erro: 'Isto não parece uma pregação (faltam "metadados" e "secoes").' };
  }
  return { ok: true, conteudo: o };
}
