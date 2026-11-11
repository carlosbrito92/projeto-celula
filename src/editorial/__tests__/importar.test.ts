import { describe, expect, it } from 'vitest';
import { extrairJson } from '../importar';

describe('extrairJson', () => {
  const pregacao = { metadados: { tema: 'X' }, secoes: [] };

  it('aceita JSON puro, com BOM e espaços', () => {
    expect(extrairJson(`﻿  ${JSON.stringify(pregacao)}\n`)).toEqual({ ok: true, conteudo: pregacao });
  });

  it('tira de dentro de cerca ```json e de texto em volta', () => {
    const r = extrairJson(`Aqui está:\n\`\`\`json\n${JSON.stringify(pregacao, null, 2)}\n\`\`\`\nQualquer dúvida, avise.`);
    expect(r).toEqual({ ok: true, conteudo: pregacao });
    expect(extrairJson(`Segue o JSON: ${JSON.stringify(pregacao)} Espero que ajude!`)).toEqual({ ok: true, conteudo: pregacao });
  });

  it('erros legíveis: vazio, sem JSON, cortado, lista, outro objeto', () => {
    expect(extrairJson('  ')).toMatchObject({ ok: false, erro: expect.stringContaining('Cole') });
    expect(extrairJson('não sei')).toMatchObject({ ok: false, erro: expect.stringContaining('Não encontrei') });
    expect(extrairJson('{"metadados": {"tema": "X"}, "secoes": [')).toMatchObject({ ok: false, erro: expect.stringContaining('incompleto') });
    expect(extrairJson('{"metadados": {"tema": "X",}}')).toMatchObject({ ok: false, erro: expect.stringContaining('incompleto') });
    expect(extrairJson('{"nome": "x"}')).toMatchObject({ ok: false, erro: expect.stringContaining('não parece') });
  });

  it('recusa acima de 512 KB', () => {
    const grande = JSON.stringify({ metadados: {}, secoes: [], x: 'a'.repeat(600 * 1024) });
    expect(extrairJson(grande)).toMatchObject({ ok: false, erro: expect.stringContaining('512 KB') });
  });
});
