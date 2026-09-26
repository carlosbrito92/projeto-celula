import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'content', 'pregacoes');

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('Erro: GEMINI_API_KEY não definida em .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-3.1-flash-lite', // Rápido, gratuito e suporta 1M de tokens de contexto
  generationConfig: {
    responseMimeType: 'application/json', // Força a saída a ser JSON válido
    temperature: 0.2,
  }
});

const PROMPT = `Você é um editor editorial de conteúdo cristão evangélico.
Receba um JSON de pregação e gere um "resumo para líder de célula" seguindo ESTE formato exato de JSON:
{
  "frase_tema": "1 frase que resume a mensagem (máx 25 palavras)",
  "pontos": [
    {
      "numero": 1,
      "titulo": "Título curto do ponto (máx 8 palavras)",
      "resumo": "2-3 frases condensando o ponto, citando o versículo-âncora entre parênteses no final",
      "frase_chave": "1 frase memorável do pregador sobre este ponto (entre aspas)"
    }
  ],
  "versiculo_chave": { "referencia": "Ex: João 5.24", "texto": "Texto completo do versículo" }
}

Regras estritas:
1. Use exatamente os mesmos pontos de "mapa_pontos" (mesma ordem, mesmos títulos).
2. Cada "resumo" deve ser autossuficiente para quem não leu a pregação.
3. Preserve ilustrações marcantes mencionadas no texto (ex: "ouro no barro", "cartão de crédito").
4. Extraia a "frase_chave" de um bloco "callout" ou de uma frase de impacto real do corpo da pregação.
5. Não invente conteúdo — use apenas o que está no JSON fornecido.`;

async function processarArquivo(caminhoArquivo: string) {
  const conteudo = await readFile(caminhoArquivo, 'utf-8');
  const json = JSON.parse(conteudo);

  if (json.resumo_lider) {
    console.log(`⏭  ${path.basename(caminhoArquivo)} (já possui resumo_lider)`);
    return;
  }

  console.log(`🔄 Gerando resumo líder para: ${path.basename(caminhoArquivo)}...`);

  try {
    const result = await model.generateContent(`${PROMPT}\n\nJSON DA PREGAÇÃO:\n${JSON.stringify(json, null, 2)}`);
    const responseText = result.response.text();

    // Limpeza de segurança caso o Gemini adicione markdown ```json ... ```
    const cleanJson = responseText.replace(/^```json\n?|\n?```$/g, '').trim();
    const resumoLider = JSON.parse(cleanJson);

    json.resumo_lider = resumoLider;

    await writeFile(caminhoArquivo, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`✅ ${path.basename(caminhoArquivo)} atualizado com sucesso.`);
  } catch (error) {
    console.error(`❌ Erro ao processar ${path.basename(caminhoArquivo)}:`, error);
  }
}

async function main() {
  const argArquivo = process.argv[2];

  if (argArquivo) {
    await processarArquivo(path.resolve(argArquivo));
  } else {
    const arquivos = (await readdir(contentDir)).filter((f) => f.endsWith('.json') && f.startsWith('calibracao-'));
    for (const arquivo of arquivos) {
      await processarArquivo(path.join(contentDir, arquivo));
    }
  }
}

main();
