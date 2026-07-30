import { describe, expect, it } from 'vitest';
import { sortearPapel, SEM_PAPEL_ESPECIAL } from '../sortearPapel';

describe('sortearPapel', () => {
  it('marca exatamente 1 participante com o papel, determinístico com rng fixa', () => {
    const resultado = sortearPapel(['A', 'B', 'C'], 'Detetive', () => 0.5);
    expect(resultado).toEqual({ A: SEM_PAPEL_ESPECIAL, B: 'Detetive', C: SEM_PAPEL_ESPECIAL });
  });

  it('com rng real, sempre exatamente 1 vencedor entre os participantes', () => {
    const participantes = ['A', 'B', 'C', 'D', 'E'];
    const resultado = sortearPapel(participantes, 'Impostor', Math.random);
    const vencedores = Object.values(resultado).filter((v) => v === 'Impostor');
    expect(vencedores).toHaveLength(1);
    expect(Object.keys(resultado).sort()).toEqual(participantes.sort());
  });
});
