import { useState } from 'react';
import { usePregacoes } from '../../content/usePregacoes';
import { filterPregacoes } from '../../content/librarySearch';
import { SermonCard } from './SermonCard';
import styles from './Library.module.css';

export function Library() {
  const { pregacoes, erro } = usePregacoes();
  const [termo, setTermo] = useState('');

  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>Pregações</div>
      <div className={styles.busca}>
        <input
          className={styles.buscaInput}
          type="search"
          placeholder="Buscar tema, série, pregador"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
      </div>

      {erro && <div className={styles.vazio}>Não foi possível carregar as pregações.</div>}
      {!erro && pregacoes === null && <div className={styles.vazio}>Carregando…</div>}
      {!erro && pregacoes !== null && pregacoes.length === 0 && (
        <div className={styles.vazio}>Nenhuma pregação cadastrada ainda.</div>
      )}

      {pregacoes && pregacoes.length > 0 && (() => {
        const filtradas = filterPregacoes(pregacoes, termo);

        if (filtradas.length === 0) {
          return <div className={styles.vazio}>Nada encontrado para "{termo}".</div>;
        }

        if (termo.trim()) {
          return (
            <div className={styles.lista}>
              {filtradas.map((p) => (
                <SermonCard key={p.id} pregacao={p} />
              ))}
            </div>
          );
        }

        const [destaque, ...resto] = filtradas;
        return (
          <>
            <SermonCard pregacao={destaque} destaque />
            <div className={styles.lista}>
              {resto.map((p) => (
                <SermonCard key={p.id} pregacao={p} />
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}
