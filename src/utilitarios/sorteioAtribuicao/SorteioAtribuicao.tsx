import { useState } from 'react';
import { usePassagemSequencial } from '../passagemSequencial/usePassagemSequencial';
import { PassagemSequencial } from '../passagemSequencial/PassagemSequencial';
import { ListaChips } from '../passagemSequencial/ListaChips';
import { SetupParticipantes } from '../passagemSequencial/SetupParticipantes';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { atribuir, embaralhar } from '../shuffle';
import { CategoriaEditor, type CategoriaConfig } from '../CategoriaEditor';
import styles from '../passagemSequencial/PassagemSequencial.module.css';

const TITULO = 'Atribuição escondida';

interface SorteioAtribuicaoProps {
  /**
   * Quando embutido num quebra-gelo (UtilitarioInlineRef.categorias), o setup
   * troca a lista de valores livres por um seletor de categoria — quem
   * configura nunca vê as palavras, só o nome da categoria. A palavra real só
   * é sorteada em iniciar() (docs/spec-privacidade-sorteio.md § Extensão:
   * banco de categorias). Ausente => comportamento original (valores livres).
   */
  categorias?: CategoriaConfig[];
  aoFechar: () => void;
}

export function SorteioAtribuicao({ categorias, aoFechar }: SorteioAtribuicaoProps) {
  const passagem = usePassagemSequencial();
  const [valores, setValores] = useState<string[]>([]);
  const [categoriaEscolhida, setCategoriaEscolhida] = useState<string | null>(null);

  const temCategorias = Boolean(categorias && categorias.length > 0);
  const totalParticipantes = passagem.nomes.length;
  const categoriaSelecionada = categorias?.find((c) => c.nome === categoriaEscolhida) ?? null;
  const podeSortearCategoria =
    categoriaSelecionada !== null && categoriaSelecionada.palavras.length >= totalParticipantes;

  if (passagem.estado.fase !== 'setup') {
    return <PassagemSequencial passagem={passagem} titulo={TITULO} aoFechar={aoFechar} />;
  }

  function iniciar() {
    if (temCategorias) {
      if (!categoriaSelecionada) return;
      const palavrasSorteadas = embaralhar(categoriaSelecionada.palavras, Math.random).slice(
        0,
        totalParticipantes,
      );
      passagem.iniciar(totalParticipantes, (participantes) =>
        atribuir(participantes, palavrasSorteadas, Math.random),
      );
    } else {
      passagem.iniciar(totalParticipantes, (participantes) =>
        atribuir(participantes, valores, Math.random),
      );
    }
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
        podeIniciarExtra={temCategorias ? podeSortearCategoria : true}
        rotuloAcao="Sortear"
        legenda="Ninguém vê o resultado do outro — só o próprio, na hora de passar o celular."
      >
        {temCategorias ? (
          <CategoriaEditor
            categorias={categorias!}
            categoriaEscolhida={categoriaEscolhida}
            onEscolher={setCategoriaEscolhida}
            minimoPalavras={totalParticipantes}
          />
        ) : (
          <ListaChips itens={valores} onChange={setValores} placeholder="valor/palavra" />
        )}
      </SetupParticipantes>
    </div>
  );
}
