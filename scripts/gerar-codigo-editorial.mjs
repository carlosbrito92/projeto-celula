// Gera um código de líder para EDITORIAL_CODIGOS (api/_lib/editorialAuth.ts).
//
//   npm run editorial:codigo -- "Nome do Líder"
//
// Imprime `Nome do Líder:xxxx-xxxx-xxxx-xxxx-xxxx` para colar no painel da
// Vercel (várias entradas separadas por `;`). Depois de alterar a variável,
// fazer Redeploy: a Vercel só aplica env var nova em deploy novo.
//
// 20 símbolos de um alfabeto de 31 (sem i, l, o, 0, 1, que se confundem na
// leitura) ≈ 99 bits, sorteados com crypto.randomInt (sem viés de módulo).
// Rodar no próprio terminal; nunca colar o resultado em chat, issue ou commit.
import { randomInt } from 'node:crypto';

const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
const nome = process.argv.slice(2).join(' ').trim();

if (!nome || nome.includes(';')) {
  console.error('Uso: npm run editorial:codigo -- "Nome do Líder"   (o nome não pode ter ";")');
  process.exit(1);
}

const grupos = Array.from({ length: 5 }, () => Array.from({ length: 4 }, () => ALFABETO[randomInt(ALFABETO.length)]).join(''));
console.log(`${nome}:${grupos.join('-')}`);
