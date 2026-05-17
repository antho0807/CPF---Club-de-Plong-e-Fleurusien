/**
 * Edge Function — Envoi de notifications push Web Push (VAPID)
 * Déploiement : supabase functions deploy send-push-notification
 *
 * Variables d'environnement requises :
 *   VAPID_PRIVATE_KEY = Rt8p1uSE8zZ1cyqfkJasuehojk6c3HMRRxI96cc2Y_Y
 *   VAPID_PUBLIC_KEY  = BEHap2OoCu8LvtCaFDLq8SEpOHa0OOWxvhggDKQiSHZS1dbflsGK5f8VZqQ2vpbBZqJAYB6rWZ5Gs3ogcTcPqFM
 *   VAPID_SUBJECT     = mailto:info@cpfleurusien.be
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface Payload {
  user_ids?: string[]   // si fourni, envoie uniquement à ces users
  title: string
  body: string
  url?: string
}

serve(async (req) => {
  const { user_ids, title, body, url }: Payload = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Récupérer les subscriptions
  let query = supabase.from('push_subscriptions').select('subscription, user_id')
  if (user_ids?.length) query = query.in('user_id', user_ids)
  const { data: subs } = await query

  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
  const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:info@cpfleurusien.be'

  const notification = JSON.stringify({ title, body, url: url ?? '/' })
  let sent = 0

  for (const { subscription } of subs) {
    try {
      const sub = subscription as { endpoint: string; keys: { p256dh: string; auth: string } }
      // Utilise l'API web-push via fetch avec VAPID
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'TTL': '86400',
          'Authorization': `vapid t=${await buildVapidToken(sub.endpoint, VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)},k=${VAPID_PUBLIC_KEY}`,
        },
        body: new TextEncoder().encode(notification),
      })
      if (res.ok || res.status === 201) sent++
    } catch {
      // Subscription expirée ou invalide — on ignore
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})

// Génération simplifiée du token VAPID (JWT)
async function buildVapidToken(endpoint: string, subject: string, publicKey: string, privateKey: string): Promise<string> {
  const origin = new URL(endpoint).origin
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payload = btoa(JSON.stringify({ aud: origin, exp: now + 86400, sub: subject })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const toSign = `${header}.${payload}`
  // Import private key
  const pk = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(privateKey.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pk, new TextEncoder().encode(toSign))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${toSign}.${sigB64}`
}
