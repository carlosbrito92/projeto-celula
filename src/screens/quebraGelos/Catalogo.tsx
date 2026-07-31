import { useState } from 'react';
import { useQuebraGelosJogos } from '../../content/useQuebraGelos';
import type { QuebraGeloJogoConteudo } from '../../content/types';
import { CatalogCard } from '../CatalogCard';
import { filtrarPorTipo, type FiltroTipo } from './catalogoFiltro';
import { formatarDuracao, formatarIdade, formatarJogadores } from './metaFormat';
import styles from './Catalogo.module.css';

const PILLS: { valor: FiltroTipo; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'leitura', rotulo: 'Só leitura' },
  { valor: 'sorteio', rotulo: 'Com sorteio' },
];

function meta(conteudo: QuebraGeloJogoConteudo): string | undefined {
  const partes = [
    formatarJogadores(conteudo.jogadores),
    formatarIdade(conteudo.idade_minima),
    formatarDuracao(conteudo.duracao_minutos),
  ].filter((p): p is string => Boolean(p));
  return partes.length > 0 ? partes.join(' · ') : undefined;
}

export function Catalogo() {
  const { jogos, erro } = useQuebraGelosJogos();
  const [filtro, setFiltro] = useState<FiltroTipo>('todos');

  return (
    <div className={styles.wrapper}>
      <div className={styles.titulo}>Quebra-gelos</div>

      <div className={styles.pills}>
        {PILLS.map((p) => (
          <button
            key={p.valor}
            type="button"
            className={`${styles.pill} ${filtro === p.valor ? styles.pillAtiva : ''}`}
            onClick={() => setFiltro(p.valor)}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      {erro && <div className={styles.vazio}>Não foi possível carregar os quebra-gelos.</div>}
      {!erro && jogos === null && <div className={styles.vazio}>Carregando…</div>}
      {!erro && jogos !== null && jogos.length === 0 && (
        <div className={styles.vazio}>Nenhum quebra-gelo cadastrado ainda.</div>
      )}

      {jogos &&
        jogos.length > 0 &&
        (() => {
          const filtrados = filtrarPorTipo(jogos, filtro);
          if (filtrados.length === 0) {
            return <div className={styles.vazio}>Nada encontrado para este filtro.</div>;
          }
          return (
            <div className={styles.grid}>
              {filtrados.map((j) => {
                const conteudo = j.conteudo as QuebraGeloJogoConteudo;
                return (
                  <CatalogCard
                    key={j.id}
                    to={`/quebra-gelos/${j.id}`}
                    icone={conteudo.icone}
                    titulo={j.nome}
                    meta={meta(conteudo)}
                  />
                );
              })}
            </div>
          );
        })()}
    </div>
  );
}
