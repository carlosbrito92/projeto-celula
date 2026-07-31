import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { QuebraGeloRow } from './types';

export function useUtilitariosCatalogo() {
  const [utilitarios, setUtilitarios] = useState<QuebraGeloRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    supabase
      .from('quebra_gelos')
      .select('*')
      .eq('tipo', 'utilitario')
      .order('nome')
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setUtilitarios((data ?? []) as QuebraGeloRow[]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { utilitarios, erro };
}

export function useUtilitarioCatalogo(id: string) {
  const [utilitario, setUtilitario] = useState<QuebraGeloRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    supabase
      .from('quebra_gelos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setUtilitario(data as QuebraGeloRow);
        setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return { utilitario, erro, carregando };
}

export function useQuebraGelosJogos() {
  const [jogos, setJogos] = useState<QuebraGeloRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    supabase
      .from('quebra_gelos')
      .select('*')
      .in('tipo', ['instrucional', 'instrucional_utilitario'])
      .order('nome')
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setJogos((data ?? []) as QuebraGeloRow[]);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return { jogos, erro };
}

export function useQuebraGeloJogo(id: string) {
  const [jogo, setJogo] = useState<QuebraGeloRow | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    supabase
      .from('quebra_gelos')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (cancelado) return;
        if (error) setErro(error.message);
        else setJogo(data as QuebraGeloRow);
        setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [id]);

  return { jogo, erro, carregando };
}
