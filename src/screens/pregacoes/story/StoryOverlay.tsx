import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../../../themes/types';
import { useGoogleFont } from '../../../themes/useGoogleFont';
import { registrarUso } from '../../../lib/uso';
import {
  FONTES_APP,
  FONTE_APOIO,
  FONTE_APOIO_URL,
  FONTE_SERIE,
  FUNDOS,
  OPCOES_PADRAO,
  TAMANHOS,
  resolverFonte,
  resolverPaleta,
  type Alinhamento,
  type OpcoesStory,
  type TamanhoKey,
  type TrechoStory,
} from './opcoes';
import { canvasParaBlob, renderizarStory } from './renderizarStory';
import styles from './StoryOverlay.module.css';

interface Props {
  trecho: TrechoStory;
  tema: Theme;
  aoFechar: () => void;
}

export function StoryOverlay({ trecho, tema, aoFechar }: Props) {
  const [opcoes, setOpcoes] = useState<OpcoesStory>(OPCOES_PADRAO);
  const [aviso, setAviso] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fonte = resolverFonte(opcoes.fonte, tema);
  useGoogleFont(fonte.googleFontsUrl);
  useGoogleFont(FONTE_APOIO_URL);

  useEffect(() => {
    registrarUso('story_aberto');
  }, []);

  useEffect(() => {
    let cancelado = false;
    async function desenhar() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        // A fonte só existe para o canvas depois de carregada.
        await Promise.all([
          document.fonts.load(`${opcoes.italico ? 'italic ' : ''}${fonte.peso} 48px ${fonte.family}`),
          document.fonts.load(`600 36px ${FONTE_APOIO}`),
          document.fonts.load(`800 36px ${FONTE_APOIO}`),
        ]);
      } catch {
        // sem fonte: desenha com o fallback do sistema
      }
      if (!cancelado && canvasRef.current) renderizarStory(canvasRef.current, trecho, opcoes, tema);
    }
    void desenhar();
    return () => {
      cancelado = true;
    };
  }, [trecho, opcoes, tema, fonte.key, fonte.family, fonte.peso]);

  async function gerarArquivo(): Promise<File | null> {
    if (!canvasRef.current) return null;
    renderizarStory(canvasRef.current, trecho, opcoes, tema);
    const blob = await canvasParaBlob(canvasRef.current);
    return blob ? new File([blob], 'story-projeto-celula.png', { type: 'image/png' }) : null;
  }

  async function baixar(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement('a');
    a.href = url;
    a.download = arquivo.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    registrarUso('story_baixado');
  }

  async function compartilhar() {
    setAviso(null);
    const arquivo = await gerarArquivo();
    if (!arquivo) {
      setAviso('Não foi possível gerar a imagem.');
      return;
    }
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] });
        registrarUso('story_compartilhado');
      } catch {
        // usuário cancelou o compartilhamento: nada a fazer
      }
      return;
    }
    await baixar(arquivo);
  }

  async function salvar() {
    setAviso(null);
    const arquivo = await gerarArquivo();
    if (arquivo) await baixar(arquivo);
    else setAviso('Não foi possível gerar a imagem.');
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Criar imagem para stories">
      <div className={styles.topo}>
        <button type="button" className={styles.fechar} onClick={aoFechar} aria-label="Fechar">
          ✕
        </button>
        <div className={styles.titulo}>Imagem para stories</div>
      </div>

      <div className={styles.previaArea}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>

      <div className={styles.controles}>
        <div className={styles.grupo}>
          <div className={styles.rotulo}>Fonte</div>
          <div className={styles.chips}>
            {[resolverFonte(FONTE_SERIE, tema), ...FONTES_APP].map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={opcoes.fonte === f.key}
                className={`${styles.chip} ${opcoes.fonte === f.key ? styles.chipAtivo : ''}`}
                style={{ fontFamily: f.family, fontWeight: f.peso }}
                onClick={() => setOpcoes((o) => ({ ...o, fonte: f.key }))}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grupo}>
          <div className={styles.rotulo}>Estilo</div>
          <div className={styles.chips}>
            <button
              type="button"
              aria-pressed={opcoes.italico}
              className={`${styles.chip} ${opcoes.italico ? styles.chipAtivo : ''}`}
              style={{ fontStyle: 'italic', letterSpacing: '0.08em' }}
              onClick={() => setOpcoes((o) => ({ ...o, italico: !o.italico }))}
            >
              Itálico espaçado
            </button>
          </div>
        </div>

        <div className={styles.grupo}>
          <div className={styles.rotulo}>Alinhamento</div>
          <div className={styles.chips}>
            {(['esquerda', 'centro'] as Alinhamento[]).map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={opcoes.alinhamento === a}
                className={`${styles.chip} ${opcoes.alinhamento === a ? styles.chipAtivo : ''}`}
                onClick={() => setOpcoes((o) => ({ ...o, alinhamento: a }))}
              >
                {a === 'esquerda' ? 'Esquerda' : 'Centro'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.grupo}>
          <div className={styles.rotulo}>Fundo</div>
          <div className={styles.chips}>
            {FUNDOS.map((f) => {
              const paleta = resolverPaleta(f.key, tema);
              const fundo =
                paleta.fundo.length === 1
                  ? paleta.fundo[0]
                  : `linear-gradient(${paleta.fundo.join(',')})`;
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={opcoes.fundo === f.key}
                  aria-label={`Fundo ${f.label}`}
                  className={`${styles.amostra} ${opcoes.fundo === f.key ? styles.chipAtivo : ''}`}
                  style={{ background: fundo }}
                  onClick={() => setOpcoes((o) => ({ ...o, fundo: f.key }))}
                >
                  <span className={styles.amostraLabel} style={{ color: paleta.texto }}>
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.grupo}>
          <div className={styles.rotulo}>Tamanho do texto</div>
          <div className={styles.chips}>
            {(Object.keys(TAMANHOS) as TamanhoKey[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={opcoes.tamanho === k}
                className={`${styles.chip} ${opcoes.tamanho === k ? styles.chipAtivo : ''}`}
                onClick={() => setOpcoes((o) => ({ ...o, tamanho: k }))}
              >
                {TAMANHOS[k].label}
              </button>
            ))}
          </div>
        </div>

        {aviso && <div className={styles.aviso}>{aviso}</div>}

        <div className={styles.acoes}>
          <button type="button" className={styles.botaoSecundario} onClick={salvar}>
            Salvar imagem
          </button>
          <button type="button" className={styles.botaoPrimario} onClick={compartilhar}>
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
