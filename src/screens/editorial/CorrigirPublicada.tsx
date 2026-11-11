import { useState } from 'react';
import { useRouter } from '../../router/Router';
import { criarRascunho, ErroEditorial, mensagemDeErro, type ResumoRascunho } from '../../editorial/api';
import { normalizar } from '../../editorial/modelo';
import { carregarPublicada, type PregacaoPublicada } from '../../editorial/publicadas';
import styles from './Painel.module.css';

// Corrigir uma pregação já publicada (docs/painel-editorial.md §7.5): o JSON
// de `main` vira um rascunho que já nasce com o `arquivo` dela, então o envio
// substitui o mesmo arquivo (novo PR, ou novo commit no PR aberto dele).
// Se o líder já tem um rascunho desse arquivo, abre esse em vez de duplicar.

export function CorrigirPublicada({
  codigo,
  pregacoes,
  rascunhos,
}: {
  codigo: string;
  pregacoes: PregacaoPublicada[];
  rascunhos: ResumoRascunho[];
}) {
  const { navigate } = useRouter();
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (pregacoes.length === 0) return null;

  const corrigir = async (p: PregacaoPublicada) => {
    const existente = rascunhos.find((r) => r.arquivo === p.arquivo);
    if (existente) {
      navigate(`/editorial/${existente.id}`);
      return;
    }
    setAbrindo(p.arquivo);
    setErro(null);
    try {
      const { conteudo } = await carregarPublicada(p);
      const r = await criarRascunho(codigo, normalizar(conteudo), p.arquivo);
      navigate(`/editorial/${r.id}`);
    } catch (e) {
      setErro(e instanceof ErroEditorial ? e.message : mensagemDeErro(-1));
      setAbrindo(null);
    }
  };

  return (
    <details className={styles.ia}>
      <summary className={styles.iaTitulo}>Corrigir pregação publicada</summary>
      <div className={styles.iaCorpo}>
        <p className={styles.ajuda}>
          Abre a pregação como está no app. Ao enviar, a correção vai para revisão e só substitui a publicada depois que o Carlos aprovar.
        </p>
        {erro && (
          <div className={styles.erro} role="alert">
            {erro}
          </div>
        )}
        <ul className={styles.lista}>
          {pregacoes.map((p) => {
            const existente = rascunhos.some((r) => r.arquivo === p.arquivo);
            return (
              <li key={p.arquivo} className={styles.publicada}>
                <div className={styles.publicadaInfo}>
                  <span className={styles.tema}>{p.tema}</span>
                  {p.serie && <span className={styles.data}>{p.serie}</span>}
                </div>
                <button
                  type="button"
                  className={styles.botaoSecundario}
                  disabled={abrindo !== null}
                  aria-label={`${existente ? 'Continuar correção de' : 'Corrigir'} ${p.tema}`}
                  onClick={() => void corrigir(p)}
                >
                  {abrindo === p.arquivo ? 'Abrindo…' : existente ? 'Continuar' : 'Corrigir'}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
