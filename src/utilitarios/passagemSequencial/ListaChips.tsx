import { useState } from 'react';
import styles from './ListaChips.module.css';

interface ListaChipsProps {
  itens: string[];
  onChange: (itens: string[]) => void;
  placeholder: string;
}

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

  return (
    <div className={styles.wrapper}>
      {itens.map((item, i) => (
        <button key={`${item}-${i}`} type="button" className={styles.chip} onClick={() => remover(i)}>
          {item} <span aria-hidden="true">✕</span>
        </button>
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
