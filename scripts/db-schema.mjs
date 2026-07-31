// Aplica db/migrations/*.sql contra o Neon. Rodado manualmente via Bash com
// DATABASE_URL_ADMIN (role owner/admin do projeto Neon) — nunca em runtime
// deployado. Assume que o role `app_readonly` já foi criado via console do
// Neon (aba Roles) antes de rodar este script, já que a migração referencia
// esse nome de role nas policies/grants.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const DATABASE_URL_ADMIN = process.env.DATABASE_URL_ADMIN;
if (!DATABASE_URL_ADMIN) {
  console.error('DATABASE_URL_ADMIN não definida. Configure em .env.local e exporte antes de rodar.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

const client = new pg.Client({ connectionString: DATABASE_URL_ADMIN });
await client.connect();

try {
  const arquivos = (await readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const arquivo of arquivos) {
    const sql = await readFile(path.join(migrationsDir, arquivo), 'utf-8');
    console.log(`Aplicando ${arquivo}...`);
    await client.query(sql);
  }
  console.log('Schema aplicado com sucesso.');
} finally {
  await client.end();
}
