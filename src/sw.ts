/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Activer immédiatement sans attendre la fermeture des onglets
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ─── Push notifications ───────────────────────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] push event reçu', event.data?.text())

  let title = 'CPF Plongée'
  let body  = 'Nouvelle notification'
  let url   = '/'

  if (event.data) {
    try {
      const d = event.data.json()
      title = d.title ?? title
      body  = d.body  ?? body
      url   = d.url   ?? url
    } catch {
      body = event.data.text() || body
    }
  }

  console.log('[SW] showNotification:', title, body)

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/logo-cpf.png',
      badge: '/logo-cpf.png',
      data:  { url },
    }).then(() => console.log('[SW] notification affichée'))
      .catch((e: unknown) => console.error('[SW] erreur showNotification:', e))
  )
})

// ─── Clic sur la notification → ouvrir l'app ─────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        existing.focus()
        existing.navigate(url)
      } else {
        self.clients.openWindow(url)
      }
    }),
  )
})
