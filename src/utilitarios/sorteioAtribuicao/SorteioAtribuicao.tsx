import { useState } from 'react';
import { usePassagemSequencial } from '../passagemSequencial/usePassagemSequencial';
import { PassagemSequencial } from '../passagemSequencial/PassagemSequencial';
import { ListaChips } from '../passagemSequencial/ListaChips';
import { SetupParticipantes } from '../passagemSequencial/SetupParticipantes';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { atribuir } from '../shuffle';
import styles from '../passagemSequencial/PassagemSequencial.module.css';

const TITULO = 'Atribuição escondida';

export function SorteioAtribuicao({ aoFechar }: { aoFechar: () => void }) {
  const passagem = usePassagemSequencial();
  const [valores, setValores] = useState<string[]>([]);

  if (passagem.estado.fase !== 'setup') {
    return <PassagemSequencial passagem={passagem} titulo={TITULO} aoFechar={aoFechar} />;
  }

  function iniciar() {
    passagem.iniciar(passagem.nomes.length, (participantes) =>
      atribuir(participantes, valores, Math.random),
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
        legenda="Ninguém vê o resultado do outro — só o próprio, na hora de passar o celular."
      >
        <ListaChips itens={valores} onChange={setValores} placeholder="valor/palavra" />
      </SetupParticipantes>
    </div>
  );
}
