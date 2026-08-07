import { useEffect, useRef, useState } from 'react';
import { getState, setState } from 'playroomkit';
import styles from './Canvas.module.css';

interface Ponto {
  x: number;
  y: number;
}

interface Stroke {
  cor: string;
  pontos: Ponto[];
}

const INTERVALO_POLL_MS = 50;

function redesenhar(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  for (const stroke of strokes) {
    if (stroke.pontos.length < 2) continue;
    ctx.strokeStyle = stroke.cor;
    ctx.beginPath();
    ctx.moveTo(stroke.pontos[0].x, stroke.pontos[0].y);
    for (const p of stroke.pontos.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }
}

interface CanvasProps {
  /** Cor do próprio traço — null quando quem olha não desenha (organizador). */
  corPropria: string | null;
}

/**
 * Canvas compartilhado (Artista Impostor, V2) — turno livre, sem lock de
 * estado por "vez de quem" (docs/projeto-celula.md §10, decisão de produto:
 * combinado verbal entre o grupo, não travado pelo app).
 *
 * Sincronização confirmada via exemplo oficial "Live Canvas" do Playroom
 * Kit: cada traço completo (não ponto a ponto) entra no array `strokes` do
 * estado da sala via `setState(..., true)`; todo cliente faz polling de
 * `getState('strokes')` a cada 50ms pra refletir o que os outros desenharam
 * — não é push por evento. ~50ms de atraso, imperceptível aqui.
 */
export function Canvas({ corPropria }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(() => getState('strokes') ?? []);
  const tracoAtualRef = useRef<Stroke | null>(null);
  const desenhandoRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const remoto: Stroke[] = getState('strokes') ?? [];
      setStrokes((atual) => (remoto.length === atual.length ? atual : remoto));
    }, INTERVALO_POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const todos = tracoAtualRef.current ? [...strokes, tracoAtualRef.current] : strokes;
    redesenhar(canvas, todos);
  }, [strokes]);

  const posicaoRelativa = (e: React.PointerEvent<HTMLCanvasElement>): Ponto => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const aoIniciar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!corPropria) return;
    desenhandoRef.current = true;
    tracoAtualRef.current = { cor: corPropria, pontos: [posicaoRelativa(e)] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const aoMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!desenhandoRef.current || !tracoAtualRef.current) return;
    tracoAtualRef.current.pontos.push(posicaoRelativa(e));
    const canvas = canvasRef.current;
    if (canvas) redesenhar(canvas, [...strokes, tracoAtualRef.current]);
  };

  const aoSoltar = () => {
    if (!desenhandoRef.current || !tracoAtualRef.current) return;
    desenhandoRef.current = false;
    const tracoFinalizado = tracoAtualRef.current;
    tracoAtualRef.current = null;
    if (tracoFinalizado.pontos.length < 2) return;
    // Lê o estado mais recente antes de gravar — reduz (não elimina) a janela
    // de corrida entre dois participantes desenhando ao mesmo tempo. Sem
    // trava de "vez de quem" por decisão de produto — perda ocasional de um
    // traço concorrente é aceitável aqui, não justifica CRDT/merge real.
    const remoto: Stroke[] = getState('strokes') ?? [];
    setState('strokes', [...remoto, tracoFinalizado], true);
  };

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={360}
      height={480}
      onPointerDown={aoIniciar}
      onPointerMove={aoMover}
      onPointerUp={aoSoltar}
      onPointerLeave={aoSoltar}
    />
  );
}
