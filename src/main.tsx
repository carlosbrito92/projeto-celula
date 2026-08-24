import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// registerType: 'autoUpdate' sozinho não é suficiente — precisa dessa chamada
// pra o SW realmente ativar (skipWaiting) em vez de ficar "instalado mas
// esperando". Sem periodicSync configurado, o check de atualização só roda
// na navegação natural (abrir o app de novo), então o reload automático não
// interrompe uma anotação em andamento no meio da sessão.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
