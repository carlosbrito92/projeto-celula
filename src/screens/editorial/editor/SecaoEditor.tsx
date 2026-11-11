import { Fragment, useState } from 'react';
import { definirCaminho, idCampo } from '../../../editorial/caminho';
import { adicionarBloco, moverSecao, removerSecao, ROTULO_TIPO_BLOCO, type TipoNovoBloco } from '../../../editorial/modelo';
import { BlocoEditor } from './BlocoEditor';
import { CampoTexto } from './Campos';
import { errosDoCampo, useEditor } from './contexto';
import styles from '../Editor.module.css';

const TIPOS = Object.entries(ROTULO_TIPO_BLOCO) as [TipoNovoBloco, string][];

/** Leva o foco ao primeiro campo do bloco recém-criado (depois do React desenhá-lo). */
function focarBloco(s: number, b: number) {
  requestAnimationFrame(() => {
    const el = document.getElementById(idCampo(['secoes', s, 'corpo', b]));
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.querySelector<HTMLElement>('input, textarea, select')?.focus({ preventScroll: true });
  });
}

function SeletorTipo({ id, valor, mudar }: { id: string; valor: TipoNovoBloco; mudar: (t: TipoNovoBloco) => void }) {
  return (
    <select id={id} className={styles.input} value={valor} onChange={(e) => mudar(e.target.value as TipoNovoBloco)}>
      {TIPOS.map(([t, nome]) => (
        <option key={t} value={t}>
          {nome}
        </option>
      ))}
    </select>
  );
}

/** "+ Inserir bloco aqui" entre dois blocos: fechado é só um link discreto. */
function InserirBloco({ s, posicao }: { s: number; posicao: number }) {
  const { aplicar } = useEditor();
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoNovoBloco>('paragrafo');
  const id = `inserir-bloco-${s}-${posicao}`;
  if (!aberto) {
    return (
      <button type="button" className={styles.inserirBotao} onClick={() => setAberto(true)}>
        + Inserir bloco aqui
      </button>
    );
  }
  return (
    <div className={styles.inserirCaixa}>
      <label className={styles.rotulo} htmlFor={id}>
        Tipo do bloco
      </label>
      <div className={styles.linha}>
        <SeletorTipo id={id} valor={tipo} mudar={setTipo} />
        <button
          type="button"
          className={styles.botaoSecundario}
          onClick={() => {
            aplicar((c) => adicionarBloco(c, s, tipo, posicao));
            setAberto(false);
            focarBloco(s, posicao);
          }}
        >
          Inserir
        </button>
        <button type="button" className={styles.botaoSecundario} onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/**
 * Um título por ponto (vale para o índice e para a leitura). Título diferente
 * dentro da leitura é opcional e fica escondido: no primeiro uso real o líder
 * se confundiu com dois campos de título lado a lado.
 */
function TituloDoPonto({ s, iMapa }: { s: number; iMapa: number }) {
  const { conteudo, aplicar, erros } = useEditor();
  const secao = conteudo.secoes[s];
  const tituloIndice = conteudo.mapa_pontos[iMapa]?.titulo ?? '';
  // Decidido só na abertura: editar o título do ponto depois não deve fazer o
  // campo da leitura "pular" para a tela.
  const [aberto, setAberto] = useState(() => !!secao.titulo?.trim() && secao.titulo !== tituloIndice);
  const mostrar = aberto || errosDoCampo(erros, `secoes[${s}].titulo`).length > 0;
  return (
    <>
      <CampoTexto
        caminho={['mapa_pontos', iMapa, 'titulo']}
        rotulo="Título do ponto"
        dica="Aparece no índice e no início do ponto. Curto é melhor."
        exemplo="titulo_indice"
        obrigatorio
      />
      {mostrar ? (
        <>
          <CampoTexto
            caminho={['secoes', s, 'titulo']}
            rotulo="Título dentro da leitura (opcional)"
            exemplo="titulo_secao"
            dica="Só se quiser um título mais longo no início do ponto. Vazio = usa o título do ponto."
          />
          <button
            type="button"
            className={styles.exemploBotao}
            onClick={() => {
              setAberto(false);
              aplicar((c) => definirCaminho(c, ['secoes', s, 'titulo'], ''));
            }}
          >
            Usar o mesmo título na leitura
          </button>
        </>
      ) : (
        <button type="button" className={styles.exemploBotao} onClick={() => setAberto(true)}>
          Usar outro título dentro da leitura
        </button>
      )}
    </>
  );
}

export function SecaoEditor({ s, total }: { s: number; total: number }) {
  const { conteudo, aplicar, erros } = useEditor();
  const secao = conteudo.secoes[s];
  const iMapa = conteudo.mapa_pontos.findIndex((p) => p.id === secao.id);
  const tituloIndice = iMapa >= 0 ? conteudo.mapa_pontos[iMapa].titulo : '';
  const extra = !secao.numero;
  const [novoTipo, setNovoTipo] = useState<TipoNovoBloco>('paragrafo');
  const [confirmarRemocao, setConfirmarRemocao] = useState(false);
  const qtdErros = errosDoCampo(erros, `secoes[${s}]`).length + erros.filter((e) => e.caminho.startsWith(`secoes[${s}].`)).length;

  return (
    <details className={styles.grupo} id={idCampo(['secoes', s])} open>
      <summary className={styles.grupoTitulo}>
        <span className={styles.numero}>{extra ? '—' : secao.numero}</span>
        <span>{tituloIndice || secao.titulo || 'Ponto sem título'}</span>
        {qtdErros > 0 && <span className={styles.contadorErros}>{qtdErros}</span>}
      </summary>
      <div className={styles.grupoCorpo}>
        {iMapa >= 0 ? (
          <TituloDoPonto s={s} iMapa={iMapa} />
        ) : (
          <CampoTexto caminho={['secoes', s, 'titulo']} rotulo="Título da seção" exemplo="titulo_secao" obrigatorio />
        )}
        <CampoTexto caminho={['secoes', s, 'sec_eyebrow']} rotulo="Rótulo (opcional)" dica='Ex: "Fundação", "Conclusão".' exemplo="sec_eyebrow" />
        <CampoTexto caminho={['secoes', s, 'referencias']} rotulo="Referências (opcional)" dica="Ex: Gênesis 3.15 · Romanos 3.20" exemplo="referencias" />

        <div className={styles.blocos}>
          {secao.corpo.map((_, b) => (
            <Fragment key={b}>
              <InserirBloco s={s} posicao={b} />
              <BlocoEditor s={s} b={b} total={secao.corpo.length} />
            </Fragment>
          ))}
          {errosDoCampo(erros, `secoes[${s}].corpo`)
            .filter((e) => e.caminho === `secoes[${s}].corpo`)
            .map((e) => (
              <div key={e.mensagem} className={styles.erroCampo}>
                Conteúdo: {e.mensagem}
              </div>
            ))}
        </div>

        <div className={styles.adicionar}>
          <label className={styles.rotulo} htmlFor={`novo-bloco-${s}`}>
            Adicionar bloco
          </label>
          <div className={styles.linha}>
            <SeletorTipo id={`novo-bloco-${s}`} valor={novoTipo} mudar={setNovoTipo} />
            <button type="button" className={styles.botaoSecundario} onClick={() => {
                aplicar((c) => adicionarBloco(c, s, novoTipo));
                focarBloco(s, secao.corpo.length);
              }}>
              Adicionar
            </button>
          </div>
        </div>

        <div className={styles.acoesSecao}>
          <button type="button" className={styles.botaoSecundario} disabled={s === 0} onClick={() => aplicar((c) => moverSecao(c, s, -1))}>
            ↑ Subir ponto
          </button>
          <button type="button" className={styles.botaoSecundario} disabled={s === total - 1} onClick={() => aplicar((c) => moverSecao(c, s, 1))}>
            ↓ Descer ponto
          </button>
          {confirmarRemocao ? (
            <>
              <button
                type="button"
                className={styles.botaoPerigo}
                onClick={() => {
                  setConfirmarRemocao(false);
                  aplicar((c) => removerSecao(c, s));
                }}
              >
                Confirmar remoção
              </button>
              <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmarRemocao(false)}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className={styles.botaoSecundario} onClick={() => setConfirmarRemocao(true)}>
              Remover ponto
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
