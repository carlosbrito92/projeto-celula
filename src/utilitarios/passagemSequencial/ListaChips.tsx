import { useState } from 'react';
import { moverPorIndice } from './reordenar';
import styles from './ListaChips.module.css';

interface ListaChipsProps {
  itens: string[];
  onChange: (itens: string[]) => void;
  placeholder: string;
}

/**
 * Chips com setas pra reordenar — a ordem da lista é a ordem física de
 * passagem do celular (docs/spec-privacidade-sorteio.md § Extensão:
 * reordenação). Era arraste (@dnd-kit/sortable) — testado num device real,
 * o gesto não completava de forma confiável em touch; trocado por botões de
 * seta, que não dependem de nenhuma biblioteca e funcionam de forma
 * previsível em qualquer touchscreen.
 */
export function ListaChips({ itens, onChange, placeholder }: ListaChipsProps) {
  const [rascunho, setRascunho] = useState('');

  function adicionar() {
    const valor = rascunho.trim();
    if (!valor) return;
    onChange([...itens, valor]);
    setRascunho('');
  }

  function remover(indice: number) {
    onChange(itens.filter((_, i) => i !== indice));
  }

  function mover(indice: number, direcao: -1 | 1) {
    onChange(moverPorIndice(itens, indice, indice + direcao));
  }

  return (
    <div className={styles.wrapper}>
      {itens.map((item, i) => (
        <div key={`${item}-${i}`} className={styles.chipGrupo}>
          <button
            type="button"
            className={styles.seta}
            onClick={() => mover(i, -1)}
            disabled={i === 0}
            aria-label={`Mover "${item}" pra esquerda`}
          >
            ←
          </button>
          <button type="button" className={styles.chip} onClick={() => remover(i)}>
            {item} <span aria-hidden="true">✕</span>
          </button>
          <button
            type="button"
            className={styles.seta}
            onClick={() => mover(i, 1)}
            disabled={i === itens.length - 1}
            aria-label={`Mover "${item}" pra direita`}
          >
            →
          </button>
        </div>
      ))}
      <input
        className={styles.input}
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            adicionar();
          }
        }}
        placeholder={placeholder}
      />
      <button type="button" className={styles.addPill} onClick={adicionar}>
        + {placeholder}
      </button>
    </div>
  );
}
