// Tipos do schema de conteúdo de pregação — espelha docs/geracao-pregacao.md.

export interface Metadados {
  serie: string;
  capitulo?: string;
  tema: string;
  data?: string;
  pregador?: string;
  texto_base?: string;
  modo_origem?: 'A' | 'B';
  /** Aponta explicitamente para um tema (ex: "Estilo #3") quando serie não resolve um. Ver docs/estilos-pregacao.md § Resolução de tema. */
  tema_override?: string;
}

export interface VersiculoAncora {
  referencia: string;
  texto: string;
}

export interface BannerIntro {
  /** Recapitulação/enquadramento editorial antes da frase-síntese. Ex: "Segundo capítulo da série X...". */
  contextualizacao?: string;
  /** Mesmo formato de variante/dados de ComponenteTemaVariante, mas no nível do header — não dentro de uma seção. */
  componente_tema?: ComponenteTemaVariante;
  frase_sintese: string;
  /** Versículo-base citado por extenso, em destaque isolado, entre a frase-síntese e o índice. Distinto de metadados.texto_base (só a referência curta). */
  versiculo_ancora?: VersiculoAncora;
}

export interface MapaPonto {
  id: string;
  numero: string;
  titulo: string;
}

export interface BlocoParagrafo {
  tipo: 'paragrafo';
  texto: string;
}

export interface BlocoVersiculo {
  tipo: 'versiculo';
  referencia: string;
  texto: string;
}

export interface BlocoCallout {
  tipo: 'callout';
  texto: string;
}

export interface BlocoFraseChave {
  tipo: 'frase_chave';
  texto: string;
}

export interface BlocoLista {
  tipo: 'lista';
  itens: string[];
}

export interface DadosStage {
  label: string;
  frase: string;
  subtitulo?: string;
}

export interface DadosDiagnostico {
  label: string;
  itens: string[];
}

export interface DadosAntidoto {
  label: string;
  texto: string;
}

export interface DadosVersusLado {
  label: string;
  citacao: string;
}

export interface DadosVersus {
  lado_a: DadosVersusLado;
  lado_b: DadosVersusLado;
}

export interface DadosContrasteLado {
  label: string;
  titulo: string;
  texto: string;
}

export interface DadosContraste {
  lado_a: DadosContrasteLado;
  lado_b: DadosContrasteLado;
}

export interface DadosAnalogia {
  label: string;
  corpo: string[];
  conclusao: string;
}

export interface DadosBanhoList {
  itens: string[];
}

export interface DadosHumor {
  texto: string;
}

export interface DadosLabelBoxCampo {
  campo: string;
  valor: string;
}

export interface DadosLabelBox {
  titulo: string;
  campos: DadosLabelBoxCampo[];
}

export type ComponenteTemaVariante =
  | { variante: 'stage'; dados: DadosStage }
  | { variante: 'diagnostico'; dados: DadosDiagnostico }
  | { variante: 'antidoto'; dados: DadosAntidoto }
  | { variante: 'versus'; dados: DadosVersus }
  | { variante: 'contraste'; dados: DadosContraste }
  | { variante: 'analogia'; dados: DadosAnalogia }
  | { variante: 'banho_list'; dados: DadosBanhoList }
  | { variante: 'humor'; dados: DadosHumor }
  | { variante: 'label_box'; dados: DadosLabelBox }
  // variantes exclusivas de tema ainda não implementadas na plataforma
  // (verb_block, poeiras_grid) caem aqui e são ignoradas com segurança
  // pelo ComponenteTemaRenderer — nunca quebram a renderização.
  | { variante: string; dados: unknown };

export type BlocoComponenteTema = { tipo: 'componente_tema' } & ComponenteTemaVariante;

export type Bloco =
  | BlocoParagrafo
  | BlocoVersiculo
  | BlocoCallout
  | BlocoFraseChave
  | BlocoLista
  | BlocoComponenteTema;

export interface Anotacao {
  autor: string;
  texto: string;
}

export interface Secao {
  id: string;
  numero: string;
  titulo: string;
  sec_eyebrow?: string;
  referencias?: string;
  corpo: Bloco[];
  anotacoes?: Anotacao[];
}

export interface ResumoItem {
  ponto: string;
  versiculo_ancora?: string;
}

export interface MerchItem {
  icone: string;
  titulo: string;
  descricao: string;
}

export interface MerchSectionData {
  titulo?: string;
  itens: MerchItem[];
}

export interface NotaLacuna {
  secao_id: string;
  texto: string;
}

export interface CelulaBoxData {
  anotado_por?: string;
  compartilhado_por?: string;
  sugestao_uso?: string;
}

export interface PregacaoConteudo {
  metadados: Metadados;
  banner_intro?: BannerIntro;
  mapa_pontos: MapaPonto[];
  secoes: Secao[];
  resumo_final?: ResumoItem[];
  merch_section?: MerchSectionData | null;
  /** Nota de rodapé do Estilo #3 (quem anotou, quem compartilha, sugestão de uso) — não confundir com banner_intro.contextualizacao (abertura). */
  celula_box?: CelulaBoxData | null;
  nota_lacuna?: NotaLacuna[];
}

// Linha da tabela `pregacoes` no Supabase.
export interface PregacaoRow {
  id: string;
  serie: string | null;
  capitulo: string | null;
  tema: string;
  data: string | null;
  pregador: string | null;
  texto_base: string | null;
  modo_origem: 'A' | 'B' | null;
  conteudo: PregacaoConteudo;
  created_at: string;
  updated_at: string;
}

// Tipos do schema de conteúdo de quebra-gelos/utilitários — espelha
// docs/projeto-celula.md §5-§6 e docs/spec-privacidade-sorteio.md.

export type UtilitarioTipo = 'sorteio_atribuicao' | 'sorteio_papel' | 'cronometro';

/**
 * Utilitário embutido inline na regra de um quebra-gelo. Item [0] do array vira
 * o CTA grande da tela de Detalhe; um item adicional (caso "Artista Impostor",
 * que usa 2 utilitários) vira só uma legenda "Depois: X", não clicável — ver
 * docs/mock-aprovado-v2.html (bloco de CTA da tela de detalhe).
 */
export interface UtilitarioInlineRef {
  utilitario_tipo: UtilitarioTipo;
  rotulo_acao: string;
  eyebrow?: string;
  /**
   * Só para utilitario_tipo === 'sorteio_papel' — lista de papéis com
   * quantidade explícita (ex: [{nome:"Detetive",quantidade:1},{nome:"Cidadão",quantidade:3}]).
   * A soma das quantidades precisa bater com o total de participantes no
   * momento do sorteio (validado em runtime, não aqui) — docs/spec-privacidade-sorteio.md
   * § Extensão: papéis múltiplos.
   */
  papeis?: { nome: string; quantidade: number }[];
}

export interface QuebraGeloJogoConteudo {
  icone?: string;
  jogadores?: { min: number; max?: number };
  idade_minima?: number;
  duracao_minutos?: number;
  /** Passos numerados. Ausente => tela de Detalhe renderiza "Detalhes em breve". */
  regras?: string[];
  utilitarios_inline?: UtilitarioInlineRef[];
}

/** conteudo das linhas tipo='utilitario' — as 3 ferramentas em si, aba Utilitários. */
export interface UtilitarioCatalogoConteudo {
  icone?: string;
  utilitario_tipo: UtilitarioTipo;
  descricao_curta?: string;
}

export type QuebraGeloConteudo = QuebraGeloJogoConteudo | UtilitarioCatalogoConteudo;

// Linha da tabela `quebra_gelos` no Supabase.
export interface QuebraGeloRow {
  id: string;
  nome: string;
  tipo: 'instrucional' | 'utilitario' | 'instrucional_utilitario';
  /** Texto de proveniência/exibição — não lido pela UI para decidir qual widget abrir. */
  utilitario: string | null;
  conteudo: QuebraGeloConteudo;
  created_at: string;
  updated_at: string;
}
