import { useState } from 'react';
import type {
  BlocoComponenteTema,
  DadosAnalogia,
  DadosAntidoto,
  DadosBanhoList,
  DadosContraste,
  DadosDiagnostico,
  DadosDuplaGrid,
  DadosHumor,
  DadosLabelBox,
  DadosStage,
  DadosVersus,
} from './types';
import { TextoComKeywords } from './Keyword';
import styles from './ComponenteTemaRenderer.module.css';

/**
 * Um `componente_tema` não é código exclusivo de um tema — qualquer variante
 * pode aparecer em qualquer pregação (confirmado no conteúdo real: `stage`
 * apareceu numa pregação da série Igrejar, documentado como "exclusivo" dos
 * Estilos #1/#2). O payload é sempre o mesmo; só as cores mudam com o tema
 * ativo via CSS vars. Variante não reconhecida não quebra a renderização.
 */
export function ComponenteTemaRenderer({ bloco }: { bloco: BlocoComponenteTema }) {
  switch (bloco.variante) {
    case 'stage':
      return <Stage dados={bloco.dados as DadosStage} />;
    case 'diagnostico':
      return <Diagnostico dados={bloco.dados as DadosDiagnostico} />;
    case 'antidoto':
      return <Antidoto dados={bloco.dados as DadosAntidoto} />;
    case 'versus':
      return <Versus dados={bloco.dados as DadosVersus} />;
    case 'contraste':
      return <Contraste dados={bloco.dados as DadosContraste} />;
    case 'analogia':
      return <Analogia dados={bloco.dados as DadosAnalogia} />;
    case 'banho_list':
      return <BanhoList dados={bloco.dados as DadosBanhoList} />;
    case 'humor':
      return <Humor dados={bloco.dados as DadosHumor} />;
    case 'label_box':
      return <LabelBox dados={bloco.dados as DadosLabelBox} />;
    case 'duplice_grid':
      return <DuplaGrid dados={bloco.dados as DadosDuplaGrid} />;
    default:
      if (import.meta.env.DEV) {
        console.warn(`componente_tema variante desconhecida: "${bloco.variante}" — ignorada.`);
      }
      return null;
  }
}

function Stage({ dados }: { dados: DadosStage }) {
  return (
    <div className={styles.stage}>
      <div className={styles.stageLabel}>{dados.label}</div>
      <div className={styles.stageFrase}>{dados.frase}</div>
      {dados.subtitulo && <div className={styles.stageSubtitulo}>{dados.subtitulo}</div>}
    </div>
  );
}

function Diagnostico({ dados }: { dados: DadosDiagnostico }) {
  return (
    <div className={styles.diagnostico}>
      <div className={styles.diagnosticoLabel}>{dados.label}</div>
      <ul className={styles.diagnosticoItens}>
        {dados.itens.map((item, i) => (
          <li key={i} className={styles.diagnosticoItem}>
            <TextoComKeywords texto={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Antidoto({ dados }: { dados: DadosAntidoto }) {
  return (
    <div className={styles.antidoto}>
      <div className={styles.antidotoLabel}>{dados.label}</div>
      <div className={styles.antidotoTexto}>
        <TextoComKeywords texto={dados.texto} />
      </div>
    </div>
  );
}

function Versus({ dados }: { dados: DadosVersus }) {
  return (
    <div className={styles.versus}>
      <div className={styles.versusLado}>
        <div className={styles.versusLabel}>{dados.lado_a.label}</div>
        <div className={styles.versusCitacao}>“{dados.lado_a.citacao}”</div>
      </div>
      <div className={`${styles.versusLado} ${styles.versusLadoB}`}>
        <div className={styles.versusLabel}>{dados.lado_b.label}</div>
        <div className={styles.versusCitacao}>“{dados.lado_b.citacao}”</div>
      </div>
    </div>
  );
}

function Contraste({ dados }: { dados: DadosContraste }) {
  return (
    <div className={styles.contraste}>
      <div className={styles.contrasteLado}>
        <div className={styles.contrasteLabel}>{dados.lado_a.label}</div>
        <div className={styles.contrasteTitulo}>{dados.lado_a.titulo}</div>
        <div className={styles.contrasteTexto}>
          <TextoComKeywords texto={dados.lado_a.texto} />
        </div>
      </div>
      <div className={`${styles.contrasteLado} ${styles.contrasteLadoB}`}>
        <div className={styles.contrasteLabel}>{dados.lado_b.label}</div>
        <div className={styles.contrasteTitulo}>{dados.lado_b.titulo}</div>
        <div className={styles.contrasteTexto}>
          <TextoComKeywords texto={dados.lado_b.texto} />
        </div>
      </div>
    </div>
  );
}

function Analogia({ dados }: { dados: DadosAnalogia }) {
  const [aberta, setAberta] = useState(false);

  return (
    <div className={styles.analogia}>
      <button
        type="button"
        className={styles.analogiaLabel}
        aria-expanded={aberta}
        onClick={() => setAberta((v) => !v)}
      >
        <span className={styles.analogiaCaret} aria-hidden="true">
          {aberta ? '▾' : '▸'}
        </span>
        {dados.label}
      </button>
      {aberta && (
        <>
          {dados.corpo.map((paragrafo, i) => (
            <p key={i} className={styles.analogiaCorpo}>
              <TextoComKeywords texto={paragrafo} />
            </p>
          ))}
          <p className={styles.analogiaConclusao}>
            <TextoComKeywords texto={dados.conclusao} />
          </p>
        </>
      )}
    </div>
  );
}

function BanhoList({ dados }: { dados: DadosBanhoList }) {
  return (
    <ol className={styles.banhoList}>
      {dados.itens.map((item, i) => (
        <li key={i} className={styles.banhoItem}>
          <span className={styles.banhoNumero}>{String(i + 1).padStart(2, '0')}</span>
          <span className={styles.banhoTexto}>
            <TextoComKeywords texto={item} />
          </span>
        </li>
      ))}
    </ol>
  );
}

function Humor({ dados }: { dados: DadosHumor }) {
  return (
    <div className={styles.humor}>
      <span aria-hidden="true">😄</span>
      <span>{dados.texto}</span>
    </div>
  );
}

function DuplaGrid({ dados }: { dados: DadosDuplaGrid }) {
  return (
    <div className={styles.duplaGrid}>
      {dados.itens.map((item, i) => (
        <div key={i} className={styles.duplaGridItem}>
          <span className={styles.duplaGridNum}>{item.num}</span>
          <div className={styles.duplaGridNome}>{item.nome}</div>
          <div className={styles.duplaGridTexto}>
            <TextoComKeywords texto={item.texto} />
          </div>
        </div>
      ))}
    </div>
  );
}

function LabelBox({ dados }: { dados: DadosLabelBox }) {
  return (
    <div className={styles.labelBox}>
      <div className={styles.labelBoxTitulo}>{dados.titulo}</div>
      <dl className={styles.labelBoxCampos}>
        {dados.campos.map((item, i) => (
          <div key={i} className={styles.labelBoxLinha}>
            <dt className={styles.labelBoxCampo}>{item.campo}</dt>
            <dd className={styles.labelBoxValor}>{item.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
