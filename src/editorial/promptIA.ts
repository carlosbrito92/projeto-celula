// Prompt para o líder gerar a pregação na IA de preferência dele. O corpo é
// docs/geracao-pregacao.md inteiro (o mesmo que Carlos usa, carregado com
// ?raw no build: muda o doc, muda o prompt). O doc remete a
// estilos-pregacao.md para os payloads de componente_tema, que o líder não
// tem; o apêndice abaixo traz esses formatos (testados contra o validador).

export const PAYLOADS_COMPONENTE: Record<string, Record<string, unknown>> = {
  analogia: { label: 'Ilustração — O Copo de Água Suja', corpo: ['parágrafo 1', 'parágrafo 2 (opcional)'], conclusao: 'frase que liga a ilustração ao ponto' },
  stage: { label: 'Promessa de Deus', frase: 'a frase em destaque', subtitulo: 'opcional — referência ou contexto curto' },
  diagnostico: { label: 'Sintomas', itens: ['item 1', 'item 2'] },
  antidoto: { label: 'O tratamento', texto: 'texto' },
  versus: { lado_a: { label: 'polo confrontado', citacao: 'texto' }, lado_b: { label: 'polo afirmado', citacao: 'texto' } },
  contraste: {
    lado_a: { label: 'Agar', titulo: 'o que ela representa', texto: 'texto' },
    lado_b: { label: 'Sara', titulo: 'o que ela representa', texto: 'texto' },
  },
  timeline: { itens: [{ icon: '1', titulo: 'etapa', desc: 'descrição, aceita **negrito**' }] },
  label_box: { titulo: 'Antídoto', campos: [{ campo: 'Princípio ativo', valor: 'Graça' }] },
  banho_list: { itens: ['item 1', 'item 2'] },
};

export function montarPrompt(doc: string, series: readonly string[]): string {
  const payloads = Object.entries(PAYLOADS_COMPONENTE)
    .map(([variante, dados]) => `- \`${variante}\`: \`${JSON.stringify(dados)}\``)
    .join('\n');
  return `${doc.trim()}

---

## Apêndice para o Painel Editorial

### Formato de \`dados\` de cada \`componente_tema\`

Use só estas variantes, com exatamente estes campos:

${payloads}

Não use \`verb_block\`, \`poeiras_grid\` nem \`razoes_grid\`.

### Séries com tema próprio

Em \`metadados.serie\`, use o nome exato de uma destas quando for o caso; senão, \`Avulsa\`:

${series.map((s) => `- ${s}`).join('\n')}

### Formato da resposta

Responda **só com o JSON**, completo, num único bloco de código. Sem comentários dentro do JSON e sem texto antes ou depois. Os campos de \`metadados\` que o líder não informou ficam como string vazia.
`;
}

/** Bloco de metadados que o líder preenche e cola junto com a transcrição ou as anotações. */
export const MODELO_PEDIDO = `Série: 
Capítulo: 
Tema: 
Data: 
Pregador: 
Texto-base: 
Modo: A (transcrição) ou B (anotações)

Siga as instruções do prompt acima para gerar o conteúdo em JSON.

[cole aqui a transcrição ou as anotações]`;
