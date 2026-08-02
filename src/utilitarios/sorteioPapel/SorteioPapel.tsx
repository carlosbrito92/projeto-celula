import { useState } from 'react';
import { usePassagemSequencial } from '../passagemSequencial/usePassagemSequencial';
import { PassagemSequencial } from '../passagemSequencial/PassagemSequencial';
import { SetupParticipantes } from '../passagemSequencial/SetupParticipantes';
import { UtilitarioHeader } from '../UtilitarioHeader';
import { atribuir, embaralhar } from '../shuffle';
import { CategoriaEditor, type CategoriaConfig } from '../CategoriaEditor';
import { gerarFichas, somaQuantidades, type PapelConfig } from './papeis';
import { PapeisEditor } from './PapeisEditor';
import styles from '../passagemSequencial/PassagemSequencial.module.css';

const TITULO = 'Sorteio de papel especial';

/**
 * Modo Artista Impostor: 1 papel especial ("Impostor") + todo o resto do
 * grupo recebe a mesma palavra sorteada da categoria — não é "papel nomeado
 * repetido" (não tem identidade de papel, é a palavra do jogo em si).
 * docs/spec-privacidade-sorteio.md § Correção: modelo "Artista Impostor" é
 * diferente do modelo "Detetive".
 */
const VALOR_IMPOSTOR = 'Você é o Impostor!';

interface SorteioPapelProps {
  /**
   * Modo "Detetive" (papéis nomeados, cada um com quantidade explícita —
   * docs/spec-privacidade-sorteio.md § Extensão: papéis múltiplos). Quando
   * embutido num quebra-gelo (UtilitarioInlineRef.papeis), entra como valor
   * inicial editável — não como override fixo. Um preset parcial (ex: só
   * "Detetive × 1") não teria como bater a soma com o total de participantes
   * sem o editor, já que a quantidade de participantes só é conhecida em
   * tempo real; por isso o editor continua sempre visível, pré-preenchido
   * quando há preset. Mutuamente exclusivo com `categorias` — um widget usa
   * um modo ou outro, nunca os dois.
   */
  papeis?: PapelConfig[];
  /**
   * Modo "Artista Impostor" (docs/spec-privacidade-sorteio.md § Correção:
   * modelo "Artista Impostor" é diferente do modelo "Detetive"): em vez do
   * editor de papéis livres, o setup mostra um seletor de categoria — quem
   * configura nunca vê as palavras, só o nome da categoria. 1 papel
   * "Impostor" fixo (quantidade 1, implícito, não configurado à mão) + todo
   * o resto do grupo recebe a mesma palavra sorteada da categoria escolhida,
   * decidida só no momento do sorteio.
   */
  categorias?: CategoriaConfig[];
  aoFechar: () => void;
}

export function SorteioPapel({ papeis: papeisPreset, categorias, aoFechar }: SorteioPapelProps) {
  const passagem = usePassagemSequencial();
  const [papeis, setPapeis] = useState<PapelConfig[]>(papeisPreset ?? []);
  const [categoriaEscolhida, setCategoriaEscolhida] = useState<string | null>(null);

  if (passagem.estado.fase !== 'setup') {
    return <PassagemSequencial passagem={passagem} titulo={TITULO} aoFechar={aoFechar} />;
  }

  const temCategorias = Boolean(categorias && categorias.length > 0);
  const totalParticipantes = passagem.nomes.length;
  const categoriaSelecionada = categorias?.find((c) => c.nome === categoriaEscolhida) ?? null;

  const somaBate = totalParticipantes > 0 && somaQuantidades(papeis) === totalParticipantes;
  const podeSortearCategoria =
    totalParticipantes >= 2 && categoriaSelecionada !== null && categoriaSelecionada.palavras.length >= 1;

  function iniciar() {
    if (temCategorias) {
      if (!podeSortearCategoria || !categoriaSelecionada) return;
      const [palavra] = embaralhar(categoriaSelecionada.palavras, Math.random);
      const fichas = [VALOR_IMPOSTOR, ...Array(totalParticipantes - 1).fill(palavra)];
      passagem.iniciar(totalParticipantes, (participantes) =>
        atribuir(participantes, fichas, Math.random),
      );
    } else {
      if (!somaBate) return;
      passagem.iniciar(totalParticipantes, (participantes) =>
        atribuir(participantes, gerarFichas(papeis), Math.random),
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
        podeIniciarExtra={temCategorias ? podeSortearCategoria : somaBate}
        rotuloAcao="Sortear"
        icone="🎲"
        legenda="Ninguém vê o resultado até você mostrar."
      >
        {temCategorias ? (
          <CategoriaEditor
            categorias={categorias!}
            categoriaEscolhida={categoriaEscolhida}
            onEscolher={setCategoriaEscolhida}
            minimoPalavras={1}
          />
        ) : (
          <PapeisEditor papeis={papeis} onChange={setPapeis} totalParticipantes={totalParticipantes} />
        )}
      </SetupParticipantes>
    </div>
  );
}
