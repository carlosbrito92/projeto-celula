const MESES: Record<string, string> = {
  janeiro: '01',
  fevereiro: '02',
  março: '03',
  marco: '03',
  abril: '04',
  maio: '05',
  junho: '06',
  julho: '07',
  agosto: '08',
  setembro: '09',
  outubro: '10',
  novembro: '11',
  dezembro: '12',
};

const DATA_PTBR_REGEX = /^(\d{1,2}) de ([a-zçã]+) de (\d{4})$/i;

/** "26 de julho de 2026" -> "2026-07-26". Retorna null se não reconhecer o formato. */
export function parseDataPtBr(input: string | null | undefined): string | null {
  if (!input) return null;
  const match = DATA_PTBR_REGEX.exec(input.trim());
  if (!match) return null;

  const [, dia, mesNome, ano] = match;
  const mes = MESES[mesNome.toLowerCase()];
  if (!mes) return null;

  return `${ano}-${mes}-${dia.padStart(2, '0')}`;
}

/** "2026-07-26" -> "26 de julho de 2026" (exibição). Retorna null se inválido. */
export function formatDataPtBr(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, ano, mes, dia] = match;
  const nomeMes = Object.entries(MESES).find(([, valor]) => valor === mes)?.[0];
  if (!nomeMes) return null;
  return `${Number.parseInt(dia, 10)} de ${nomeMes} de ${ano}`;
}
