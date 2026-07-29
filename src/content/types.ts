// Tipos do schema de conteúdo de pregação — espelha docs/geracao-pregacao.md.

export interface Metadados {
  serie: string;
  capitulo?: string;
  tema: string;
  data?: string;
  pregador?: string;
  texto_base?: string;
  modo_origem?: 'A' | 'B';
}

export interface BannerIntro {
  frase_sintese: string;
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

export type ComponenteTemaVariante =
  | { variante: 'stage'; dados: DadosStage }
  | { variante: 'diagnostico'; dados: DadosDiagnostico }
  | { variante: 'antidoto'; dados: DadosAntidoto }
  | { variante: 'versus'; dados: DadosVersus }
  | { variante: 'analogia'; dados: DadosAnalogia }
  | { variante: 'banho_list'; dados: DadosBanhoList }
  | { variante: 'humor'; dados: DadosHumor }
  // variantes exclusivas de tema ainda não implementadas na plataforma
  // (verb_block, poeiras_grid, label_box) caem aqui e são ignoradas com
  // segurança pelo ComponenteTemaRenderer — nunca quebram a renderização.
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

export interface PregacaoConteudo {
  metadados: Metadados;
  banner_intro?: BannerIntro;
  mapa_pontos: MapaPonto[];
  secoes: Secao[];
  resumo_final?: ResumoItem[];
  merch_section?: MerchSectionData | null;
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
