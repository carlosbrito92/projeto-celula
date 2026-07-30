import { ListaChips } from './ListaChips';
import styles from './SetupParticipantes.module.css';

interface SetupParticipantesProps {
  nomes: string[];
  onChangeNomes: (nomes: string[]) => void;
  liderParticipa: boolean;
  onChangeLiderParticipa: (v: boolean) => void;
  onIniciar: () => void;
  rotuloAcao: string;
  legenda: string;
  icone?: string;
  children?: React.ReactNode;
}

export function SetupParticipantes({
  nomes,
  onChangeNomes,
  liderParticipa,
  onChangeLiderParticipa,
  onIniciar,
  rotuloAcao,
  legenda,
  icone = '🎲',
  children,
}: SetupParticipantesProps) {
  const podeIniciar = nomes.length > 0;

  return (
    <div className={styles.corpo}>
      <ListaChips itens={nomes} onChange={onChangeNomes} placeholder="nome" />

      {children}

      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={liderParticipa}
          onChange={(e) => onChangeLiderParticipa(e.target.checked)}
        />
        Eu também vou participar do sorteio?
      </label>

      <button
        type="button"
        className={styles.botaoCircular}
        onClick={onIniciar}
        disabled={!podeIniciar}
      >
        <span className={styles.botaoIcone}>{icone}</span>
        <span className={styles.botaoLabel}>{rotuloAcao}</span>
      </button>

      <div className={styles.legenda}>{legenda}</div>
    </div>
  );
}
