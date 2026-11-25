import { useState } from 'react';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { restantes, sortearPergunta } from './sorteio';
import { carregarHistorico, limparHistorico, salvarHistorico } from './historico';
import styles from './SorteioPergunta.module.css';

interface Props {
  perguntas: string[];
  /** Identifica o histórico (uma dinâmica = um histórico). */
  chave: string;
  rotulo?: string;
  aoFechar: () => void;
}

export function SorteioPergunta({ perguntas, chave, rotulo = 'Sortear pergunta', aoFechar }: Props) {
  const [usadas, setUsadas] = useState<string[]>(() => carregarHistorico(chave));
  const [atual, setAtual] = useState<string | null>(null);

  const faltam = restantes(perguntas, usadas).length;
  const acabou = faltam === 0;

  function sortear() {
    const proxima = sortearPergunta(perguntas, usadas);
    if (!proxima) return;
    const novas = [...usadas, proxima];
    setAtual(proxima);
    setUsadas(novas);
    salvarHistorico(chave, novas);
  }

  function limpar() {
    limparHistorico(chave);
    setUsadas([]);
    setAtual(null);
  }

  return (
    <div className={styles.tela}>
      <UtilitarioHeader rotulo={rotulo} aoFechar={aoFechar} />
      <div className={styles.corpo}>
        <div className={styles.caixa} role="status" aria-live="polite">
          {atual ??
            (acabou
              ? 'Todas as perguntas já saíram. Limpe o histórico para recomeçar.'
              : 'Toque em "Sortear" para ver a pergunta.')}
        </div>
        <div className={styles.contador}>
          {acabou ? 'Nenhuma pergunta restante' : `${faltam} de ${perguntas.length} perguntas restantes`}
        </div>
        <div className={styles.acoes}>
          <button
            type="button"
            className={styles.botaoLimpar}
            onClick={limpar}
            disabled={usadas.length === 0}
          >
            Limpar histórico
          </button>
          <button type="button" className={styles.botaoSortear} onClick={sortear} disabled={acabou}>
            Sortear
          </button>
        </div>
      </div>
    </div>
  );
}
