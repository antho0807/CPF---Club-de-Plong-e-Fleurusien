/**
 * Edge Function — Notifier les admins d'une nouvelle demande d'inscription.
 * Appelée depuis PendingApproval.tsx à la première visite du nouveau membre.
 *
 * Body : { member_name: string, member_id: string }
 * Requiert un JWT valide (le nouveau membre est connecté).
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

  // Vérifier JWT
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt)
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { member_name, member_id } = await req.json()

  // Vérifier que le membre est bien en statut "pending" (sécurité anti-spam)
  const { data: memberProfile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', member_id ?? user.id)
    .single()

  if (!memberProfile || memberProfile.status !== 'pending') {
    return new Response(JSON.stringify({ skipped: 'not pending' }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Récupérer tous les admins et super admins actifs
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .or('role.eq.admin,is_super_admin.eq.true')
    .eq('status', 'approved')

  if (!admins?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const adminIds = admins.map(a => a.id)
  const name = member_name ?? 'Un nouveau membre'

  // Push notification à tous les admins
  await supabase.functions.invoke('send-push-notification', {
    body: {
      user_ids: adminIds,
      notification_type: 'account_approved',
      title: '👤 Nouvelle demande d\'inscription',
      body: `${name} souhaite rejoindre le club et attend votre approbation.`,
    },
  }).catch(console.error)

  // Notification in-app pour chaque admin
  await Promise.all(adminIds.map(adminId =>
    supabase.from('notifications').insert({
      user_id: adminId,
      type: 'account_approved',
      title: '👤 Nouvelle demande d\'inscription',
      body: `${name} souhaite rejoindre le club.`,
      data: { member_id: member_id ?? user.id },
    })
  ))

  return new Response(
    JSON.stringify({ sent: adminIds.length }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
