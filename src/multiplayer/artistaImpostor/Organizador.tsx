import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getRoomCode, getState, insertCoin, myPlayer, setState, usePlayersList } from 'playroomkit';
import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { PADRAO_MINC } from '../../themes/registry';
import { escolherUm } from '../../utilitarios/shuffle';
import { gerarFichas } from '../../utilitarios/sorteioPapel/papeis';
import { criarDistribuidorIncremental } from '../distribuicaoIncremental';
import { CATEGORIAS, type Categoria } from './categorias';
import { corPorIndice } from './cores';
import { QrCode } from '../quemSouEu/QrCode';
import { Canvas } from './Canvas';
import { Resultado } from './Resultado';
import styles from './Organizador.module.css';

type Fase = 'categoria' | 'sala' | 'desenho' | 'votacao' | 'resultado';

const MINIMO_PARTICIPANTES = 3;

// Mesma convenção de src/multiplayer/quemSouEu/Organizador.tsx — sem
// server.hostname customizado, o WebView nativo serve de https://localhost.
const DOMINIO_PUBLICO = 'https://projeto-celula.vercel.app';

function linkConvite(): string {
  const origem = Capacitor.isNativePlatform() ? DOMINIO_PUBLICO : window.location.origin;
  return `${origem}${window.location.pathname}?sala=${getRoomCode()}`;
}

export function Organizador() {
  const [fase, setFase] = useState<Fase>('categoria');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const todosJogadores = usePlayersList(true);
  // 'ehOrganizador' marca o host de forma que qualquer cliente (não só o
  // próprio host) consiga filtrar a lista de participantes corretamente —
  // Votacao.tsx/Resultado.tsx rodam tanto no organizador quanto no
  // participante e precisam do mesmo filtro, diferente do Quem Sou Eu (só
  // o organizador olhava a lista, então `id !== myPlayer().id` bastava lá).
  const participantes = todosJogadores.filter((j) => !j.getState('ehOrganizador'));
  const votantes = participantes.filter((j) => j.getState('votoEm')).length;

  const escolherCategoria = async (cat: Categoria) => {
    setCategoria(cat);
    await insertCoin({ skipLobby: true });
    myPlayer().setState('ehOrganizador', true, true);
    setFase('sala');
  };

  const iniciarRodada = () => {
    if (!categoria || participantes.length < MINIMO_PARTICIPANTES) return;
    const fichas = gerarFichas([
      { nome: 'impostor', quantidade: 1 },
      { nome: 'sabe_palavra', quantidade: participantes.length - 1 },
    ]);
    const distribuidor = criarDistribuidorIncremental(fichas);
    participantes.forEach((jogador, i) => {
      jogador.setState('papel', distribuidor.proximo(), true);
      jogador.setState('cor', corPorIndice(i), true);
      jogador.setState('votoEm', undefined, true);
    });
    const rodadaAtual = (getState('rodada') as number) ?? 0;
    setState('palavra', escolherUm(categoria.palavras), true);
    setState('rodada', rodadaAtual + 1, true);
    setState('strokes', [], true);
    setState('fase', 'desenho', true);
    setFase('desenho');
  };

  const encerrarDesenho = () => {
    setState('fase', 'votacao', true);
    setFase('votacao');
  };

  const verResultado = () => {
    setState('fase', 'resultado', true);
    setFase('resultado');
  };

  return (
    <ThemeScope tema={PADRAO_MINC} className={styles.shell}>
      <div className={styles.wrapper}>
        <Link to="/quebra-gelos" className={styles.voltar}>
          ←
        </Link>

        {fase === 'categoria' && (
          <>
            <div className={styles.titulo}>Artista Impostor</div>
            <div className={styles.subtitulo}>Escolha a categoria do objeto secreto:</div>
            <div className={styles.categorias}>
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.nome}
                  type="button"
                  className={styles.categoriaBotao}
                  onClick={() => escolherCategoria(cat)}
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          </>
        )}

        {fase === 'sala' && (
          <>
            <div className={styles.titulo}>Sala criada</div>
            <div className={styles.subtitulo}>Categoria: {categoria?.nome}</div>
            <div className={styles.qrBloco}>
              <QrCode valor={linkConvite()} />
            </div>
            <div className={styles.codigo}>
              Código <span className={styles.codigoValor}>{getRoomCode()}</span>
            </div>

            <div className={styles.participantes}>
              <div className={styles.participantesLabel}>
                {participantes.length} participante(s)
                {participantes.length < MINIMO_PARTICIPANTES && ` — mínimo ${MINIMO_PARTICIPANTES}`}
              </div>
              {participantes.length === 0 && (
                <div className={styles.vazio}>Aguardando alguém escanear o QR…</div>
              )}
              {participantes.map((jogador) => {
                const nome = jogador.getState('nome');
                return (
                  <div key={jogador.id} className={styles.participanteItem}>
                    {nome ?? <span className={styles.participanteAguardando}>aguardando nome…</span>}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.ctaIniciar}
              onClick={iniciarRodada}
              disabled={participantes.length < MINIMO_PARTICIPANTES}
            >
              Iniciar
            </button>
          </>
        )}

        {fase === 'desenho' && (
          <div className={styles.desenhoHost}>
            <div className={styles.titulo}>Desenho em andamento</div>
            <div className={styles.subtitulo}>
              {participantes.length} jogador(es) desenhando na mesma folha — turno combinado entre
              o grupo.
            </div>
            <Canvas corPropria={null} />
            <button type="button" className={styles.ctaIniciar} onClick={encerrarDesenho}>
              Encerrar desenho → Votação
            </button>
          </div>
        )}

        {fase === 'votacao' && (
          <div className={styles.desenhoHost}>
            <div className={styles.titulo}>Votação em andamento</div>
            <div className={styles.subtitulo}>
              {votantes} de {participantes.length} já votaram pelo celular — ou decidam
              conversando, apontando pela cor de cada um.
            </div>
            <button type="button" className={styles.ctaIniciar} onClick={verResultado}>
              Ver resultado
            </button>
          </div>
        )}

        {fase === 'resultado' && <Resultado onNovaRodada={iniciarRodada} />}
      </div>
    </ThemeScope>
  );
}
