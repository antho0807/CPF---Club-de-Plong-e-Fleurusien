/**
 * Edge Function — Suppression définitive d'un compte.
 *
 * Deux modes :
 * - Auto-suppression (token requis) : { user_id, token }
 * - Suppression admin (pas de token) : { user_id }
 *   → le requérant doit être admin/super_admin
 *
 * Cascade : auth.users → profiles → registrations, documents, etc.
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
    return new Response(JSON.stringify({ error: 'Non authentifié' }), {
      status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const { user_id, token } = await req.json()
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'user_id requis' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const isSelf = user_id === requester.id

  if (isSelf) {
    // ── Auto-suppression : token obligatoire ──────────────────
    if (!token) {
      return new Response(JSON.stringify({ error: 'Token requis pour supprimer votre propre compte' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    const { data: tokenRecord } = await supabase
      .from('account_deletion_tokens')
      .select('id')
      .eq('user_id', user_id)
      .eq('token', token)
      .eq('requested_by', requester.id)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!tokenRecord) {
      return new Response(JSON.stringify({ error: 'Code invalide ou expiré' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
    await supabase.from('account_deletion_tokens').delete().eq('user_id', user_id)

  } else {
    // ── Suppression par admin : vérifier que le requérant est admin ──
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('role, is_super_admin')
      .eq('id', requester.id)
      .single()

    const isAdmin = requesterProfile?.role === 'admin' || requesterProfile?.is_super_admin === true
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Non autorisé — réservé aux admins' }), {
        status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Protection super admin ────────────────────────────────
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user_id)
    .single()

  if (targetProfile?.is_super_admin) {
    return new Response(JSON.stringify({ error: 'Ce compte est protégé et ne peut pas être supprimé.' }), {
      status: 403, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // ── Suppression définitive ────────────────────────────────
  const { error: deleteErr } = await supabase.auth.admin.deleteUser(user_id)
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ deleted: true }),
    { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } },
  )
})
