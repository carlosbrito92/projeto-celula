import type { usePassagemSequencial } from './usePassagemSequencial';
import { UtilitarioHeader } from '../UtilitarioHeader';
import styles from './PassagemSequencial.module.css';

interface PassagemSequencialProps {
  passagem: ReturnType<typeof usePassagemSequencial>;
  titulo: string;
  aoFechar: () => void;
}

/** Fases `passagem` (aguardando/revelado/confirmando) e `gestao` do fluxo de
 * privacidade sequencial — docs/spec-privacidade-sorteio.md. A fase `setup` é
 * responsabilidade de cada widget (via SetupParticipantes), não deste componente. */
export function PassagemSequencial({ passagem, titulo, aoFechar }: PassagemSequencialProps) {
  const { estado, quantidade, participanteAtual, valorAtual } = passagem;

  if (estado.fase === 'setup') return null;

  if (estado.fase === 'gestao') {
    return (
      <div className={styles.tela}>
        <UtilitarioHeader rotulo={`${titulo} · gestão`} aoFechar={aoFechar} />
        <div className={styles.gestaoLista}>
          {passagem.participantes.map((nome, i) => (
            <button
              key={`${nome}-${i}`}
              type="button"
              className={styles.gestaoLinha}
              onClick={() => passagem.revelarParaLider(i)}
            >
              <span>{nome}</span>
              <span className={styles.gestaoValor}>
                {passagem.revelados[i] ? passagem.valorDe(i) : '••••••'}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.gestaoLegenda}>
          Revelação individual, só para você — nunca exibida ao grupo.
        </div>
      </div>
    );
  }

  const rotulo = `${titulo} · ${estado.indice + 1} de ${quantidade}`;
  const nomeEhSintetico = participanteAtual?.startsWith('Participante ');

  return (
    <div className={styles.tela}>
      <UtilitarioHeader rotulo={rotulo} aoFechar={aoFechar} />
      <div className={styles.corpo}>
        {estado.sub === 'aguardando' && (
          <>
            <div className={styles.prompt}>
              Passe para {nomeEhSintetico ? 'o próximo' : <strong>{participanteAtual}</strong>}
            </div>
            <button type="button" className={styles.ctaCheio} onClick={passagem.revelarAtual}>
              Revelar
            </button>
          </>
        )}

        {(estado.sub === 'revelado' || estado.sub === 'confirmando') && (
          <>
            <div className={styles.valorSecreto}>{valorAtual}</div>
            <div className={styles.aviso}>É só seu — não mostre para os outros.</div>
            {estado.sub === 'revelado' ? (
              <button type="button" className={styles.ctaCheio} onClick={passagem.pedirConfirmacao}>
                Continuar
              </button>
            ) : (
              <div className={styles.confirmarLinha}>
                <div className={styles.pergunta}>Quer rever antes de passar?</div>
                <div className={styles.confirmarBotoes}>
                  <button type="button" className={styles.botaoSecundario} onClick={passagem.reverNovamente}>
                    Rever
                  </button>
                  <button type="button" className={styles.ctaPrimario} onClick={passagem.avancar}>
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
