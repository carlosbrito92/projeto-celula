import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { moverPorIndice } from './reordenar';
import styles from './ListaChips.module.css';

interface ListaChipsProps {
  itens: string[];
  onChange: (itens: string[]) => void;
  placeholder: string;
}

function SortableChip({ id, texto, onRemover }: { id: string; texto: string; onRemover: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={styles.chip}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={onRemover}
      {...attributes}
      {...listeners}
    >
      {texto} <span aria-hidden="true">✕</span>
    </button>
  );
}

/**
 * Chips com arraste pra reordenar — a ordem da lista é a ordem física de
 * passagem do celular (docs/spec-privacidade-sorteio.md § Extensão:
 * reordenação por arraste). `activationConstraint: { distance: 8 }` deixa um
 * toque curto (remover) e um arraste de verdade (reordenar) conviverem no
 * mesmo elemento sem conflito — só movimento além do limiar inicia o drag.
 */
export function ListaChips({ itens, onChange, placeholder }: ListaChipsProps) {
  const [rascunho, setRascunho] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // id estável por posição — a lista é reordenada por índice, não por
  // identidade de valor (nomes podem se repetar; ok para esta lista curta).
  const ids = itens.map((_, i) => String(i));

  function adicionar() {
    const valor = rascunho.trim();
    if (!valor) return;
    onChange([...itens, valor]);
    setRascunho('');
  }

  function remover(indice: number) {
    onChange(itens.filter((_, i) => i !== indice));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    onChange(moverPorIndice(itens, String(active.id), String(over.id)));
  }

  return (
    <div className={styles.wrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          {itens.map((item, i) => (
            <SortableChip key={ids[i]} id={ids[i]} texto={item} onRemover={() => remover(i)} />
          ))}
        </SortableContext>
      </DndContext>
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
