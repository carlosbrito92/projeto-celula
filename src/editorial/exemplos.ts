import type { TipoNovoBloco } from './modelo';

// Exemplos do editor guiado: para cada campo/bloco, onde ele aparece na
// leitura e um trecho real de uma pregação já publicada (content/pregacoes/).
// Pedido de Carlos (2026-11-11): o líder precisa ter noção do que escreve e
// de onde aquilo vai parar. Tipos sem uso real no acervo ainda (subtítulo,
// pergunta/resposta, citação) têm exemplo ilustrativo, sem `fonte`.

export interface Exemplo {
  /** Onde o campo aparece para quem lê. */
  onde: string;
  linhas: { rotulo?: string; texto: string }[];
  /** Tema da pregação de onde o trecho foi tirado. */
  fonte?: string;
}

export type ChaveExemplo =
  | 'tema'
  | 'serie'
  | 'capitulo'
  | 'texto_base'
  | 'frase_sintese'
  | 'contextualizacao'
  | 'versiculo_ancora'
  | 'titulo_indice'
  | 'titulo_secao'
  | 'sec_eyebrow'
  | 'referencias'
  | 'rl_frase_tema'
  | 'rl_ponto'
  | TipoNovoBloco;

export const EXEMPLOS: Record<ChaveExemplo, Exemplo> = {
  tema: {
    onde: 'Título grande no topo da pregação e no card da Biblioteca.',
    linhas: [{ texto: 'A Graça Não É o Que Você Pensa' }],
    fonte: 'A Graça Não É o Que Você Pensa',
  },
  serie: {
    onde: 'Etiqueta acima do título e no card da Biblioteca. Define as cores e fontes da leitura.',
    linhas: [{ texto: 'Religião Tóxica' }, { rotulo: 'Sem série', texto: 'Avulsa' }],
  },
  capitulo: {
    onde: 'Junto da série, no topo da pregação.',
    linhas: [{ texto: 'Capítulo 4 · Penúltimo Episódio' }],
    fonte: 'A Igreja: o Centro do Coração de Deus',
  },
  texto_base: {
    onde: 'Nos dados da pregação; usado na busca da Biblioteca.',
    linhas: [{ texto: 'Mateus 16.18' }],
    fonte: 'A Igreja: o Centro do Coração de Deus',
  },
  frase_sintese: {
    onde: 'Frase em destaque logo abaixo do título, antes do índice. É a primeira coisa que o leitor lê.',
    linhas: [
      {
        texto:
          'Quando todas as portas se fecham, ainda existe uma porta que permanece aberta: a porta da oração. E essa porta, nem Herodes pode fechar.',
      },
    ],
    fonte: 'Uma Igreja de Joelhos',
  },
  contextualizacao: {
    onde: 'Parágrafo curto acima da frase-síntese, situando a mensagem.',
    linhas: [
      {
        texto:
          'Uma mensagem sobre maturidade, sabedoria e a importância de discernir as estações espirituais para concluir os ciclos de crescimento e alcançar o próximo nível que Deus tem para nós.',
      },
    ],
    fonte: 'Contando os Nossos Dias',
  },
  versiculo_ancora: {
    onde: 'Versículo em destaque entre a frase-síntese e o índice.',
    linhas: [
      { rotulo: 'Referência', texto: 'Salmo 90.12' },
      { rotulo: 'Texto', texto: 'Ensina-nos a contar os nossos dias para que o nosso coração alcance sabedoria.' },
    ],
    fonte: 'Contando os Nossos Dias',
  },
  titulo_indice: {
    onde: 'No índice do começo e na trilha de pontos que acompanha a leitura. Quanto mais curto, melhor.',
    linhas: [{ texto: 'O Poder e o Fruto das Palavras' }],
    fonte: 'A Boca de Quem Entendeu a Graça',
  },
  titulo_secao: {
    onde: 'Título no início do ponto, dentro da leitura. Normalmente igual ao do índice.',
    linhas: [{ texto: '6ª Prova: Recebemos o Selo e o Penhor do Espírito' }],
    fonte: 'A Certeza da Salvação',
  },
  sec_eyebrow: {
    onde: 'Etiqueta pequena acima do título do ponto, dizendo o papel dele na mensagem.',
    linhas: [{ texto: '1ª Verdade' }],
    fonte: 'A Boca de Quem Entendeu a Graça',
  },
  referencias: {
    onde: 'Linha abaixo do título do ponto, com as passagens citadas nele, separadas por " · ".',
    linhas: [{ texto: 'Provérbios 12.14 · Provérbios 12.18 · Provérbios 13.2 · Provérbios 18.20-21' }],
    fonte: 'A Boca de Quem Entendeu a Graça',
  },
  paragrafo: {
    onde: 'Texto corrido do ponto. Palavras entre ** ficam em destaque.',
    linhas: [{ texto: 'Em Romanos 7, Paulo faz outra alegoria — desta vez, do **casamento** — para falar da lei.' }],
    fonte: 'A Religião Te Confundiu',
  },
  versiculo: {
    onde: 'Caixa de versículo dentro do ponto, com a referência embaixo.',
    linhas: [
      { rotulo: 'Referência', texto: 'Romanos 7.12' },
      { rotulo: 'Texto', texto: 'De fato, a lei é santa, e o mandamento, santo, justo e bom.' },
    ],
    fonte: 'A Lei É Boa, Mas o Problema Não É Ela',
  },
  frase_chave: {
    onde: 'Frase curta em destaque — a síntese que o pregador repetiu ou deixou formulada.',
    linhas: [{ texto: 'Talvez ninguém veja, mas Deus vê.' }],
    fonte: 'Jamais Será em Vão',
  },
  callout: {
    onde: 'Caixa destacada com uma frase de impacto ou aplicação prática.',
    linhas: [{ texto: 'Mau humor não é destino — é uma escolha. Decida não ficar mal-humorado. Decida ser feliz.' }],
    fonte: 'Como Viver uma Vida Abundante',
  },
  lista: {
    onde: 'Lista com marcadores. Escreva um item por linha, sem "*" ou "-".',
    linhas: [
      { texto: 'Somos fortalecidos — a vida flui pela conexão.' },
      { texto: 'Recebemos direção — o Corpo enxerga o que o membro isolado não vê.' },
      { texto: 'Somos protegidos — há cobertura na comunhão.' },
    ],
    fonte: 'A Igreja: o Centro do Coração de Deus',
  },
  subtitulo: {
    onde: 'Divide um ponto longo em partes, como um título menor dentro dele.',
    linhas: [{ texto: 'O que a lei não consegue fazer' }],
  },
  pergunta: {
    onde: 'Pergunta em destaque, seguida da resposta (use o bloco "Resposta" logo depois).',
    linhas: [{ texto: 'Se a lei é santa, justa e boa, por que ela não consegue nos salvar?' }],
  },
  resposta: {
    onde: 'Resposta à pergunta logo acima.',
    linhas: [{ texto: 'Porque o problema nunca foi a lei — foi o coração de quem tenta cumpri-la sozinho.' }],
  },
  citacao: {
    onde: 'Frase de outra pessoa (autor, teólogo, livro), com o nome embaixo. Para frases do próprio pregador, use "Destaque".',
    linhas: [
      { rotulo: 'Autor', texto: 'Agostinho, Confissões' },
      { rotulo: 'Citação', texto: 'Fizeste-nos para ti, e inquieto está o nosso coração enquanto não repousa em ti.' },
    ],
  },
  analogia: {
    onde: 'Caixa recolhível com uma ilustração ou história do pregador e a conclusão dela.',
    linhas: [
      { rotulo: 'Rótulo', texto: 'Testemunho pessoal' },
      {
        rotulo: 'Parágrafo',
        texto:
          "O pastor compartilhou que cresceu ouvindo de seu pai e irmão mais velho que 'não era nada e não ia virar nada' — e reagia.",
      },
      { rotulo: 'Conclusão', texto: 'É um bom tipo de estratégia… só destrói a alma de uma criança.' },
    ],
    fonte: 'De Volta ao Pai',
  },
  stage: {
    onde: 'Declaração grande, em palco, para a verdade central do ponto.',
    linhas: [
      { rotulo: 'Rótulo', texto: 'Lição' },
      { rotulo: 'Frase', texto: 'Deus sempre desejou viver em comunhão conosco.' },
      { rotulo: 'Linha de apoio', texto: 'Gênesis 2 · Apocalipse 21-22 — do anteprojeto no Éden à consumação na Nova Jerusalém.' },
    ],
    fonte: 'A Igreja: o Centro do Coração de Deus',
  },
  diagnostico: {
    onde: 'Caixa de alerta com um rótulo e uma lista (sintomas, sinais, perigos).',
    linhas: [
      { rotulo: 'Rótulo', texto: 'Sintomas da "Doença dos Gálatas"' },
      { texto: 'Medo constante da punição de Deus.' },
      { texto: 'Dúvida sobre a própria salvação.' },
      { texto: 'Crença de que precisa conquistar o favor divino por meio das obras.' },
    ],
    fonte: 'Você Foi Enganado',
  },
  contraste: {
    onde: 'Dois cartões lado a lado comparando duas figuras ou ideias.',
    linhas: [
      { rotulo: 'Lado A · Agar · Grande Babilônia', texto: 'A Lei. Não sozinha — mas misturada. Aponta para o Monte Sinai, gera escravidão, produz esforço e merecimento.' },
      { rotulo: 'Lado B · Sara · Nova Jerusalém', texto: 'A Graça. A noiva, pura, com interesse somente em Cristo. Aponta para a Jerusalém do alto — livre.' },
    ],
    fonte: 'A Religião Te Confundiu',
  },
  rl_frase_tema: {
    onde: 'Abertura da versão resumida (botão "Ler versão resumida" na pregação).',
    linhas: [
      {
        texto:
          'Todo serviço realizado para Deus, mesmo que invisível aos olhos humanos, possui valor eterno e jamais será esquecido pelo Senhor.',
      },
    ],
    fonte: 'Jamais Será em Vão',
  },
  rl_ponto: {
    onde: 'Um cartão por ponto na versão resumida: resumo que se sustenta sozinho + a frase do pregador.',
    linhas: [
      {
        rotulo: 'Resumo',
        texto:
          'A salvação é um presente imerecido de Deus, não fruto de nossos esforços. No entanto, fomos transformados para que essa graça transborde em boas obras como evidência de nossa fé (Efésios 2.8-10).',
      },
      { rotulo: 'Frase-chave', texto: 'Não somos salvos pelas obras, mas somos salvos para as obras.' },
    ],
    fonte: 'Jamais Será em Vão',
  },
};
