import { createHash, timingSafeEqual } from 'node:crypto';

// Autenticação do Painel Editorial: um código por líder, lista na env var
// EDITORIAL_CODIGOS da Vercel (nunca no bundle do client). Formato:
//
//   EDITORIAL_CODIGOS="Fulano de Tal:k7q2-m9xv-p4tz-w8hc;Ciclano:..."
//
// Separador entre líderes `;`, entre nome e código o ÚLTIMO `:` (nome pode
// ter `:`, código não). Revogar um líder = remover a entrada dele e
// redeployar — não afeta os demais.

/** Mínimo de caracteres por código: com o alfabeto de gerarCodigo (32 símbolos) dá ≥80 bits, inviável por força bruta mesmo sem rate limit. */
export const TAMANHO_MINIMO_CODIGO = 16;

export interface Lider {
  nome: string;
  codigo: string;
}

export function parseCodigos(env: string | undefined): Lider[] {
  if (!env) return [];
  const lideres: Lider[] = [];
  for (const entrada of env.split(';')) {
    const limpa = entrada.trim();
    if (!limpa) continue;
    const sep = limpa.lastIndexOf(':');
    const nome = sep > 0 ? limpa.slice(0, sep).trim() : '';
    const codigo = sep > 0 ? limpa.slice(sep + 1).trim() : '';
    if (!nome || codigo.length < TAMANHO_MINIMO_CODIGO) {
      // Nunca loga o código em si — só o nome (ou posição) da entrada ruim.
      console.error(`EDITORIAL_CODIGOS: entrada ignorada (${nome || 'sem nome'}) — código ausente ou com menos de ${TAMANHO_MINIMO_CODIGO} caracteres`);
      continue;
    }
    lideres.push({ nome, codigo });
  }
  return lideres;
}

const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest();

/**
 * Retorna o nome do líder dono do código, ou null. Compara hashes de tamanho
 * fixo com timingSafeEqual e percorre a lista inteira sempre (sem early
 * return) — tempo de resposta não revela prefixo certo nem posição na lista.
 */
export function identificarLider(codigo: unknown, lideres: Lider[]): string | null {
  if (typeof codigo !== 'string' || codigo.length === 0) return null;
  const alvo = hash(codigo);
  let encontrado: string | null = null;
  for (const lider of lideres) {
    if (timingSafeEqual(alvo, hash(lider.codigo)) && encontrado === null) encontrado = lider.nome;
  }
  return encontrado;
}
