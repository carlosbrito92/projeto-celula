import type { Bloco } from '../../../content/types';
import { idCampo } from '../../../editorial/caminho';
import { moverBloco, removerBloco, ROTULO_TIPO_BLOCO, tipoEditavel } from '../../../editorial/modelo';
import { CampoLinhas, CampoTexto } from './Campos';
import { useEditor } from './contexto';
import styles from '../Editor.module.css';

const NEGRITO = 'Use **palavra** para destacar em negrito.';

function Corpo({ bloco, base }: { bloco: Bloco; base: (string | number)[] }) {
  const tipo = tipoEditavel(bloco);
  const d = [...base, 'dados'];
  switch (tipo) {
    case 'paragrafo':
      return <CampoTexto caminho={[...base, 'texto']} rotulo="Texto" dica={NEGRITO} obrigatorio multilinha />;
    case 'frase_chave':
    case 'callout':
    case 'pergunta':
    case 'resposta':
      return <CampoTexto caminho={[...base, 'texto']} rotulo="Texto" dica={NEGRITO} obrigatorio multilinha />;
    case 'subtitulo':
      return <CampoTexto caminho={[...base, 'texto']} rotulo="Subtítulo" obrigatorio />;
    case 'versiculo':
      return (
        <>
          <CampoTexto caminho={[...base, 'referencia']} rotulo="Referência" dica="Ex: Efésios 2.8-9" obrigatorio />
          <CampoTexto caminho={[...base, 'texto']} rotulo="Texto bíblico" obrigatorio multilinha />
        </>
      );
    case 'lista':
      return <CampoLinhas caminho={[...base, 'itens']} rotulo="Itens" obrigatorio />;
    case 'citacao':
      return (
        <>
          <CampoTexto caminho={[...base, 'autor']} rotulo="Autor" dica="Quem disse (autor, livro)." obrigatorio />
          <CampoTexto caminho={[...base, 'texto']} rotulo="Citação" obrigatorio multilinha />
        </>
      );
    case 'analogia':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" dica='Ex: "Analogia", "Ilustração".' obrigatorio />
          <CampoLinhas caminho={[...d, 'corpo']} rotulo="Parágrafos" dica="Um parágrafo por linha." obrigatorio />
          <CampoTexto caminho={[...d, 'conclusao']} rotulo="Conclusão" obrigatorio multilinha />
        </>
      );
    case 'stage':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" dica='Ex: "Lição", "Verdade".' obrigatorio />
          <CampoTexto caminho={[...d, 'frase']} rotulo="Frase" obrigatorio multilinha />
          <CampoTexto caminho={[...d, 'subtitulo']} rotulo="Linha de apoio (opcional)" />
        </>
      );
    case 'diagnostico':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" obrigatorio />
          <CampoLinhas caminho={[...d, 'itens']} rotulo="Itens" obrigatorio />
        </>
      );
    case 'contraste':
      return (
        <div className={styles.doisLados}>
          {(['lado_a', 'lado_b'] as const).map((lado) => (
            <fieldset key={lado} className={styles.lado}>
              <legend>{lado === 'lado_a' ? 'Lado A' : 'Lado B'}</legend>
              <CampoTexto caminho={[...d, lado, 'label']} rotulo="Rótulo" obrigatorio />
              <CampoTexto caminho={[...d, lado, 'titulo']} rotulo="Título" obrigatorio />
              <CampoTexto caminho={[...d, lado, 'texto']} rotulo="Texto" obrigatorio multilinha />
            </fieldset>
          ))}
        </div>
      );
    default:
      return (
        <p className={styles.dica}>
          Este tipo de bloco não é editável aqui e será mantido como está.
        </p>
      );
  }
}

export function BlocoEditor({ s, b, total }: { s: number; b: number; total: number }) {
  const { conteudo, aplicar } = useEditor();
  const bloco = conteudo.secoes[s].corpo[b];
  const tipo = tipoEditavel(bloco);
  const nome = tipo
    ? ROTULO_TIPO_BLOCO[tipo]
    : bloco.tipo === 'componente_tema'
      ? `Componente “${bloco.variante}”`
      : `Bloco “${bloco.tipo}”`;
  return (
    <div className={styles.bloco} id={idCampo(['secoes', s, 'corpo', b])}>
      <div className={styles.blocoTopo}>
        <span className={styles.blocoTipo}>{nome}</span>
        <span className={styles.botoesIcone}>
          <button type="button" aria-label="Subir bloco" disabled={b === 0} onClick={() => aplicar((c) => moverBloco(c, s, b, -1))}>
            ↑
          </button>
          <button type="button" aria-label="Descer bloco" disabled={b === total - 1} onClick={() => aplicar((c) => moverBloco(c, s, b, 1))}>
            ↓
          </button>
          <button type="button" aria-label="Remover bloco" onClick={() => aplicar((c) => removerBloco(c, s, b))}>
            ✕
          </button>
        </span>
      </div>
      <Corpo bloco={bloco} base={['secoes', s, 'corpo', b]} />
    </div>
  );
}
