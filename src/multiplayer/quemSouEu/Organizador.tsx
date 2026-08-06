import { useState } from 'react';
import { getRoomCode, insertCoin, myPlayer, setState, usePlayersList } from 'playroomkit';
import { CATEGORIAS, type Categoria } from './categorias';
import { criarDistribuidorIncremental } from '../distribuicaoIncremental';
import { QrCode } from './QrCode';

type Fase = 'categoria' | 'sala' | 'jogo';

function linkConvite(): string {
  // skipLobby: true faz o insertCoin() não ler mais o hash #r=<código> —
  // isso era feito pela UI nativa do lobby, que pulamos. Convenção própria
  // via query param, lida explicitamente em Participante.tsx.
  return `${window.location.origin}${window.location.pathname}?sala=${getRoomCode()}`;
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

  if (fase === 'categoria') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Quem Sou Eu — organizador</h1>
        <p>Escolha a categoria:</p>
        {CATEGORIAS.map((cat) => (
          <div key={cat.nome} style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => sortear(cat)}>
              {cat.nome}
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (fase === 'sala') {
    return (
      <div style={{ padding: 24 }}>
        <h1>Sala criada</h1>
        <p>Categoria: {categoria?.nome}</p>
        <QrCode valor={linkConvite()} />
        <p>Código: {getRoomCode()}</p>
        <ul>
          {participantes.map((jogador) => (
            <li key={jogador.id}>{jogador.getState('nome') ?? 'aguardando nome…'}</li>
          ))}
        </ul>
        <button type="button" onClick={iniciar} disabled={participantes.length === 0}>
          Iniciar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Jogo iniciado</h1>
      <p>{participantes.length} jogador(es) — valores atribuídos.</p>
    </div>
  );
}
