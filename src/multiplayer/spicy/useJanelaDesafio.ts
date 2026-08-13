import { useEffect, useState } from 'react';

const DURACAO_PADRAO_MS = 5000;

export interface EstadoJanelaDesafio {
  ativa: boolean;
  restanteMs: number;
}

/**
 * Contagem local baseada no `declaradoEm` publicado — só decide se o botão
 * de desafiar aparece pro jogador da vez em partidas de 2 (exceção de
 * `podeDesafiarAgora` em `turno.ts`). Puramente cosmético: quem realmente
 * barra a ação é o host via `desafiar()`/`resolverDesafioMultiplo` — isso só
 * evita o usuário clicar num botão que o host vai rejeitar.
 */
export function useJanelaDesafio(
  declaradoEm: number | null,
  duracaoMs: number = DURACAO_PADRAO_MS,
): EstadoJanelaDesafio {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (declaradoEm === null) return;
    setAgora(Date.now()); // corrige de imediato — sem isso, `agora` fica com o valor da montagem até o 1º tick do interval
    const id = setInterval(() => setAgora(Date.now()), 200);
    return () => clearInterval(id);
  }, [declaradoEm]);

  if (declaradoEm === null) return { ativa: false, restanteMs: 0 };
  const restanteMs = Math.max(0, duracaoMs - (agora - declaradoEm));
  return { ativa: restanteMs > 0, restanteMs };
}
