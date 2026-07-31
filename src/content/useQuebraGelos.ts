import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import type { QuebraGeloRow } from './types';

export function useUtilitariosCatalogo() {
  const [utilitarios, setUtilitarios] = useState<QuebraGeloRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    apiGet<QuebraGeloRow[]>('/quebra-gelos?tipo=utilitario')
      .then((data) => {
        if (!cancelado) setUtilitarios(data);
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
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
    apiGet<QuebraGeloRow>(`/quebra-gelos/${id}`)
      .then((data) => {
        if (!cancelado) setUtilitario(data);
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

  return { utilitario, erro, carregando };
}

export function useQuebraGelosJogos() {
  const [jogos, setJogos] = useState<QuebraGeloRow[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    apiGet<QuebraGeloRow[]>('/quebra-gelos?tipo=instrucional,instrucional_utilitario')
      .then((data) => {
        if (!cancelado) setJogos(data);
      })
      .catch((e: Error) => {
        if (!cancelado) setErro(e.message);
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
    apiGet<QuebraGeloRow>(`/quebra-gelos/${id}`)
      .then((data) => {
        if (!cancelado) setJogo(data);
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

  return { jogo, erro, carregando };
}
