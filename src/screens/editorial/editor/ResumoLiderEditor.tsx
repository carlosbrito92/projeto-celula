import { idCampo } from '../../../editorial/caminho';
import { gerarPontosResumoLider, removerResumoLider } from '../../../editorial/modelo';
import { CampoTexto } from './Campos';
import { useEditor } from './contexto';
import styles from '../Editor.module.css';

export function ResumoLiderEditor() {
  const { conteudo, aplicar } = useEditor();
  const rl = conteudo.resumo_lider;

  return (
    <details className={styles.grupo} id={idCampo(['resumo_lider'])} open={!!rl}>
      <summary className={styles.grupoTitulo}>Resumo do líder (opcional)</summary>
      <div className={styles.grupoCorpo}>
        {!rl ? (
          <>
            <p className={styles.dica}>
              Versão mais densa para o líder preparar a célula: uma frase-tema e um resumo por ponto, com a frase de
              impacto do pregador.
            </p>
            <button type="button" className={styles.botaoSecundario} onClick={() => aplicar(gerarPontosResumoLider)}>
              Adicionar resumo do líder
            </button>
          </>
        ) : (
          <>
            <CampoTexto caminho={['resumo_lider', 'frase_tema']} rotulo="Frase-tema" exemplo="rl_frase_tema" obrigatorio multilinha />
            {rl.pontos.map((p, i) => (
              <fieldset key={i} className={styles.lado} id={idCampo(['resumo_lider', 'pontos', i])}>
                <legend>
                  {p.numero}. {p.titulo || 'Ponto sem título'}
                </legend>
                <CampoTexto caminho={['resumo_lider', 'pontos', i, 'resumo']} rotulo="Resumo" exemplo={i === 0 ? 'rl_ponto' : undefined} obrigatorio multilinha />
                <CampoTexto
                  caminho={['resumo_lider', 'pontos', i, 'frase_chave']}
                  rotulo="Frase-chave"
                  dica="Uma frase real do pregador, não inventada."
                  obrigatorio
                />
              </fieldset>
            ))}
            <CampoTexto caminho={['resumo_lider', 'versiculo_chave', 'referencia']} rotulo="Versículo-chave: referência (opcional)" />
            <CampoTexto caminho={['resumo_lider', 'versiculo_chave', 'texto']} rotulo="Versículo-chave: texto (opcional)" multilinha />
            <div className={styles.acoesSecao}>
              <button type="button" className={styles.botaoSecundario} onClick={() => aplicar(gerarPontosResumoLider)}>
                Atualizar pontos pelo índice
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={() => aplicar(removerResumoLider)}>
                Remover resumo
              </button>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
