import { useState } from 'react';
import { usePassagemSequencial } from '../passagemSequencial/usePassagemSequencial';
import { PassagemSequencial } from '../passagemSequencial/PassagemSequencial';
import { SetupParticipantes } from '../passagemSequencial/SetupParticipantes';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { atribuir } from '../shuffle';
import { gerarFichas, somaQuantidades, type PapelConfig } from './papeis';
import { PapeisEditor } from './PapeisEditor';
import styles from '../passagemSequencial/PassagemSequencial.module.css';

const TITULO = 'Sorteio de papel especial';

interface SorteioPapelProps {
  /**
   * Quando embutido num quebra-gelo (UtilitarioInlineRef.papeis), entra como
   * valor inicial editável — não como override fixo. Um preset parcial (ex:
   * só "Detetive × 1") não teria como bater a soma com o total de
   * participantes sem o editor, já que a quantidade de participantes só é
   * conhecida em tempo real; por isso o editor continua sempre visível,
   * pré-preenchido quando há preset.
   */
  papeis?: PapelConfig[];
  aoFechar: () => void;
}

export function SorteioPapel({ papeis: papeisPreset, aoFechar }: SorteioPapelProps) {
  const passagem = usePassagemSequencial();
  const [papeis, setPapeis] = useState<PapelConfig[]>(papeisPreset ?? []);

  if (passagem.estado.fase !== 'setup') {
    return <PassagemSequencial passagem={passagem} titulo={TITULO} aoFechar={aoFechar} />;
  }

  const totalParticipantes = passagem.nomes.length;
  const somaBate = totalParticipantes > 0 && somaQuantidades(papeis) === totalParticipantes;

  function iniciar() {
    if (!somaBate) return;
    passagem.iniciar(totalParticipantes, (participantes) =>
      atribuir(participantes, gerarFichas(papeis), Math.random),
    );
  }

  return (
    <div className={styles.tela}>
      <UtilitarioHeader rotulo={TITULO} aoFechar={aoFechar} />
      <SetupParticipantes
        nomes={passagem.nomes}
        onChangeNomes={passagem.setNomes}
        liderParticipa={passagem.liderParticipa}
        onChangeLiderParticipa={passagem.setLiderParticipa}
        onIniciar={iniciar}
        podeIniciarExtra={somaBate}
        rotuloAcao="Sortear"
        icone="🎲"
        legenda="Ninguém vê o resultado até você mostrar."
      >
        <PapeisEditor papeis={papeis} onChange={setPapeis} totalParticipantes={totalParticipantes} />
      </SetupParticipantes>
    </div>
  );
}
