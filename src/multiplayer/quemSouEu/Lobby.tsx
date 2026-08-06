import { useState } from 'react';
import { Organizador } from './Organizador';
import { Participante } from './Participante';

/**
 * Decide o papel uma vez, no mount: ?sala=<código> já presente na URL (veio
 * de escanear o QR) => participante entra direto; sem o param => organizador
 * escolhe categoria antes de criar a sala. Não linkado na tab bar — acesso
 * só por /v2/quem-sou-eu direto ou pelo QR gerado pelo organizador.
 */
export function QuemSouEuLobby() {
  const [ehParticipante] = useState(() => new URLSearchParams(window.location.search).has('sala'));
  return ehParticipante ? <Participante /> : <Organizador />;
}
