import { useState } from 'react';
import { Organizador } from './Organizador';
import { Participante } from './Participante';

/** Mesmo mecanismo de src/multiplayer/quemSouEu/Lobby.tsx. */
export function ArtistaImpostorLobby() {
  const [ehParticipante] = useState(() => new URLSearchParams(window.location.search).has('sala'));
  return ehParticipante ? <Participante /> : <Organizador />;
}
