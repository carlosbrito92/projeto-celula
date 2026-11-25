import { inject, track } from '@vercel/analytics';

/**
 * Medição de uso anônima (Vercel Web Analytics, eventos customizados): só o
 * NOME do evento, nunca texto de anotação, nome de pessoa ou id de usuário —
 * CLAUDE.md, segurança item 5 (sem PII). Existe para decidir com dado se
 * anotações pessoais/PDF ainda valem a manutenção (a imagem de story as
 * substitui, se ninguém usar). Falha silenciosa: medir nunca quebra o app.
 */
export type EventoUso =
  | 'anotacao_modo_ativado'
  | 'anotacao_destaque_criado'
  | 'anotacao_nota_criada'
  | 'pdf_exportado'
  | 'story_aberto'
  | 'story_compartilhado'
  | 'story_baixado';

export function iniciarMedicao(): void {
  try {
    inject();
  } catch {
    // sem DOM/rede: segue sem medir
  }
}

export function registrarUso(evento: EventoUso): void {
  try {
    track(evento);
  } catch {
    // idem
  }
}
