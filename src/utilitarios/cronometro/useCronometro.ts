import { useEffect, useRef, useState } from 'react';

export const PRESETS_SEGUNDOS = [30, 60, 120, 300] as const;

export function useCronometro(presetInicial: number = 60) {
  const [preset, setPreset] = useState(presetInicial);
  const [segundosRestantes, setSegundosRestantes] = useState(presetInicial);
  const [rodando, setRodando] = useState(false);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!rodando) return;
    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          setRodando(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [rodando]);

  function escolherPreset(segundos: number) {
    setPreset(segundos);
    setSegundosRestantes(segundos);
    setRodando(false);
  }

  function iniciarOuPausar() {
    setRodando((r) => !r);
  }

  function zerar() {
    setRodando(false);
    setSegundosRestantes(preset);
  }

  return { preset, segundosRestantes, rodando, escolherPreset, iniciarOuPausar, zerar };
}
