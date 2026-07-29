# Projeto Célula

Plataforma unificada para redes de célula: biblioteca de pregações, catálogo de quebra-gelos e kit de utilitários compartilhados. Ver `docs/projeto-celula.md` para a visão completa do projeto.

Stack: React + Vite + Capacitor (Android/iOS/PWA), Supabase (Postgres + RLS).

## Desenvolvimento

```bash
npm install
npm run dev       # dev server web
npm run build     # build web (dist/), inclui manifest PWA + service worker
```

## Build nativo (Capacitor)

Este projeto usa JDK 21 para o build Android — pinado via `.sdkmanrc` (requer [SDKMAN!](https://sdkman.io)).

```bash
npm run build
npx cap sync

# Android
cd android && ./gradlew assembleDebug

# iOS (requer macOS + Xcode)
npx cap open ios
```

## Documentação do projeto

- `docs/projeto-celula.md` — visão, escopo, stack, segurança
- `docs/estilos-pregacao.md` — sistema de temas por série
- `docs/geracao-pregacao.md` — schema de conteúdo (JSON) de pregações
- `docs/mock-prompt.md` / `docs/mock-aprovado-v2.html` — referência visual
- `docs/progresso.md` — checklist de acompanhamento por fase
- `supabase/migrations/` — migrações do banco (schema + RLS)
