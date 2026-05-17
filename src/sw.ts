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
  if (!event.data) return

  let data: { title?: string; body?: string; url?: string; icon?: string } = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'CPF Plongée', body: event.data.text() }
  }

  const title = data.title ?? 'CPF Plongée'
  const options: NotificationOptions = {
    body:  data.body ?? '',
    icon:  data.icon ?? '/logo-cpf.png',
    badge: '/logo-cpf.png',
    data:  { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
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
