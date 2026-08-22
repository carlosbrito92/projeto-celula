// Resiliência de destaque pessoal a recalibração de conteúdo (spec anotações
// pessoais §"Complexidade técnica real"). offsetInicio/offsetFim salvos podem
// não corresponder mais ao texto atual se a pregação foi recalibrada — em vez
// de confiar cegamente no offset ou perder o dado, tenta re-localizar pelo
// texto salvo antes de desistir.

export interface DestaqueSalvo {
  offsetInicio: number;
  offsetFim: number;
  textoSelecionado: string;
}

export interface DestaqueResolvido {
  offsetInicio: number;
  offsetFim: number;
}

/**
 * Resolve um destaque salvo contra o texto atual (limpo, sem `**`) do bloco.
 * 1. Offset bate com o texto salvo → usa direto.
 * 2. Não bate, mas o texto salvo ainda existe em outro ponto → realinha.
 * 3. Não encontrado de jeito nenhum → `null` (destaque órfão; chamador decide
 *    como exibir, mas nunca aponta pro lugar errado nem perde o registro).
 */
export function resolverDestaque(
  textoAtualLimpo: string,
  salvo: DestaqueSalvo,
): DestaqueResolvido | null {
  const { offsetInicio, offsetFim, textoSelecionado } = salvo;

  if (textoAtualLimpo.slice(offsetInicio, offsetFim) === textoSelecionado) {
    return { offsetInicio, offsetFim };
  }

  const idx = textoAtualLimpo.indexOf(textoSelecionado);
  if (idx !== -1) {
    return { offsetInicio: idx, offsetFim: idx + textoSelecionado.length };
  }

  return null;
}
