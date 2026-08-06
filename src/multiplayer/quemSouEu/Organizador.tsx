import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getRoomCode, insertCoin, myPlayer, setState, usePlayersList } from 'playroomkit';
import { Link } from '../../router/Router';
import { ThemeScope } from '../../themes/ThemeScope';
import { PADRAO_MINC } from '../../themes/registry';
import { CATEGORIAS, type Categoria } from './categorias';
import { criarDistribuidorIncremental } from '../distribuicaoIncremental';
import { QrCode } from './QrCode';
import styles from './Organizador.module.css';

type Fase = 'categoria' | 'sala' | 'jogo';

// Mesmo domínio público hardcoded de src/lib/api.ts (API_BASE_URL) — sem
// server.hostname customizado no capacitor.config.ts, o app nativo serve de
// https://localhost por padrão. window.location.origin funciona pra
// web/PWA (reflete o domínio real), mas dentro do app nativo geraria um QR
// apontando pro "localhost" de quem escaneia — inútil pra outro dispositivo.
const DOMINIO_PUBLICO = 'https://projeto-celula.vercel.app';

function linkConvite(): string {
  // skipLobby: true faz o insertCoin() não ler mais o hash #r=<código> —
  // isso era feito pela UI nativa do lobby, que pulamos. Convenção própria
  // via query param, lida explicitamente em Participante.tsx.
  const origem = Capacitor.isNativePlatform() ? DOMINIO_PUBLICO : window.location.origin;
  return `${origem}${window.location.pathname}?sala=${getRoomCode()}`;
}

export function Organizador() {
  const [fase, setFase] = useState<Fase>('categoria');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const todosJogadores = usePlayersList(true);
  // Organizador (host) também conta como "jogador" no Playroom, mas não
  // participa da rodada nesta versão — só quem escaneia e digita nome.
  const participantes = todosJogadores.filter((j) => j.id !== myPlayer().id);

  const sortear = async (cat: Categoria) => {
    setCategoria(cat);
    await insertCoin({ skipLobby: true });
    setFase('sala');
  };

  const iniciar = () => {
    if (!categoria) return;
    const distribuidor = criarDistribuidorIncremental(categoria.palavras);
    for (const jogador of participantes) {
      const valor = distribuidor.proximo();
      if (valor) jogador.setState('valor', valor, true);
    }
    setState('jogoIniciado', true, true);
    setFase('jogo');
  };

  return (
    <ThemeScope tema={PADRAO_MINC} className={styles.shell}>
      <div className={styles.wrapper}>
        <Link to="/quebra-gelos" className={styles.voltar}>
          ←
        </Link>

        {fase === 'categoria' && (
          <>
            <div className={styles.titulo}>Quem Sou Eu?</div>
            <div className={styles.subtitulo}>Escolha a categoria pra sortear:</div>
            <div className={styles.categorias}>
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.nome}
                  type="button"
                  className={styles.categoriaBotao}
                  onClick={() => sortear(cat)}
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
              onClick={iniciar}
              disabled={participantes.length === 0}
            >
              Iniciar
            </button>
          </>
        )}

        {fase === 'jogo' && (
          <div className={styles.jogoIniciado}>
            <div className={styles.jogoIniciadoTitulo}>Jogo iniciado</div>
            <div className={styles.jogoIniciadoTexto}>
              {participantes.length} jogador(es) — valores atribuídos. Cada um já vê a própria
              palavra no celular.
            </div>
          </div>
        )}
      </div>
    </ThemeScope>
  );
}
