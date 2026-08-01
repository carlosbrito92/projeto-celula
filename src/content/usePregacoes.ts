import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
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
    apiGet<PregacaoRow[]>('/pregacoes')
      .then((data) => {
        if (cancelado) return;
        setPregacoes(ordenarPregacoes(data));
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
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
    apiGet<PregacaoRow>(`/pregacoes/${id}`)
      .then((data) => {
        if (cancelado) return;
        setPregacao(data);
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return { pregacao, erro, carregando };
}
