import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
  })
} else {
  globalThis.setTimeout(() => {
    import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
  }, 1500)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

