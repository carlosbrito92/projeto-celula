import { useState } from 'react';
import { usePassagemSequencial } from '../passagemSequencial/usePassagemSequencial';
import { PassagemSequencial } from '../passagemSequencial/PassagemSequencial';
import { SetupParticipantes } from '../passagemSequencial/SetupParticipantes';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { sortearPapel } from './sortearPapel';
import styles from '../passagemSequencial/PassagemSequencial.module.css';
import setupStyles from '../passagemSequencial/SetupParticipantes.module.css';

const TITULO = 'Sorteio de papel especial';

interface SorteioPapelProps {
  /** Quando embutido num quebra-gelo (UtilitarioInlineRef.papel_nome), já vem definido. */
  papelNome?: string;
  aoFechar: () => void;
}

export function SorteioPapel({ papelNome: papelNomeProp, aoFechar }: SorteioPapelProps) {
  const passagem = usePassagemSequencial();
  const [papelDigitado, setPapelDigitado] = useState('');
  const papelNome = papelNomeProp ?? papelDigitado;

  if (passagem.estado.fase !== 'setup') {
    return <PassagemSequencial passagem={passagem} titulo={TITULO} aoFechar={aoFechar} />;
  }

  function iniciar() {
    if (!papelNome.trim()) return;
    passagem.iniciar(passagem.nomes.length, (participantes) =>
      sortearPapel(participantes, papelNome, Math.random),
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
        rotuloAcao="Sortear"
        icone="🎲"
        legenda="Ninguém vê o resultado até você mostrar."
      >
        {!papelNomeProp && (
          <input
            className={setupStyles.campoTexto}
            value={papelDigitado}
            onChange={(e) => setPapelDigitado(e.target.value)}
            placeholder="Nome do papel (ex: Detetive)"
          />
        )}
      </SetupParticipantes>
    </div>
  );
}
