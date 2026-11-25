import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { iniciarAtualizacao } from './pwa/atualizacao'
import { iniciarMedicao } from './lib/uso'

// Procura versão nova ao voltar ao app e recarrega só em momento seguro
// (src/pwa/atualizacao.ts). Sem isso, o celular seguia na versão antiga até o
// usuário limpar o cache — o que apagava as anotações pessoais.
iniciarAtualizacao(registerSW)
iniciarMedicao()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
