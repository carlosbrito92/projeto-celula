import { UtilitarioHeader } from '../UtilitarioHeader';
import { formatarTempo } from './formatarTempo';
import { PRESETS_SEGUNDOS, useCronometro } from './useCronometro';
import styles from './Cronometro.module.css';

const LABEL_PRESET: Record<number, string> = {
  30: '30s',
  60: '1 min',
  120: '2 min',
  300: '5 min',
};

export function Cronometro({ aoFechar }: { aoFechar: () => void }) {
  const { preset, segundosRestantes, rodando, escolherPreset, iniciarOuPausar, zerar } =
    useCronometro(60);

  return (
    <div className={styles.tela}>
      <UtilitarioHeader rotulo="Cronômetro" aoFechar={aoFechar} />
      <div className={styles.corpo}>
        <div className={styles.tempo}>{formatarTempo(segundosRestantes)}</div>
        <div className={styles.presets}>
          {PRESETS_SEGUNDOS.map((segundos) => (
            <button
              key={segundos}
              type="button"
              className={`${styles.presetPill} ${segundos === preset ? styles.presetAtivo : ''}`}
              onClick={() => escolherPreset(segundos)}
            >
              {LABEL_PRESET[segundos]}
            </button>
          ))}
        </div>
        <div className={styles.acoes}>
          <button type="button" className={styles.botaoZerar} onClick={zerar}>
            Zerar
          </button>
          <button type="button" className={styles.botaoPausar} onClick={iniciarOuPausar}>
            {rodando ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </div>
  );
}
