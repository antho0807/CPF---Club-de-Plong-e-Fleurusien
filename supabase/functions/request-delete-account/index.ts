/**
 * Edge Function — Demande de suppression de compte
 * Génère un code à 6 chiffres, le stocke, envoie l'email de confirmation.
 *
 * Body : { target_user_id?: string }  (omis = suppression de son propre compte)
 * Si target_user_id est fourni, le requérant doit être admin.
 * Le code est envoyé à l'email du REQUÉRANT (admin ou utilisateur lui-même).
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Vérifier le JWT du requérant
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user: requester }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !requester) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  const { target_user_id } = await req.json().catch(() => ({}))
  const targetId: string = target_user_id ?? requester.id
  const isSelf = targetId === requester.id

  // Si suppression d'un autre compte : vérifier que le requérant est admin
  if (!isSelf) {
    const { data: req_profile } = await supabase.from('profiles').select('role').eq('id', requester.id).single()
    if (req_profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }
  }

  // Récupérer le nom du compte cible (pour l'email)
  const { data: targetProfile } = await supabase.from('profiles').select('full_name, email').eq('id', targetId).single()

  // Code à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  // Stocker le token (upsert : une seule demande active par compte)
  const { error: tokenErr } = await supabase
    .from('account_deletion_tokens')
    .upsert({ user_id: targetId, token: code, requested_by: requester.id, expires_at: expiresAt }, { onConflict: 'user_id' })
  if (tokenErr) {
    return new Response(JSON.stringify({ error: tokenErr.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  // Email de confirmation envoyé au REQUÉRANT
  const recipientEmail = requester.email!
  const recipientName = isSelf ? targetProfile?.full_name : (await supabase.from('profiles').select('full_name').eq('id', requester.id).single()).data?.full_name
  const targetName = targetProfile?.full_name ?? 'ce compte'

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'onboarding@resend.dev'

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Service email non configuré (RESEND_API_KEY manquant)' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  const subject = isSelf
    ? '🔐 Confirmation de suppression de votre compte CPF'
    : `🔐 Confirmation de suppression du compte de ${targetName}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0077b6;padding:24px;border-radius:8px 8px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">⚓ Club de Plongée Fleurusien</h1>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
        <p>Bonjour <strong>${recipientName}</strong>,</p>
        <p>Une demande de <strong>suppression définitive</strong> du compte ${isSelf ? 'de votre compte' : `de <strong>${targetName}</strong>`} a été initiée.</p>
        <p>Votre code de confirmation (valable 1 heure) :</p>
        <div style="text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#0f172a;background:#f1f5f9;padding:16px 24px;border-radius:12px;display:inline-block;">${code}</span>
        </div>
        <p style="color:#dc2626;font-size:14px;">⚠️ Cette action est <strong>irréversible</strong>. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">CPF — Club de Plongée Fleurusien · LIFRAS / CMAS Belgium</p>
      </div>
    </div>`

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [recipientEmail], subject, html }),
  })

  if (!emailRes.ok) {
    const emailErr = await emailRes.json().catch(() => ({}))
    console.error('[request-delete-account] Resend error:', emailErr)
    // Supprimer le token puisque l'email n'est pas parti
    await supabase.from('account_deletion_tokens').delete().eq('user_id', targetId)
    return new Response(
      JSON.stringify({ error: `Email non envoyé (${emailRes.status}) : ${(emailErr as { message?: string }).message ?? 'Erreur Resend — vérifiez FROM_EMAIL et la configuration du domaine'}` }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ sent: true, email: recipientEmail.replace(/(.{2}).*(@.*)/, '$1…$2') }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
