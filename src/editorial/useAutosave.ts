import { useCallback, useEffect, useRef } from 'react';

// Autosave com respiro e intervalo mínimo: a regra do Vercel Firewall em
// /api/editorial é 30 requisições/60s (docs/painel-editorial.md §5), então
// nunca salvar a cada tecla. Salva `espera` ms depois da última edição (cada
// edição muda `revisao` e reinicia a espera), nunca antes de `intervaloMinimo`
// ms depois do último salvamento e nunca depois de `esperaMaxima` ms desde a
// primeira edição não salva (digitação contínua não adia para sempre).

export interface OpcoesAutosave {
  /** Há alterações ainda não enviadas? */
  sujo: boolean;
  /** Muda a cada edição (contador) — reinicia a espera. */
  revisao: number;
  /** Autosave pausado (ex: conflito de versão esperando decisão do líder). */
  pausado?: boolean;
  salvar: () => Promise<void>;
  espera?: number;
  intervaloMinimo?: number;
}

export function useAutosave({
  sujo,
  revisao,
  pausado = false,
  salvar,
  espera = 4000,
  intervaloMinimo = 15000,
  esperaMaxima = 30000,
}: OpcoesAutosave & { esperaMaxima?: number }) {
  const sujoDesde = useRef<number | null>(null);
  const ultimoSalvamento = useRef(0);
  const salvarRef = useRef(salvar);
  const emAndamento = useRef(false);

  useEffect(() => {
    salvarRef.current = salvar;
  }, [salvar]);

  const executar = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    ultimoSalvamento.current = Date.now();
    try {
      await salvarRef.current();
    } finally {
      emAndamento.current = false;
    }
  }, []);

  useEffect(() => {
    if (!sujo) {
      sujoDesde.current = null;
      return;
    }
    if (pausado) return;
    const agora = Date.now();
    sujoDesde.current ??= agora;
    const limite = sujoDesde.current + esperaMaxima - agora;
    const minimo = intervaloMinimo - (agora - ultimoSalvamento.current);
    const atraso = Math.max(minimo, Math.min(espera, limite), 0);
    const t = setTimeout(() => void executar(), atraso);
    return () => clearTimeout(t);
  }, [sujo, revisao, pausado, espera, intervaloMinimo, esperaMaxima, executar]);

  // Aba indo para segundo plano (trocou de app, bloqueou a tela): salva já.
  useEffect(() => {
    if (!sujo || pausado) return;
    const aoOcultar = () => {
      if (document.visibilityState === 'hidden') void executar();
    };
    document.addEventListener('visibilitychange', aoOcultar);
    return () => document.removeEventListener('visibilitychange', aoOcultar);
  }, [sujo, pausado, executar]);

  return { salvarAgora: executar };
}
