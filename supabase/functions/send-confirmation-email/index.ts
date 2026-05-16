/**
 * Edge Function — Envoi du mail de confirmation d'inscription
 *
 * Déploiement :
 *   supabase functions deploy send-confirmation-email
 *
 * Variables d'environnement à configurer dans le dashboard Supabase :
 *   RESEND_API_KEY=re_xxxx          (https://resend.com — gratuit jusqu'à 3000 mails/mois)
 *   FROM_EMAIL=noreply@cpf-plongee.be
 *
 * Appelée depuis validateRegistration() dans useEvents.ts
 * (à déclencher via supabase.functions.invoke() quand l'inscr. est confirmée)
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

interface Payload {
  to: string
  memberName: string
  eventTitle: string
  eventDate: string
  eventLocation?: string
}

serve(async (req) => {
  const { to, memberName, eventTitle, eventDate, eventLocation }: Payload = await req.json()

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'noreply@cpf-plongee.be'

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY manquant' }), { status: 500 })
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0077b6; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">⚓ Club de Plongée Fleurusien</h1>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="color: #374151;">Bonjour <strong>${memberName}</strong>,</p>
        <p style="color: #374151;">Votre inscription à l'événement suivant a été <strong style="color: #16a34a;">confirmée</strong> :</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: bold; color: #0f172a;">${eventTitle}</p>
          <p style="margin: 0; color: #6b7280;">📅 ${eventDate}</p>
          ${eventLocation ? `<p style="margin: 4px 0 0; color: #6b7280;">📍 ${eventLocation}</p>` : ''}
        </div>
        <p style="color: #374151;">Pensez à vérifier votre certificat médical avant la plongée.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">CPF — Club de Plongée Fleurusien · LIFRAS / CMAS Belgium</p>
      </div>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `✓ Inscription confirmée — ${eventTitle}`,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: res.ok ? 200 : 500,
    headers: { 'Content-Type': 'application/json' },
  })
})
