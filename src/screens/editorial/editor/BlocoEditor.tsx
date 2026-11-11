import type { Bloco } from '../../../content/types';
import { idCampo } from '../../../editorial/caminho';
import { useState } from 'react';
import { blocoVazio, moverBloco, removerBloco, ROTULO_TIPO_BLOCO, tipoEditavel } from '../../../editorial/modelo';
import { CampoLinhas, CampoTexto, VerExemplo } from './Campos';
import { useEditor } from './contexto';
import styles from '../Editor.module.css';

function Corpo({ bloco, base }: { bloco: Bloco; base: (string | number)[] }) {
  const tipo = tipoEditavel(bloco);
  const d = [...base, 'dados'];
  switch (tipo) {
    case 'paragrafo':
    case 'frase_chave':
    case 'callout':
    case 'pergunta':
    case 'resposta':
      return <CampoTexto caminho={[...base, 'texto']} rotulo="Texto" exemplo={tipo} obrigatorio multilinha negrito />;
    case 'subtitulo':
      return <CampoTexto caminho={[...base, 'texto']} rotulo="Subtítulo" exemplo="subtitulo" obrigatorio />;
    case 'versiculo':
      return (
        <>
          <CampoTexto caminho={[...base, 'referencia']} rotulo="Referência" dica="Ex: Efésios 2.8-9" exemplo="versiculo" obrigatorio />
          <CampoTexto caminho={[...base, 'texto']} rotulo="Texto bíblico" obrigatorio multilinha negrito />
        </>
      );
    case 'lista':
      return <CampoLinhas caminho={[...base, 'itens']} rotulo="Itens" exemplo="lista" obrigatorio negrito />;
    case 'citacao':
      return (
        <>
          <CampoTexto caminho={[...base, 'autor']} rotulo="Autor" dica="Quem disse (autor, livro)." exemplo="citacao" obrigatorio />
          <CampoTexto caminho={[...base, 'texto']} rotulo="Citação" obrigatorio multilinha negrito />
        </>
      );
    case 'analogia':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" dica='Ex: "Analogia", "Ilustração".' exemplo="analogia" obrigatorio />
          <CampoLinhas caminho={[...d, 'corpo']} rotulo="Parágrafos" dica="Um parágrafo por linha." obrigatorio negrito />
          <CampoTexto caminho={[...d, 'conclusao']} rotulo="Conclusão" obrigatorio multilinha negrito />
        </>
      );
    case 'stage':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" dica='Ex: "Lição", "Verdade".' exemplo="stage" obrigatorio />
          <CampoTexto caminho={[...d, 'frase']} rotulo="Frase" obrigatorio multilinha />
          <CampoTexto caminho={[...d, 'subtitulo']} rotulo="Linha de apoio (opcional)" />
        </>
      );
    case 'diagnostico':
      return (
        <>
          <CampoTexto caminho={[...d, 'label']} rotulo="Rótulo" exemplo="diagnostico" obrigatorio />
          <CampoLinhas caminho={[...d, 'itens']} rotulo="Itens" obrigatorio negrito />
        </>
      );
    case 'contraste':
      return (
        <>
          <VerExemplo chave="contraste" />
          <div className={styles.doisLados}>
            {(['lado_a', 'lado_b'] as const).map((lado) => (
              <fieldset key={lado} className={styles.lado}>
                <legend>{lado === 'lado_a' ? 'Lado A' : 'Lado B'}</legend>
                <CampoTexto caminho={[...d, lado, 'label']} rotulo="Rótulo" obrigatorio />
                <CampoTexto caminho={[...d, lado, 'titulo']} rotulo="Título" obrigatorio />
                <CampoTexto caminho={[...d, lado, 'texto']} rotulo="Texto" obrigatorio multilinha negrito />
              </fieldset>
            ))}
          </div>
        </>
      );
    default:
      return <p className={styles.dica}>Este tipo de bloco não é editável aqui e será mantido como está.</p>;
  }
}

export function BlocoEditor({ s, b, total }: { s: number; b: number; total: number }) {
  const { conteudo, aplicar } = useEditor();
  const [confirmando, setConfirmando] = useState(false);
  const bloco = conteudo.secoes[s].corpo[b];
  const remover = () => {
    setConfirmando(false);
    aplicar((c) => removerBloco(c, s, b));
  };
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
          <button type="button" aria-label="Remover bloco" onClick={() => (blocoVazio(bloco) ? remover() : setConfirmando(true))}>
            ✕
          </button>
        </span>
      </div>
      {confirmando && (
        <div className={styles.linha} role="alert">
          <span className={styles.dica}>Remover este bloco e o texto dele?</span>
          <button type="button" className={styles.botaoPerigo} onClick={remover}>
            Remover
          </button>
          <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </div>
      )}
      <Corpo bloco={bloco} base={['secoes', s, 'corpo', b]} />
    </div>
  );
}
