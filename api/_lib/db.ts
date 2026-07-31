import { neon } from '@neondatabase/serverless';

// DATABASE_URL aponta pro role app_readonly (só SELECT — GRANT+RLS aplicados
// em db/migrations/). Nunca a connection string admin aqui.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não definida nas env vars do projeto Vercel.');
}

export const sql = neon(DATABASE_URL);

/** Regex de validação de UUID — usado para nunca deixar um `id` malformado chegar à query. */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
