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
  /** Quando embutido num quebra-gelo (UtilitarioInlineRef.papeis), já vem definido. */
  papeis?: PapelConfig[];
  aoFechar: () => void;
}

export function SorteioPapel({ papeis: papeisProp, aoFechar }: SorteioPapelProps) {
  const passagem = usePassagemSequencial();
  const [papeisDigitados, setPapeisDigitados] = useState<PapelConfig[]>([]);
  const papeis = papeisProp ?? papeisDigitados;

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
        {!papeisProp && (
          <PapeisEditor
            papeis={papeisDigitados}
            onChange={setPapeisDigitados}
            totalParticipantes={totalParticipantes}
          />
        )}
      </SetupParticipantes>
    </div>
  );
}
