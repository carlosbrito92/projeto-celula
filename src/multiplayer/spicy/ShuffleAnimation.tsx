import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Card } from './Card';
import { dividirEmDuasPilhas, intercalarRiffle } from './riffleShuffle';
import type { Carta } from './types';

// Verso não depende de conteúdo real (revelada=false sempre) — qualquer
// carta serve de placeholder aqui.
const CARTA_PLACEHOLDER: Carta = { id: 'shuffle', tipo: 'numerada', cor: 'vermelho', valor: 1 };

type Fase = 'dividindo' | 'intercalando';

interface CartaAnimada {
  id: string;
  pilha: 'esquerda' | 'direita';
  ordem: number;
}

const DURACAO_DIVIDIR = 500;
const DURACAO_INTERCALAR = 700;
const PAUSA_FINAL = 350;

/**
 * Coreografia de embaralhar (docs/spicy-pesquisa-visual-animacao.md §2.4,
 * algoritmo de Juha Lindstedt reimplementado em Framer Motion) — puramente
 * decorativa, tocada uma vez no host antes de "Iniciar" de verdade. O
 * embaralhamento REAL já acontece no motor (`criarBaralhoEmbaralhado`,
 * Math.random) — aqui é só representação visual com N cartas-placeholder,
 * não um replay do resultado verdadeiro (evita animar 110 elementos por
 * nenhum ganho visual real). Duas fases: (1) cada carta sorteia pilha
 * esquerda/direita e "voa" pra lá; (2) reconstitui o baralho puxando
 * card a card de uma das duas pilhas, sorteado a cada passo — mesma
 * lógica do riffle shuffle físico, não um espalhamento aleatório (que
 * faria as cartas "atravessarem" umas às outras visualmente).
 */
export function ShuffleAnimation({
  quantidade = 16,
  onConcluido,
}: {
  quantidade?: number;
  onConcluido: () => void;
}) {
  const cartas = useMemo<CartaAnimada[]>(() => {
    const ids = Array.from({ length: quantidade }, (_, i) => i);
    const { esquerda, direita } = dividirEmDuasPilhas(ids);
    return [
      ...esquerda.map((ordem) => ({ id: `shuffle-${ordem}`, pilha: 'esquerda' as const, ordem })),
      ...direita.map((ordem) => ({ id: `shuffle-${ordem}`, pilha: 'direita' as const, ordem })),
    ];
  }, [quantidade]);

  const ordemIntercalada = useMemo(() => {
    const esquerda = cartas.filter((c) => c.pilha === 'esquerda').map((c) => c.id);
    const direita = cartas.filter((c) => c.pilha === 'direita').map((c) => c.id);
    return intercalarRiffle(esquerda, direita);
  }, [cartas]);

  const [fase, setFase] = useState<Fase>('dividindo');

  useEffect(() => {
    const t1 = setTimeout(() => setFase('intercalando'), DURACAO_DIVIDIR + 150);
    const t2 = setTimeout(
      onConcluido,
      DURACAO_DIVIDIR + 150 + DURACAO_INTERCALAR + PAUSA_FINAL,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onConcluido]);

  return (
    <div style={{ position: 'relative', height: 200 }}>
      {cartas.map((carta) => {
        const indice = ordemIntercalada.indexOf(carta.id);
        const alvo =
          fase === 'dividindo'
            ? { x: carta.pilha === 'esquerda' ? -56 : 56, y: 0, rotate: carta.pilha === 'esquerda' ? -6 : 6 }
            : { x: 0, y: -indice * 0.5, rotate: 0 };
        return (
          <motion.div
            key={carta.id}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
            animate={{ ...alvo, opacity: 1 }}
            transition={{
              duration: fase === 'dividindo' ? DURACAO_DIVIDIR / 1000 : DURACAO_INTERCALAR / 1000,
              delay: (fase === 'dividindo' ? carta.ordem : indice) * 0.025,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 64,
              aspectRatio: '2 / 3',
              marginLeft: -32,
              marginTop: -48,
              zIndex: fase === 'dividindo' ? carta.ordem : indice,
            }}
          >
            <Card carta={CARTA_PLACEHOLDER} revelada={false} />
          </motion.div>
        );
      })}
    </div>
  );
}
