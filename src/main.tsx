import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ── Mise à jour automatique du Service Worker ────────────────
// Quand un nouveau SW prend le contrôle (suite à une mise à jour),
// on recharge la page pour charger les nouveaux assets.
// Le flag "previousController" évite un reload à la toute première installation.
if ('serviceWorker' in navigator) {
  const previousController = navigator.serviceWorker.controller

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Ne recharger que si un SW existait déjà (= vraie mise à jour, pas premier install)
    if (previousController) {
      window.location.reload()
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
