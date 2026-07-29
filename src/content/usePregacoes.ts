import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { PregacaoRow } from './types';

/** data (ISO) desc, nulls por último; depois created_at desc — nunca quebra por falta de data. */
export function ordenarPregacoes(pregacoes: PregacaoRow[]): PregacaoRow[] {
  return [...pregacoes].sort((a, b) => {
    if (a.data && b.data) return b.data.localeCompare(a.data);
    if (a.data && !b.data) return -1;
    if (!a.data && b.data) return 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

export function usePregacoes() {
  const [pregacoes, setPregacoes] = useState<PregacaoRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    supabase
      .from('pregacoes')
      .select('*')
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setPregacoes(ordenarPregacoes((data ?? []) as PregacaoRow[]));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { pregacoes, erro };
}

export function usePregacao(id: string) {
  const [pregacao, setPregacao] = useState<PregacaoRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    supabase
      .from('pregacoes')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setPregacao(data as PregacaoRow);
        setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return { pregacao, erro, carregando };
}
