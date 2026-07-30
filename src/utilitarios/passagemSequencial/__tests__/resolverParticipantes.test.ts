import { describe, expect, it } from 'vitest';
import { resolverParticipantes } from '../resolverParticipantes';

describe('resolverParticipantes', () => {
  it('usa os nomes informados quando presentes', () => {
    expect(resolverParticipantes(3, ['Ana', 'Beto', 'Carol'])).toEqual(['Ana', 'Beto', 'Carol']);
  });

  it('sintetiza "Participante N" quando não há nomes', () => {
    expect(resolverParticipantes(3)).toEqual(['Participante 1', 'Participante 2', 'Participante 3']);
  });

  it('sintetiza só os nomes faltantes quando a lista é parcial', () => {
    expect(resolverParticipantes(3, ['Ana'])).toEqual(['Ana', 'Participante 2', 'Participante 3']);
  });

  it('ignora nomes em branco/só espaços, tratando como ausentes', () => {
    expect(resolverParticipantes(2, ['  ', 'Beto'])).toEqual(['Participante 1', 'Beto']);
  });
});
