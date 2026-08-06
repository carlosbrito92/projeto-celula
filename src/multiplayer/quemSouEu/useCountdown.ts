import { useEffect, useState } from 'react';

export type FaseCountdown = 'aguardando' | 'contagem' | 'revelado';

export interface EstadoCountdown {
  fase: FaseCountdown;
  restante: number;
}

/**
 * Contagem regressiva pra tela "coloque o celular na sua testa" (V2, Quem
 * Sou Eu) — fica em 'aguardando' até `ativar` virar true, decrementa 1 por
 * segundo, e vai pra 'revelado' ao chegar em zero (sem voltar).
 */
export function useCountdown(segundos: number, ativar: boolean): EstadoCountdown {
  const [fase, setFase] = useState<FaseCountdown>('aguardando');
  const [restante, setRestante] = useState(segundos);

  useEffect(() => {
    if (!ativar) return;
    setFase('contagem');
    setRestante(segundos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativar]);

  useEffect(() => {
    if (fase !== 'contagem') return;
    if (restante <= 0) {
      setFase('revelado');
      return;
    }
    const id = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [fase, restante]);

  return { fase, restante };
}
