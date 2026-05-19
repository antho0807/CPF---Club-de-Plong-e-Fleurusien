/**
 * Edge Function — Notification création réunion CA
 * Envoie un email + push notification à tous les membres CA (sauf le créateur).
 *
 * Body : {
 *   meeting_id: string
 *   title: string
 *   meeting_date: string   (ISO)
 *   location?: string
 *   agenda?: string
 *   creator_id: string
 * }
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-BE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) + ' à ' + d.toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Vérifier JWT
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const { meeting_id, title, meeting_date, location, agenda, creator_id } = await req.json()

  // Récupérer tous les membres CA actifs (is_ca = true OU role = 'admin')
  const { data: caMembers } = await supabase
    .from('profiles')
    .select('id, full_name, email, alias')
    .or('is_ca.eq.true,role.eq.admin')
    .eq('status', 'approved')
    .neq('id', creator_id)   // ne pas notifier le créateur

  if (!caMembers?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const dateLabel = formatDate(meeting_date)
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

  let emailsSent = 0

  // ── Envoi emails ─────────────────────────────────────────
  if (RESEND_API_KEY) {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#0077b6;padding:24px;border-radius:8px 8px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">⚓ Club de Plongée Fleurusien — Espace CA</h1>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
          <p style="color:#374151;">Bonjour,</p>
          <p style="color:#374151;">Une nouvelle réunion du Conseil d'Administration a été planifiée :</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:bold;color:#0f172a;">📅 ${title}</p>
            <p style="margin:0 0 4px;color:#6b7280;">🗓 ${dateLabel}</p>
            ${location ? `<p style="margin:0 0 4px;color:#6b7280;">📍 ${location}</p>` : ''}
            ${agenda ? `<div style="margin-top:12px;"><p style="font-weight:600;color:#374151;margin:0 0 4px;">Ordre du jour :</p><p style="color:#6b7280;white-space:pre-line;margin:0;">${agenda}</p></div>` : ''}
          </div>
          <p style="color:#374151;font-size:14px;">Connectez-vous à l'application pour confirmer votre présence.</p>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CPF — Conseil d'Administration · LIFRAS / CMAS Belgium</p>
        </div>
      </div>`

    const emailResults = await Promise.allSettled(
      caMembers.map(member =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [member.email],
            subject: `📅 Réunion CA — ${title}`,
            html,
          }),
        })
      )
    )
    emailsSent = emailResults.filter(r => r.status === 'fulfilled').length
  }

  // ── Envoi push notifications ──────────────────────────────
  const memberIds = caMembers.map(m => m.id)
  await supabase.functions.invoke('send-push-notification', {
    body: {
      user_ids: memberIds,
      notification_type: 'new_event',
      title: '📅 Nouvelle réunion CA',
      body: `${title} — ${dateLabel}`,
    },
  }).catch(console.error)

  return new Response(
    JSON.stringify({ emailsSent, pushSentTo: memberIds.length }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
