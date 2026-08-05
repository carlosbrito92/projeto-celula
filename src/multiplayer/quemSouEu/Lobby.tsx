import { useState } from 'react';
import { getRoomCode, insertCoin, isHost, myPlayer, onPlayerJoin, usePlayersList } from 'playroomkit';
import { criarDistribuidorIncremental } from '../distribuicaoIncremental';

/**
 * Placeholder até existir um banco de nomes real por categoria — só prova a
 * mecânica de distribuição incremental via onPlayerJoin (ver projeto-celula.md §10).
 */
const VALORES_PLACEHOLDER = [
  'A Rainha',
  'Superman',
  'Brad Pitt',
  'Sherlock Holmes',
  'Cleópatra',
  'Batman',
  'Albert Einstein',
  'Homer Simpson',
  'Frodo',
  'Harry Potter',
];

/**
 * Protótipo V2 — só prova lobby + atribuição por onPlayerJoin funcionando de
 * ponta a ponta. Sem UI de jogo real ainda (categoria fixa, sem tela "coloque
 * na testa"). Não linkado na tab bar — acesso só por /v2/quem-sou-eu direto.
 */
export function QuemSouEuLobby() {
  const [entrou, setEntrou] = useState(false);
  const jogadores = usePlayersList(true);

  const entrar = async () => {
    const distribuidor = criarDistribuidorIncremental(VALORES_PLACEHOLDER);
    // Registrado antes do insertCoin() pra não perder o join do próprio host.
    onPlayerJoin((jogador) => {
      const valor = distribuidor.proximo();
      if (valor) jogador.setState('valorAtribuido', valor);
    });
    // ?sala=<código> — mesmo mecanismo que o QR nativo entrega via URL, só
    // que explícito. Útil pra QA (testar re-scan/reconexão sem decodificar
    // QR) e como fallback de convite por texto/link compartilhado.
    const sala = new URLSearchParams(window.location.search).get('sala') ?? undefined;
    await insertCoin({ roomCode: sala });
    setEntrou(true);
  };

  if (!entrou) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Quem Sou Eu — protótipo V2</h1>
        <button type="button" onClick={entrar}>
          Sortear / Entrar na sala
        </button>
      </div>
    );
  }

  if (isHost()) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Sala criada</h1>
        <p>Código: {getRoomCode()}</p>
        <p>{jogadores.length} participante(s) na sala.</p>
        <ul>
          {jogadores.map((jogador) => (
            <li key={jogador.id}>
              {jogador.getProfile().name} —{' '}
              {jogador.getState('valorAtribuido') ? 'valor atribuído' : 'aguardando'}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const meuValor = myPlayer().getState('valorAtribuido');
  return (
    <div style={{ padding: 24 }}>
      <h1>Você entrou</h1>
      <p>{meuValor ? `Seu valor: ${meuValor}` : 'Aguardando o organizador atribuir...'}</p>
    </div>
  );
}
