/**
 * Edge Function — Web Push RFC 8291 + VAPID
 * Implémentation Deno native (Web Crypto API)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
interface Payload  { user_ids?: string[]; notification_type?: string; exclude_user_id?: string; title: string; body: string; url?: string }

// Mapping type de notification → colonne dans notification_preferences
const PREF_MAP: Record<string, string> = {
  registration_pending:  'registration_update',
  registration_confirmed:'registration_update',
  registration_refused:  'registration_update',
  exercise_validated:    'registration_update',
  exercise_refused:      'registration_update',
  new_message:           'new_message',
  new_event:             'new_event',
  event_reminder:        'event_reminder',
  account_approved:      'account_approved',
  medical_expiry:        'medical_expiry',
  club_announcement:     'club_announcement',
}

// ─── Base64url ────────────────────────────────────────────────

const enc = new TextEncoder()

function dec(s: string): Uint8Array {
  const b = s.trim().replace(/-/g, '+').replace(/_/g, '/').replace(/=/g, '')
  return Uint8Array.from(atob(b + '='.repeat((4 - b.length % 4) % 4)), c => c.charCodeAt(0))
}

function enc64(u: Uint8Array): string {
  return btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ─── PKCS#8 pour P-256 (DER minimal, sans clé publique) ──────

function pkcs8(raw: Uint8Array): ArrayBuffer {
  // 30 41 02 01 00 30 13 06 07 2A 86 48 CE 3D 02 01 06 08 2A 86 48 CE 3D 03 01 07 04 27 30 25 02 01 01 04 20 [32]
  const hdr = new Uint8Array([
    0x30,0x41,0x02,0x01,0x00,0x30,0x13,0x06,0x07,
    0x2a,0x86,0x48,0xce,0x3d,0x02,0x01,0x06,0x08,
    0x2a,0x86,0x48,0xce,0x3d,0x03,0x01,0x07,0x04,
    0x27,0x30,0x25,0x02,0x01,0x01,0x04,0x20,
  ])
  const out = new Uint8Array(67)
  out.set(hdr); out.set(raw, 35)
  return out.buffer
}

// ─── VAPID JWT ────────────────────────────────────────────────

async function vapidJwt(endpoint: string, sub: string, pub: string, priv: string): Promise<string> {
const pubBytes = dec(pub)
  const x = enc64(pubBytes.slice(1, 33))
  const y = enc64(pubBytes.slice(33, 65))

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', d: priv, x, y, key_ops: ['sign'], ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  )
  const aud = new URL(endpoint).origin
  const now = Math.floor(Date.now() / 1000)
  const h = enc64(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const p = enc64(enc.encode(JSON.stringify({ aud, exp: now + 43200, sub })))
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${h}.${p}`)))
  return `${h}.${p}.${enc64(sig)}`
}

// ─── Chiffrement aes128gcm (RFC 8291 / RFC 8188) ─────────────

// HMAC-SHA-256 brut
async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data))
}

// HKDF-Extract(salt, IKM) = HMAC(salt, IKM)
async function hkdfExtract(salt: Uint8Array, ikm: Uint8Array): Promise<Uint8Array> {
  return hmac(salt, ikm)
}

// HKDF-Expand(PRK, info, len) — pour len ≤ 32 octets (un seul bloc T1)
async function hkdfExpand(prk: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  return (await hmac(prk, concat(info, new Uint8Array([1])))).slice(0, len)
}

// HKDF complet (Extract + Expand) via Web Crypto — pour CEK et nonce
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8))
}

function concat(...a: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(a.reduce((s, x) => s + x.length, 0))
  let o = 0; for (const x of a) { out.set(x, o); o += x.length }
  return out
}

async function encrypt(plaintext: string, s: PushSub): Promise<Uint8Array> {
  const recvPubRaw = dec(s.keys.p256dh)
  const recvPub = await crypto.subtle.importKey('raw', recvPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [])

  const ephem = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const sendPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', ephem.publicKey))

  const ecdhBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: recvPub }, ephem.privateKey, 256))

  const auth = dec(s.keys.auth)
  const salt = crypto.getRandomValues(new Uint8Array(16))

  // RFC 8291 key derivation (correct)
  // Étape 1 : PRK = HKDF-Extract(auth_secret, ecdh_secret) = HMAC(auth, ecdh)
  const prk = await hkdfExtract(auth, ecdhBits)

  // Étape 2 : IKM = HKDF-Expand(PRK, "WebPush: info\0" || recv_pub || send_pub, 32)
  const keyInfo = concat(enc.encode('WebPush: info\0'), recvPubRaw, sendPubRaw)
  const ikm = await hkdfExpand(prk, keyInfo, 32)

  // Étapes 3/4 : CEK et nonce via HKDF complet avec le sel 16 octets
  const cek   = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const cipher = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    concat(enc.encode(plaintext), new Uint8Array([0x02])),
  ))

  // RFC 8188 header: salt(16) + rs(4) + idlen(1) + senderPub
  const rs = new Uint8Array(4); new DataView(rs.buffer).setUint32(0, 4096)
  return concat(salt, rs, new Uint8Array([sendPubRaw.length]), sendPubRaw, cipher)
}

// ─── CORS ────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Handler ─────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const { user_ids, notification_type, exclude_user_id, title, body, url }: Payload = await req.json()

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // user_ids non fourni = envoyer à tous les abonnés actifs
  // user_ids fourni = filtrer + vérifier les préférences
  let targetIds: string[] | null = user_ids?.length ? user_ids : null

  // Si pas de user_ids explicites, récupérer tous les membres actifs approuvés
  if (!targetIds) {
    const { data: activeMembers } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true)
      .eq('status', 'approved')
    if (activeMembers?.length) {
      targetIds = activeMembers.map((m: { id: string }) => m.id)
    }
  }

  // Exclure l'utilisateur spécifié (ex : le créateur d'un événement)
  if (exclude_user_id && targetIds) {
    targetIds = targetIds.filter(id => id !== exclude_user_id)
  }
  const prefCol = notification_type ? PREF_MAP[notification_type] : null

  if (targetIds && prefCol) {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select(`user_id, ${prefCol}`)
      .in('user_id', targetIds)

    if (prefs) {
      const disabled = new Set(
        prefs
          .filter((p: Record<string, unknown>) => p[prefCol] === false)
          .map((p: Record<string, unknown>) => p.user_id as string)
      )
      const remaining = targetIds.filter((id) => !disabled.has(id))
      if (!remaining.length) return new Response(
        JSON.stringify({ sent: 0, skipped: 'preferences' }),
        { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
      )
    }
  }

  let q = supabase.from('push_subscriptions').select('subscription, user_id')
  if (targetIds) q = q.in('user_id', targetIds)
  const { data: subs, error } = await q

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  if (!subs?.length) return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  const PRIV = Deno.env.get('VAPID_PRIVATE_KEY')!.trim()
  const PUB  = Deno.env.get('VAPID_PUBLIC_KEY')!.trim()
  const SUB  = (Deno.env.get('VAPID_SUBJECT') ?? 'mailto:noreply@app-cpf.be').trim()

  const payload = JSON.stringify({ title, body, url: url ?? '/', icon: '/logo-cpf.png' })

  let sent = 0; const errors: string[] = []

  for (const row of subs) {
    const s = row.subscription as PushSub
    try {
      const jwt  = await vapidJwt(s.endpoint, SUB, PUB, PRIV)
      const body = await encrypt(payload, s)

      const res = await fetch(s.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type':     'application/octet-stream',
          'Content-Encoding': 'aes128gcm',
          'TTL':              '86400',
          'Authorization':    `vapid t=${jwt},k=${PUB}`,
        },
        body,
      })

      if (res.ok || res.status === 201) {
        sent++
      } else {
        errors.push(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
      }
    } catch (e: unknown) {
      errors.push(e instanceof Error ? `${e.name}: ${e.message}` : String(e))
    }
  }

  return new Response(
    JSON.stringify({ sent, total: subs.length, ...(errors.length && { errors }) }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
